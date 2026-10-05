#!/usr/bin/env python3
"""Gera a arte do Montanha: Zero Day via OpenRouter (modelo de imagem), com teto de gasto.

Roda na SUA máquina: a chave vem de OPENROUTER_API_KEY (a mesma do cheap_models) e nunca é impressa.
Stdlib only. Retoma de onde parou: imagens que já existem em art/raw/ são puladas.

    python3 tools/gen_art.py --dry-run          # mostra o plano, sem gastar
    python3 tools/gen_art.py                    # gera tudo (teto padrão US$ 2,00)
    python3 tools/gen_art.py --only hero_sheet  # gera uma peça
    python3 tools/gen_art.py --list-models      # modelos do OpenRouter que geram imagem
"""
import argparse, base64, json, os, sys, urllib.error, urllib.request
from pathlib import Path

API = "https://openrouter.ai/api/v1"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "art" / "raw"
REF_PHOTO = ROOT / "art" / "ref" / "montanha.jpg"
DEFAULT_MODEL = os.environ.get("ZERODAY_IMAGE_MODEL", "google/gemini-2.5-flash-image")

STYLE = ("High-quality hand-painted 2D video game art, HD-2D side-scroller look, crisp clean silhouettes, "
         "cel shading with soft painted lighting, cyberpunk neon palette (cyan #3df0ff, magenta #ff4fd8, gold #ffd23d) "
         "on deep navy night tones. Inspired by the mood of Final Fantasy and the readability of Mega Man X. "
         "No text, no letters, no logos, no watermark, no UI.")
SPRITE_BG = ("Isolated on a perfectly flat, solid pure magenta background (#FF00FF) with no shadow on the ground, "
             "no gradient, no other objects, so it can be cut out cleanly. Full body visible with margin around it.")
HERO = ("the hero MONTANHA: a stocky Brazilian man in his 30s with a full dark beard and goatee, black snapback cap "
        "with flat grey brim, black oversized hoodie, dark cargo pants, white sneakers, a compact high-tech backpack "
        "with glowing cyan seams and two small jet nozzles, and a chunky silver smartwatch on his left wrist that "
        "glows cyan (his hacking weapon). Tattoo of a winged eye on the back of his hand. Same face as the reference photo.")

# (nome, proporção, referências, prompt). Referências: "photo" = sua foto; outro nome = imagem já gerada.
PLAN = [
    ("hero_sheet", "16:9", ["photo"],
     f"Character sprite sheet of {HERO} Four poses side by side in one row, all facing RIGHT, same scale, evenly spaced: "
     "1) idle standing, 2) running mid-stride, 3) jumping with knees tucked and backpack jets firing, "
     f"4) shooting: arm extended forward firing a cyan energy bolt from the watch. {SPRITE_BG} {STYLE}"),
    ("hero_portrait", "1:1", ["photo", "hero_sheet"],
     f"Dialogue portrait bust of {HERO} Three-quarter view, confident half smile, cyan rim light, painted RPG portrait "
     f"like a Final Fantasy character card. {SPRITE_BG} {STYLE}"),
    ("byte", "1:1", ["hero_sheet"],
     "BYTE, a small round floating assistant robot, white glossy shell with cyan glowing eyes on a black visor, a tiny "
     f"antenna with a gold tip, small thruster glow underneath, friendly and cute but techy. Side view facing right. {SPRITE_BG} {STYLE}"),
    ("drone", "1:1", [],
     "Hostile invader drone of the evil AI 'Legião Null': compact purple insect-like flying machine, two red glowing eyes, "
     f"small magenta thrusters, menacing. Side view facing LEFT. {SPRITE_BG} {STYLE}"),
    ("crawler", "1:1", [],
     "Malware crawler enemy: a low, wide red armored robotic bug with many thin black legs and two yellow glowing eyes, "
     f"glitchy corrupted panels. Side view facing LEFT, walking. {SPRITE_BG} {STYLE}"),
    ("turret", "1:1", [],
     "Wall-mounted security turret: chunky grey metal base, red dome sensor, a single short cannon barrel pointing LEFT. "
     f"Compact, readable silhouette. {SPRITE_BG} {STYLE}"),
    ("boss", "1:1", [],
     "Final boss TITAN: a giant floating machine shaped like a menacing padlock, dark crimson armor plates, a "
     "huge glowing red eye core in the center, a golden keyhole below the eye, side cannons, red energy cracks. "
     f"Front view, imposing. {SPRITE_BG} {STYLE}"),
    ("bg_city_far", "16:9", [],
     "Far parallax background layer: Neo-Sampa, a futuristic São Paulo at night, distant skyscraper skyline in purple "
     f"silhouettes with tiny lit windows, crescent moon, stars, haze. Wide, horizontally tileable. {STYLE}"),
    ("bg_city_near", "16:9", [],
     "Near parallax layer: rooftops and closer buildings of a cyberpunk São Paulo at night, neon signs without text, "
     "antennas, water tanks, lit windows. Only the bottom 60% of the image has buildings; the sky area above is solid "
     f"pure magenta (#FF00FF) to be cut out. Horizontally tileable. {STYLE}"),
    ("bg_dc_far", "16:9", [],
     f"Far parallax background: an abyssal data center, endless rows of server racks fading into teal darkness, tiny green and cyan LEDs. Wide, tileable. {STYLE}"),
    ("bg_dc_near", "16:9", [],
     "Near parallax layer: thick cable bundles and pipes hanging from the top and big server cabinets at the bottom, dark teal "
     f"with green LEDs; everything else is solid pure magenta (#FF00FF) to be cut out. Tileable. {STYLE}"),
    ("bg_core_far", "16:9", [],
     f"Far parallax background: the core of an evil AI, black and crimson void, perspective red grid floor, a huge glowing red reactor core in the distance. Wide, tileable. {STYLE}"),
    ("bg_core_near", "16:9", [],
     "Near parallax layer: dark crimson tech pillars with red light strips and cables in the foreground; everything else is "
     f"solid pure magenta (#FF00FF) to be cut out. Tileable. {STYLE}"),
    ("tiles", "1:1", [],
     "Game tileset texture sheet, 3 rows by 3 columns of square seamless platform tiles: row 1 cyberpunk rooftop metal "
     "with magenta neon edge on top, row 2 data center floor panels with green LED edge, row 3 crimson AI-core armor "
     f"plates with red glowing edge. Flat front view, no perspective. {STYLE}"),
    ("title_art", "16:9", ["photo", "hero_sheet", "byte"],
     f"Key art for the game title screen: {HERO} standing on a neon rooftop at night above a futuristic São Paulo, watch "
     "glowing, robot BYTE floating beside him, purple invader drones in the sky, dramatic low angle, cinematic. Leave clean "
     f"empty space in the upper third for a logo. {STYLE}"),
]


