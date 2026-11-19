---
name: lesson-video
description: Make or update an interview-lesson explainer video (HyperFrames + local VieNeu-TTS voice "Hải Đăng") and its React lesson page in interactive-lessons/. Use when asked to create a video for a new topic (OOP, HashMap, JVM...), change scenes, narration, motion or visual style of a lesson video, re-render, or sync the video into the web lesson.
---

# Lesson video workflow

Project: `interactive-lessons/` (repo root `springboot-interview/`).

- `video-kit/` holds the shared engine: `motion.py` (helpers), `build.py`, `template.html` (look), `pipeline.py`, `vieneu_synth.py`.
- Each `<topic>-video/` (`oop-video/`, `equals-video/`, ...) is a HyperFrames project with only `scenes.py` + `video.json` authored by hand.
- `web/` is the React + Vite app. A lesson is `web/src/data/lessons/<slug>.ts`, registered in `web/src/data/course.ts`, opened with `?bai=<slug>`.
- Read `interactive-lessons/README.md` first.

## Commands (run inside `interactive-lessons/`)

```bash
python3 video-kit/pipeline.py setup                   # once per machine: shared .tts-env/ (vieneu>=3.8) + voice smoke test
python3 video-kit/pipeline.py <project> build         # TTS per sentence (cached in <project>/.tts/) + index.html + timeline.json
python3 video-kit/pipeline.py <project> check         # must report 0 errors
python3 video-kit/pipeline.py <project> snapshot 9,22,40   # then READ <project>/.hyperframes/pipeline-snapshots/contact-sheet*.jpg
python3 video-kit/pipeline.py <project> render        # ~4 min for 3.5 min of video; run in background
RENDER_HOST=user@host video-kit/render-remote.sh <project> ...   # render on another Linux box instead (the user prefers this); copies MP4s back to <project>/renders/, then publish here
python3 video-kit/pipeline.py <project> publish       # one clip per scene, timelines/<slug>.json, posters/<slug>/, videoVersion, web build + lint
python3 video-kit/pipeline.py <project> all           # build, check, render, publish
python3 video-kit/pipeline.py <project> qc-voice      # Whisper (large-v3-turbo, local) listens to every beat, flags < 0.85
python3 video-kit/pipeline.py <project> revoice       # best-of-4 re-synthesis of flagged beats, rebuild, re-check
python3 video-kit/pipeline.py <project> qc-frames     # snapshot at the end of EVERY beat; read every contact sheet
python3 video-kit/pipeline.py <project> qc-render     # LUFS, true peak, stray silences, render + clip durations
```

After `publish`, restart any running `vite preview`. It caches the old file size and answers 416.

## Quality gate (do not skip; the user asked for controlled quality)

Order: build → **qc-voice** (fix script / revoice) → check → **qc-frames** (read all sheets, fix) → render → publish → **qc-render** → browser test.

- **Voice.** Mean match should be ≥ 0.9. Read every flagged beat:
  - Real TTS errors (a term heard as another word): rephrase, then `revoice`. VieNeu sampling varies, so best-of-N often fixes slurs.
  - ASR-only noise is acceptable and should be stated in the report: maths read aloud ("O n" heard as "owner", "bảy tám chín" as "789").
- **Pronunciation rules for narration** (checked by synthesising and transcribing):
  - Fine: ArrayList, LinkedList, HashMap, Iterator, Comparator, ConcurrentHashMap, Priority Queue, remove if, for each, "Không thread safe", "Concurrent Modification Exception" (spaced).
  - Write "pút" for put; say "khi resize", never "resize" alone; say "chuyển thành cây" instead of treeify; say "bảng" instead of table.
  - Avoid in speech, but keep on screen and in captions: TreeSet, Arrays.asList, a bare "null", "LRU" (say "cache tự loại phần tử lâu không dùng").
  - Do not start a sentence with a CamelCase term ("Bên trong ArrayList…" reads better than "ArrayList là…").
  - Bare "heap" is often read as "hiếp". Always say "bộ nhớ heap", set `"must_hear": ["heap|hip"]`, and rephrase any beat that still comes out as "hiếp" so that it does not say the word at all.
  - The voice reads "sealed" as "siêu" every time. Write it as "xi-lờ" in the spoken text and keep `sealed` in the caption. Write "vào ra" instead of I/O.
  - `video.json` can list `"must_hear": [...]`. A beat whose script has one of these terms but whose transcript lacks it is re-synthesised, and takes that say the term win.
