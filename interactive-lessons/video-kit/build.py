"""Compile a lesson-video project (<topic>-video/scenes.py + video.json) into index.html, assets/voice.wav, timeline.json.

Each narration beat is synthesised separately with local VieNeu-TTS (voice "Hải Đăng"),
so beat start times are exact. Those times drive the subtitles and every motion action
declared in scenes.py. Normally called through pipeline.py:
    python3 video-kit/pipeline.py <topic>-video build
"""
import hashlib
import html
import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import sfx

KIT = Path(__file__).resolve().parent
ROOT = TTS_DIR = ASSETS = None      # set per project by build()
VOICE = "Hải Đăng"                 # VieNeu-TTS preset voice
SAMPLE_RATE = 48000
BEAT_GAP, SCENE_GAP, LEAD_IN = 0.35, 0.9, 0.6


# ---------------------------------------------------------------- voiceover

def sh(*args):
    subprocess.run(args, check=True, capture_output=True)


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       check=True, capture_output=True, text=True)
    return float(r.stdout.strip())


def tts_path(text):
    """Cache key is the voice + text, so editing one beat only re-synthesises that beat."""
    key = hashlib.sha1(f"{VOICE}|{text}".encode()).hexdigest()[:16]
    return TTS_DIR / f"{key}.wav"


def synth_all(texts):
    TTS_DIR.mkdir(exist_ok=True)
    jobs = [dict(text=t, out=str(tts_path(t))) for t in texts if not tts_path(t).exists()]
    if not jobs:
        return
    python = os.environ.get("VIENEU_PYTHON")
    if not python:
        raise SystemExit("Set VIENEU_PYTHON to a Python interpreter that has `vieneu` installed")
    job_file = TTS_DIR / "jobs.json"
    job_file.write_text(json.dumps(dict(voice=VOICE, jobs=jobs), ensure_ascii=False), encoding="utf-8")
    subprocess.run([python, str(KIT / "vieneu_synth.py"), str(job_file)], check=True)


def silence(seconds):
    p = TTS_DIR / f"sil-{seconds:.2f}.wav"
    if not p.exists():
        sh("ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono",
           "-t", f"{seconds:.2f}", str(p))
    return p


# ---------------------------------------------------------------- motion -> GSAP

IN_FROM = {
    # transforms only: letterSpacing would snap to whole pixels and stutter in frame-by-frame capture
    "glowin": ("{opacity: 0, scale: 1.08, scaleX: 1.14, filter: 'blur(14px)'}", "{opacity: 1, scale: 1, scaleX: 1, filter: 'blur(0px)', ease: 'power3.out'}"),
    "up": ("{opacity: 0, y: 24}", "{opacity: 1, y: 0, ease: 'power3.out'}"),
    "down": ("{opacity: 0, y: -24}", "{opacity: 1, y: 0, ease: 'power3.out'}"),
    "left": ("{opacity: 0, x: -50}", "{opacity: 1, x: 0, ease: 'power3.out'}"),
    "right": ("{opacity: 0, x: 50}", "{opacity: 1, x: 0, ease: 'power3.out'}"),
    "fade": ("{opacity: 0}", "{opacity: 1, ease: 'none'}"),
    "pop": ("{opacity: 0, scale: 0.7, transformOrigin: '50% 50%'}", "{opacity: 1, scale: 1, ease: 'back.out(1.5)'}"),
    "blur": ("{opacity: 0, scale: 1.04, filter: 'blur(10px)'}", "{opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'power3.out'}"),
    "zoomin": ("{opacity: 0, scale: 1.18, filter: 'blur(8px)'}", "{opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'expo.out'}"),
    # squash-and-stretch landing, like a glass pill dropped onto the stage
    "stamp": ("{opacity: 0, scaleX: 0.88, scaleY: 1.12, y: 14, filter: 'blur(6px)'}", "{opacity: 1, scaleX: 1, scaleY: 1, y: 0, filter: 'blur(0px)', ease: 'back.out(1.7)'}"),
    "type1": ("{opacity: 0, x: -14}", "{opacity: 1, x: 0, ease: 'power2.out'}"),
}
OUT_TO = {
    "fade": "{opacity: 0, ease: 'power1.in'}",
    "zoom": "{opacity: 0, scale: 1.25, filter: 'blur(10px)', ease: 'power2.in'}",
    "left": "{opacity: 0, x: -140, ease: 'power2.in'}",
    "up": "{opacity: 0, y: -40, ease: 'power2.in'}",
    "pop": "{opacity: 0, scale: 0.2, ease: 'back.in(2)'}",
    "blur": "{opacity: 0, filter: 'blur(12px)', ease: 'power1.in'}",
}


