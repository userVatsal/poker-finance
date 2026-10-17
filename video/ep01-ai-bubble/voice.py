#!/usr/bin/env python3
"""
Generate the narration for Episode 01 with ElevenLabs, then build the timeline the film syncs to.

What it does:
  1. Sends each scene in scenes.js to ElevenLabs' text-to-speech "with-timestamps" endpoint.
     Neighbouring scenes are passed as previous_text / next_text so the voice flows across cuts.
  2. Caches every clip by a hash of (text, voice, model, settings), so re-running only pays for
     scenes you changed.
  3. Lays the clips out with breathing room between scenes and writes:
       audio/narration.wav   the full voice track (48 kHz mono)
       timeline.js           scene start times + per-character timings (film.html reads this)
       captions.srt          subtitles to upload to YouTube
       chapters.txt          YouTube chapter list to paste into the description

Setup (once):
  export ELEVENLABS_API_KEY="..."         # elevenlabs.io → Profile → API keys
  export ELEVENLABS_VOICE_ID="..."        # your cloned voice (recommended, the script says "I"),
                                          # or any voice from your ElevenLabs library
Usage:
  python3 video/ep01-ai-bubble/voice.py              # generate (uses cache)
  python3 video/ep01-ai-bubble/voice.py --dry-run    # show scenes, character count, no API calls
  python3 video/ep01-ai-bubble/voice.py --only s09   # regenerate just one scene
  python3 video/ep01-ai-bubble/voice.py --model eleven_v3

Requires: Python 3.9+, numpy, ffmpeg (brew install ffmpeg). No other packages.
"""
import argparse
import base64
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.request
import wave

import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
AUDIO = HERE / "audio"
CACHE = AUDIO / "cache"
SR = 48000

PRE_ROLL = 0.9      # seconds of picture before the first word
GAP = 0.55          # breath between scenes
TAIL = 1.5          # picture after the last word

# A British documentary premade voice ("George") as a fallback if no voice ID is set.
# Swap for your own clone: first-person narration sounds far more real in your own voice.
FALLBACK_VOICE = "JBFqnCBsd6RMkjVDRZzb"

# Long-form narration settings: steady but not flat. Lower stability = more expressive,
# but also more takes that drift. These are a good starting point for documentary pacing.
VOICE_SETTINGS = {
    "stability": 0.45,
    "similarity_boost": 0.8,
    "style": 0.25,
    "use_speaker_boost": True,
    "speed": 1.0,
}

BREAK_RE = re.compile(r'<break\s+time="([\d.]+)s"\s*/>')


def load_scenes():
    src = (HERE / "scenes.js").read_text(encoding="utf-8")
    body = src[src.index("[") : src.rindex("]") + 1]
    return json.loads(body)


def plain(text):
    """Text without break tags, as a viewer would read it."""
    return re.sub(r"\s+", " ", BREAK_RE.sub(" ", text)).strip()


def for_model(text, model):
    # eleven_v3 doesn't take SSML break tags; it reads ellipses and dashes as pauses instead.
    if "v3" in model:
        return re.sub(r"\s+", " ", BREAK_RE.sub(" … ", text)).strip()
    return text


def tts(text, prev_text, next_text, voice, model, key):
    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps"
        "?output_format=mp3_44100_192"
    )
    payload = {
        "text": text,
        "model_id": model,
        "voice_settings": VOICE_SETTINGS,
    }
    if prev_text:
        payload["previous_text"] = prev_text
    if next_text:
        payload["next_text"] = next_text
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:500]
        sys.exit(f"ElevenLabs returned {e.code}: {detail}")


