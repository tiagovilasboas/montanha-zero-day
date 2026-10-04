---
title: "I Built a Full PWA Game in One Day with Claude Opus 5.5 and Claude Code (Here Is the Real Token Cost & Harness Setup)"
published: true
dev_article_id: 4796702
description: "Montanha: Zero Day, a Mega Man X-style PWA built with Claude Opus 5.5 and Claude Code on a harness: vendor benchmarks, Artlist assets, a session playtest, and the gap that playtest left behind."
tags: ai, gamedev, javascript, claude
cover_image: https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/assets/devto-cover.png
---

On Sunday I sat down to turn a three-sentence idea into a browser game, **Montanha: Zero Day**. A prompt that short is a photo of a cabinet: you can see the shape, and you still have no jig for the cuts.

Without the jig, the model invents the workshop. A framework, a bundler, a new folder layout, and the token limit goes into the second and third attempt. I have watched that happen. The hard part is not the idea. It is holding the cut after the first structure comes out wrong.

What held it was not a longer prompt. A harness already sits next to the repo: guides before the model writes, sensors after it says the work is done. Opus 5.5, through Claude Code, used about half of my daily allotment on the usage panel and shipped the game. The hero is me (Montanha), the heroine is Gle, and the villain is a ransomware called RANSOM-TITAN. It runs in the browser and on phones, offline, as a PWA.

