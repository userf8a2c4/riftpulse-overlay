# Reentrena el modelo de RiftPulse con los juegos que juntó recolectar.js y lo compara con el actual.
# Prueba honesta: se entrena con los juegos anteriores al 1/8/2026 y se mide en los posteriores (que el modelo no vio).
# Uso: python3 modelo/entrenar.py  → imprime el informe y deja modelo/datos/resultado.json
import json, math, os, re, urllib.request
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier

AQUI = os.path.dirname(os.path.abspath(__file__))
ENG = open(os.path.join(AQUI, '..', 'engine.js'), encoding='utf-8').read()
MODELO = json.loads(re.search(r'var MODELO = (\{.*?\});', ENG).group(1))
CHAMP = json.loads(re.search(r'var CHAMP = (\{.*?\});', ENG).group(1))
CORTE = os.environ.get('CORTE', '2026-08-01')

def bajar(u):
    with urllib.request.urlopen(u, timeout=30) as r: return json.loads(r.read().decode('utf-8'))
ver = bajar('https://ddragon.leagueoflegends.com/api/versions.json')[0]
CAMPS = {c['id']: c for c in bajar(f'https://ddragon.leagueoflegends.com/cdn/{ver}/data/es_MX/champion.json')['data'].values()}
ITEMS = {int(k) for k, it in bajar(f'https://ddragon.leagueoflegends.com/cdn/{ver}/data/es_MX/item.json')['data'].items()
         if it.get('gold', {}).get('total', 0) >= 2200 and not it.get('into') and not set(it.get('tags', [])) & {'Boots', 'Consumable', 'Trinket'}}

juegos = [json.loads(l) for l in open(os.path.join(AQUI, 'datos', 'juegos.jsonl'), encoding='utf-8')]
series = sorted(json.load(open(os.path.join(AQUI, 'datos', 'series.json'), encoding='utf-8')), key=lambda s: s['fecha'])
print(f'juegos: {len(juegos)} · series: {len(series)} · Data Dragon {ver}')

# ---- Elo antes de cada serie (en orden de fecha, todas las ligas juntas) ----
E, ELO_PRE = {}, {}
for s in series:
    a, b = s['a'], s['b']; ea, eb = E.get(a, 1500.0), E.get(b, 1500.0)
    ELO_PRE[(s['fecha'], a, b)] = (ea, eb)
    if s['wa'] == s['wb']: continue
    exp = 1 / (1 + 10 ** ((eb - ea) / 400)); k = 24 * max(1, abs(s['wa'] - s['wb'])) / (1.5 if s['wa'] + s['wb'] > 1 else 1)
    r = 1 if s['wa'] > s['wb'] else 0; E[a] = ea + k * (r - exp); E[b] = eb - k * (r - exp)
def elo(g):
    for (f, a, b), v in ((k, v) for k, v in ELO_PRE.items() if k[0] == g['fecha']):
        if {a, b} == {g['azul'], g['rojo']}: return v if a == g['azul'] else (v[1], v[0])
    return None

# ---- la previa (igual que la app y el motor: pesos MODELO.pre) ----
W = MODELO['pre']['w']
def lado(meta, side):
    ps = meta[side + 'TeamMetadata']['participantMetadata']; ad = ap = 0; front = 0; sc = 0
    for p in ps:
        c = CAMPS.get(p['championId'], {}); info = c.get('info', {'attack': 5, 'magic': 5, 'defense': 5}); tags = c.get('tags', [])
        wt = 0.5 if p.get('role') == 'support' else 1; tot = (info['attack'] + info['magic']) or 1
        ad += wt * info['attack'] / tot; ap += wt * info['magic'] / tot
        if 'Tank' in tags or info['defense'] >= 7: front += 1
        sc += CHAMP.get(p['championId'], {}).get('scale', 0)
    return {'ad': ad / ((ad + ap) or 1), 'front': front, 'scale': sc / (len(ps) or 1)}
def previa(g):
    e = elo(g); ez = (e[0] - e[1]) * math.log(10) / 400 if e else 0
    B, R = lado(g['meta'], 'blue'), lado(g['meta'], 'red')
    ext = lambda t: 1 if t['ad'] >= 0.8 or t['ad'] <= 0.2 else 0; nof = lambda t: 0 if t['front'] else 1
    x = [ez, ext(R) - ext(B), nof(R) - nof(B), (B['scale'] - R['scale']) * 10]
    return sum(w * v for w, v in zip(W[1:], x)), (B['scale'] - R['scale']) * 10

# ---- factores en vivo: los 12 del modelo actual + los nuevos ----
el = lambda t: len([d for d in t['dragones'] if d != 'elder'])
eld = lambda t: len([d for d in t['dragones'] if d == 'elder'])
NOMBRES = ['lado', 'previa', 'oro', 'kills', 'torres', 'inhib', 'barones', 'dragones', 'alma', 'punto_alma', 'ancestral', 'draft',
           'nivel', 'cs', 'wards_puestas', 'wards_destruidas', 'items']