- **Frames.** Check beat-end frames for clipped text, wrapped boxes, chips running off the right edge, and takeaways crossing dimmed content.
- **Render.** Loudness must be in [-20, -13] LUFS and true peak ≤ -1 dBFS. Allow no silence longer than 1.6 s. Every clip must be within 0.15 s of its scene length.

The web page plays one clip per scene: the first scene at the top, each section's scene, and the last scene as the recap at the end.
Never embed the full render; its seek bar would show the whole video's length inside a section. The in-video progress bar also restarts every scene.

## Files and what to edit

| Change | File |
|---|---|
| Narration, captions, layout, motion per beat | `<topic>-video/scenes.py` |
| Video name, web slug, overview poster second, chapter labels | `<topic>-video/video.json` |
| Shared helpers (box, chip, arrow, icons, code highlighter) | `video-kit/motion.py` |
| Look: colours, cards, type, wires, captions (all videos) | `video-kit/template.html` (CSS) |
| Motion vocabulary to GSAP, ambient light, transitions | `video-kit/build.py` |
| Lesson text, quizzes, section to scene mapping | `web/src/data/lessons/<slug>.ts` |
| Course list, which lessons exist | `web/src/data/course.ts` |
| Interactive widgets (register name in `types.ts` WidgetName + App WIDGETS) | `web/src/widgets/*.tsx` |

`index.html`, `timeline.json`, `assets/voice.wav`, `web/src/data/timelines/*.json` and `web/public/posters/*` are generated. Never hand-edit them.

## Authoring a scene (scenes.py)

A scene is `dict(id, world=(w, h), hud, cam, beats)`.

- `cam` holds absolutely positioned markup on a 1920x1080 world, or wider (for example 3840) for camera pans.
- Each beat is `(spoken_text, caption, [actions])`. Every action delay is relative to the start of that beat's audio.

Markup helpers:
- `el`, `box(tone)`, `chip`, `win(title)` (••• title bar), `code(java)`
- `big_title`, `hud`, `letters`
- `wires(arrow(...))`, `icon`, `card4`

Motion helpers:
- `IN(kind)`, where kind is up, down, left, right, fade, pop, blur, zoomin, stamp or type1. `OUT(kind)`.
- `TYPE`, `ARROW` (draws the line, pops the head, then sends a light pulse along it), `FOCUS(x, y, scale)`, `HOME`.
- `DIM` (focus by brightness, no blur), `PULSE`, `SHAKE`, `TO`.

Rules:
- Elements with class `r` start hidden. Every element needs an `IN` before it is seen.
- Ids must be unique per video (build fails otherwise). Do not reuse a prefix family: `ca-t1` as a tile and as a takeaway once revealed both.
- Keep each beat's last action inside the beat's audio length. `build` prints a `warning:` line for every beat that overruns; fix them before rendering.
- Elements that intentionally slide onto each other need `attrs=" data-layout-allow-overlap"` (see `mini()` in equals-video).
- Arrow ids: the group is `#id`, the line `#id-p`, the head `#id-h`, the pulse `#id-f`. `OUT("#id")` hides all of them.
- Use tones by role: amber is the caller/app, cyan is data/object, violet is abstraction/library, green is correct, red is wrong/error.
- On a takeaway line, dim everything else hard: `DIM(..., 0, 0.07)`. Keep the takeaway in clear space.
- Keep a top-left HUD clear of camera push-ins. Check with snapshots at every `FOCUS`.
- Changing only actions or layout re-uses the cached audio. Changing `spoken_text` re-synthesises only that beat and shifts every later timestamp, so re-run `publish` afterwards.

## Kinetic text and pills (learned from NullMotion templates)

- **Chapter cards** (`big_title`): a silver headline rising word by word, with a slow camera dolly (`scale .94 → 1.04` over 3.4 s) and the cyan subtitle under it. Nothing else on the card.
- **Kinetic words** (`letters()` + `TYPE`): one mask per word. Each word comes in from `yPercent 105, rotation 3, blur 8 → 0` with `power4.out`; the stagger is at least 0.07 s per word. `.kin`, `.h1`, `.take` and `.answer` use silver gradient ink with a soft drop shadow.
- **Glass pills** (`chip`, `stamp`): tinted body, inner top highlight, contact shadow. `stamp` lands with squash-and-stretch.
- **Rejected by the user ("xấu quá"); do not add again:**
  - Frame chrome: mono uppercase series/chapter labels and the hairline across the top.
  - Title-stage grid, crosshair marks and floor spotlight.
  - Mono uppercase HUD subtitles.

