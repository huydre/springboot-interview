"""One entry point for every lesson video: voice env -> build -> check -> render -> publish to the web app.

Run from interactive-lessons/:
    python3 video-kit/pipeline.py setup                 # one-time: VieNeu-TTS (voice "Hải Đăng") in .tts-env/
    python3 video-kit/pipeline.py <project> build       # TTS (cached per sentence) + index.html + timeline.json
    python3 video-kit/pipeline.py <project> check       # HyperFrames lint/layout/motion check, fails on errors
    python3 video-kit/pipeline.py <project> snapshot 10,30,60
    python3 video-kit/pipeline.py <project> render      # <project>/renders/<name>.mp4
    python3 video-kit/pipeline.py <project> publish     # video, timeline, posters into web/, ?v=hash, build web
    python3 video-kit/pipeline.py <project> all         # build + check + render + publish
    python3 video-kit/pipeline.py <project> qc          # quality control: qc-voice + qc-render + qc-frames
        qc-voice   Whisper listens to every beat and flags lines whose words drift from the script
        qc-render  loudness, true peak, unexpected silences, render and clip durations
        qc-frames  a snapshot at the end of every beat, for a human/agent read of each frame
    python3 video-kit/pipeline.py <project> revoice     # re-synthesise flagged beats (best of 4 takes), rebuild, re-check

<project> is a folder such as oop-video/ holding scenes.py and video.json:
    {"name": "<mp4 name>", "slug": "<web lesson slug>", "overview_poster_at": 14.0, "chapters": {"<scene id>": "label"}}
The web lesson web/src/data/lessons/<slug>.ts must contain videoDir: "/videos/<name>" and videoVersion: "...";
publish writes one clip per scene to web/public/videos/<name>/<scene id>.mp4.

Only stdlib; external tools: uv (setup), ffmpeg/ffprobe, npx, npm.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import build as kit_build

KIT = Path(__file__).resolve().parent
BASE = KIT.parent                                      # interactive-lessons/
WEB = BASE / "web"                                     # the React app that embeds every lesson video
HYPERFRAMES = "hyperframes@0.9.41"                     # pinned: compositions are checked against this version
TTS_ENV = BASE / ".tts-env"                            # shared isolated env, never touches other VieNeu checkouts
VIENEU_SPEC = "vieneu>=3.8,<4"                         # 3.8+ ships the "Hải Đăng" preset voice
ROOT = CFG = None                                      # the selected project and its video.json


def run(*args, cwd=None, env=None):
    print("$", " ".join(str(a) for a in args), flush=True)
    subprocess.run([str(a) for a in args], cwd=cwd or ROOT or BASE, env=env, check=True)


def tts_python():
    """VIENEU_PYTHON wins; otherwise the env made by `setup`."""
    explicit = os.environ.get("VIENEU_PYTHON")
    if explicit:
        return explicit
    local = TTS_ENV / "bin" / "python"
    return str(local) if local.exists() else None


def setup():
    if not shutil.which("uv"):
        sys.exit("uv is required for setup: https://docs.astral.sh/uv/")
    run("uv", "venv", "--python", "3.12", TTS_ENV)
    run("uv", "pip", "install", "--python", TTS_ENV / "bin" / "python", VIENEU_SPEC, "faster-whisper>=1.2")
    # Smoke test: synthesise one short line with the preset voice (fails if this vieneu lacks "Hải Đăng").
    tts_dir = BASE / ".tts-env" / "check"
    tts_dir.mkdir(exist_ok=True)
    job, out = tts_dir / "setup-check.json", tts_dir / "setup-check.wav"
    job.write_text(json.dumps(dict(voice="Hải Đăng", jobs=[dict(text="Xin chào.", out=str(out))]),
                              ensure_ascii=False), encoding="utf-8")
    out.unlink(missing_ok=True)
    run(TTS_ENV / "bin" / "python", KIT / "vieneu_synth.py", job)
    job.unlink()
    out.unlink()
    print("VieNeu ready, voice Hải Đăng works")


def build():
    python = tts_python()
    if python:
        os.environ["VIENEU_PYTHON"] = python
    # Without a TTS python, build still works when every sentence is already cached in <project>/.tts/.
    kit_build.build(ROOT)


def check():
    run("npx", "--yes", HYPERFRAMES, "check")


def snapshot(at):
    out = ROOT / ".hyperframes" / "pipeline-snapshots"
    run("npx", "--yes", HYPERFRAMES, "snapshot", "--at", at, "--no-end", "-o", out)
    print(f"contact sheet: {out}")


def render():
    (ROOT / "renders").mkdir(exist_ok=True)
    run("npx", "--yes", HYPERFRAMES, "render", "-o", f"renders/{CFG['name']}.mp4")


def publish():
    """Cut the render into one clip per scene, so each player's timeline, duration and seek bar cover only that scene."""
    name, slug = CFG["name"], CFG["slug"]
    src = ROOT / "renders" / f"{name}.mp4"
    if not src.exists():
        sys.exit(f"{src} not found, run `render` first")
    timeline = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))
    first = timeline[0]
    if not first["start"] <= CFG["overview_poster_at"] < first["end"]:
        # The overview poster sits on the opening clip; a later second would show the next scene's frame.
        sys.exit(f"overview_poster_at {CFG['overview_poster_at']}s is outside the opening scene "
                 f"[{first['start']}, {first['end']}); pick a second inside it in video.json")

    clips = WEB / "public" / "videos" / name
    if clips.exists():
        shutil.rmtree(clips)
    clips.mkdir(parents=True)
    (WEB / "public" / "videos" / f"{name}.mp4").unlink(missing_ok=True)  # the old single-file layout
    for sc in timeline:
        # Re-encode (not stream copy) so every clip starts exactly at its scene, on a fresh keyframe.
        run("ffmpeg", "-y", "-loglevel", "error", "-ss", sc["start"], "-i", src, "-t", round(sc["end"] - sc["start"], 3),
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", clips / f"{sc['id']}.mp4")

    timeline_file = WEB / "src" / "data" / "timelines" / f"{slug}.json"
    timeline_file.parent.mkdir(parents=True, exist_ok=True)
    timeline_file.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")

    # One poster per clip (55% in) so a paused <video> never shows a black first frame;
    # "overview" is the opening clip's poster, taken at the configured second of the full render.
    posters = WEB / "public" / "posters" / slug
    posters.mkdir(parents=True, exist_ok=True)
    shots = [(sc["id"], clips / f"{sc['id']}.mp4", round((sc["end"] - sc["start"]) * 0.55, 2)) for sc in timeline]
    shots.append(("overview", src, CFG["overview_poster_at"]))
    for poster, video, t in shots:
        run("ffmpeg", "-y", "-loglevel", "error", "-ss", t, "-i", video, "-frames:v", "1",
            "-vf", "scale=1280:-1", "-q:v", "4", posters / f"{poster}.jpg")

    # Cache-bust with the content hash: browsers and `vite preview` otherwise keep serving old files.
    digest = hashlib.sha1()
    for clip in sorted(clips.glob("*.mp4")):
        digest.update(clip.read_bytes())
    version = digest.hexdigest()[:8]
    lesson = WEB / "src" / "data" / "lessons" / f"{slug}.ts"
    text, n = re.subn(r'videoVersion: "[^"]*"', f'videoVersion: "{version}"', lesson.read_text(encoding="utf-8"))
    if n != 1 or f'"/videos/{name}"' not in text:
        sys.exit(f'{lesson} needs videoDir: "/videos/{name}" and one videoVersion field')
    if "scenes: []" in text:
        # First publish of a lesson written before its video: play the clips from the timeline just written.
        text = text.replace("scenes: []", "scenes: timeline as Scene[]", 1)
        text = text.replace('import type { Lesson } from "../types";',
                            f'import timeline from "../timelines/{slug}.json";\nimport type {{ Lesson, Scene }} from "../types";', 1)
        text = text.replace("// Video not rendered yet: scenes stay empty until publish.\n", "")
        if "scenes: timeline as Scene[]" not in text or f"../timelines/{slug}.json" not in text:
            sys.exit(f"{lesson}: could not wire the timeline import; do it by hand")
        print("scenes -> timeline (first publish)")
    lesson.write_text(text, encoding="utf-8")
    print(f"videoVersion -> {version}")

    run("npm", "run", "build", cwd=WEB)
    run("npm", "run", "lint", cwd=WEB)
    print("published. Restart any running `vite preview` so it serves the new file sizes.")


VOICE_FLAG = 0.85         # beats below this get re-voiced or a human listen (0.8 let "ArrayList" heard as "Aurelis" pass)
LOUDNESS_RANGE = (-20.0, -13.0)  # integrated LUFS considered comfortable for spoken web video
MAX_SILENCE = 1.9         # planned scene gap + beat gap is 1.25 s, plus up to ~0.3 s of silence inside the TTS takes
MAX_FREEZE = 3.0          # natural stills measured ≤ 1.8 s; longer means the render dropped frames


def qc_voice():
    """Whisper listens to every beat; print the beats whose words drift from the script."""
    python = tts_python()
    if not python:
        sys.exit("run `setup` first: the voice check uses faster-whisper inside .tts-env")
    run(python, KIT / "asr_check.py", ROOT / ".tts" / "beats.json")
    results = json.loads((ROOT / ".tts" / "asr.json").read_text(encoding="utf-8"))
    flagged = sorted((r for r in results if r["score"] < VOICE_FLAG), key=lambda r: r["score"])
    print(f"\nvoice: {len(results)} beats, mean match {sum(r['score'] for r in results) / len(results):.2f}, "
          f"{len(flagged)} below {VOICE_FLAG}")
    for r in flagged:
        print(f"  [{r['score']:.2f}] {r['scene']} @ {r['t']:.1f}s\n    script: {r['spoken']}\n    heard : {r['transcript']}"
              f"\n    missing words: {', '.join(r['missing'][:12])}")
    return flagged


def revoice():
    """Best-of-N re-synthesis for the beats qc-voice flagged, then rebuild so the new takes are in voice.wav."""
    python = tts_python()
    if not python:
        sys.exit("run `setup` first")
    build()      # scenes may have changed since the last check: synthesise and assemble first,
    qc_voice()   # then score the current takes, so revoice never acts on a stale asr.json
    # video.json "must_hear": key terms a take must be heard saying (e.g. "sealed" read as "siêu" scores well otherwise).
    must = json.loads((ROOT / "video.json").read_text(encoding="utf-8")).get("must_hear", [])
    run(python, KIT / "revoice.py", ROOT / ".tts" / "asr.json", VOICE_FLAG, ",".join(must), cwd=KIT)
    build()
    qc_voice()


def qc_frames():
    """One snapshot at the end of every beat, when all of its motion has landed: the frames a viewer pauses on."""
    beats = json.loads((ROOT / ".tts" / "beats.json").read_text(encoding="utf-8"))
    at = ",".join(f"{b['t'] + b['d'] * 0.95:.2f}" for b in beats)
    out = ROOT / ".hyperframes" / "qc-frames"
    run("npx", "--yes", HYPERFRAMES, "snapshot", "--at", at, "--no-end", "-o", out)
    print(f"qc frames: {len(beats)} beat-end frames in {out}/contact-sheet*.jpg; read every sheet")


def probe_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def qc_render():
    """Loudness, peaks, unexpected silences and durations of the rendered file and its published clips."""
    src = ROOT / "renders" / f"{CFG['name']}.mp4"
    if not src.exists():
        print("render: no render yet, skipped")
        return []
    problems = []
    log = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-af",
                          f"ebur128=peak=true,silencedetect=noise=-45dB:d={MAX_SILENCE}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1])
    peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", log)[-1])
    silences = [(float(s), float(d)) for s, d in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", log)]
    timeline = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))
    total = timeline[-1]["end"]
    length = probe_duration(src)
    print(f"\nrender: {length:.2f}s (timeline {total:.2f}s), loudness {lufs} LUFS, true peak {peak} dBFS")
    if not LOUDNESS_RANGE[0] <= lufs <= LOUDNESS_RANGE[1]:
        problems.append(f"loudness {lufs} LUFS outside {LOUDNESS_RANGE}")
    if peak > -1.0:
        problems.append(f"true peak {peak} dBFS above -1 dBFS (clipping risk)")
    if abs(length - total) > 0.2:
        problems.append(f"render length {length:.2f}s differs from timeline {total:.2f}s")
    for end, dur in silences:
        if end < total - 0.5:   # the tail after the last line is expected
            problems.append(f"silence of {dur:.2f}s ending at {end:.2f}s")
    # Ambient light and the progress bar always move, so natural stills stay under ~1.8 s (measured on all renders).
    # A longer freeze means the renderer dropped or repeated frames, e.g. after a browser capture retry.
    vlog = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-vf", "freezedetect=n=0.0003:d=0.8",
                           "-map", "0:v", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"freeze_start: ([\d.]+)", vlog)]
    lengths = [float(x) for x in re.findall(r"freeze_duration: ([\d.]+)", vlog)]
    longest = max(lengths, default=0.0)
    print(f"render: longest still segment {longest:.2f}s")
    for s, d in zip(starts, lengths):
        if d > MAX_FREEZE:
            problems.append(f"frozen video for {d:.2f}s from {s:.2f}s (dropped frames?)")
    clips = WEB / "public" / "videos" / CFG["name"]
    if clips.exists():
        for sc in timeline:
            clip = clips / f"{sc['id']}.mp4"
            want = sc["end"] - sc["start"]
            if not clip.exists():
                problems.append(f"missing clip {clip.name}")
            elif abs(probe_duration(clip) - want) > 0.15:
                problems.append(f"clip {clip.name} is {probe_duration(clip):.2f}s, scene is {want:.2f}s")
    print("render problems:" if problems else "render: ok")
    for p in problems:
        print("  -", p)
    return problems