👉 **Play it live:** [tiagovilasboas.github.io/montanha-zero-day](https://tiagovilasboas.github.io/montanha-zero-day/) (Portuguese only when the browser language is Portuguese and the timezone is Brazil; English otherwise)  
👉 **Source Code:** [github.com/tiagovilasboas/montanha-zero-day](https://github.com/tiagovilasboas/montanha-zero-day)

![Montanha: Zero Day Title Screen](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/title-screen.webp)

---

## The Initial Prompt: Less than You Think

People often ask what kind of 5-page prompt was required to spin up an entire game from scratch. The reality? **Almost nothing.**

The kickoff prompt was surprisingly concise:

> *"Build a cyberpunk Mega Man X–style platformer game in pure JavaScript (ES modules) with canvas. The hero is Montanha (backpack jetpack, cybernetic hacking watch), the heroine is Gle, and the final boss is a ransomware virus named RANSOM-TITAN. It needs to run offline as a PWA on mobile and desktop."*

How can a model go from a 3-sentence prompt to 24 modular ES architecture files without derailing into chaos or hallucinated spaghetti code?

The secret wasn't prompt engineering. It was **Harness Engineering**.

### Built on Top of a Central Engineering Harness

Rather than dumping monolithic instructions into every conversation, my local setup is governed by a **central harness core** (`harness-core`). 

This harness provides continuous feedforward rules (*Guides*) and automated feedback loops (*Sensors*):
1. **Clean Architectural Boundaries:** Single Responsibility Principle (SRP) per module, decoupling state, physics, rendering, input, and audio into event-driven ES modules without framework overhead.
2. **Behavioral Invariants:** Zero-assumptions development. The agent must verify facts through execution, inspect DOM/canvas states directly, and confirm before claiming completion.
3. **Domain-Driven Commits:** Structured git workflows with atomic commits scoped strictly by semantic domains (`feat(hero)`, `fix(gameplay)`, `style(mobile)`).

This is where Claude Code and Opus 5.5 were useful. Claude Code ran the local tools (Python, ffmpeg, git) and the cloud reasoning in the same session, and it stayed inside those constraints instead of adding a library the game did not need.

---

## Opus 5.5 by the Numbers

Anthropic released Opus 5.5 on September 22, 2026. The numbers below are **reported by Anthropic**, so read them with healthy skepticism: there is no single, independent, identical-harness comparison across all frontier models yet.

| Benchmark | Opus 5.5 | Fable 5.1 | Opus 5 | GPT-6 Astra |
|---|---|---|---|---|
| Terminal-Bench 4.0 | **66.4%** | 55.8% | 52.3% | 57.9% |
| FrontierCode v1.1 | **54.4%** | 50.3% | 48.0% | 53.3% |
| CursorBench 4.0 | **57.8%** | 51.8% | 46.6% | — |
| GDPval-AA v2.1 (Elo) | **1846** | 1735 | 1708 | 1542 |
| Humanity's Last Exam (with tools) | **67.7%** | 65.6% | 63.6% | 57.2% |
| AutomationBench | 40.0% | 31.4% | 26.9% | **41.4%** |
| Terminal-Bench-Science 0.1 | 58.7% | 52.6% | 29.0% | **64.6%** |

Being objective: GPT-6 Astra leads on AutomationBench and Terminal-Bench-Science. And as noted in Vellum's analysis, certain science evaluation tasks dropped back to Opus 5 due to safety classifiers, which slightly impacts the 5.5 composite score.

### The Artificial Analysis Intelligence Index

[Artificial Analysis](https://artificialanalysis.ai/models) rolls independent multi-metric evaluations into an aggregate Intelligence Index:

| Model | Intelligence Index |
|---|---|
| **Claude Opus 5.5 (max)** | **58** |
| Claude Sonnet 5.5 (max) | 56 |
| Claude Opus 5.5 (xhigh) | 56 |
| Claude Opus 5.5 (high) | 54 |
| Claude Fable 5.1 (max) | 53 |
| MiMo-V2.6-Pro | 46 |

Opus 5.5 holds first place (the median for comparable models sits at 26). However, the trade-off is clear: throughout the benchmark index, the model **generated 260 million tokens**, versus an 81M median. It reasons and ponders extensively before acting. The measured throughput was 92.4 tokens/second.

### Pricing & Token Economy

| | Opus 5.5 | Opus 5 | Fable 5.1 |
|---|---|---|---|
| Input (per 1M tokens) | $4 | $5 | $10 |
| Output (per 1M tokens) | $20 | $25 | $50 |

Anthropic claims real-world workflows run **~40% cheaper than on Opus 5** because the model needs fewer iterations for the same goal. My Sunday does not confirm that percentage. The usage panel showed about half of the daily allotment for code, art, design, and the playtest runs. The panel does not split input, output, and cache, so "half" is a reading, not a token bill.

---

## The Game

- **Stage 1:** You pilot Montanha (jetpack vertical boost + hacker watch that shoots and overrides terminal nodes). Reaching the end reveals Gle trapped in a cryo-capsule. Love hearts float up, but RANSOM-TITAN drops an extraction claw from the sky and abducts Montanha. It was bait.
- **Stages 2 and 3:** Gle, freed from containment, retaliates armed with a golden buster gauntlet and high-speed light boots.
- **Ending:** She shatters the boss core, retrieves his decryption key, and opens Montanha's prison cell.

Under the hood: **Vanilla JavaScript ES modules** (~2,700 lines across 24 single-purpose files), HTML5 Canvas, a deterministic 60 Hz simulation loop, service workers for offline PWA installation, a 100% synthesized WebAudio procedural soundtrack (no bulky MP3/OGG assets), and HD-2D art pipeline. Zero frameworks, zero bundlers.

![The stage 1 ending: hearts, the RANSOM-TITAN claw drops, grabs Montanha and lifts him away from Gle's capsule](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/abduction-cutscene.jpg)
*The stage 1 ending, frame by frame: hearts, the claw drops, grabs Montanha and lifts him away.*

![Gle gliding on her golden light boots through the flooded server room of stage 2](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/gle-boots.jpg)

![Gle facing the RANSOM-TITAN boss, a giant padlock with a red eye, in the Core arena](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/boss-fight.jpg)

---

## Generating High-Def Assets with Artlist Credits

A retro-modern platformer lives or dies by its art and animation. For this, we tapped into **[Artlist.io](https://artlist.io/)** using generation credits.

What is Artlist in this context? Artlist has evolved into a powerhouse creative suite featuring generative AI models for video, character design, and music. 

Here is what we did with those credits:
1. **Character Sprites with Nano Banana 2:** We generated high-definition, cel-shaded character art. Because we supplied reference images, the character likeness (Montanha's dark beard, snapback cap, hoodie, and watch) remained rock-solid across multiple poses.
2. **Animation Cycles with Seedance:** We converted still character poses into 720p 24fps motion clips.
3. **Pure Chroma Isolation:** We generated all characters on flat magenta (`#FF00FF`) or green backgrounds.

### Bridging Artlist and the Local Python Pipeline

During the session, the containerized runtime faced a network restriction accessing the external Artlist media host. Instead of giving up or waiting for human intervention, the agent navigated through its environment:
- It utilized the local browser to inspect the video stream.
- Extracted raw frames directly into an HTML5 `<canvas>`.
- Measured the pixel delta across frames to calculate the exact seamless 2-step cycle (19 frames at 24 fps).
- Streamed the frames into the project's local Python pipeline (`tools/process_art.py`), where `scipy` and `Pillow` ran automatic chroma-key despill, centered the torso/feet anchor points, and packed the final spritesheet into WebP.

Total cost: **590 Artlist credits**. Result: fully custom, beautifully animated characters without manually drawing a single pixel.

---

## Autonomous Playwright E2E Testing & Navigation

Session scene. Not player telemetry. The bot ran in that chat. The scripts are not in the repository, so a clone of the game does not include this sensor.

Rather than treating a clean compile as proof, the agent started **Playwright in headless Chromium** and played:
- **Playtesting bot:** It did more than load the page. It drove a scripted bot through the game's physics (`js/physics.js`), jumped gaps, and pressed on collision boxes.
- **One pixel short:** During the stage 3 expansion (pulse beams), the bot found a platform jump **1 pixel out of reach** from the absolute edge. The agent moved the chunk in `config.js` and ran the jump again.
- **Walk through the beam:** The bot caught an invulnerability hole: spend 3 HP and walk through a live hazard while blinking. The beam collision was changed so it stays solid during invulnerability.
- **One walk of the three stages:** Title, cutscenes, boss, and ending, checking that portraits and the audio state changed with the scene. That walk is one session. It is not a suite you can re-run from CI.

![Montanha hovering with his jetpack in Neo-Sampa](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/montanha-jetpack.webp)

![Gle facing the rhythmic pulse beams in Stage 3](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/gle-pulse-beams.webp)

---

## What the Model Actually Delivered

### 1. Parallel Subagent Auditing
When tasked with reviewing game feel and narrative consistency, Claude Code branched out **two subagents in parallel**: one dedicated to story plot holes, and another hunting edge cases in the game engine. 

Session scene. Not a production bug count. They surfaced 16 prioritized issues and checked them by running the build:
- *Boss Resurrection Bug:* Dying while the boss explosion triggered would resurrect the boss at full health upon pressing "Retry".
- *Level 1 Fall Glitch:* Knockback from low-tier enemies knocked the hero backwards directly into unrecoverable pits.

### 2. Diagnosing "Character Feel"
Session scene. I gave feedback that *"Gle felt much more fluid to play than Montanha."* Rather than blindly tweaking speed variables, the model verified that the physics parameters were mathematically identical. 

It then inspected the animation sprites:
- Montanha was literally turning backwards during jump ascents because the video generation had mirrored his horizontal orientation.
- His run cycle was repeating the identical leading foot on every step, resembling a gallop rather than a sprint.

It mirrored the sprite sheet, hooked up an ascending vs hovering jetpack frame selector, and introduced distinct neon trails (cyan for Montanha, radiant gold for Gle).

![Montanha's jump frames before (facing backwards, two frames facing the camera) and after (mirrored side frames)](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/jump-before-after.png)

![Montanha's run cycle before (same leg forward every step) and after (regenerated two-step loop)](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/run-before-after.png)

### 3. A 12-Chunk Stage Expansion
When asked to expand Stage 3 before the boss, it added **pulse beams**: laser barriers that blink before they fire, offset from the beam next to them. The stage grew from 7 to 12 sections. Session scene. One bot run reported a clean, no-damage clear in 39 seconds. That number is not a sample of players.

---

## The Takeaway

Sunday went from a three-sentence prompt to a playable PWA: code, generated art, procedural audio, and a service worker. The usage panel read about half of the daily allotment. Artlist cost **590 credits**. One bot run reported a 39-second clear.

That bot is not in the repo. Clone the [game](https://github.com/tiagovilasboas/montanha-zero-day) and you get the PWA, not the Playwright sensor. I will not call the build bug-free. The same day found a boss that came back at full health, a knockback into a pit, and a beam you could walk through while invulnerable. What you play is the build after those fixes. Nobody has measured how real players die.

---

## The Bigger Picture: Opus 5.5 Is Sparking a Browser Game Renaissance

*Montanha: Zero Day* is not an isolated experiment. Across the community, Opus 5.5 combined with Claude Code is triggering an explosion of indie game development without traditional engines (no Unity, no Unreal):

- **[Awesome Opus 5.5 Games](https://github.com/VibeFin/awesome-opus-5.5-games):** Curated directory featuring nearly 200 playable games built with Opus 5.5.
- **[Rundevue (Built with Opus 5.5)](https://rundevue.com/built-with/opus-5-5):** Community showcase featuring Rocket League clones, open-world experiments, pod racers, and tycoon titles running in WebGL/Three.js.
- **[Hearthlight](https://hearthlight.github.io/):** A cozy 10-chapter pixel-art adventure game with 8 characters, dungeons, and up to 8-player multiplayer, built entirely using Claude Code + Opus 5.5 + Three.js with natural language playtesting iterations ([Reddit discussion](https://www.reddit.com/r/ClaudeAI/comments/1wtcs7k/i_opensourced_the_cozy_pixelart_game_opus_55_made/)).
- **NUTSHOT!:** Created by Brazilian dev Yan Mantovani, showcasing how a 3D browser shooter was spun up from a single kickoff prompt and refined via playtesting loops.
- **The Fallout: New York Phenomenon:** A sprawling browser fan game featuring 117 locations, 112 characters, and 46 weapons crafted with Opus 5.5 that went viral across gaming outlets.

The emerging stack is unmistakable:  
`Opus 5.5 + Claude Code` → `TypeScript / Vanilla ES Modules` → `Canvas / Three.js / WebGL` → `Procedural / Generative Assets` → `Instant Browser Delivery`.

A harness can keep the architecture from drifting. It does not, by itself, put a test in the repository or a player on the other side of the screen.

When an agent finds a bug by playing, do you commit the test, or does the proof stay in the chat?

---

**Sources & Links:**
- [Play Montanha: Zero Day](https://tiagovilasboas.github.io/montanha-zero-day/)
- [GitHub Repository](https://github.com/tiagovilasboas/montanha-zero-day)
- [Anthropic Opus 5.5 Announcement](https://www.anthropic.com/claude-opus-5-5)
- [Artificial Analysis Leaderboard](https://artificialanalysis.ai/models)
- [Artlist Generative Suite](https://artlist.io/)
- [Awesome Opus 5.5 Games](https://github.com/VibeFin/awesome-opus-5.5-games)
- [Rundevue Showcase](https://rundevue.com/built-with/opus-5-5)
