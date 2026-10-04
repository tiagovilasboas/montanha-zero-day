#!/usr/bin/env python3
"""Turns raw art (art/raw/*.png and *.mp4) into the game assets (assets/*.webp and anims.json).

Removes the chroma background (magenta or green), trims empty borders, splits hero poses,
slices floor tiles, builds animation sheets from the video clips and resizes everything to
SCALE real pixels per logical pixel (the camera zoom shows the art up to ~6x).
See docs/ART_PIPELINE.md.

    python3 tools/process_art.py
"""
import json, subprocess, tempfile
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
RAW, OUT = ROOT / "art" / "raw", ROOT / "assets"
SCALE = 6  # pixels reais por pixel lógico (o jogo mostra a arte até ~6x com o zoom da câmera)


KEYS = {"magenta": (255, 0, 255), "green": (0, 255, 0)}


def chroma_key(img: Image.Image, key_name: str = "") -> Image.Image:
    """Remove o fundo de cor sólida com borda suave e sem halo. Sem chave explícita, usa a cor dos cantos."""
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    if key_name:
        key = np.array(KEYS[key_name], dtype=np.float32)
    else:
        corners = np.concatenate([rgb[:8, :8].reshape(-1, 3), rgb[:8, -8:].reshape(-1, 3),
                                  rgb[-8:, :8].reshape(-1, 3), rgb[-8:, -8:].reshape(-1, 3)])
        key = np.median(corners, axis=0)
    dist = np.linalg.norm(rgb - key, axis=2)
    alpha = np.clip((dist - 60) / 70, 0, 1)
    # Tira o reflexo da cor-chave nas bordas (despill): limita o canal dominante da chave.
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key[1] > key[0] and key[1] > key[2]:            # verde
        g = np.minimum(g, np.maximum(r, b))
    else:                                               # magenta
        cap = g + 20
        r, b = np.minimum(r, np.maximum(cap, r * (1 - (1 - alpha) * 0.8))), np.minimum(b, np.maximum(cap, b * (1 - (1 - alpha) * 0.8)))
    out = np.dstack([r, g, b, alpha * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def trim(img: Image.Image, pad: int = 4) -> Image.Image:
    a = np.asarray(img)[..., 3]
    ys, xs = np.where(a > 16)
    return img.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0), xs.max() + pad, ys.max() + pad))


def fit(img: Image.Image, *, height: int = 0, width: int = 0) -> Image.Image:
    ratio = height / img.height if height else width / img.width
    return img.resize((max(1, round(img.width * ratio)), max(1, round(img.height * ratio))), Image.LANCZOS)


def save(img: Image.Image, name: str, quality: int = 88) -> None:
    OUT.mkdir(exist_ok=True)
    img.save(OUT / f"{name}.webp", "WEBP", quality=quality, method=6)
    print(f"  {name}.webp {img.size}")


