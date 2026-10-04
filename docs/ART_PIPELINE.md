# Art pipeline

All art is generated, then processed by `tools/process_art.py` into `assets/`.

## 1. Generate (Artlist)

- **Images:** Nano Banana 2 in a HD-2D cartoon, cel-shaded style, with saved character references so the faces stay consistent across poses.
- **Animation:** Seedance 1.5 image-to-video (720p, no audio, 4 s clips) from a still of each pose.
- **Chroma backgrounds:** every sprite is rendered on a flat key color so it can be cut out: **magenta** for characters, enemies, tiles and the city and data center backdrops; **green** for the core backdrop's near layer and the rescue capsule.

The script that downloaded the originals is not in the repository, because it contains signed links to the raw files. Put the originals in `art/raw/` with these names:

| Group | Files |
|---|---|
| Montanha | `hero_sheet.png` (4 poses in a row: idle, run, jump, shoot), `hero_portrait.png`, `anim_run.mp4`, `anim_idle.mp4`, `anim_jump.mp4`, `anim_shoot.mp4` |
| Gle | `gle_idle.png`, `gle_run.png`, `gle_jump.png`, `gle_shoot.png`, `gleyce_portrait*.png`, `gleyce_capsule*.png`, `gle_anim_run.mp4`, `gle_anim_idle.mp4`, `gle_anim_jump.mp4`, `gle_anim_shoot.mp4` |
| Others | `byte.png`, `drone.png`, `crawler.png`, `turret.png`, `boss.png`, `tiles.png` (3 rows × 3 columns: city, data center, core) |
| Backdrops | `bg_{city,dc,core}_{far,near}.png`, `title_art.png` |

For redone pieces, add `_v2`, `_v3`, ... to the name (for example `gleyce_portrait_v5.png`); the processor picks the highest version.

## 2. Process

Requirements: Python 3, `numpy`, `scipy`, `Pillow` and `ffmpeg`.

```bash
python3 tools/process_art.py
```

What it does:

- **Chroma key** with a soft edge and despill, so no colored halo is left around hair or edges.
- **Trim and resize** at `SCALE = 6` real pixels per logical pixel (characters are exported at 36 × 6 = 216 px tall).
- **Animation sheets** from the clips: frames are extracted at 24 fps, cleaned of the colored glow of the jet and shots, aligned by torso and feet so the character does not drift, and packed into one horizontal sheet per pose with a foot anchor. A short loop is chosen per pose (run cycle, idle ping-pong, jump tail, first part of the shot).
- **Montanha's run and jump (revised):** the first run clip led with the same leg on every step, and the jump clip faced left. The run was regenerated with Seedance 2.0 from a running pose (Nano Banana 2) used as **both the start and the end frame**, so the clip loops; a 19-frame, two-step cycle (frames 30–48 at 24 fps) was picked and packed into 10 frames. The jump sheet keeps only the four side frames, mirrored to face right; the game picks frame 0 in the air and loops 1–3 while hovering.
- **Pink BYTE:** Gle's robot is a recolor of BYTE (cyan accents to pink, light tint on the shell).
- **Metadata:** `assets/anims.json`.

## 3. Check

Run the game, look at the characters at the zoom the camera uses, and confirm the shot leaves the watch or gauntlet. If you change the art, re-measure the muzzle point in `HEROES` (`config.js`) and bump `VERSION` in `sw.js`.

## Notes

- The reference photo used for the character likeness lives in `art/ref/` and is git-ignored.
- `tools/gen_art.py` is the first, cheaper generator (OpenRouter, key from `OPENROUTER_API_KEY`). It is kept as an option and is not part of the current pipeline.
