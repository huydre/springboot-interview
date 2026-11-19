"""Shared vocabulary for lesson videos: motion actions and markup helpers used by every <topic>-video/scenes.py.

Every scene has a `.cam` world that the camera can push into or pan across, a HUD layer
that stays fixed, and beats. A beat = (spoken text, caption, [actions]). Actions are
small dicts produced by the helpers below and turned into GSAP calls by build.py.
"""
import html
import json
import math
import re
from pathlib import Path

# ---------------------------------------------------------------- motion helpers

def IN(sel, kind="up", d=0.0, dur=0.6, stagger=0.0):
    return dict(a="in", sel=sel, kind=kind, d=d, dur=dur, stagger=stagger)


def OUT(sel, kind="fade", d=0.0, dur=0.45):
    return dict(a="out", sel=sel, kind=kind, d=d, dur=dur)


def TYPE(sel, d=0.0, each=0.035):
    return dict(a="type", sel=sel, d=d, each=each)


def DRAW(sel, d=0.0, dur=0.8):
    return dict(a="draw", sel=sel, d=d, dur=dur)


def FOCUS(x, y, scale, d=0.0, dur=1.3):
    """Move the camera so world point (x, y) sits at screen centre, zoomed by `scale`."""
    return dict(a="cam", x=round((960 - x) * scale, 1), y=round((540 - y) * scale, 1), scale=scale, d=d, dur=dur)


def HOME(d=0.0, dur=1.1):
    return dict(a="cam", x=0, y=0, scale=1, d=d, dur=dur)


def DIM(sel, d=0.0, level=0.22, blur=0):
    return dict(a="dim", sel=sel, d=d, level=level, blur=blur)


def PULSE(sel, d=0.0):
    return dict(a="pulse", sel=sel, d=d)


def FLOW(sel, d=0.0):
    """A glowing dot that keeps travelling along a drawn wire until the scene ends."""
    return dict(a="flow", sel=sel, d=d)


def COMET(id_, d=0.0, dur=0.8):
    """Send one bright comet (white head, coloured tail) along a trace(), once, start to end."""
    return dict(a="comet", sel=f"#{id_}", d=d, dur=dur)


def LIGHT(sel, d=0.0):
    """Light up gnode()s: the glow layer pops in, like a circuit node receiving the pulse."""
    return dict(a="light", sel=sel, d=d)


def SHAKE(sel, d=0.0):
    return dict(a="shake", sel=sel, d=d)


def TO(sel, props, d=0.0, dur=0.6, ease="power3.inOut"):
    return dict(a="to", sel=sel, props=props, d=d, dur=dur, ease=ease)


def fit_to_audio(scenes, scenes_file, rate=14.5):
    """Retime a scene list to the measured narration.

    Authors place reveals assuming `rate` spoken characters per second. After a first build the real take lengths are in
    <project>/.tts/beats.json, so every action delay in a beat is scaled by (measured seconds / authored estimate) and
    the reveals keep their place in the sentence. Call it as the last line of scenes.py: fit_to_audio(SCENES, __file__).
    """
    beats = Path(scenes_file).parent / ".tts" / "beats.json"
    if not beats.exists():
        return
    known = {b["spoken"]: b["d"] for b in json.loads(beats.read_text(encoding="utf-8"))}
    for sc in scenes:
        for spoken, _caption, actions in sc["beats"]:
            if spoken in known:
                f = known[spoken] / (len(spoken) / rate)
                for a in actions:
                    a["d"] = round(a.get("d", 0) * f, 2)


# ---------------------------------------------------------------- markup helpers

def esc(s):
    return html.escape(s, quote=False)


def letters(text):
    """Split text into masked words for TYPE reveals: each word rises from behind its own mask (.w clips, .ch moves).
    Every letter is also its own .l span so a theme can reveal and shimmer letter by letter."""
    def word(w):
        return "".join(f'<span class="l">{esc(c)}</span>' for c in w)
    return " ".join(f'<span class="w"><span class="ch">{word(w)}</span></span>' for w in text.split(" "))


def el(id_, x, y, w, h, inner, cls="", style="", attrs=""):
    size = f"left:{x}px;top:{y}px;" + (f"width:{w}px;" if w else "") + (f"height:{h}px;" if h else "")
    return f'<div id="{id_}" class="abs {cls}" style="{size}{style}"{attrs}>{inner}</div>'


def box(id_, x, y, w, h, inner, tone="cyan", extra=""):
    return el(id_, x, y, w, h, inner, f"gbox {tone} r {extra}")


def chip(id_, x, y, text, tone="cyan", w=None):
    return el(id_, x, y, w, None, esc(text), f"chip {tone} r")


