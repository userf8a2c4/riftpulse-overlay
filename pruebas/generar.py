"""Genera los videos sintéticos de las pruebas en pruebas/.gen/ (no se suben al repo).

Un HUD del Mundial dibujado a mano con una tipografía libre (Saira Condensed, OFL): reloj, siglas, oro, kills y
retratos de campeones (colores planos). Así se prueba el lector sin usar imágenes de la transmisión oficial.

  vod.webm   80 s: juego 1 de 4:20 a 5:09 (con 10 s de «repetición» sin marcador), luego el juego 2 desde 0:05
  desk.webm  60 s: juego 1 desde 4:20, con 25 s de desk sin marcador en el medio
  clip.webm  60 s: 15 s de un juego ya jugado (juego 1 desde 4:20), como un clip en la previa, y después el desk
  final.webm 40 s: el final del juego 1 (25:00) con el HUD todavía en pantalla, como en los mejores momentos
  correr.webm 40 s: juego 2 corriendo desde 16:58, con marcador 2–3
  replay.webm 50 s: juego 1 desde 4:20; de 15 s a 27 s una repetición con el HUD (el reloj vuelve a 3:50); después sigue en 4:47
  serie.webm 40 s: juego 2 desde 1:40 con los mismos retratos que el juego 1: solo la serie en pantalla (1–0) dice que es el 2

En los cuadros del juego 2, junto a cada sigla se ven las victorias en la serie (IG 1–0), como en el HUD de 2026.
"""
import os, random, subprocess, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(AQUI, '.gen'); os.makedirs(GEN, exist_ok=True)
FUENTE = os.path.join(AQUI, 'fixtures', 'SairaCondensed-SemiBold.ttf')
W, H = 1920, 1080
F30, F40, F44 = (ImageFont.truetype(FUENTE, n) for n in (30, 40, 46))
random.seed(7)

# retratos: 10 colores por juego (los íconos de los campeones que sirve el simulador de Data Dragon)
PALETAS = {'A': ['#d94f3d', '#3d8ad9', '#e0c341', '#58b368', '#9b59d0'], 'B': ['#ff8a3d', '#2fc4c4', '#c44f8a', '#7a8a3d', '#4f5fd9'],
           'C': ['#5a2f8a', '#8ad92f', '#d92f5a', '#2f5ad9', '#d9a12f'], 'D': ['#2fd99b', '#a12fd9', '#d95a2f', '#5ad9d9', '#d9d92f']}
CAM_X = {'blue': (0.372, 0.393), 'red': (0.607, 0.628)}
CAM_Y = [0.761, 0.81, 0.859, 0.907, 0.953]
CAM_H = 0.042


def iconos():
    d = os.path.join(GEN, 'iconos'); os.makedirs(d, exist_ok=True)
    for pre, cols in PALETAS.items():
        for i, c in enumerate(cols):
            im = Image.new('RGB', (120, 120), c); dr = ImageDraw.Draw(im)
            dr.ellipse((30, 20, 90, 80), fill='#f2e6d0'); dr.rectangle((20, 85, 100, 120), fill='#222')
            im.save(os.path.join(d, f'{pre}{i}.png'))


def fondo():
    im = Image.new('RGB', (W, H), (34, 58, 40)); dr = ImageDraw.Draw(im)
    for _ in range(260):
        x, y, r = random.randint(0, W), random.randint(0, H), random.randint(20, 140)
        c = (random.randint(25, 70), random.randint(50, 95), random.randint(30, 60))
        dr.ellipse((x - r, y - r, x + r, y + r), fill=c)
    im = im.filter(ImageFilter.GaussianBlur(18))
    dr = ImageDraw.Draw(im)
    dr.rectangle((0, 800, W, H), fill=(14, 16, 22))  # panel de jugadores
    return im


BASE = fondo()


def serie(dr, wa, wb, bo=3):
    """Las victorias de la serie: una columna de rectángulos junto a cada logo, que se llenan con el color del lado."""
    n = bo // 2 + 1  # medidas de la transmisión de 2026 (en 1920×1080): barra en x≈516 y 1404, rectángulos al lado
    for x0, bar, col, w in ((508, 514, (61, 139, 255), wa), (1383, 1402, (255, 70, 85), wb)):
        dr.rectangle((x0, 8, x0 + 29, 72), fill=(10, 12, 16))
        dr.rectangle((bar, 10, bar + 4, 62), fill=col)  # la barra de color del lado
        px = 520 if x0 == 508 else 1391
        alto = (64 - 16 - 4 * (n - 1)) // n
        for i in range(n):
            y = 16 + i * (alto + 4)
            dr.rectangle((px, y, px + 9, y + alto), fill=col if i < w else (6, 7, 9), outline=(70, 74, 82))


