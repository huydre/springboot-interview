#!/usr/bin/env python3
"""Stand-in for the TTS interpreter that runs VieNeu on the render machine instead of this Mac.

build.py calls `$VIENEU_PYTHON vieneu_synth.py jobs.json`; point VIENEU_PYTHON at this file and the same call
uploads the jobs, synthesises them in the remote `~/lesson-render/.tts-env` (same vieneu version as here), and
copies the WAVs back to the paths build.py expects. Cache keys and outputs are unchanged.

    RENDER_HOST=user@host RENDER_KEY=~/.ssh/key VIENEU_PYTHON=video-kit/remote_tts.py \\
        python3 video-kit/pipeline.py <project> build
"""
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

HOST = os.environ.get("RENDER_HOST") or sys.exit("set RENDER_HOST=user@host")
KEY = os.environ.get("RENDER_KEY")
REMOTE_BASE = os.environ.get("RENDER_DIR", "lesson-render")
SSH = ["ssh", "-o", "ServerAliveInterval=30", "-o", "BatchMode=yes"] + (["-i", KEY, "-o", "IdentitiesOnly=yes"] if KEY else [])


def run(args, attempts=3):
    for n in range(1, attempts + 1):
        if subprocess.run(args).returncode == 0:
            return
        print(f"remote_tts: attempt {n} failed: {args[0]}", file=sys.stderr)
    sys.exit(f"remote_tts: giving up on {' '.join(args[:2])}")


def main(synth_script, job_file):
    spec = json.loads(Path(job_file).read_text(encoding="utf-8"))
    todo = [j for j in spec["jobs"] if not os.path.exists(j["out"])]
    if not todo:
        return
    # One remote folder per local cache folder, so two projects never mix their WAVs.
    tag = hashlib.sha1(str(Path(job_file).parent.resolve()).encode()).hexdigest()[:12]
    remote = f"{REMOTE_BASE}/tts-jobs/{tag}"
    remote_spec = dict(voice=spec["voice"], jobs=[dict(text=j["text"], out=Path(j["out"]).name) for j in todo])
    local_spec = Path(job_file).with_name("jobs.remote.json")
    local_spec.write_text(json.dumps(remote_spec, ensure_ascii=False), encoding="utf-8")

    rsh = " ".join(SSH)
    run(SSH + [HOST, f"mkdir -p {remote}"])
    run(["rsync", "-az", "-e", rsh, synth_script, str(local_spec), f"{HOST}:{remote}/"])
    # Relative `out` names resolve inside the remote folder because the synth runs with that cwd.
    run(SSH + [HOST, f"cd {remote} && ~/{REMOTE_BASE}/.tts-env/bin/python {Path(synth_script).name} jobs.remote.json"], attempts=2)
    # The remote folder only ever holds this project's cache WAVs, so copying all of them back is safe.
    run(["rsync", "-az", "-e", rsh, f"{HOST}:{remote}/*.wav", str(Path(job_file).parent) + "/"])
    local_spec.unlink(missing_ok=True)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
