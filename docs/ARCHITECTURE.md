# Architecture

Plain ES modules, no framework and no bundler. Each module has one job; shared data lives in `js/config.js` and modules talk through the event bus in `js/core.js`.

## Modules

| Layer | Module | Responsibility |
|---|---|---|
| Data | `config.js` | constants, physics, themes, level chunks, heroes, stages, story, enemy stats, XP curve |
| Core | `core.js` | `$` helper, `on`/`emit` event bus, persistent `save` (localStorage) |
| Input | `input.js` | keyboard, d-pad and buttons merged into one `input` state with `pressed`/`released` edges |
| Physics | `physics.js` | axis-separated tile collision, overlap and distance helpers |
| World | `world.js` | the single mutable `world` object, level assembly from ASCII chunks, tile queries, boss arena wall |
| Actors | `player.js`, `enemies.js`, `boss.js`, `ally.js` | movement and shooting, enemy AI, RANSOM-TITAN, the BYTE helper |
| Systems | `combat.js`, `fx.js`, `scene.js`, `hack.js`, `puzzle.js`, `interact.js` | bullets, damage, XP and levels, particles and hearts, the abduction cutscene timeline, hacking, terminal puzzles, doors, pickups and checkpoints |
| UI | `dialog.js`, `hud.js`, `screens.js` | dialog windows, HUD, title/map/pause/result/ending screens |
| Audio | `audio.js` | WebAudio sound effects and the procedural soundtrack |
| Render | `render.js`, `sprites.js`, `assets.js` | canvas drawing, camera zoom, parallax, pixel-art fallbacks, HD asset loading |
| Flow | `game.js`, `main.js` | state machine and event wiring, boot, viewport fitting and the fixed-step loop |

## Game loop

`main.js` runs a fixed 60 Hz simulation (`step()` in `game.js`) and renders once per animation frame. A frame in `play` mode updates, in order: player, ally, enemies, boss, bullets, interactables, effects, camera, arena trigger and HUD.

## Screen, units and camera

- **Logical units.** Height is always 192 units and a tile is 16 units. Width follows the screen's aspect ratio, from 320 (touch layout) up to 448 (21:9 landscape), so the game fills the screen with no side bars. Phones in portrait are not supported: `#rotate` (CSS media query `orientation: portrait` + `pointer: coarse` + `max-width: 820px`) covers the app, `main.js` mirrors it into `game.blocked` and `step()` stops the simulation until the phone is rotated. Desktop windows in portrait keep the old layout (min width 256).
- **Real pixels.** The canvas is `W × scale` by `H × scale` real pixels (scale up to 4) and drawing uses logical coordinates.
- **Zoom.** The world is drawn with `cam.zoom` (`ZOOM = 1.56` in `config.js`). The painted backdrop is not zoomed, so characters and props read bigger against it. In the boss room the zoom eases back to 1 and shows the whole arena.
- **Vertical follow.** The camera keeps the floor in view and rises when the player jumps high.

Because the art is shown up to about 6x, assets are exported at 6 real pixels per logical pixel (see the art pipeline doc).

## Heroes and hitboxes

`HEROES` in `config.js` holds per-hero data: art prefix, portrait, shot color, boost label, the robot sprite (`bot`) and the **muzzle** point, measured from the shoot animation (height as a fraction of the body, reach in logical pixels). The drawn character is about twice as tall as the hitbox, so shots spawn at the muzzle, not at the hitbox top. Player bullets carry a `drop` so their hit area extends downward and still reaches ground enemies.

## Events

Modules emit and `game.js` decides. Main events: `toast`, `say`, `player:hit`, `player:dead`, `stage:clear`, `boss:firewall`, `boss:defeated`, and the `ui:*` events from screens (`ui:new`, `ui:continue`, `ui:stage`, `ui:retry`, `ui:pause`, ...).

## Game states

`title → story → map → play ⇄ pause → cutscene → result → map → ... → ending`, plus `over` after a defeat. Phase 1 ends in a `cutscene`: dialog (`STORY.meet`), love hearts, the claw abduction run by `scene.js` (`world.scene`, drawn by `render.js`), then dialog (`STORY.freed`) and the result screen. The hero for each stage comes from `STAGES[i].hero`.

## Levels

Levels are strings. A stage lists chunk names (`start`, `flat`, `pit`, `door`, `bridge`, `turret`, `stairs`, `check`, `goal`, `arena`) and `world.js` joins 20-column chunks into a grid. The legend is in the comment above `CHUNKS` in `config.js`.

## Animation

`assets/anims.json` describes each sheet: frame count, cell size and a foot anchor (`ax`, `ay`). `render.js` plays `hero_*` or `gle_*` sheets by pose (`idle`, `run`, `jump`, `shoot`) and falls back to the static pose, then to pixel art, while assets load.

## Audio

Everything is synthesized, and each stage has its own original track in a different style (title: calm flute; stage 1: brass march; stage 2: bell crystal cave; stage 3: driving fortress; boss: battle). Tracks are data: a melody string (one symbol per eighth note), a chord per bar, a tempo, and style choices for voice, bass, arpeggio and drums. `playStep` turns each eighth note into voices with a reverb send and small timing and volume variations. The tunes are original compositions inspired by the feel of classic adventure and RPG music, not copies.

## Offline

`sw.js` precaches the shell, modules and art with a versioned cache and serves cache-first. `python3 build.py --sw` sets `VERSION` from a content hash; run it before shipping.

## How to add content

- **A stage:** add an entry to `STAGES` (name, theme, track, hero, chunks, dialogs). Add a theme in `THEMES` and art for it if needed.
- **A chunk:** add an array of 12 rows of 20 characters to `CHUNKS`.
- **A hero:** add it to `HEROES`, export its sheets with the art pipeline and measure the muzzle point.
- **A track:** add an entry to `TRACKS` in `audio.js` and point a stage at it with `track`.