def scope(sid, sel, suffix=""):
    return ", ".join(f"#sc-{sid} {part.strip()}{suffix}" for part in sel.split(","))


def merge(obj, extra):
    """Append extra GSAP vars to a '{...}' literal."""
    return obj[:-1] + ", " + extra + "}"


def sfx_events(a, t):
    """Map one motion action to sound events (time, kind, duration)."""
    at, kind = t + a.get("d", 0), a["a"]
    if kind == "in" and a["kind"] in ("pop", "stamp", "zoomin"):
        return [(at, "pop", None)]
    if kind == "in" and a["kind"] == "type1":
        return [(at, "tick", None)]
    if kind == "in" and a["kind"] == "glowin":
        return [(at, "shine", None)]
    if kind == "draw":
        return [(at + a["dur"], "tick", None)]
    if kind == "type" and a["sel"].strip().endswith("-big"):
        return [(at + 0.05, "boom", None)]
    if kind == "type":
        return [(at + 0.1, "shine", None)]
    if kind == "shake":
        return [(at, "buzz", None)]
    if kind == "comet":  # berry hides the comet, so it gets no sound either
        return [] if THEME == "berry" else [(at, "sweep", a["dur"])]
    if kind == "light":
        return [(at, "tick", None)]
    return []


def action_js(sid, a, t, end):
    t = round(t + a.get("d", 0), 3)
    kind = a["a"]
    if kind == "in":
        frm, to = IN_FROM[a["kind"]]
        extra = f"duration: {a['dur']}" + (f", stagger: {a['stagger']}" if a.get("stagger") else "")
        return f'tl.fromTo("{scope(sid, a["sel"])}", {frm}, {merge(to, extra)}, {t});'
    if kind == "out":
        return f'tl.to("{scope(sid, a["sel"])}", {merge(OUT_TO[a["kind"]], "duration: " + str(a["dur"]))}, {t});'
    if kind == "type" and THEME in ("berry", "mono"):
        # Letters surface from a soft blur one by one, then a light band sweeps across the line.
        sel = scope(sid, a["sel"])
        each = round(max(a["each"], 0.022), 3)
        js = (f'tl.set("{sel}, {scope(sid, a["sel"], " .ch")}", {{opacity: 1}}, {t}); '
              f'tl.fromTo("{scope(sid, a["sel"], " .l")}", {{opacity: 0, y: 18, filter: "blur(12px)"}}, '
              f'{{opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, stagger: {each}, ease: "power3.out"}}, {t}); '
              f'tl.to("{scope(sid, a["sel"], " .l")}", {{opacity: 0.38, duration: 0.3, yoyo: true, repeat: 1, '
              f'stagger: {each}, ease: "sine.inOut"}}, {round(t + 1.0, 3)});')
        if a["sel"].strip().endswith("-big"):
            js += f' tl.fromTo("{scope(sid, a["sel"], " .kin")}", {{scale: 0.97}}, {{scale: 1.02, duration: 3.4, ease: "sine.out"}}, {t});'
        return js
    if kind == "type":
        # Words rise from behind their masks with a slight tilt and de-blur (editorial kinetic type).
        stagger = round(max(a["each"] * 4, 0.07), 3)
        js = (f'tl.set("{scope(sid, a["sel"])}", {{opacity: 1}}, {t}); '
              f'tl.fromTo("{scope(sid, a["sel"], " .ch")}", {{opacity: 0, yPercent: 105, rotation: 3, filter: "blur(8px)"}}, '
              f'{{opacity: 1, yPercent: 0, rotation: 0, filter: "blur(0px)", duration: 0.75, stagger: {stagger}, '
              f'ease: "power4.out"}}, {t});')
        if a["sel"].strip().endswith("-big"):
            # Chapter card: slow camera dolly into the headline.
            js += f' tl.fromTo("{scope(sid, a["sel"], " .kin")}", {{scale: 0.94}}, {{scale: 1.04, duration: 3.4, ease: "sine.out"}}, {t});'
        return js
    if kind == "draw":
        return (f'tl.fromTo("{scope(sid, a["sel"])}", {{attr: {{"stroke-dashoffset": 1}}, opacity: 0}}, '
                f'{{attr: {{"stroke-dashoffset": 0}}, opacity: 1, duration: {a["dur"]}, ease: "power2.inOut"}}, {t});')
    if kind == "flow":
        # one dot every 1.6 s from the moment the wire is drawn until the scene fades out
        n = int((end - 0.4 - t) / 1.6)
        if n < 1:
            return ""
        return (f'tl.set("{scope(sid, a["sel"])}", {{opacity: 1}}, {t}); '
                f'tl.fromTo("{scope(sid, a["sel"])}", {{attr: {{"stroke-dashoffset": 0.03}}}}, {{attr: {{"stroke-dashoffset": -0.97}}, '
                f'duration: 1.6, repeat: {n - 1}, ease: "none"}}, {t});')
    if kind == "comet":
        # tail (long, soft) and head (short, white) slide from the start of the trace to its end, then fade.
        sel, dur = scope(sid, a["sel"]), a["dur"]
        return (f'tl.set("{sel}-t, {sel}-k", {{opacity: 1}}, {t}); '
                f'tl.fromTo("{sel}-t", {{attr: {{"stroke-dashoffset": 0.4}}}}, {{attr: {{"stroke-dashoffset": -0.6}}, duration: {dur}, ease: "power2.inOut"}}, {t}); '
                f'tl.fromTo("{sel}-k", {{attr: {{"stroke-dashoffset": 0.03}}}}, {{attr: {{"stroke-dashoffset": -0.97}}, duration: {dur}, ease: "power2.inOut"}}, {t}); '
                f'tl.to("{sel}-t, {sel}-k", {{opacity: 0, duration: 0.25}}, {round(t + dur, 3)});')
    if kind == "light":
        sel = scope(sid, a["sel"], " .lit")
        js = f'tl.fromTo("{sel}", {{opacity: 0, scale: 0.6}}, {{opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)"}}, {t});'
        if THEME == "berry":  # dark label on a white node turns white once the node fills with colour
            js += f' tl.to("{scope(sid, a["sel"], " .gn-in")}", {{color: "#ffffff", duration: 0.3}}, {t});'
        return js
    if kind == "cam":
        return (f'tl.to("#sc-{sid} .cam", {{x: {a["x"]}, y: {a["y"]}, scale: {a["scale"]}, '
                f'duration: {a["dur"]}, ease: "power2.inOut"}}, {t});')
    if kind == "dim":
        return (f'tl.to("{scope(sid, a["sel"])}", {{opacity: {a["level"]}, filter: "blur({a["blur"]}px)", '
                f'duration: 0.7, ease: "power2.out"}}, {t});')
    if kind == "pulse":
        return (f'tl.to("{scope(sid, a["sel"])}", {{scale: 1.06, transformOrigin: "50% 50%", duration: 0.18, '
                f'yoyo: true, repeat: 1, ease: "power1.inOut"}}, {t});')
    if kind == "shake":
        return f'tl.to("{scope(sid, a["sel"])}", {{keyframes: {{x: [0, -10, 8, -5, 3, 0]}}, duration: 0.4}}, {t});'
    if kind == "to":
        props = ", ".join(f"{k}: {json.dumps(v)}" for k, v in a["props"].items())
        return f'tl.to("{scope(sid, a["sel"])}", {{{props}, duration: {a["dur"]}, ease: "{a["ease"]}"}}, {t});'
    raise ValueError(kind)