## Motion devices and sound (learned from the NullMotion "Infinite" ad)

- **Circuit traces:** use `trace(id, pts, tone)` for orthogonal polylines. `DRAW("#id-p")` reveals the trace; `COMET(id, d, dur)` sends a white-headed comet with a coloured tail along it once.
- **Glossy nodes:** `gnode(id, x, y, w, h, label, tone)` is a dark glossy node; `LIGHT(sel, d)` switches its coloured glow on. Fire LIGHT when a comet arrives.
  - Use comet + light for anything that "flows": pipelines, request paths, propagation.
- **Glowing words:** `.glow` class with the IN kind `"glowin"` (de-blur plus horizontal squeeze, transforms only). Use it for one-word reveals such as "lazy".
- **Cuts:** a thin light streak (`.whip`) crosses every cut, and the sound is a whoosh.
- **Sound effects** (`video-kit/sfx.py`, procedural, so license-free and deterministic): build.py maps actions to sounds.
  - pop on pop / stamp / zoomin;
  - tick on draw end, type1 and LIGHT;
  - boom on a chapter title;
  - shine on takeaways and glowin;
  - buzz on SHAKE;
  - sweep on COMET;
  - whoosh at each cut.
  - The effects are mixed about 10 dB under the voice into `assets/mix.wav`, through a limiter with `level=false`.
- **Never tween CSS `strokeDashoffset`:** HyperFrames rounds it to whole pixels, so `pathLength=1` comets freeze at the start and DRAW pops in. `build.py` tweens `attr: {"stroke-dashoffset": ...}` instead; keep dash offsets out of CSS.
- **Never animate `letterSpacing` (or other layout properties):** they snap to whole pixels and `check` flags them. Use transforms.

## Themes (`video.json` → `"theme"`)

- `dark` (default) is the look described in the section below.
- `berry` follows the NullMotion "Newsroom" ad the user picked, and is piloted on `lambda-video/`:
  - **Canvas:** off-white `#f7f6f7`, with berry ink pooling into the corners.
  - **Headlines:** berry gradient. Each letter surfaces from a blur, then a light band sweeps across the line.
  - **Pills:** berry-gradient pills in the sans font with white text.
  - **Cards and captions:** white cards with soft shadows; captions in a frosted white pill.
  - **Tone mapping:** cyan → berry `#b51c63`; red → vermilion, so errors stay distinct.
  - **No glows:** the user rejected glow halos and the comet line. Use flat shadows only. Comets and the whip are hidden and get no sound. Flow is shown by nodes lighting up in turn.
- `mono` follows the NullMotion "Infinite" ad the user picked, and is piloted on `optional-video/`:
  - **Canvas:** near-black with film grain, a faint grid with diamond markers, and a diagonal wash of light from the bottom right.
  - **Headlines:** silver, revealed letter by letter, with a cool halo. Hero words use `.glow`.
  - **Nodes and circuits:** `gnode` is a dark rounded square with a white rim and a dot matrix, and `LIGHT` fills it with blue glass. White circuits use `trace(..., r=28)` for rounded corners. `COMET` has a white head and a blue tail.
  - **App icon:** a `.tile` app-icon square for the title card.
  - **Glows:** the user asked for this look explicitly, so glows are allowed in `mono` only.
- A theme is made of three parts:
  - `video-kit/themes/<name>.css`, loaded after the base CSS;
  - its pools in `AMBIENTS` in `build.py`;
  - optional theme branches in `action_js` (berry: letter-level `type`; `light` turns node labels white).
- Every letter is its own `.l` span (from `letters()`), so themes can animate letters.

## Visual language (from the reference videos the user chose)

- **Background:** near-black canvas with three soft light pools (teal, amber, violet) drifting slowly. No starfield, no mascot.
- **Cards:** tinted glass, meaning a tone-coloured gradient fill, a 1.5 px tone border and a soft outer glow. Use 16 px radius. "App/class" panels get a ••• title bar.
- **Type:** Be Vietnam Pro for text and JetBrains Mono for code identifiers. Titles are bold and sentence-case with no glow. Labels are small and muted.
- **Wires:** 2.5 px lines with a small head and a light dot travelling along after they are drawn. Use dashed wires for "implements" or weak links.
- **Motion:** short travel (24 to 50 px), gentle overshoot, blur-to-focus. Scene changes are a soft crossfade.
- **Focus:** dim the rest. Do not zoom-blur.