def qc():
    flagged = qc_voice()
    problems = qc_render()
    qc_frames()
    print(f"\nqc summary: {len(flagged)} voice beats to listen to, {len(problems)} render problems")


def main(argv):
    global ROOT, CFG
    if not argv or argv[0] in ("-h", "--help"):
        sys.exit(__doc__)
    if argv[0] == "setup":
        return setup()
    if len(argv) < 2:
        sys.exit(__doc__)
    ROOT = (Path.cwd() / argv[0]).resolve()
    if not (ROOT / "video.json").exists():
        sys.exit(f"{ROOT}/video.json not found")
    CFG = json.loads((ROOT / "video.json").read_text(encoding="utf-8"))
    cmd, rest = argv[1], argv[2:]
    steps = {"build": build, "check": check, "render": render, "publish": publish,
             "qc": qc, "qc-voice": qc_voice, "qc-frames": qc_frames, "qc-render": qc_render, "revoice": revoice}
    if cmd == "snapshot":
        snapshot(rest[0] if rest else "5,30,60,90,120,150")
    elif cmd == "all":
        for step in (build, check, render, publish):
            step()
    elif cmd in steps:
        steps[cmd]()
    else:
        sys.exit(f"unknown command {cmd!r}\n{__doc__}")


if __name__ == "__main__":
    main(sys.argv[1:])