AMBIENTS = {  # theme -> [(id, x, y, size, colour)] soft colour pools behind everything
    "dark": [
        ("amb-t", 120, -260, 1200, "rgba(34, 190, 230, 0.16)"),
        ("amb-a", 1100, 520, 1100, "rgba(245, 165, 36, 0.09)"),
        ("amb-v", 1300, -200, 900, "rgba(168, 85, 247, 0.10)"),
    ],
    "berry": [  # off-white canvas with berry ink pooling into the corners
        ("amb-t", -520, 420, 1300, "rgba(176, 28, 98, 0.62)"),
        ("amb-a", 1180, 300, 1400, "rgba(190, 40, 110, 0.55)"),
        ("amb-v", 520, 760, 1000, "rgba(214, 92, 150, 0.40)"),
    ],
    "mono": [  # diagonal wash of light from the bottom right, a faint cool pool top left
        ("amb-t", 700, 260, 1600, "rgba(255, 255, 255, 0.26)"),
        ("amb-a", 1100, 560, 1100, "rgba(225, 230, 240, 0.20)"),
        ("amb-v", -420, -460, 1100, "rgba(110, 150, 255, 0.07)"),
    ],
}
THEME = "dark"                     # from video.json "theme"; "berry" also loads themes/berry.css


def ambient(total):
    """Three blurred light pools drifting slowly so the black never looks flat."""
    markup, js = [], []
    for k, (aid, x, y, size, col) in enumerate(AMBIENTS[THEME]):
        markup.append(f'<i class="amb" id="{aid}" style="left:{x}px;top:{y}px;width:{size}px;height:{size}px;'
                      f'background:radial-gradient(circle, {col}, transparent 65%)"></i>')
        period = 11 + 3 * k
        js.append(f'tl.to("#{aid}", {{x: {(-1) ** k * 140}, y: {90 - 40 * k}, duration: {period}, yoyo: true, '
                  f'repeat: {int(total / period)}, ease: "sine.inOut"}}, 0);')
    return "".join(markup), js


