#!/usr/bin/env python3
"""Build: wraps game.html into a full PWA document (index.html) and renders the app icons."""
import hashlib, re, sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
BG = "#070914"
CYAN = "#3df0ff"

PORTRAIT = ROOT / "assets" / "portrait_hero.webp"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="description" content="Montanha: Zero Day. A cyberpunk pixel-art platformer. Montanha sets out to rescue Gle. Then she goes after him.">
<meta name="theme-color" content="#070914">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Zero Day">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<link rel="icon" type="image/png" href="icons/icon-192.png">
"""


def build_html():
    body = (ROOT / "game.html").read_text(encoding="utf-8")
    out = ROOT / "index.html"
    out.write_text(f"{HEAD}</head>\n<body>\n{body}</body>\n</html>\n", encoding="utf-8")
    return out


def render_icon(size, safe):
    """Current HD portrait centred on BG; `safe` keeps maskable artwork inside the safe area."""
    img = Image.new("RGBA", (size, size), BG)
    box = size * safe
    ring_r = box / 2 * 0.9
    ring_w = max(2, round(size / 48))
    c = size / 2

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([c - ring_r, c - ring_r, c + ring_r, c + ring_r], outline=CYAN, width=ring_w * 3)
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(size / 40)))
    ImageDraw.Draw(img).ellipse([c - ring_r, c - ring_r, c + ring_r, c + ring_r], outline=CYAN, width=ring_w)

    art = Image.open(PORTRAIT).convert("RGBA")
    if box := art.getbbox():
        art = art.crop(box)
    art.thumbnail((round(ring_r * 1.55), round(ring_r * 1.55)), Image.Resampling.LANCZOS)
    img.alpha_composite(art, (round(c - art.width / 2), round(c - art.height / 2 + ring_r * 0.04)))
    return img.convert("RGB")


def build_icons():
    icons = ROOT / "icons"
    icons.mkdir(exist_ok=True)
    specs = {"icon-192.png": (192, 1.0), "icon-512.png": (512, 1.0), "icon-maskable-512.png": (512, 0.8)}
    written = []
    for name, (size, safe) in specs.items():
        path = icons / name
        render_icon(size, safe).save(path, optimize=True)
        written.append(path)
    return written


def stamp_sw():
    """Version the service worker cache by content: any change to code, page or art gives a new VERSION,
    so installed copies refresh on their own (no more bumping it by hand)."""
    files = sorted([*ROOT.glob("js/*.js"), ROOT / "css" / "style.css", ROOT / "index.html", ROOT / "manifest.webmanifest",
                    *ROOT.glob("assets/*"), *ROOT.glob("icons/*")])
    digest = hashlib.sha1()
    for f in files:
        digest.update(f.relative_to(ROOT).as_posix().encode())
        digest.update(f.read_bytes())
    sw = ROOT / "sw.js"
    text, n = re.subn(r"const VERSION = '[^']*';", f"const VERSION = 'zeroday-{digest.hexdigest()[:10]}';", sw.read_text(encoding="utf-8"), count=1)
    if n != 1:
        sys.exit("sw.js: VERSION line not found")
    sw.write_text(text, encoding="utf-8")
    return sw


if __name__ == "__main__":
    # python3 build.py        -> index.html, icons and the service worker version
    # python3 build.py --sw   -> only the service worker version (run before each deploy)
    steps = [stamp_sw] if "--sw" in sys.argv else [build_html, build_icons, stamp_sw]
    for step in steps:
        out = step()
        for path in out if isinstance(out, list) else [out]:
            print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")
