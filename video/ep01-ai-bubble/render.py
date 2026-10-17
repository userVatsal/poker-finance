#!/usr/bin/env python3
"""
Render Episode 01 to MP4: 1920 × 1080, 30 fps, H.264 + AAC, loudness-normalised for YouTube.

Run voice.py first so the picture locks to the ElevenLabs narration. Without it, this renders a
silent cut on estimated timings (useful for checking visuals).

Usage:
  python3 video/ep01-ai-bubble/render.py                      # full film → out/ep01-ai-bubble.mp4
  python3 video/ep01-ai-bubble/render.py --music bed.mp3      # add a music bed, auto-ducked under the voice
  python3 video/ep01-ai-bubble/render.py --preview            # quick 960×540, 24 fps draft
  python3 video/ep01-ai-bubble/render.py --still 42.5         # one PNG frame at 42.5 s
  python3 video/ep01-ai-bubble/render.py --from 120 --to 180  # render just a section
  python3 video/ep01-ai-bubble/render.py --workers 6           # parallel browsers (default: cores − 2)

Requires (macOS): brew install ffmpeg · pip3 install playwright numpy · python3 -m playwright install chromium
"""
import argparse
import multiprocessing as mp
import os
import pathlib
import subprocess
import sys
import wave

import numpy as np
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from render import sfx, SR  # reuse the intro film's synthesised sound effects  # noqa: E402

NARRATION = HERE / "audio" / "narration.wav"


def build_sfx(cues, duration, path, t_from=0.0):
    track = np.zeros(int((duration + 3) * SR))
    for i, cue in enumerate(cues):
        t = cue["t"] - t_from
        if t < 0 or t > duration:
            continue
        s = sfx(cue["type"], i)
        o = int(t * SR)
        track[o : o + len(s)] += s[: len(track) - o]
    track = track[: int(duration * SR)]
    peak = np.max(np.abs(track)) or 1
    track = track / peak * 0.5
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((track * 32767).astype(np.int16).tobytes())


def mix_audio(sfx_wav, music, out_wav, t_from, duration):
    """Voice at full level, SFX well underneath, optional music ducked under the voice. -14 LUFS."""
    have_voice = NARRATION.exists()
    inputs, filters, labels = [], [], []
    idx = 0
    if have_voice:
        inputs += ["-ss", str(t_from), "-t", str(duration), "-i", str(NARRATION)]
        filters.append(f"[{idx}:a]aformat=channel_layouts=mono,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,asplit=2[voice][key]")
        labels.append("[voice]")
        idx += 1
    inputs += ["-i", str(sfx_wav)]
    filters.append(f"[{idx}:a]volume={0.22 if have_voice else 0.6}[fx]")
    labels.append("[fx]")
    idx += 1
    if music:
        inputs += ["-stream_loop", "-1", "-ss", str(t_from), "-t", str(duration), "-i", str(music)]
        filters.append(f"[{idx}:a]aformat=channel_layouts=mono,volume=0.35[mus]")
        if have_voice:
            filters.append("[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[ducked]")
            labels.append("[ducked]")
        else:
            labels.append("[mus]")
        idx += 1
    elif have_voice:
        filters.append("[key]anullsink")
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filters),
         "-map", "[out]", "-ac", "2", "-t", str(duration), str(out_wav)],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--out", default=str(HERE / "out" / "ep01-ai-bubble.mp4"))
    ap.add_argument("--music", help="Optional music bed (mp3/wav). It loops and ducks under the voice.")
    ap.add_argument("--preview", action="store_true", help="Fast 960×540, 24 fps draft")
    ap.add_argument("--still", type=float)
    ap.add_argument("--from", dest="t_from", type=float, default=0.0)
    ap.add_argument("--to", dest="t_to", type=float)
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2) - 2),
                    help="Parallel browsers (default: CPU cores minus 2)")
    args = ap.parse_args()

    scale = 0.5 if args.preview else 1.0
    fps = 24 if args.preview else args.fps
    out = pathlib.Path(args.out)
    if args.preview and args.out == ap.get_default("out"):
        out = out.with_name("ep01-ai-bubble-preview.mp4")
    out.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser, page = open_page(p, scale)
        stage = page.locator("#stage")
        if not page.evaluate("TL.real"):
            print("No timeline.js yet: using estimated timings and no voice. Run voice.py first for the real cut.",
                  file=sys.stderr)
        if args.still is not None:
            page.evaluate(f"seek({args.still})")
            png = out.with_name(f"frame-{args.still:07.2f}.png")
            stage.screenshot(path=str(png))
            print(png)
            browser.close()
            return
        total = page.evaluate("DURATION")
        cues = page.evaluate("SFX")
        browser.close()

    t_from = max(0.0, args.t_from)
    t_to = min(total, args.t_to) if args.t_to else total
    duration = t_to - t_from
    frames = int(duration * fps)

    sfx_wav = out.with_name("_sfx.wav")
    mix_wav = out.with_name("_mix.wav")
    build_sfx(cues, duration, sfx_wav, t_from)
    mix_audio(sfx_wav, args.music, mix_wav, t_from, duration)

    # Split the frames across workers, each with its own headless browser.
    n = max(1, min(args.workers, frames // fps or 1))
    bounds = [round(frames * k / n) for k in range(n + 1)]
    segs = [out.with_name(f"_seg{k:02}.mp4") for k in range(n)]
    jobs = [(k, bounds[k], bounds[k + 1], t_from, fps, scale, args.preview, str(segs[k])) for k in range(n)]
    print(f"Rendering {frames} frames ({duration:.0f} s) with {n} worker(s)…", file=sys.stderr)
    with mp.get_context("spawn").Pool(n) as pool:
        for _ in pool.imap_unordered(render_segment, jobs):
            pass

    concat = out.with_name("_concat.txt")
    concat.write_text("".join(f"file '{sg.name}'\n" for sg in segs))
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat),
        "-i", str(mix_wav), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(out),
    ], check=True, cwd=str(out.parent))
    for f in [sfx_wav, mix_wav, concat, *segs]:
        f.unlink(missing_ok=True)
    print(f"\nWrote {out}", file=sys.stderr)


def open_page(p, scale):
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=scale)
    page.goto((HERE / "film.html").as_uri() + "#render")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(400)
    return browser, page


def render_segment(job):
    k, a, b, t_from, fps, scale, preview, seg = job
    ff = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
        "-c:v", "libx264", "-preset", "veryfast" if preview else "slow",
        "-crf", "23" if preview else "17", "-pix_fmt", "yuv420p", "-r", str(fps), seg,
    ], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        browser, page = open_page(p, scale)
        stage = page.locator("#stage")
        for i in range(a, b):
            page.evaluate(f"seek({t_from + i / fps})")
            ff.stdin.write(stage.screenshot(type="jpeg", quality=95))
            if k == 0 and (i - a) % fps == 0:
                done = (i - a) / max(1, b - a)
                print(f"\r  {done:5.1%} of worker 1's share", end="", file=sys.stderr, flush=True)
        browser.close()
    ff.stdin.close()
    ff.wait()
    return k


if __name__ == "__main__":
    main()