def split_poses(img: Image.Image) -> list:
    """Separa as figuras de uma folha pelas maiores manchas conectadas, da esquerda para a direita."""
    a = np.asarray(img)[..., 3] > 40
    labels, n = ndimage.label(ndimage.binary_dilation(a, iterations=6))
    sizes = ndimage.sum(a, labels, range(1, n + 1))
    objects = ndimage.find_objects(labels)
    keep = sorted((int(l) + 1 for l in np.argsort(sizes)[-4:]), key=lambda l: objects[l - 1][1].start)
    poses = []
    for l in keep:
        sl = objects[l - 1]
        crop = img.crop((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
        mask = Image.fromarray(((labels == l)[sl] * 255).astype(np.uint8))
        crop.putalpha(Image.fromarray(np.minimum(np.asarray(crop)[..., 3], np.asarray(mask))))
        poses.append(crop)
    return poses


def hero() -> None:
    poses = split_poses(chroma_key(Image.open(RAW / "hero_sheet.png")))
    base = max(p.height for p in poses)
    for name, pose in zip(["idle", "run", "jump", "shoot"], poses):
        # Mesma escala para todas as poses: a mais alta vira 36 px lógicos.
        save(pose.resize((round(pose.width * 36 * SCALE / base), round(pose.height * 36 * SCALE / base)), Image.LANCZOS), f"hero_{name}")


def sprite(name: str, *, height: int = 0, width: int = 0, flip: bool = False) -> None:
    img = trim(chroma_key(Image.open(RAW / f"{name}.png")))
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    save(fit(img, height=height * SCALE, width=width * SCALE), name)


def pinkify(img: Image.Image) -> Image.Image:
    """BYTE da Gle: gira os acentos ciano/azul para rosa-choque e dá um tom rosado ao casco claro."""
    import colorsys
    a = np.asarray(img.convert("RGBA")).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    sat, val = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0), mx
    # matiz em graus (vetorizado)
    d = np.maximum(mx - mn, 1e-6)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    accent = (hue > 150) & (hue < 260) & (sat > 0.3)
    out = a.copy()
    for y, x in zip(*np.nonzero(accent)):          # só os poucos pixels de acento: loop barato
        h, s, v = colorsys.rgb_to_hsv(*a[y, x, :3])
        out[y, x, :3] = colorsys.hsv_to_rgb(0.90, min(1, s * 1.05), min(1, v * 1.05))
    shell = (~accent) & (sat < 0.25) & (val > 0.55)
    out[..., 1] = np.where(shell, out[..., 1] * 0.90, out[..., 1])     # casco: menos verde = tom rosado
    out[..., 2] = np.where(shell, out[..., 2] * 0.97, out[..., 2])
    return Image.fromarray((out.clip(0, 1) * 255).astype(np.uint8), "RGBA")


def tiles() -> None:
    """A folha tem 3 linhas (cidade, data center, núcleo) por 3 colunas; usa a célula do meio de cada linha."""
    rgb = np.asarray(Image.open(RAW / "tiles.png").convert("RGB")).astype(int)
    bg = np.median(rgb[:6, :6].reshape(-1, 3), axis=0)
    mask = np.linalg.norm(rgb - bg, axis=2) > 40
    labels, n = ndimage.label(ndimage.binary_opening(mask, iterations=2))
    boxes = [s for s in ndimage.find_objects(labels) if (s[0].stop - s[0].start) > 150 and (s[1].stop - s[1].start) > 150]
    boxes.sort(key=lambda s: (round(s[0].start / 200), s[1].start))
    src = Image.open(RAW / "tiles.png").convert("RGB")
    for row, name in enumerate(["tile_city", "tile_dc", "tile_core"]):
        s = boxes[row * 3 + 1]
        save(src.crop((s[1].start, s[0].start, s[1].stop, s[0].stop)).resize((16 * SCALE, 16 * SCALE), Image.LANCZOS), name)


def backgrounds() -> None:
    for theme, key in (("city", "magenta"), ("dc", "magenta"), ("core", "green")):
        save(Image.open(RAW / f"bg_{theme}_far.png").convert("RGB"), f"bg_{theme}_far", 82)
        save(chroma_key(Image.open(RAW / f"bg_{theme}_near.png"), key), f"bg_{theme}_near", 85)
    save(Image.open(RAW / "title_art.png").convert("RGB").resize((1376, 768), Image.LANCZOS), "title_art", 84)


def portraits() -> None:
    save(fit(chroma_key(Image.open(RAW / "hero_portrait.png")), width=256), "portrait_hero")
    byte = fit(trim(chroma_key(Image.open(RAW / "byte.png"))), width=256)
    save(byte, "portrait_byte"); save(pinkify(byte), "portrait_byte_pink")
    boss = trim(chroma_key(Image.open(RAW / "boss.png")))
    save(fit(boss.crop((0, 0, boss.width, int(boss.height * 0.75))), width=256), "portrait_boss")
    src = latest("gleyce_portrait")
    if src:
        save(fit(chroma_key(Image.open(src), "magenta"), width=256), "portrait_gleyce")


def latest(name: str):
    """Versão mais nova de uma peça refeita (name_vN.png de maior N; senão name.png)."""
    versions = sorted(RAW.glob(f"{name}_v*.png"), key=lambda p: int(p.stem.rsplit("_v", 1)[1]))
    return versions[-1] if versions else (RAW / f"{name}.png" if (RAW / f"{name}.png").exists() else None)


def gleyce() -> None:
    """Gle presa na cápsula no fim da fase 1 (34 px lógicos de largura)."""
    src = latest("gleyce_capsule")
    if src:
        save(fit(trim(chroma_key(Image.open(src), "green")), width=40 * SCALE), "gleyce_capsule")


# ---- Animações do herói a partir dos vídeos (art/raw/anim_*.mp4)
ANIMS = {  # nome: (quadros desejados, modo de recorte do clipe)
    "run": (10, "cycle"), "idle": (12, "pingpong"), "jump": (6, "tail"), "shoot": (6, "head"),
}


def video_frames(path: Path, fps: int = 24) -> list:
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-vf", f"fps={fps}", f"{tmp}/f%03d.png"], check=True)
        return [dehaze(chroma_key(Image.open(f), "magenta")) for f in sorted(Path(tmp).glob("f*.png"))]


def dehaze(img: Image.Image) -> Image.Image:
    """Remove o brilho lilás que sobra quando o jato/tiro se mistura ao fundo magenta."""
    a = np.asarray(img).copy()
    r, g, b = (a[..., i].astype(int) for i in range(3))
    a[..., 3][(r - g > 18) & (b - g > 18)] = 0
    # Ilhas soltas (restos do brilho) somem; fica só o que está ligado ao personagem.
    labels, n = ndimage.label(a[..., 3] > 40)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(labels), labels, range(1, n + 1))
        keep = np.isin(labels, 1 + np.nonzero(sizes >= sizes.max() * 0.03)[0])
        a[..., 3][~keep] = 0
    return Image.fromarray(a)


