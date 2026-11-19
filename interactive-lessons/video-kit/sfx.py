"""Procedural sound effects for lesson videos: synthesised from noise and sine waves, so they are
license-free and identical on every build (fixed random seed).

build.py turns motion actions into events (time, kind, duration) and calls render_track(); the track is
mixed under the narration. Levels sit well below the voice (peaks around -20 dBFS before mixing).
"""
import wave

import numpy as np

SR = 48000
RNG_SEED = 7

# kind -> (gain, minimum spacing between two hits of the same kind in seconds)
LEVELS = {
    "whoosh": (0.22, 0.4),
    "pop": (0.16, 0.09),
    "tick": (0.10, 0.07),
    "boom": (0.30, 0.6),
    "buzz": (0.12, 0.3),
    "sweep": (0.10, 0.2),
    "shine": (0.08, 0.3),
}


def _env(n, attack, release):
    """Linear attack, exponential release envelope over n samples."""
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    r = np.exp(-np.maximum(t - attack, 0) / max(release, 1e-4))
    return a * r


def _lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be an array (time-varying sweep)."""
    alpha = 1 - np.exp(-2 * np.pi * np.broadcast_to(cutoff, x.shape) / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha[i] * (x[i] - acc)
        y[i] = acc
    return y


def whoosh(rng, dur=0.55):
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    sweep = np.geomspace(500, 5000, n) * np.sin(np.linspace(0, np.pi, n)) + 300
    band = _lowpass(noise, sweep) - _lowpass(noise, sweep * 0.25)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    return band * shape


def pop(rng, dur=0.09):
    n = int(SR * dur)
    t = np.arange(n) / SR
    freq = 820 * np.exp(-t * 28) + 260
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * _env(n, 0.002, 0.03)


def tick(rng, dur=0.03):
    n = int(SR * dur)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * t) * 0.6 + rng.standard_normal(n) * 0.25) * _env(n, 0.0005, 0.006)


def boom(rng, dur=0.7):
    n = int(SR * dur)
    t = np.arange(n) / SR
    freq = 95 * np.exp(-t * 3) + 42
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * _env(n, 0.004, 0.28)
    hit = _lowpass(rng.standard_normal(n), 1800) * _env(n, 0.001, 0.025) * 0.8
    return body + hit


def buzz(rng, dur=0.18):
    n = int(SR * dur)
    t = np.arange(n) / SR
    square = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 151.5 * t)) * 0.5
    return _lowpass(square, 1400) * _env(n, 0.003, 0.08) * (0.75 + 0.25 * np.sin(2 * np.pi * 28 * t))


def sweep(rng, dur=0.6):
    """Rising airy tone for a light pulse travelling along a trace."""
    n = int(SR * max(dur, 0.15))
    t = np.arange(n) / SR
    freq = np.geomspace(380, 1500, n)
    tone = np.sin(2 * np.pi * np.cumsum(freq) / SR)
    air = _lowpass(rng.standard_normal(n), freq * 2) * 0.35
    return (tone * 0.6 + air) * np.sin(np.linspace(0, np.pi, n)) ** 1.5


def shine(rng, dur=0.5):
    """Soft bell shimmer for a takeaway landing."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    partials = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((1320, 0.5), (1980, 0.3), (2640, 0.2)))
    return partials * _env(n, 0.004, 0.16)


SYNTHS = {"whoosh": whoosh, "pop": pop, "tick": tick, "boom": boom, "buzz": buzz, "sweep": sweep, "shine": shine}


def render_track(events, total, path):
    """events: [(time_s, kind, duration_or_None)]. Writes a mono 16-bit WAV of length `total` seconds."""
    rng = np.random.default_rng(RNG_SEED)
    out = np.zeros(int(SR * (total + 1)), dtype=np.float64)
    last = {}
    for at, kind, dur in sorted(events, key=lambda e: e[0]):
        gain, spacing = LEVELS[kind]
        if at - last.get(kind, -9) < spacing:
            continue  # thin out bursts (staggered pops) so effects never chatter
        last[kind] = at
        clip = SYNTHS[kind](rng, dur) if dur else SYNTHS[kind](rng)
        clip = clip / (np.max(np.abs(clip)) or 1) * gain
        start = int(max(at, 0) * SR)
        end = min(start + len(clip), len(out))
        out[start:end] += clip[: end - start]
    out = np.tanh(out * 1.2) / 1.2          # gentle soft clip for overlapping hits
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(out[: int(SR * total)], -1, 1) * 32767).astype("<i2").tobytes())