## Verification before reporting done

1. `check` reports 0 errors. Known acceptable warnings are `line_unread` on long captions and `text_below_floor` on small labels.
2. Snapshot every scene (the middle of each beat that adds or moves things). Read the contact sheet and fix overlaps, clipping and text crossing wires.
3. Run every Java snippet shown on screen or in quizzes on a real JDK (21), and quote the actual output.
4. After `publish`, open the web page with Playwright and confirm:
   - a section video seeks to its scene start and pauses at the end;
   - there is no black first frame (posters handle this).
5. Report honestly: the qc-voice mean score, which flagged beats remain, and why (TTS vs ASR noise). whisper-cli crashes on this machine; qc-voice uses faster-whisper inside `.tts-env` instead (audio decoded with ffmpeg because the bundled PyAV is incompatible).

## New topic

1. Source content: `docs/study-notes/<NN> - <topic>.md` (already verified on JDK 21). Pick 6 scenes, about 3 to 3.5 min.
2. Create `<topic>-video/`:
   - Copy `hyperframes.json`, `CLAUDE.md` and `AGENTS.md` from `equals-video/`.
   - Write `package.json` and `meta.json` with the new name.
   - Write `video.json` and `scenes.py` (start with `from motion import *`).
   - `.gitignore` already covers `*-video/` build outputs.
3. Run every Java snippet and every widget rule on JDK 21 before building.
4. Add the web lesson:
   - Write `web/src/data/lessons/<slug>.ts` with `videoDir: "/videos/<name>"` and `videoVersion: "0"`.
   - Register it in `course.ts`.
   - Add widgets.
   - `publish` cuts the clips and fills in the timeline, posters and `videoVersion`.

## Studying a reference video

- YouTube download: `yt-dlp --extractor-args "youtube:player_client=mweb"`. The default and tv clients return 403. Subtitles: `--write-auto-subs --sub-langs vi-orig`.
- Contact sheet: `ffmpeg -i in.mp4 -vf "fps=1/12,scale=640:-1,tile=4x4" sheet%d.jpg`.
- Motion strip: `-ss T -t 4 -vf "fps=4,scale=480:-1,tile=4x4"`.
- Keep downloads in the session scratchpad. Never in the repo.
- Borrow the style (palette, card material, motion grammar), never the brand, characters or assets.

## Do not

- Do not modify `~/Documents/remotion-video/VieNeu-TTS`. It is the user's checkout, v3.2.4, has no "Hải Đăng" voice, and has uncommitted work.
- Do not commit unless the user asks.
- Do not bump the HyperFrames pin (`hyperframes@0.9.41`) silently. Upgrading changes rendering, so propose it first.

## Narration spelling that the Vietnamese voice reads well (measured with `qc-voice`)

- Write English product and class names with capitals in the spoken line (`Redis`, `Spring Boot`, `Kafka`, `Mockito Bean`, `Post Construct`); lowercase (`redis`, `mock`, `bean`) is read as Vietnamese words ("rê-đi", "móc").
- Spelled-out letters are read badly (`J A R`, `A O P`, `J W T`, `R F C`, `Y M L`, `E N V`): rewrite in plain Vietnamese ("gói ứng dụng", "lập trình hướng khía cạnh", "biến môi trường") or say the full English name (`Inversion of Control`). `AOP` and `SQL` as plain words work only mid-sentence, not at the start.
- "key set" for keyset, "I O C" fails: say `Inversion of Control`. "bean" is heard as "bin"; that is the usual Vietnamese reading and passes.
- `qc-voice` mean 0.90+ with every beat >= 0.80 is acceptable; the remaining flags are usually ASR spelling differences, not the audio.

## Retiming to the real narration

Author reveal delays assuming about 14.5 spoken characters per second, build once, then build again: end `scenes.py` with `fit_to_audio(SCENES, __file__)` (video-kit/motion.py) and the second build rescales every action delay to the measured take lengths from `.tts/beats.json`.
`card4(prefix, ...)` creates ids `<prefix>0..n`: never reuse `<prefix>1` for a chip in the same scene (the build fails with "duplicate element ids"). `console(id, x, y, w, lines)` takes no height argument; each console line is about 45 px tall.