def bbox(img: Image.Image) -> tuple:
    a = np.asarray(img)[..., 3]
    ys, xs = np.where(a > 40)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def anchor(img: Image.Image) -> tuple:
    """Âncora do quadro: x médio do tronco (40% de cima do corpo) e y da base dos pés."""
    x0, y0, x1, y1 = bbox(img)
    top = np.asarray(img)[y0:y0 + int((y1 - y0) * 0.4), :, 3] > 40
    return int(np.nonzero(top)[1].mean()), y1


def cycle_length(frames: list) -> int:
    """Período da corrida: primeiro quadro (depois de alguns) mais parecido com o quadro inicial."""
    base = np.asarray(frames[0].convert("L"), dtype=np.float32)
    diffs = [np.abs(np.asarray(f.convert("L"), dtype=np.float32) - base).mean() for f in frames]
    candidates = range(8, min(len(frames), 40))
    return min(candidates, key=lambda i: diffs[i])


def pick(frames: list, count: int, mode: str) -> list:
    if mode == "cycle":
        frames = frames[:cycle_length(frames)]
    elif mode == "tail":
        frames = frames[len(frames) // 2:]
    elif mode == "head":   # o fim do clipe de tiro vira close no relógio: fica de fora
        frames = frames[:int(len(frames) * 0.55)]
    idx = np.linspace(0, len(frames) - 1, count).round().astype(int)
    chosen = [frames[i] for i in idx]
    return chosen + chosen[-2:0:-1] if mode == "pingpong" else chosen


def animations(prefix: str, clip: str) -> dict:
    """Folhas de animação de um personagem: art/raw/{clip}{pose}.mp4 -> assets/anim_{prefix}_{pose}.webp."""
    clips = {n: RAW / f"{clip}{n}.mp4" for n in ANIMS}
    if not all(p.exists() for p in clips.values()):
        print(f"  ({prefix}: vídeos ainda não baixados, animações puladas)")
        return {}
    frames = {n: video_frames(p) for n, p in clips.items()}
    # Escala única: a altura do personagem parado no 1º quadro vira 36 px lógicos.
    x0, y0, x1, y1 = bbox(frames["idle"][0])
    scale = 36 * SCALE / (y1 - y0)
    meta = {}
    for name, (count, mode) in ANIMS.items():
        chosen = pick(frames[name], count, mode)
        # Cada quadro é alinhado pelo tronco (x) e pelos pés (y): o vídeo anda dentro do quadro, o jogo não.
        anchors = [anchor(f) for f in chosen]
        boxes = [bbox(f) for f in chosen]
        left = max(cx - b[0] for (cx, _), b in zip(anchors, boxes))
        right = max(b[2] - cx for (cx, _), b in zip(anchors, boxes))
        up = max(fy - b[1] for (_, fy), b in zip(anchors, boxes))
        down = max(b[3] - fy for (_, fy), b in zip(anchors, boxes))
        w, h = round((left + right) * scale), round((up + down) * scale)
        sheet = Image.new("RGBA", (w * len(chosen), h))
        for i, (f, (cx, fy)) in enumerate(zip(chosen, anchors)):
            cell = f.crop((cx - left, fy - up, cx + right, fy + down)).resize((w, h), Image.LANCZOS)
            sheet.alpha_composite(cell, (i * w, 0))
        key = f"{prefix}_{name}"
        save(sheet, f"anim_{key}")
        meta[key] = {"frames": len(chosen), "w": w, "h": h, "ax": round(left * scale), "ay": round(up * scale)}
    return meta


def gle_poses() -> None:
    """Poses paradas da Gle (reserva enquanto as animações carregam), 36 px lógicos de altura."""
    for pose in ("idle", "run", "jump", "shoot"):
        src = latest(f"gle_{pose}")
        if src:
            save(fit(trim(chroma_key(Image.open(src), "magenta")), height=36 * SCALE), f"gle_{pose}")


if __name__ == "__main__":
    hero()
    sprite("byte", height=16)
    save(pinkify(Image.open(OUT / "byte.webp")), "byte_pink")
    sprite("drone", width=26)
    sprite("crawler", width=24, flip=True)   # gerado olhando para a direita; o jogo espera esquerda
    sprite("turret", width=20)
    sprite("boss", width=60)
    tiles()
    backgrounds()
    portraits()
    gleyce()
    gle_poses()
    meta = {**animations("hero", "anim_"), **animations("gle", "gle_anim_")}
    if meta:
        (OUT / "anims.json").write_text(json.dumps(meta, indent=1))
        print("  anims.json", list(meta))
