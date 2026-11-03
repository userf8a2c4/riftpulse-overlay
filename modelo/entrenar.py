# Reentrena el modelo de RiftPulse con los juegos que juntó recolectar.js y lo compara con el actual, idea por idea.
# Prueba honesta: se entrena con los juegos anteriores a CORTE (1/8/2026) y se mide en los posteriores (que el modelo no vio),
# en todos y aparte solo en internacionales (Mundial, MSI, First Stand...). Se miden el acierto, el Brier y el log-loss.
# Una idea entra solo si baja el Brier en los min 15 y 20 y no empeora en internacionales.
# Uso: python3 modelo/entrenar.py  → imprime el informe y deja modelo/datos/resultado.json (con el MODELO propuesto)
import json, math, os, re, urllib.request
import numpy as np
from sklearn.linear_model import LogisticRegression

AQUI = os.path.dirname(os.path.abspath(__file__))
ENG = open(os.path.join(AQUI, '..', 'engine.js'), encoding='utf-8').read()
MODELO = json.loads(re.search(r'var MODELO = (\{.*?\});', ENG).group(1))
CHAMP = json.loads(re.search(r'var CHAMP = (\{.*?\});', ENG).group(1))
CORTE = os.environ.get('CORTE', '2026-08-01')
# el mismo Elo que RiftEngine.elo (engine.js): regiones, ajuste por región, K internacional y cambio de temporada
REG = {'lck': 'KR', 'lpl': 'CN', 'lec': 'EU', 'lcs': 'NA', 'lta_n': 'NA', 'cblol-brazil': 'BR', 'lta_s': 'BR', 'lcp': 'PAC'}
INTL = {'worlds', 'msi', 'first_stand', 'ewc_lol', 'esports_world_cup', 'americas_cup', 'lta_cross'}

def bajar(u):
    with urllib.request.urlopen(u, timeout=30) as r: return json.loads(r.read().decode('utf-8'))
ver = bajar('https://ddragon.leagueoflegends.com/api/versions.json')[0]
CAMPS = {c['id']: c for c in bajar(f'https://ddragon.leagueoflegends.com/cdn/{ver}/data/es_MX/champion.json')['data'].values()}

juegos = [json.loads(l) for l in open(os.path.join(AQUI, 'datos', 'juegos.jsonl'), encoding='utf-8')]
series = sorted(json.load(open(os.path.join(AQUI, 'datos', 'series.json'), encoding='utf-8')), key=lambda s: s['fecha'])
print(f'juegos: {len(juegos)} · series: {len(series)} · Data Dragon {ver}')

# ---- las dos fuerzas: la vieja (sin regiones, la que usaba este script) y la de RiftEngine.elo ----
def elo_viejo():
    E, pre = {}, {}
    for s in series:
        a, b = s['a'], s['b']; ea, eb = E.get(a, 1500.0), E.get(b, 1500.0)
        pre[(s['fecha'], a, b)] = (ea, eb)
        if s['wa'] == s['wb']: continue
        exp = 1 / (1 + 10 ** ((eb - ea) / 400)); k = 24 * max(1, abs(s['wa'] - s['wb'])) / (1.5 if s['wa'] + s['wb'] > 1 else 1)
        r = 1 if s['wa'] > s['wb'] else 0; E[a] = ea + k * (r - exp); E[b] = eb - k * (r - exp)
    return pre
def elo_region():
    reg = {}
    for s in series:
        g = REG.get(s['liga'])
        if g: reg[s['a']] = g; reg[s['b']] = g
    r, off, season, pre = {}, {'KR': 110, 'CN': 100, 'EU': 0, 'NA': -60, 'PAC': -70, 'BR': -110}, '2025', {}
    de = lambda t: r.get(t, 1500.0) + off.get(reg.get(t), -150)
    for s in series:
        y = s['fecha'][:4]
        if y > season:
            season = y
            for k in r: r[k] = 1500 + 0.7 * (r[k] - 1500)
        a, b, wa, wb = s['a'], s['b'], s['wa'], s['wb']
        pre[(s['fecha'], a, b)] = (de(a), de(b))
        if not wa and not wb: continue
        ea = 1 / (1 + 10 ** ((de(b) - de(a)) / 400)); intl = s['liga'] in INTL; d = (32 if intl else 24) * (wa - (wa + wb) * ea)
        r[a] = r.get(a, 1500.0) + d; r[b] = r.get(b, 1500.0) - d
        ga, gb = reg.get(a), reg.get(b)
        if intl and ga and gb and ga != gb: off[ga] += d * 0.25; off[gb] -= d * 0.25
    return pre