def cuadro(gt, oro_a, oro_b, ka, kb, retratos, con_hud=True, vict=None):
    im = BASE.copy(); dr = ImageDraw.Draw(im)
    if con_hud and vict: serie(dr, *vict)
    if con_hud:
        dr.rectangle((540, 0, 1380, 128), fill=(10, 12, 16))
        dr.text((640, 34), 'IG', font=F44, fill=(80, 160, 255), anchor='mm')
        dr.text((1286, 34), 'LYON', font=F44, fill=(255, 80, 90), anchor='mm')
        dr.text((838, 38), '%.1fK' % oro_a, font=F40, fill=(240, 240, 240), anchor='mm')
        dr.text((1092, 38), '%.1fK' % oro_b, font=F40, fill=(240, 240, 240), anchor='mm')
        dr.text((926, 40), str(ka), font=F40, fill=(240, 240, 240), anchor='mm')
        dr.text((994, 40), str(kb), font=F40, fill=(240, 240, 240), anchor='mm')
        dr.text((960, 94), '%02d:%02d' % (gt // 60, gt % 60), font=F30, fill=(235, 235, 235), anchor='mm')
    for side, pre in retratos.items():
        x0, x1 = CAM_X[side]
        for i, y in enumerate(CAM_Y):
            ic = Image.open(os.path.join(GEN, 'iconos', f'{pre}{i}.png')).resize((int((x1 - x0) * W), int(CAM_H * H)))
            im.paste(ic, (int(x0 * W), int(y * H)))
    return im


def video(nombre, cuadros):
    d = os.path.join(GEN, 'cuadros'); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    for i, im in enumerate(cuadros): im.save(os.path.join(d, '%03d.png' % i))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '1', '-i', os.path.join(d, '%03d.png'),
                    '-c:v', 'libvpx-vp9', '-b:v', '3M', '-pix_fmt', 'yuv420p', '-r', '10', os.path.join(GEN, nombre)], check=True)
    shutil.rmtree(d)


if __name__ == '__main__':
    iconos()
    oro = lambda gt: 2.5 + 0.0265 * gt  # el mismo oro que da el simulador del feed
    vod = []
    for t in range(80):
        if t < 50: gt, ret = 260 + t, {'blue': 'A', 'red': 'B'}
        else: gt, ret = 5 + (t - 50), {'blue': 'C', 'red': 'D'}
        vod.append(cuadro(gt, oro(gt), oro(gt) + 0.1, 0, 0, ret, con_hud=not (15 <= t < 25), vict=(1, 0) if t >= 50 else None))
    video('vod.webm', vod)
    # desk.webm 60 s: juego 1 desde 4:20; de 20 s a 45 s el desk (sin marcador); luego el juego sigue en 4:45
    video('desk.webm', [cuadro(260 + t, oro(260 + t), oro(260 + t) + 0.1, 0, 0, {'blue': 'A', 'red': 'B'}, con_hud=not (20 <= t < 45)) for t in range(60)])
    video('clip.webm', [cuadro(260 + t, oro(260 + t), oro(260 + t) + 0.1, 0, 0, {'blue': 'A', 'red': 'B'}, con_hud=t < 15) for t in range(60)])
    video('final.webm', [cuadro(1480 + t, oro(1480 + t), oro(1480 + t) + 0.1, 5, 1, {'blue': 'A', 'red': 'B'}) for t in range(40)])
    video('correr.webm', [cuadro(1018 + t, 28.7, 29.7, 2, 3, {'blue': 'C', 'red': 'D'}, vict=(1, 0)) for t in range(40)])
    rep = lambda t: 260 + t if not (15 <= t < 27) else 230 + (t - 15)
    video('replay.webm', [cuadro(rep(t), oro(rep(t)), oro(rep(t)) + 0.1, 0, 0, {'blue': 'A', 'red': 'B'}) for t in range(50)])
    video('serie.webm', [cuadro(100 + t, oro(100 + t), oro(100 + t) + 0.1, 0, 0, {'blue': 'A', 'red': 'B'}, vict=(1, 0)) for t in range(40)])
    print('Videos listos en', GEN)