# ---------------------------------------------------------------- build

def load_scenes(root):
    """Import <project>/scenes.py; it does `from motion import *`, so the kit must be importable."""
    sys.path.insert(0, str(KIT))
    spec = importlib.util.spec_from_file_location(f"scenes_{root.name}", root / "scenes.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.SCENES


def build(root):
    global ROOT, TTS_DIR, ASSETS, CHAPTERS, THEME
    ROOT, TTS_DIR, ASSETS = Path(root).resolve(), Path(root).resolve() / ".tts", Path(root).resolve() / "assets"
    config = json.loads((ROOT / "video.json").read_text(encoding="utf-8"))
    CHAPTERS = config["chapters"]
    THEME = config.get("theme", "dark")
    if THEME not in AMBIENTS:
        raise SystemExit(f"unknown theme {THEME!r}; known: {', '.join(AMBIENTS)}")
    SCENES = load_scenes(ROOT)
    synth_all([spoken for sc in SCENES for spoken, _, _ in sc["beats"]])
    t, parts, timeline = LEAD_IN, [silence(LEAD_IN)], []
    for sc in SCENES:
        start, beats = t - (LEAD_IN if not timeline else SCENE_GAP / 2), []
        for spoken, caption, actions in sc["beats"]:
            wav = tts_path(spoken)
            d = duration(wav)
            beats.append(dict(t=round(t, 3), d=round(d, 3), cap=caption, spoken=spoken, wav=str(wav), actions=actions))
            last = max((x.get("d", 0) + x.get("dur", 0.5) for x in actions), default=0)
            if last > d + BEAT_GAP:  # motion still running after the narration moved on
                print(f"warning: {sc['id']} beat ends {last:.2f}s but its audio is {d:.2f}s: {spoken[:50]}")
            parts += [wav, silence(BEAT_GAP)]
            t += d + BEAT_GAP
        parts.append(silence(SCENE_GAP))
        t += SCENE_GAP
        timeline.append(dict(sc, start=round(start, 3), end=round(t - SCENE_GAP / 2, 3), beats=beats))
    total = round(t + 0.6, 3)
    timeline[-1]["end"] = total
    ASSETS.mkdir(exist_ok=True)
    lst = TTS_DIR / "concat.txt"
    lst.write_text("".join(f"file '{p.resolve()}'\n" for p in parts))
    sh("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy",
       str(ASSETS / "voice.wav"))
    events = [(sc["start"] - 0.12, "whoosh", None) for sc in timeline[1:]]
    for sc in timeline:
        for bt in sc["beats"]:
            for a in bt["actions"]:
                events += sfx_events(a, bt["t"])
    sfx.render_track(events, total, ASSETS / "sfx.wav")
    # voice on top, effects under it; a limiter keeps the sum below -1 dBFS true peak
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", str(ASSETS / "voice.wav"), "-i", str(ASSETS / "sfx.wav"),
       "-filter_complex", "[0][1]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.8:attack=1:release=60:level=false",
       "-ar", "48000", "-ac", "1", str(ASSETS / "mix.wav"))
    page = render_html(timeline, total)
    assert_unique_ids(page)
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    (ROOT / "timeline.json").write_text(json.dumps(
        [dict(id=s["id"], chapter=chapter_name(s), start=s["start"], end=s["end"]) for s in timeline],
        ensure_ascii=False, indent=2), encoding="utf-8")
    # Per-beat timing for quality control (pipeline.py qc): transcript check and end-of-beat snapshots.
    (ROOT / ".tts" / "beats.json").write_text(json.dumps(
        [dict(scene=s["id"], t=b["t"], d=b["d"], spoken=b["spoken"], caption=b["cap"], wav=b["wav"])
         for s in timeline for b in s["beats"]], ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"built {len(timeline)} scenes, {sum(len(s['beats']) for s in timeline)} beats, {total:.1f}s")


CHAPTERS = {}                      # scene id -> chapter label, from video.json


def assert_unique_ids(page):
    """Selectors are #id based, so a reused id silently animates the wrong element; fail the build instead."""
    ids = re.findall(r'\sid="([^"]+)"', page)
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise SystemExit(f"duplicate element ids: {', '.join(dupes)}")


def chapter_name(sc):
    return CHAPTERS[sc["id"]]


def render_html(timeline, total):
    scenes, caps = [], []
    amb, js = ambient(total)
    for sc in timeline:
        sid, s0, s1 = sc["id"], sc["start"], sc["end"]
        ww, wh = sc["world"]
        scenes.append(f'<section class="clip scene" id="sc-{sid}" data-start="{s0}" data-duration="{round(s1 - s0, 3)}" '
                      f'data-track-index="1"><div class="cam" style="width:{ww}px;height:{wh}px">{sc["cam"]}</div>'
                      f'{sc["hud"]}<i class="whip"></i></section>')
        if s0 > 0:  # a comet streak whips across at the cut (sound: whoosh)
            js.append(f'tl.fromTo("#sc-{sid} .whip", {{x: -900, opacity: 1}}, {{x: 2300, opacity: 0.0, duration: 0.7, ease: "power2.in"}}, {round(s0 - 0.2, 3)});')
        js.append(f'tl.fromTo("#sc-{sid}", {{opacity: 0, scale: 1.02, filter: "blur(6px)"}}, '
                  f'{{opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "power2.out"}}, {s0});')
        js.append(f'tl.to("#sc-{sid}", {{opacity: 0, filter: "blur(4px)", duration: 0.4, '
                  f'ease: "power1.in"}}, {round(s1 - 0.4, 3)});')
        for b in sc["beats"]:
            cap = html.escape(b["cap"]).replace("`", "")
            caps.append(f'<div class="clip cap" data-start="{b["t"]}" data-duration="{round(b["d"] + 0.3, 3)}" '
                        f'data-track-index="2"><span>{cap}</span></div>')
            for a in b["actions"]:
                if a["a"] in ("flow", "in") and a["sel"].endswith(("-f", "-h")) and f'id="{a["sel"][1:]}"' not in sc["cam"]:
                    continue  # dashed/muted wires have no light pulse; head-less wires have no head
                code = action_js(sid, a, b["t"], s1)
                if code:
                    js.append(code)
    # The bar tracks the current scene, not the whole video: each scene is also published as its own clip.
    for sc in timeline:
        js.append(f'tl.fromTo("#bar", {{scaleX: 0}}, {{scaleX: 1, duration: {round(sc["end"] - sc["start"], 3)}, '
                  f'ease: "none", immediateRender: false}}, {sc["start"]});')
    template = (KIT / "template.html").read_text(encoding="utf-8")
    css = KIT / "themes" / f"{THEME}.css"
    theme_css = css.read_text(encoding="utf-8") if css.exists() else ""
    return (template.replace("{{TOTAL}}", str(total))
            .replace("{{AMBIENT}}", amb)
            .replace("{{THEME_CSS}}", theme_css)
            .replace("{{SCENES}}", "\n".join(scenes))
            .replace("{{CAPTIONS}}", "\n".join(caps))
            .replace("{{JS}}", "\n      ".join(js)))


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else ".")