ELOS = {'viejo': elo_viejo(), 'region': elo_region()}
IDX = {}
for nombre, pre in ELOS.items():
    ix = {}
    for (f, a, b), v in pre.items(): ix[(f, a, b)] = v; ix[(f, b, a)] = (v[1], v[0])
    IDX[nombre] = ix
def elo(g, cual):
    return IDX[cual].get((g['fecha'], g['azul'], g['rojo']))

# ---- la previa: [1 (lado), Elo, tipo de daño, frontline, curva del draft] (igual que el motor) ----
def lado(meta, side):
    ps = meta[side + 'TeamMetadata']['participantMetadata']; ad = ap = 0; front = 0; sc = 0
    for p in ps:
        c = CAMPS.get(p['championId'], {}); info = c.get('info', {'attack': 5, 'magic': 5, 'defense': 5}); tags = c.get('tags', [])
        wt = 0.5 if p.get('role') == 'support' else 1; tot = (info['attack'] + info['magic']) or 1
        ad += wt * info['attack'] / tot; ap += wt * info['magic'] / tot
        if 'Tank' in tags or info['defense'] >= 7: front += 1
        sc += CHAMP.get(p['championId'], {}).get('scale', 0)
    return {'ad': ad / ((ad + ap) or 1), 'front': front, 'scale': sc / (len(ps) or 1)}
def xprev(g, cual):
    e = elo(g, cual); ez = (e[0] - e[1]) * math.log(10) / 400 if e else 0
    B, R = lado(g['meta'], 'blue'), lado(g['meta'], 'red')
    ext = lambda t: 1 if t['ad'] >= 0.8 or t['ad'] <= 0.2 else 0; nof = lambda t: 0 if t['front'] else 1
    return [1, ez, ext(R) - ext(B), nof(R) - nof(B), (B['scale'] - R['scale']) * 10]

def medir(p, y):
    if not len(y): return {'acierto': None, 'brier': None, 'logloss': None, 'n': 0}
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return {'acierto': round(float(np.mean((p >= 0.5) == (y == 1))), 4), 'brier': round(float(np.mean((p - y) ** 2)), 4),
            'logloss': round(float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))), 4), 'n': int(len(y))}
sig = lambda z: 1 / (1 + np.exp(-np.clip(z, -4.6, 4.6)))
def ajustar(X, Y, w=None, Cs=(0.03, 0.1, 0.3, 1.0)):
    # el C se elige con los últimos 20 % del entrenamiento (por fecha), sin mirar la prueba
    n = len(Y); k = int(n * 0.8); mejor = None
    for c in Cs:
        lr = LogisticRegression(C=c, fit_intercept=False, max_iter=3000).fit(X[:k], Y[:k], sample_weight=None if w is None else w[:k])
        b = float(np.mean((lr.predict_proba(X[k:])[:, 1] - Y[k:]) ** 2))
        if mejor is None or b < mejor[0]: mejor = (b, c)
    return LogisticRegression(C=mejor[1], fit_intercept=False, max_iter=3000).fit(X, Y, sample_weight=w), mejor[1]

ok = [g for g in juegos if elo(g, 'viejo') and elo(g, 'region')]
ok.sort(key=lambda g: g['fecha'])
Y = np.array([1 if g['ganador'] == 'blue' else 0 for g in ok]); T = np.array([g['fecha'] >= CORTE for g in ok])
I = np.array([g.get('liga') in INTL for g in ok]); tr, te = ~T, T
dias = np.array([(np.datetime64(g['fecha'][:10]) - np.datetime64('2025-01-01')).astype(int) for g in ok], float)
res = {'corte': CORTE, 'juegos': len(ok), 'prueba': int(te.sum()), 'prueba_intl': int((te & I).sum()), 'previa': {}, 'por_minuto': {}}
print(f'con Elo: {len(ok)} · entreno {int(tr.sum())} · prueba {int(te.sum())} (internacionales {int((te & I).sum())})')

# ---- 1. antes del juego: Elo viejo contra Elo con regiones ----
PRE = {}
for cual in ['viejo', 'region']:
    X = np.array([xprev(g, cual) for g in ok], float)
    lr, c = ajustar(X[tr], Y[tr]); p = lr.predict_proba(X)[:, 1]
    PRE[cual] = {'X': X, 'w': lr.coef_[0], 'C': c}
    res['previa'][cual] = {'todos': medir(p[te], Y[te]), 'intl': medir(p[te & I], Y[te & I])}
    print(f"previa · Elo {cual}: {res['previa'][cual]['todos']} · internacionales {res['previa'][cual]['intl']}")
