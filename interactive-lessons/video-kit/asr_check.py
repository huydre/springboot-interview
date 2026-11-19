"""Listen back to every narration beat and compare it with the script, to catch TTS mispronunciations.

Usage: <python-with-faster-whisper> asr_check.py <project>/.tts/beats.json
Writes <project>/.tts/asr.json: one entry per beat with the transcript and a similarity score.
Transcripts are cached per wav file, so re-running after a small edit only re-listens to changed beats.

The score is word-level similarity between the transcript and the closest of (spoken text, caption): the caption
carries digits and symbols (128, ==) that Whisper tends to output, the spoken text carries the words as read.
A low score means either the voice said something else or it pronounced a term so badly that Whisper heard
another word; both are worth a human listen.
"""
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

MODEL = "large-v3-turbo"   # small mishears English terms; turbo is accurate enough to judge the TTS


def pcm16k(path):
    """Decode with ffmpeg (avoids PyAV version issues): mono float32 at 16 kHz."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32)


DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]


def vi_number(n):
    """0..999 999 as read in the scripts: 16 'mười sáu', 21 'hai mươi mốt', 64 'sáu mươi tư', 404 'bốn trăm lẻ bốn',
    2160 'hai nghìn một trăm sáu mươi', 1050 'một nghìn không trăm năm mươi'."""
    if n >= 1000:
        thousands, rest = divmod(n, 1000)
        head = f"{vi_number(thousands)} nghìn"
        if rest == 0:
            return head
        return f"{head} " + (f"không trăm lẻ {DIGITS[rest]}" if rest < 10 else f"không trăm {vi_number(rest)}" if rest < 100 else vi_number(rest))
    if n < 10:
        return DIGITS[n]
    if n < 100:
        tens, unit = divmod(n, 10)
        head = "mười" if tens == 1 else f"{DIGITS[tens]} mươi"
        if unit == 0:
            return head
        tail = {1: "mốt" if tens > 1 else "một", 4: "tư" if tens > 1 else "bốn", 5: "lăm"}.get(unit, DIGITS[unit])
        return f"{head} {tail}"
    hundreds, rest = divmod(n, 100)
    if rest == 0:
        return f"{DIGITS[hundreds]} trăm"
    return f"{DIGITS[hundreds]} trăm " + (f"lẻ {DIGITS[rest]}" if rest < 10 else vi_number(rest))


def spell_numbers(text):
    """Whisper writes digits ("16", "0.75"); the scripts spell them out. Spell the transcript's digits the same way."""
    def one(m):
        token = m.group()
        if re.fullmatch(r"\d{1,3}(?:\.\d{3})+", token):  # Vietnamese thousands separator: 10.800
            token = token.replace(".", "")
        elif token.count(".") >= 2:  # version string such as 3.9.2: "ba chấm chín chấm hai"
            return " chấm ".join(vi_number(int(part)) for part in token.split("."))
        whole, _, frac = token.partition(".")
        out = vi_number(int(whole)) if int(whole) < 1_000_000 else whole
        return out + (" phẩy " + " ".join(DIGITS[int(d)] for d in frac) if frac else "")
    return re.sub(r"\d+(?:\.\d+)*", one, text)


# Old vs new Vietnamese tone placement ("xoá" vs "xóa") are the same word; Whisper prefers the new style.
TONE_STYLE = {"oà": "òa", "oá": "óa", "oả": "ỏa", "oã": "õa", "oạ": "ọa", "oè": "òe", "oé": "óe", "oẻ": "ỏe",
              "oẽ": "õe", "oẹ": "ọe", "uỳ": "ùy", "uý": "úy", "uỷ": "ủy", "uỹ": "ũy", "uỵ": "ụy"}


def words(text):
    # Split CamelCase first ("ArrayList" and "Array List" are the same words), then normalise case, digits, tones.
    text = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", text)
    text = unicodedata.normalize("NFC", spell_numbers(text.lower()))
    for old, new in TONE_STYLE.items():
        text = text.replace(old, new)
    text = re.sub(r"[^\w\s]", " ", text)
    return text.split()


def score(transcript, *references):
    """Word-level similarity against the closest reference. Character-level was tried and is too lenient:
    it scored "ArrayList" heard as "Raelis" at 0.93."""
    heard = words(transcript)
    best, missing = 0.0, []
    for ref in references:
        expected = words(ref)
        ratio = difflib.SequenceMatcher(None, expected, heard).ratio()
        if ratio > best:
            best = ratio
            missing = [w for w in expected if w not in heard]
    return round(best, 3), missing


def main(beats_file):
    beats_file = Path(beats_file)
    beats = json.loads(beats_file.read_text(encoding="utf-8"))
    out_file = beats_file.with_name("asr.json")
    # Cache key is path + modification time: a re-synthesised take (revoice.py) is always listened to again.
    old = json.loads(out_file.read_text(encoding="utf-8")) if out_file.exists() else []
    cache = {(e["wav"], e.get("mtime")): e["transcript"] for e in old}
    model = None
    results = []
    for b in beats:
        mtime = os.path.getmtime(b["wav"])
        transcript = cache.get((b["wav"], mtime))
        if transcript is None:
            if model is None:
                model = WhisperModel(MODEL, device="cpu", compute_type="int8")
            segments, _ = model.transcribe(pcm16k(b["wav"]), language="vi", beam_size=5)
            transcript = " ".join(s.text.strip() for s in segments)
        sim, missing = score(transcript, b["spoken"], b["caption"])
        results.append(dict(scene=b["scene"], t=b["t"], spoken=b["spoken"], transcript=transcript,
                            score=sim, missing=missing, wav=b["wav"], mtime=mtime))
    out_file.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1])
