#!/usr/bin/env python3
"""
Render video/intro.html to an MP4 (1080x1080, 30 fps, H.264 + AAC).

How it works:
  1. Opens intro.html in headless Chromium with #render, so it doesn't autoplay.
  2. For every frame, calls seek(t) and screenshots the stage.
  3. Pipes frames into ffmpeg.
  4. Synthesises soft sound effects from the page's SFX cue list and mixes them in.

Requirements (macOS):
  brew install ffmpeg
  pip3 install playwright numpy
  python3 -m playwright install chromium

Usage:
  python3 video/render.py                 # writes video/out/poker-finance-intro.mp4
  python3 video/render.py --fps 60 --out my.mp4
  python3 video/render.py --still 12.8    # single PNG frame at 12.8 s, for checking
"""
import argparse
import math
import pathlib
import subprocess
import sys
import wave

import numpy as np
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
SR = 48000


# ---------------------------------------------------------------- audio
def env(n, attack=0.004, decay=0.12):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def tone(freq, dur, decay, gain=1.0, partials=((1, 1.0),)):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = sum(w * np.sin(2 * math.pi * freq * k * t) for k, w in partials)
    return gain * sig * env(n, decay=decay)


def noise(dur, decay, gain=1.0, smooth=1, seed=0):
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    if smooth > 1:
        x = np.convolve(x, np.ones(smooth) / smooth, mode="same")
    return gain * x * env(n, decay=decay)


def sweep_noise(dur, gain, seed, rising=True):
    """Soft whoosh: noise whose brightness changes over time, with a bell-shaped envelope."""
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    y = 0.0
    for i in range(n):
        p = i / n
        a = 0.02 + 0.25 * (p if rising else 1 - p)  # one-pole low-pass coefficient
        y += a * (x[i] - y)
        out[i] = y
    shape = np.sin(np.linspace(0, math.pi, n)) ** 2
    return gain * out * shape


def mix(*sigs):
    """Sum signals of different lengths."""
    out = np.zeros(max(len(x) for x in sigs))
    for x in sigs:
        out[: len(x)] += x
    return out


def sfx(kind, seed):
    if kind == "tick":
        return mix(tone(2200, 0.06, 0.012, 0.18), noise(0.03, 0.006, 0.05, 2, seed))
    if kind == "pop":
        return tone(520, 0.18, 0.05, 0.28, ((1, 1), (2, 0.25)))
    if kind == "hit":
        return mix(tone(110, 0.5, 0.16, 0.55, ((1, 1), (2, 0.3))), noise(0.12, 0.03, 0.12, 6, seed))
    if kind == "swish":
        return sweep_noise(0.35, 0.22, seed, rising=True)
    if kind == "whoosh":
        return sweep_noise(0.6, 0.3, seed, rising=False)
    if kind == "chip":
        a = noise(0.05, 0.008, 0.25, 2, seed)
        b = np.concatenate([np.zeros(int(0.045 * SR)), noise(0.05, 0.008, 0.18, 2, seed + 1)])
        return mix(a, b, tone(3100, 0.08, 0.02, 0.06))
    if kind == "card":
        return mix(noise(0.09, 0.02, 0.28, 3, seed), tone(900, 0.05, 0.01, 0.04))
    if kind == "click":
        return mix(tone(1600, 0.05, 0.01, 0.3), noise(0.02, 0.004, 0.15, 1, seed))
    if kind == "win":
        out = np.zeros(int(1.4 * SR))
        for i, f in enumerate((523.25, 659.25, 783.99, 1046.5)):  # C major arpeggio
            s = tone(f, 1.0, 0.35, 0.16, ((1, 1), (2, 0.2), (3, 0.08)))
            o = int(i * 0.07 * SR)
            out[o : o + len(s)] += s
        return out
    if kind == "chime":
        return tone(880, 2.0, 0.6, 0.18, ((1, 1), (2.76, 0.35), (5.4, 0.12)))
    raise ValueError(kind)


def build_audio(cues, duration, path):
    track = np.zeros(int((duration + 2) * SR))
    for i, cue in enumerate(cues):
        s = sfx(cue["type"], i)
        o = int(cue["t"] * SR)
        track[o : o + len(s)] += s[: len(track) - o]
    track = track[: int(duration * SR)]
    # Fade out the last half second and normalise to -3 dBFS peak.
    fade = int(0.5 * SR)
    track[-fade:] *= np.linspace(1, 0, fade)
    peak = np.max(np.abs(track)) or 1
    track = track / peak * 0.7
    stereo = np.repeat((track * 32767).astype(np.int16)[:, None], 2, axis=1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


# ---------------------------------------------------------------- video
def open_page(p):
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1080, "height": 1080}, device_scale_factor=1)
    page.goto((HERE / "intro.html").as_uri() + "#render")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(300)
    return browser, page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--out", default=str(HERE / "out" / "poker-finance-intro.mp4"))
    ap.add_argument("--still", type=float, help="Render a single frame at this time (seconds) to PNG")
    ap.add_argument("--silent", action="store_true", help="Skip the sound effects")
    args = ap.parse_args()

    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser, page = open_page(p)
        stage = page.locator("#stage")

        if args.still is not None:
            page.evaluate(f"seek({args.still})")
            png = out.with_name(f"frame-{args.still:05.2f}.png")
            stage.screenshot(path=str(png))
            print(png)
            browser.close()
            return

        duration = page.evaluate("DURATION")
        cues = page.evaluate("SFX")
        frames = int(duration * args.fps)

        audio = out.with_suffix(".wav")
        if not args.silent:
            build_audio(cues, duration, audio)

        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "image2pipe", "-framerate", str(args.fps), "-i", "-",
        ]
        if not args.silent:
            cmd += ["-i", str(audio)]
        cmd += [
            "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
        ]
        if not args.silent:
            cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest"]
        cmd += [str(out)]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)

        for i in range(frames):
            page.evaluate(f"seek({i / args.fps})")
            ff.stdin.write(stage.screenshot(type="png"))
            if i % args.fps == 0:
                print(f"\r{i // args.fps:>3}s / {int(duration)}s", end="", file=sys.stderr, flush=True)
        ff.stdin.close()
        ff.wait()
        browser.close()
        if audio.exists():
            audio.unlink()
        print(f"\nWrote {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