actual_pre = np.array(MODELO['pre']['w'])
res['previa']['actual'] = {'todos': medir(sig(PRE['viejo']['X'][te] @ actual_pre), Y[te]), 'intl': medir(sig(PRE['viejo']['X'][te & I] @ actual_pre), Y[te & I])}
print(f"previa · actual (pesos de hoy, Elo viejo): {res['previa']['actual']['todos']}")

# ---- 2. en vivo, por minuto: el modelo de hoy y cada idea nueva ----
el = lambda t: len([d for d in t['dragones'] if d != 'elder'])
eld = lambda t: len([d for d in t['dragones'] if d == 'elder'])
def minuto(g, m): return g['minutos'].get(str(m)) or g['minutos'].get(m)
def roles(g, side):
    return [p.get('role') for p in g['meta'][side + 'TeamMetadata']['participantMetadata']]
def base12(g, m, zpre):
    f = minuto(g, m); b, r = f['azul'], f['rojo']; dr = xprev(g, 'viejo')[4]
    return [1, zpre, (b['oro'] - r['oro']) / 1000, (b['kills'] - r['kills']) / 5, b['torres'] - r['torres'], b['inhib'] - r['inhib'], b['barones'] - r['barones'],
            el(b) - el(r), (el(b) >= 4) - (el(r) >= 4), (el(b) == 3) - (el(r) == 3), eld(b) - eld(r), dr]
def extra(g, m, grupo):
    f = minuto(g, m); b, r = f['azul'], f['rojo']; gd = (b['oro'] - r['oro']) / 1000
    if grupo == 'tendencia':   # cómo cambió la diferencia de oro en los últimos 2–3 minutos
        f0 = minuto(g, {10: 7, 15: 12, 20: 17, 25: 22}[m])
        return [gd - (f0['azul']['oro'] - f0['rojo']['oro']) / 1000] if f0 else [0]
    if grupo == 'carries':     # oro de mid + ADC por encima del resto (la ventaja que más pesa)
        if not b.get('oroJ') or not r.get('oroJ'): return [0]
        cg = lambda t, side: sum(o for o, ro in zip(t['oroJ'], roles(g, side)) if ro in ('mid', 'bottom'))
        return [(cg(b, 'blue') - cg(r, 'red')) / 1000 - gd * 0.4]
    if grupo == 'oro_x_draft':  # la ventaja vale distinto según qué draft escala mejor
        return [gd * xprev(g, 'viejo')[4]]
    if grupo == 'serie':        # en eliminatorias el que pierde elige lado; cómo va la serie
        if (g.get('bo') or 1) <= 1 or not g.get('antes'): return [0, 0]
        pa = g.get('perdioAntes'); return [(g['antes']['azul'] - g['antes']['rojo']), 1 if pa == 'azul' else -1 if pa == 'rojo' else 0]
    return []
GRUPOS = ['tendencia', 'carries', 'oro_x_draft', 'serie']
# zpre = la previa sin el lado (como en el motor: G.pre.zNoSide), con los pesos de la previa de cada Elo
def zpre(i, cual, w): x = PRE[cual]['X'][i]; return float(x[1:] @ w[1:])
# la previa final (con todos los juegos): el motor arma zpre con estos pesos, así que los modelos por minuto finales también
lr_pre, _ = ajustar(PRE['region']['X'], Y); W_FINAL = lr_pre.coef_[0]
propuesta = {'pre': [round(float(v), 4) for v in W_FINAL], 'min': {}}
IDXM = {}
for m in [10, 15, 20, 25]:
    idx = [i for i, g in enumerate(ok) if minuto(g, m)]
    if not idx: continue
    yi, tri, tei, ii = Y[idx], tr[idx], te[idx], I[idx]
    IDXM[m] = idx
    fila = {}
    Xv = np.array([base12(ok[i], m, zpre(i, 'viejo', actual_pre)) for i in idx], float)
    Xr = np.array([base12(ok[i], m, zpre(i, 'region', PRE['region']['w'])) for i in idx], float)
    pa = sig(Xv @ np.array(MODELO['min'][str(m)]))
    fila['actual'] = {'todos': medir(pa[tei], yi[tei]), 'intl': medir(pa[tei & ii], yi[tei & ii])}
    def probar(X, w=None):
        lr, c = ajustar(X[tri], yi[tri], None if w is None else w[tri]); p = lr.predict_proba(X)[:, 1]
        return {'todos': medir(p[tei], yi[tei]), 'intl': medir(p[tei & ii], yi[tei & ii]), 'C': c}, lr
    fila['reentrenado'], _ = probar(Xv)
    fila['elo_region'], lr_r = probar(Xr)
    for gr in GRUPOS:
        Xg = np.hstack([Xr, np.array([extra(ok[i], m, gr) for i in idx], float)])
        fila['+' + gr], _ = probar(Xg)
    Xt = np.hstack([Xr] + [np.array([extra(ok[i], m, gr) for i in idx], float) for gr in GRUPOS])
    fila['+todo'], _ = probar(Xt)
    rec = 0.5 ** ((dias[idx].max() - dias[idx]) / 180)   # los juegos de hace 6 meses pesan la mitad
    fila['elo_region_reciente'], _ = probar(Xr, rec)
    res['por_minuto'][m] = fila
    print(f'min {m}:')
    f3 = lambda x: '—' if x is None else f'{x:.3f}'
    for k, v in fila.items(): print(f"   {k:22s} todos {f3(v['todos']['acierto'])}/{f3(v['todos']['brier'])} · intl {f3(v['intl']['acierto'])}/{f3(v['intl']['brier'])}   (acierto/Brier)")
    # pesos finales de la versión que el motor ya sabe usar (12 variables, Elo con regiones), con todos los juegos
    Xf = np.array([base12(ok[i], m, zpre(i, 'region', W_FINAL)) for i in idx], float)
    lr_all, _ = ajustar(Xf, yi)
    propuesta['min'][str(m)] = [round(float(v), 4) for v in lr_all.coef_[0]]