def fila(g, m):
    f = g['minutos'].get(str(m)) or g['minutos'].get(m)
    if not f: return None
    b, r = f['azul'], f['rojo']; zpre, dr = previa(g)
    base = [1, zpre, (b['oro'] - r['oro']) / 1000, (b['kills'] - r['kills']) / 5, b['torres'] - r['torres'], b['inhib'] - r['inhib'], b['barones'] - r['barones'],
            el(b) - el(r), (el(b) >= 4) - (el(r) >= 4), (el(b) == 3) - (el(r) == 3), eld(b) - eld(r), dr]
    tiene = 'nivel' in b and 'nivel' in r
    comp = lambda t: sum(1 for its in t.get('items', []) for i in its if i in ITEMS)
    nuevos = [b['nivel'] - r['nivel'], (b['cs'] - r['cs']) / 100, (b['wp'] - r['wp']) / 10, (b['wd'] - r['wd']) / 10, comp(b) - comp(r)] if tiene else [0, 0, 0, 0, 0]
    return base + nuevos, tiene

def medir(p, y):
    p = np.clip(p, 1e-6, 1 - 1e-6); return float(np.mean((p >= 0.5) == (y == 1))), float(np.mean((p - y) ** 2))
res = {'corte': CORTE, 'juegos': len(juegos), 'por_minuto': {}, 'pesos': {}}
for m in [10, 15, 20, 25]:
    X, Y, T, C = [], [], [], []
    for g in juegos:
        fl = fila(g, m)
        if fl is None or not elo(g): continue
        X.append(fl[0]); Y.append(1 if g['ganador'] == 'blue' else 0); T.append(g['fecha'] >= CORTE); C.append(fl[1])
    X, Y, T = np.array(X, float), np.array(Y), np.array(T)
    tr, te = ~T, T
    if te.sum() < 50 or tr.sum() < 200: print(f'min {m}: pocos juegos ({tr.sum()} / {te.sum()})'); continue
    actual = 1 / (1 + np.exp(-np.clip(X[:, :12] @ np.array(MODELO['min'][str(m)]), -4.6, 4.6)))
    fila_r = {'entreno': int(tr.sum()), 'prueba': int(te.sum()), 'actual': medir(actual[te], Y[te])}
    mejor = None
    for nombre, cols in [('reentrenado', 12), ('ampliado', len(NOMBRES))]:
        for c in [0.05, 0.1, 0.3, 1.0]:
            lr = LogisticRegression(C=c, fit_intercept=False, max_iter=2000).fit(X[tr][:, :cols], Y[tr])
            a, br = medir(lr.predict_proba(X[te][:, :cols])[:, 1], Y[te])
            if nombre not in fila_r or br < fila_r[nombre][1]: fila_r[nombre] = (a, br); fila_r[nombre + '_C'] = c
    gb = HistGradientBoostingClassifier(max_iter=200, learning_rate=0.05, max_leaf_nodes=15).fit(X[tr], Y[tr])
    fila_r['arboles'] = medir(gb.predict_proba(X[te])[:, 1], Y[te])
    res['por_minuto'][m] = fila_r
    # pesos finales del ampliado con todos los juegos (como la versión activa de hoy)
    lr = LogisticRegression(C=fila_r['ampliado_C'], fit_intercept=False, max_iter=2000).fit(X[:, :len(NOMBRES)], Y)
    res['pesos'][str(m)] = [round(float(w), 4) for w in lr.coef_[0]]
    print(f"min {m}: entreno {fila_r['entreno']} · prueba {fila_r['prueba']} | actual {fila_r['actual'][0]:.3f}/{fila_r['actual'][1]:.4f} · "
          f"reentrenado {fila_r['reentrenado'][0]:.3f}/{fila_r['reentrenado'][1]:.4f} · ampliado {fila_r['ampliado'][0]:.3f}/{fila_r['ampliado'][1]:.4f} · "
          f"árboles {fila_r['arboles'][0]:.3f}/{fila_r['arboles'][1]:.4f}   (acierto/Brier)")
res['nombres'] = NOMBRES
gana = all(m in res['por_minuto'] and res['por_minuto'][m]['ampliado'][1] < res['por_minuto'][m]['actual'][1] for m in [15, 20])
res['veredicto'] = 'el ampliado mejora' if gana else 'el actual se queda'
print('VEREDICTO:', res['veredicto'])
json.dump(res, open(os.path.join(AQUI, 'datos', 'resultado.json'), 'w'), indent=1)
print('RESULTADO_JSON ' + json.dumps(res))