def big_title(id_, title, sub):
    """Chapter title card: a silver headline that rises word by word while the camera slowly dollies in
    (see build.py TYPE on a -big id), with the subtitle underneath."""
    return (el(f"{id_}-big", 0, 0, 1920, 1080, f'<div class="kin">{letters(title)}</div>', "kin-stage r")
            + el(f"{id_}-bsub", 0, 600, 1920, None, esc(sub), "kin-sub r"))


def hud(id_, title, sub):
    return el(f"{id_}-hud", 120, 64, 1400, None, f"<b>{esc(title)}</b><span>{esc(sub)}</span>", "hud r")


def arrow(id_, pts, tone="cyan", dashed=False, head=True):
    """Polyline/curve arrow drawn with stroke-dash; the head pops in after the line finishes.

    pts: [(x1, y1), (x2, y2)] straight, or [(x1, y1), (c1x, c1y), (c2x, c2y), (x2, y2)] cubic.
    """
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    if len(pts) == 2:
        d, (px, py) = f"M{x1} {y1} L{x2} {y2}", (x1, y1)
    else:
        (c1x, c1y), (c2x, c2y) = pts[1], pts[2]
        d, (px, py) = f"M{x1} {y1} C{c1x} {c1y} {c2x} {c2y} {x2} {y2}", (c2x, c2y)
    ang = math.atan2(y2 - py, x2 - px)
    s = 13
    hx = [(x2, y2), (x2 - s * math.cos(ang - 0.45), y2 - s * math.sin(ang - 0.45)),
          (x2 - s * math.cos(ang + 0.45), y2 - s * math.sin(ang + 0.45))]
    head_svg = ""
    if head:
        pts_s = " ".join(f"{a:.1f},{b:.1f}" for a, b in hx)
        head_svg = f'<polygon id="{id_}-h" class="ahead {tone}" points="{pts_s}"/>'
    dash = " dashed" if dashed else ""
    flow = "" if dashed or tone == "muted" else f'<path id="{id_}-f" class="flow {tone}" pathLength="1" d="{d}"/>'
    return (f'<g id="{id_}"><path id="{id_}-p" class="wire {tone}{dash}" pathLength="1" stroke-dashoffset="1" d="{d}"/>'
            + head_svg + flow + '</g>')


def rounded(pts, r):
    """Orthogonal polyline with each inner corner replaced by a quarter curve of radius r (clamped to half a segment)."""
    if r <= 0 or len(pts) < 3:
        return "M" + " L".join(f"{x} {y}" for x, y in pts)
    out = [f"M{pts[0][0]} {pts[0][1]}"]
    for (ax, ay), (bx, by), (cx, cy) in zip(pts, pts[1:], pts[2:]):
        r1 = min(r, math.hypot(bx - ax, by - ay) / 2, math.hypot(cx - bx, cy - by) / 2)
        ux, uy = (bx - ax) / (math.hypot(bx - ax, by - ay) or 1), (by - ay) / (math.hypot(bx - ax, by - ay) or 1)
        vx, vy = (cx - bx) / (math.hypot(cx - bx, cy - by) or 1), (cy - by) / (math.hypot(cx - bx, cy - by) or 1)
        out.append(f"L{bx - ux * r1:.1f} {by - uy * r1:.1f} Q{bx} {by} {bx + vx * r1:.1f} {by + vy * r1:.1f}")
    out.append(f"L{pts[-1][0]} {pts[-1][1]}")
    return " ".join(out)


def trace(id_, pts, tone="cyan", dashed=False, r=0):
    """Circuit trace: an orthogonal polyline that DRAW reveals ("#id-p") and COMET runs along (tail + head).
    r > 0 rounds the corners."""
    d = rounded(pts, r)
    dash = " dashed" if dashed else ""
    return (f'<g id="{id_}"><path id="{id_}-p" class="wire {tone}{dash}" pathLength="1" stroke-dashoffset="1" d="{d}"/>'
            f'<path id="{id_}-t" class="comet-tail {tone}" pathLength="1" d="{d}"/>'
            f'<path id="{id_}-k" class="comet-head {tone}" pathLength="1" d="{d}"/></g>')


def gnode(id_, x, y, w, h, inner, tone="cyan"):
    """Glossy circuit node with a hidden glow layer that LIGHT turns on."""
    return el(id_, x, y, w, h, f'<span class="lit"></span><span class="gn-in">{inner}</span>', f"gnode {tone} r")


def console(id_, x, y, w, lines):
    """Terminal box whose lines (ids <id>-1..n) are revealed one by one with IN(..., "type1")."""
    rows = "".join(f'<i id="{id_}-{i}">{esc(l)}</i>' for i, l in enumerate(lines, 1))
    return el(id_, x, y, w, None, f"<span>console</span>{rows}", "console")


