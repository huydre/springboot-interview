#!/usr/bin/env bash
# Render one or more built video projects on another Linux machine, then copy the MP4s back into <project>/renders/.
# Build (TTS + index.html) and publish stay on this machine; only the slow HyperFrames render runs remotely.
#
#   RENDER_HOST=user@host video-kit/render-remote.sh index-video kafka-video
#
# The remote needs node/npx and ffmpeg on PATH (this script adds ~/.local/bin) plus Google Chrome.
# Auth: RENDER_KEY=<private key file>, the default SSH keys, or SSHPASS in the environment (sshpass -e, so the
# password never appears in argv or files). Every ssh/rsync step retries 3 times: password logins drop now and then.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${RENDER_HOST:?set RENDER_HOST=user@host}"
REMOTE_DIR="${RENDER_DIR:-lesson-render}"
HYPERFRAMES="hyperframes@0.9.41"   # same pin as pipeline.py
[ $# -gt 0 ] || { echo "usage: RENDER_HOST=user@host $0 <project>-video ..."; exit 2; }

SSH=(ssh -o ServerAliveInterval=30)
if [ -n "${RENDER_KEY:-}" ]; then SSH=(ssh -i "$RENDER_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o ServerAliveInterval=30)
elif [ -n "${SSHPASS:-}" ]; then SSH=(sshpass -e ssh -o PubkeyAuthentication=no -o ServerAliveInterval=30); fi
RSYNC_RSH="${SSH[*]}"

retry() {  # retry <cmd...>: up to 3 attempts, 5 s apart
  local n
  for n in 1 2 3; do "$@" && return 0; echo "   attempt $n failed: $1" >&2; sleep 5; done
  return 1
}

for project in "$@"; do
  [ -f "$project/index.html" ] || { echo "$project: run 'pipeline.py $project build' first"; exit 1; }
  name=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['name'])" "$project/video.json")
  echo "== $project → $RENDER_HOST:$REMOTE_DIR/$project"
  # The composition only plays assets/mix.wav; the voice and sfx stems stay here.
  retry rsync -az --delete -e "$RSYNC_RSH" \
    --exclude .tts --exclude .hyperframes --exclude renders --exclude __pycache__ \
    --exclude assets/voice.wav --exclude assets/sfx.wav \
    "$project" "$RENDER_HOST:$REMOTE_DIR/"
  start=$(date +%s)
  retry "${SSH[@]}" "$RENDER_HOST" "cd $REMOTE_DIR/$project && export PATH=\$HOME/.local/bin:\$PATH && \
    set -o pipefail; npx --yes $HYPERFRAMES render -o renders/$name.mp4 2>&1 | tail -4"
  mkdir -p "$project/renders"
  retry rsync -az -e "$RSYNC_RSH" "$RENDER_HOST:$REMOTE_DIR/$project/renders/$name.mp4" "$project/renders/"
  echo "   done in $(( $(date +%s) - start ))s → $project/renders/$name.mp4"
done