def data_url(path: Path) -> str:
    mime = "image/jpeg" if path.suffix.lower() in (".jpg", ".jpeg") else "image/png"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def reference_path(name: str) -> Path:
    return REF_PHOTO if name == "photo" else OUT / f"{name}.png"


def post(path: str, payload: dict, key: str, timeout: int = 300) -> dict:
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(payload).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                                          "X-Title": "Montanha Zero Day art"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def list_image_models() -> list:
    with urllib.request.urlopen(f"{API}/models", timeout=60) as r:
        models = json.load(r)["data"]
    return [m["id"] for m in models if "image" in m.get("architecture", {}).get("output_modalities", [])]


def generate(name: str, ratio: str, refs: list, prompt: str, model: str, key: str) -> float:
    content = [{"type": "text", "text": prompt}]
    for ref in refs:
        p = reference_path(ref)
        if not p.exists():
            raise SystemExit(f"Falta a referência {p} para gerar {name}. Gere {ref} antes.")
        content.append({"type": "image_url", "image_url": {"url": data_url(p)}})
    payload = {"model": model, "modalities": ["image", "text"], "messages": [{"role": "user", "content": content}],
               "image_config": {"aspect_ratio": ratio}, "usage": {"include": True}}
    res = post("/chat/completions", payload, key)
    images = (res.get("choices") or [{}])[0].get("message", {}).get("images") or []
    if not images:
        raise RuntimeError(f"o modelo não devolveu imagem para {name}: {json.dumps(res)[:300]}")
    url = images[0]["image_url"]["url"]
    (OUT / f"{name}.png").write_bytes(base64.b64decode(url.split(",", 1)[1]))
    return float(res.get("usage", {}).get("cost") or 0)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--budget", type=float, default=2.0, help="teto de gasto em US$ (padrão 2.00)")
    ap.add_argument("--only", help="gera só esta peça (nome do plano)")
    ap.add_argument("--force", action="store_true", help="regera mesmo se o arquivo já existir")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--list-models", action="store_true")
    args = ap.parse_args()

    if args.list_models:
        print("\n".join(list_image_models())); return 0
    plan = [p for p in PLAN if not args.only or p[0] == args.only]
    if not plan:
        raise SystemExit(f"Peça desconhecida: {args.only}. Opções: {', '.join(p[0] for p in PLAN)}")
    OUT.mkdir(parents=True, exist_ok=True)
    todo = [p for p in plan if args.force or not (OUT / f"{p[0]}.png").exists()]
    print(f"Modelo: {args.model} | teto: US$ {args.budget:.2f} | a gerar: {len(todo)} de {len(plan)}")
    if args.dry_run:
        for name, ratio, refs, _ in todo: print(f"  - {name} ({ratio}) refs={refs or '-'}")
        return 0

    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise SystemExit("Defina OPENROUTER_API_KEY (a mesma chave do cheap_models).")
    spent = 0.0
    for name, ratio, refs, prompt in todo:
        if spent >= args.budget:
            print(f"Teto de US$ {args.budget:.2f} atingido. Rode de novo para continuar."); break
        try:
            cost = generate(name, ratio, refs, prompt, args.model, key)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:300]
            print(f"  x {name}: HTTP {e.code} {body}")
            if e.code in (400, 404) and "model" in body.lower():
                print("  Modelo indisponível. Veja os que geram imagem com --list-models e use --model <id>.")
                return 2
            continue
        except Exception as e:  # noqa: BLE001 — uma peça falhar não derruba as outras
            print(f"  x {name}: {e}"); continue
        spent += cost
        print(f"  ok {name}.png  (US$ {cost:.4f}, total US$ {spent:.4f})")
    print(f"Pronto. Gasto total: US$ {spent:.4f}. Arquivos em {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
