"""Synthesise voiceover lines with local VieNeu-TTS.

Usage: <python-with-vieneu> vieneu_synth.py jobs.json
jobs.json = {"voice": "Hải Đăng", "jobs": [{"text": "...", "out": "/abs/path.wav"}, ...]}
Loads the model once, writes each WAV atomically, skips outputs that already exist.
"""
import json
import os
import sys

from vieneu import Vieneu


def main(job_file):
    spec = json.loads(open(job_file, encoding="utf-8").read())
    todo = [j for j in spec["jobs"] if not os.path.exists(j["out"])]
    if not todo:
        return
    tts = Vieneu()
    for i, job in enumerate(todo, 1):
        audio = tts.infer(job["text"], voice=spec["voice"])
        tmp = job["out"] + ".tmp.wav"
        tts.save(audio, tmp)
        os.replace(tmp, job["out"])
        print(f"[{i}/{len(todo)}] {os.path.basename(job['out'])}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1])