def tile(id_, x, y, size, glyph):
    """App-icon tile (styled by the mono theme): dark rounded square with a dot matrix and a glowing white glyph."""
    return el(id_, x, y, size, size, icon(glyph, int(size * 0.55)), "tile r")


def wires(*arrows, w=1920, h=1080):
    return f'<svg class="wires" viewBox="0 0 {w} {h}" style="width:{w}px;height:{h}px">{"".join(arrows)}</svg>'


def ARROW(id_, d=0.0, dur=0.7):
    """Draw an arrow, pop its head, then send a light pulse along it (if it has one)."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25), FLOW(f"#{id_}-f", d + dur)]


ICONS = {
    "lock": '<rect x="14" y="28" width="36" height="28" rx="5"/><path d="M21 28v-8a11 11 0 0 1 22 0v8"/><circle cx="32" cy="42" r="3"/>',
    "tree": '<rect x="24" y="6" width="16" height="12" rx="3"/><rect x="6" y="44" width="16" height="12" rx="3"/><rect x="42" y="44" width="16" height="12" rx="3"/><path d="M32 18v12M14 44V30h36v14"/>',
    "shapes": '<circle cx="20" cy="20" r="11"/><rect x="36" y="9" width="21" height="21" rx="3"/><path d="M8 56l12-20 12 20z"/><path d="M38 46h20M48 36v20"/>',
    "plug": '<path d="M24 6v12M40 6v12"/><rect x="16" y="18" width="32" height="16" rx="5"/><path d="M32 34v8a10 10 0 0 1-10 10h-8"/>',
    "eq": '<path d="M14 24h36M14 40h36"/>',
    "grid": '<rect x="8" y="12" width="48" height="40" rx="5"/><path d="M8 25h48M8 38h48M24 12v40M40 12v40"/>',
    "hash": '<path d="M26 8l-6 48M44 8l-6 48M12 23h42M10 41h42"/>',
    "quote": '<path d="M12 20h16v14q0 10-12 14M36 20h16v14q0 10-12 14"/>',
    "shield": '<path d="M32 6l22 8v16c0 14-10 24-22 28C20 54 10 44 10 30V14z"/>',
    "box": '<path d="M8 22l24-12 24 12-24 12z"/><path d="M8 22v22l24 12 24-12V22"/><path d="M32 34v22"/>',
    "split": '<circle cx="12" cy="32" r="5"/><path d="M17 32h10c6 0 8-16 16-16h6M27 32c6 0 8 16 16 16h6"/><circle cx="54" cy="16" r="4"/><circle cx="54" cy="48" r="4"/>',
    "share": '<circle cx="16" cy="32" r="7"/><circle cx="48" cy="14" r="7"/><circle cx="48" cy="50" r="7"/><path d="M22 28l20-10M22 36l20 10"/>',
}


def icon(name, size=64):
    return f'<svg class="ico" viewBox="0 0 64 64" width="{size}" height="{size}">{ICONS[name]}</svg>'


def win(title):
    """Title bar with three dots, the reference's "app window" look."""
    return f'<div class="win-h"><i></i><i></i><i></i><span>{esc(title)}</span></div>'


def card4(prefix, x0, y, w, h, gap, items, tone="cyan"):
    """A row of icon cards (any count, despite the name): items = [(icon, title, subtitle)]."""
    out = []
    for i, (ico, title, sub) in enumerate(items):
        out.append(box(f"{prefix}{i}", x0 + i * (w + gap), y, w, h,
                       f'{icon(ico)}<b>{esc(title)}</b><small>{esc(sub)}</small>', tone, "card"))
    return "".join(out)


JAVA_KW = ("public|private|protected|class|interface|extends|implements|return|new|void|if|throw|static|"
           "final|long|int|boolean|default|abstract|var|for")
TOKEN = re.compile(r'(?P<c>//[^\n]*)|(?P<s>"[^"]*")|(?P<k>\b(?:' + JAVA_KW + r')\b)'
                   r'|(?P<t>\b[A-Z][A-Za-z]+\b)|(?P<f>\b[a-z][A-Za-z]*(?=\())|(?P<x>.)', re.S)


def code(src):
    """Single-pass Java highlighter (inserted spans are never re-matched)."""
    out = []
    for m in TOKEN.finditer(src.strip("\n")):
        kind, text = m.lastgroup, esc(m.group())
        out.append(text if kind == "x" else f'<span class="{kind}">{text}</span>')
    return "<pre>" + "".join(out) + "</pre>"
