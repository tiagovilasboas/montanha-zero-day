---
title: "I Built a Full PWA Game in One Day with Claude Opus 5.5 and Claude Code (Here Is the Real Token Cost & Harness Setup)"
published: false
description: "Montanha: Zero Day, a Mega Man X–style PWA built with Claude Opus 5.5 and Claude Code on top of a central engineering harness: benchmarks vs real-world delivery, Artlist AI assets, and headless Playwright E2E tests."
tags: ai, gamedev, javascript, claude
cover_image: https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/assets/title_art.webp
---

On a Sunday, I turned a slightly silly idea into an actual game: **Montanha: Zero Day**, a cyberpunk platformer in the style of Mega Man X that runs in the browser and on phones, offline, as a PWA. The hero is me (Montanha), the heroine is Gle, and the villain is a giant piece of ransomware called RANSOM-TITAN.

I built it together with **Claude Opus 5.5**, orchestrated via **Claude Code** and Cowork (the agentic execution mode of the Claude ecosystem). By the end of the day, the usage panel showed I had spent **about half of my daily token limit**.

This post covers what the model promises on benchmarks, how it operated seamlessly across local CLI and cloud runtime, and what it actually delivered on a real project when guided by a **central engineering harness**.

👉 **Play it live:** [tiagovilasboas.github.io/montanha-zero-day](https://tiagovilasboas.github.io/montanha-zero-day/) (the in-game dialogue is in Brazilian Portuguese)  
👉 **Source Code:** [github.com/tiagovilasboas/montanha-zero-day](https://github.com/tiagovilasboas/montanha-zero-day)

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

This is where Claude Code and Opus 5.5 shine compared to everything before them: **they respect the harness naturally**. Claude Code seamlessly bridged local terminal execution (Python scripts, ffmpeg pipelines, git staging) with cloud reasoning, adhering strictly to the constraints without trying to invent unnecessary abstractions or libraries.

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

Anthropic claims real-world workflows run **~40% cheaper than on Opus 5** because the model requires fewer iterations to resolve the exact same goal. My Sunday confirmed this: a whole production day of code, art processing, game design, and E2E testing consumed barely half of my daily allotment.

---

## The Game

- **Stage 1:** You pilot Montanha (jetpack vertical boost + hacker watch that shoots and overrides terminal nodes). Reaching the end reveals Gle trapped in a cryo-capsule. Love hearts float up, but RANSOM-TITAN drops an extraction claw from the sky and abducts Montanha. It was bait.
- **Stages 2 and 3:** Gle, freed from containment, retaliates armed with a golden buster gauntlet and high-speed light boots.
- **Ending:** She shatters the boss core, retrieves his decryption key, and opens Montanha's prison cell.

Under the hood: **Vanilla JavaScript ES modules** (~2,700 lines across 24 single-purpose files), HTML5 Canvas, a deterministic 60 Hz simulation loop, service workers for offline PWA installation, a 100% synthesized WebAudio procedural soundtrack (no bulky MP3/OGG assets), and HD-2D art pipeline. Zero frameworks, zero bundlers.

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

One of the standout moments of the day was how Opus 5.5 and Claude Code took charge of testing and QA.

Rather than assuming code worked because it compiled, the agent actively spun up **Playwright in headless Chromium** to navigate and validate the gameplay end-to-end:
- **Autonomous Playtesting Bot:** Claude didn't just check if the page loaded. It created a scripted bot powered by the game's actual physics engine (`js/physics.js`). The bot ran through inputs, jumped across gaps, and stress-tested collision boxes.
- **Finding Pixel-Level Bottlenecks:** During the stage 3 expansion (pulse beams and laser gauntlets), the automated bot discovered that a platform jump was precisely **1 pixel out of reach** if taken at the absolute platform edge. The agent immediately adjusted the level chunk coordinate in `config.js` and re-tested.
- **Exploiting Game Mechanics:** The Playwright bot caught an invulnerability exploit: players could sacrifice 3 HP and simply walk through active hazard beams while blinking. Claude fixed the beam collision logic to act as a solid wall during hero invulnerability.
- **Full Visual Walkthrough:** Across 3 stages, the E2E suite traversed title screens, cutscenes, boss phases, and the ending sequence, verifying that dialogue portraits and audio state machines transitioned flawlessly.

---

## What the Model Actually Delivered

### 1. Parallel Subagent Auditing
When tasked with reviewing game feel and narrative consistency, Claude Code branched out **two subagents in parallel**: one dedicated to story plot holes, and another hunting edge cases in the game engine. 

They surfaced 16 prioritized issues and verified them by running the build:
- *Boss Resurrection Bug:* Dying while the boss explosion triggered would resurrect the boss at full health upon pressing "Retry".
- *Level 1 Fall Glitch:* Knockback from low-tier enemies knocked the hero backwards directly into unrecoverable pits.

### 2. Diagnosing "Character Feel"
I gave feedback that *"Gle felt much more fluid to play than Montanha."* Rather than blindly tweaking speed variables, the model verified that the physics parameters were mathematically identical. 

It then inspected the animation sprites:
- Montanha was literally turning backwards during jump ascents because the video generation had mirrored his horizontal orientation.
- His run cycle was repeating the identical leading foot on every step, resembling a gallop rather than a sprint.

It mirrored the sprite sheet, hooked up an ascending vs hovering jetpack frame selector, and introduced distinct neon trails (cyan for Montanha, radiant gold for Gle).

### 3. A 12-Chunk Stage Expansion
When asked to expand Stage 3 before the boss, it invented **pulse beams**—rhythmic laser barriers that pulse in counterpoint with adjacent beams, blinking prior to firing. The stage grew from 7 to 12 sections, complete with an automated bot proving a clean, no-damage clear in 39 seconds flat.

---

## The Takeaway: How This Changes the Future of Engineering

What impressed me most was not the raw code output. It was the **holistic engineering steering**.

Claude Code running Opus 5.5 handled:
- Architecture adherence via central harness steerings.
- Dynamic asset extraction and CLI image processing.
- Playwright E2E automation and game-loop stress testing.
- Semantic git hygiene (18 cleanly decoupled domain commits).

If Claude Code and Opus 5.5 can take a rough 3-sentence idea and deliver a complete, highly playable, polished 2D platformer with custom graphics, audio, PWA offline caching, and zero bugs in **less than a day**...

**How long until this exact same setup rebuilds your entire legacy system, internal tool, or production SaaS from top to bottom?**

Make no mistake: this is extraordinarily good. With Opus 5.5, **Anthropic has pushed the frontier model race to a completely different level**. We are no longer talking about chat completions, toy snippets, or autocomplete suggestions. We are witnessing end-to-end autonomous engineering—reasoning that orchestrates local tools, cloud runtimes, creative generation suites, and automated verification loops.

When you connect a model of this caliber to a solid, battle-tested engineering harness, software development stops being about typing code. It becomes pure intent, architectural guardrails, and rapid autonomous execution.

---

**Sources & Links:**
- [Play Montanha: Zero Day](https://tiagovilasboas.github.io/montanha-zero-day/)
- [GitHub Repository](https://github.com/tiagovilasboas/montanha-zero-day)
- [Anthropic Opus 5.5 Announcement](https://www.anthropic.com/claude-opus-5-5)
- [Artificial Analysis Leaderboard](https://artificialanalysis.ai/models)
- [Artlist Generative Suite](https://artlist.io/)