# ---- 3. veredicto: qué entra. Cada idea se compara con lo que ya había (el Elo con regiones, contra el modelo de hoy
# y contra solo reentrenarlo; cada variable nueva, contra el Elo con regiones) ----
def mejora(clave, contra):
    pm = res['por_minuto']
    bi = lambda m, k: pm[m][k]['intl']['brier'] if pm[m][k]['intl']['brier'] is not None else 0
    return all(m in pm and pm[m][clave]['todos']['brier'] < min(pm[m][c]['todos']['brier'] for c in contra) and
               bi(m, clave) <= min(bi(m, c) for c in contra) + 0.002 for m in [15, 20])
res['veredicto'] = {'elo_region': mejora('elo_region', ['actual', 'reentrenado']), 'elo_region_reciente': mejora('elo_region_reciente', ['elo_region'])}
for k in ['+' + g for g in GRUPOS] + ['+todo']: res['veredicto'][k] = mejora(k, ['elo_region'])
# las variables extra que entran: las que pasaron solas, y juntas tienen que pasar también (si no, solo la mejor)
ELEGIDOS = [g for g in GRUPOS if res['veredicto']['+' + g]]
def con_extras(m, gs, wpre):
    idx = IDXM[m]
    return np.hstack([np.array([base12(ok[i], m, zpre(i, 'region', wpre)) for i in idx], float)] +
                     [np.array([extra(ok[i], m, g) for i in idx], float) for g in gs]), idx
if len(ELEGIDOS) > 1:
    for m in res['por_minuto']:
        X, idx = con_extras(m, ELEGIDOS, PRE['region']['w']); yi, tri, tei, ii = Y[idx], tr[idx], te[idx], I[idx]
        lr, _ = ajustar(X[tri], yi[tri]); p = lr.predict_proba(X)[:, 1]
        res['por_minuto'][m]['+elegidos'] = {'todos': medir(p[tei], yi[tei]), 'intl': medir(p[tei & ii], yi[tei & ii])}
    if not mejora('+elegidos', ['elo_region']):
        ELEGIDOS = [min(ELEGIDOS, key=lambda g: res['por_minuto'][15]['+' + g]['todos']['brier'])]
res['extra'] = ELEGIDOS
res['veredicto']['previa_region'] = res['previa']['region']['todos']['brier'] < res['previa']['actual']['todos']['brier']
# el modelo propuesto, en el formato de MODELO en engine.js (con MODELO.extra si entró alguna variable nueva)
if ELEGIDOS:
    for m in list(propuesta['min']):
        X, idx = con_extras(int(m), ELEGIDOS, W_FINAL); lr, _ = ajustar(X, Y[idx])
        propuesta['min'][m] = [round(float(v), 4) for v in lr.coef_[0]]
res['modelo_propuesto'] = {'pre': {'w': propuesta['pre']}, 'min': propuesta['min'], 'juegos': len(ok)}
if ELEGIDOS: res['modelo_propuesto']['extra'] = ELEGIDOS
print('VARIABLES NUEVAS QUE ENTRAN:', ELEGIDOS or 'ninguna')
print('VEREDICTO:', json.dumps(res['veredicto']))
print('MODELO_PROPUESTO ' + json.dumps(res['modelo_propuesto'], separators=(',', ':')))
json.dump(res, open(os.path.join(AQUI, 'datos', 'resultado.json'), 'w'), indent=1)
print('RESULTADO_JSON ' + json.dumps(res))
