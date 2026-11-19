"""Re-synthesise the narration beats that qc-voice flagged and keep the best take.

VieNeu sampling varies between runs: the same sentence can come out clean once and slurred the next time
("ArrayList" heard as "Aurelis"). For every beat in <project>/.tts/asr.json scoring below the threshold, this
synthesises up to TAKES new takes, scores each with Whisper exactly like asr_check.py, and keeps the best one
in place of the cached wav (same path, so build.py picks it up). Run build afterwards to re-assemble the voice.

A beat is also flagged when its script contains one of the optional must-hear terms but the transcript does not;
takes that are heard saying every such term win over takes that score higher without them.

Usage: <python-with-vieneu-and-faster-whisper> revoice.py <project>/.tts/asr.json <threshold> [term,term,...]
"""
import json
import os
import shutil
import sys
from pathlib import Path

from faster_whisper import WhisperModel
from vieneu import Vieneu

from asr_check import MODEL, pcm16k, score

TAKES = 4
VOICE = "Hải Đăng"


def transcribe(model, wav):
    segments, _ = model.transcribe(pcm16k(wav), language="vi", beam_size=5)
    return " ".join(s.text.strip() for s in segments)


def heard_all(terms, spoken, heard):
    """True when every must-hear term in the script also appears in the transcript.
    A term may list accepted hearings after the scripted word: "heap|hip" triggers on "heap", accepts "heap" or "hip"."""
    for term in terms:
        alts = term.split("|")
        if alts[0] in spoken.lower() and not any(a in heard.lower() for a in alts):
            return False
    return True


def main(asr_file, threshold, must=""):
    asr_file, threshold = Path(asr_file), float(threshold)
    terms = [t.strip().lower() for t in must.split(",") if t.strip()]
    results = json.loads(asr_file.read_text(encoding="utf-8"))
    beats = {b["wav"]: b for b in json.loads(asr_file.with_name("beats.json").read_text(encoding="utf-8"))}
    flagged = [r for r in results if r["score"] < threshold or not heard_all(terms, r["spoken"], r["transcript"])]
    if not flagged:
        print("revoice: nothing below threshold")
        return
    tts, model = Vieneu(), WhisperModel(MODEL, device="cpu", compute_type="int8")
    for r in flagged:
        best_score, best_text = r["score"], r["transcript"]
        best_key = (heard_all(terms, r["spoken"], best_text), best_score)
        caption = beats[r["wav"]]["caption"]
        for take in range(1, TAKES + 1):
            candidate = r["wav"] + f".take{take}.wav"
            tts.save(tts.infer(r["spoken"], voice=VOICE), candidate)
            heard = transcribe(model, candidate)
            sim, _ = score(heard, r["spoken"], caption)
            key = (heard_all(terms, r["spoken"], heard), sim)
            print(f"  take {take}: {sim:.2f}{'' if key[0] else ' (missing term)'}  {heard}", flush=True)
            if key > best_key:
                best_key, best_score, best_text = key, sim, heard
                shutil.copyfile(candidate, r["wav"])
            os.remove(candidate)
            if best_key[0] and best_score >= 0.95:
                break
        print(f"[{r['score']:.2f} -> {best_score:.2f}] {r['spoken']}\n    kept: {best_text}", flush=True)
        r.update(score=best_score, transcript=best_text, mtime=os.path.getmtime(r["wav"]))
    asr_file.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main(*sys.argv[1:4])