def mp3_to_samples(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def trim_silence(x, thresh=0.01):
    """Drop leading/trailing near-silence so scene gaps are consistent. Returns (samples, offset_s)."""
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x, 0.0
    a = max(0, idx[0] - int(0.03 * SR))
    b = min(len(x), idx[-1] + int(0.12 * SR))
    return x[a:b], a / SR


def words_from_alignment(chars, starts, ends):
    words, cur, t0, t1 = [], "", None, None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                words.append((cur, t0, t1))
            cur, t0 = "", None
            continue
        if t0 is None:
            t0 = s
        cur += c
        t1 = e
    if cur:
        words.append((cur, t0, t1))
    # Drop pieces of break tags if a model echoes them back.
    return [w for w in words if not re.match(r'^(<break|time=|/>)', w[0])]


def srt_time(t):
    h, rem = divmod(max(0.0, t), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02}:{int(m):02}:{int(s):02},{int(round((s % 1) * 1000)) % 1000:03}"


def write_srt(scenes_out, path):
    lines, cues = [], []
    for sc in scenes_out:
        cur, c0, c1 = [], None, None
        for w, t0, t1 in sc["words"]:
            t0 += sc["start"]
            t1 += sc["start"]
            if c0 is None:
                c0 = t0
            cur.append(w)
            c1 = t1
            text = " ".join(cur)
            if len(text) >= 38 or (c1 - c0) > 3.2 or w.endswith((".", "?", "!")) or (w.endswith(",") and len(text) >= 22):
                cues.append((c0, c1, text))
                cur, c0 = [], None
        if cur:
            cues.append((c0, c1, " ".join(cur)))
    for i, (a, b, text) in enumerate(cues, 1):
        lines += [str(i), f"{srt_time(a)} --> {srt_time(b)}", text, ""]
    path.write_text("\n".join(lines), encoding="utf-8")


def write_chapters(scenes_out, path):
    out, last = [], None
    for sc in scenes_out:
        if sc["chapter"] != last:
            t = 0 if not out else sc["start"]
            m, s = divmod(int(t), 60)
            out.append(f"{m}:{s:02} {sc['chapter']}")
            last = sc["chapter"]
    path.write_text("\n".join(out) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default=os.environ.get("ELEVENLABS_VOICE_ID", ""))
    ap.add_argument("--model", default="eleven_multilingual_v2")
    ap.add_argument("--only", help="Regenerate one scene id (e.g. s09), ignoring its cache")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    scenes = load_scenes()
    total_chars = sum(len(for_model(s["text"], args.model)) for s in scenes)
    words = sum(len(plain(s["text"]).split()) for s in scenes)
    print(f"{len(scenes)} scenes · {words} words · {total_chars} characters "
          f"(≈ {total_chars} ElevenLabs credits on a first run) · ~{words / 150:.1f} min")
    if args.dry_run:
        for s in scenes:
            print(f"  {s['id']}  {len(plain(s['text']).split()):>4} words  {s['chapter']}")
        return

    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("Set ELEVENLABS_API_KEY first (see the top of this file).")
    voice = args.voice or FALLBACK_VOICE
    if not args.voice:
        print("No ELEVENLABS_VOICE_ID set, using the fallback British narrator voice.")

    CACHE.mkdir(parents=True, exist_ok=True)
    clips = []
    for i, s in enumerate(scenes):
        text = for_model(s["text"], args.model)
        prev_text = plain(scenes[i - 1]["text"]) if i > 0 else ""
        next_text = plain(scenes[i + 1]["text"]) if i + 1 < len(scenes) else ""
        h = hashlib.sha256(
            json.dumps([text, voice, args.model, VOICE_SETTINGS]).encode()
        ).hexdigest()[:16]
        mp3, meta = CACHE / f"{s['id']}-{h}.mp3", CACHE / f"{s['id']}-{h}.json"
        if args.only == s["id"] or not mp3.exists():
            print(f"  {s['id']}: generating…", flush=True)
            res = tts(text, prev_text, next_text, voice, args.model, key)
            mp3.write_bytes(base64.b64decode(res["audio_base64"]))
            meta.write_text(json.dumps(res.get("alignment") or res.get("normalized_alignment")))
        else:
            print(f"  {s['id']}: cached")
        clips.append((s, mp3, json.loads(meta.read_text())))

    # Lay the clips out on one track.
    t = PRE_ROLL
    track_parts, scenes_out = [], []
    for s, mp3, al in clips:
        x, offset = trim_silence(mp3_to_samples(mp3))
        dur = len(x) / SR
        starts = [round(v - offset, 3) for v in al["character_start_times_seconds"]]
        ends = [round(v - offset, 3) for v in al["character_end_times_seconds"]]
        chars = al["characters"]
        scenes_out.append({
            "id": s["id"], "chapter": s["chapter"], "start": round(t, 3), "dur": round(dur, 3),
            "hold": s.get("hold", 0), "text": "".join(chars), "t": starts,
            "words": words_from_alignment(chars, starts, ends),
        })
        track_parts.append((t, x))
        t += dur + GAP + s.get("hold", 0)
    duration = t - GAP + TAIL

    track = np.zeros(int(duration * SR) + SR, dtype=np.float32)
    for start, x in track_parts:
        o = int(start * SR)
        track[o : o + len(x)] += x
    track = track[: int(duration * SR)]
    AUDIO.mkdir(exist_ok=True)
    with wave.open(str(AUDIO / "narration.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(track, -1, 1) * 32767).astype(np.int16).tobytes())

    timeline = {"duration": round(duration, 3), "scenes": [
        {k: v for k, v in sc.items() if k != "words"} for sc in scenes_out
    ]}
    (HERE / "timeline.js").write_text(
        "// Generated by voice.py. Do not edit; re-run voice.py instead.\n"
        f"window.TIMELINE = {json.dumps(timeline, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    write_srt(scenes_out, HERE / "captions.srt")
    write_chapters(scenes_out, HERE / "chapters.txt")
    m, sec = divmod(int(duration), 60)
    print(f"Done: {m}:{sec:02} of narration → audio/narration.wav, timeline.js, captions.srt, chapters.txt")


if __name__ == "__main__":
    main()
