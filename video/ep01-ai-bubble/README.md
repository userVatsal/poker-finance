# Episode 01 — Is AI a bubble? Follow the debt.

A 7–8 minute YouTube long-form for the dmuquant channel, written entirely in code like the Poker Finance intro film. The narration comes from ElevenLabs, and every animation is tied to the exact word the voice is saying, so the picture lands on the beat instead of drifting.

| File | What it is |
| --- | --- |
| `scenes.js` | The script: 13 scenes of narration, with chapter names and pauses. Edit words here. |
| `voice.py` | Sends the script to ElevenLabs, caches the audio, and writes the timeline the film syncs to. |
| `film.html` | The film itself, 1920 × 1080. Open it in Chrome to preview. |
| `render.py` | Turns the film + voice + sound effects into an MP4 ready for YouTube. |
| `fonts/` | Inter Tight and JetBrains Mono, so renders look the same on any machine. |

## Make the video (MacBook)

From the repo root:

```bash
# once
brew install ffmpeg
pip3 install playwright numpy
python3 -m playwright install chromium

# 1. Voice — about 6,300 ElevenLabs credits the first time, then only for scenes you change
export ELEVENLABS_API_KEY="sk_..."          # from your ElevenLabs account settings (API keys)
export ELEVENLABS_VOICE_ID="..."            # your voice (see below)
python3 video/ep01-ai-bubble/voice.py --dry-run   # check word count and credits first
python3 video/ep01-ai-bubble/voice.py

# 2. Check it: open video/ep01-ai-bubble/film.html in Chrome
#    (space = play/pause, ←/→ = 5 s, keys 1–9 jump to scenes). The bottom-left says "voice timings" once synced.
#    Play it next to audio/narration.wav to sanity-check, or just render a section:
python3 video/ep01-ai-bubble/render.py --preview --from 0 --to 60

# 3. Render the full film
python3 video/ep01-ai-bubble/render.py                       # → video/ep01-ai-bubble/out/ep01-ai-bubble.mp4
python3 video/ep01-ai-bubble/render.py --music bed.mp3       # with a music bed, auto-ducked under the voice
```

A full 1080p render uses several browsers in parallel (`--workers`, default: CPU cores minus 2). Expect very roughly 15–40 minutes on an M-series MacBook. Keep the laptop plugged in.

Never commit your API key. `audio/` and `out/` are git-ignored.

## The voice

The script is first person ("I'm starting a quant finance society…"), so it sounds most real in **your own voice**. In ElevenLabs, create an Instant Voice Clone from the Voices page: upload 1–3 minutes of clean speech (quiet room, phone close to your mouth, read something conversational), then copy its voice ID into `ELEVENLABS_VOICE_ID`.

Without a voice ID, `voice.py` falls back to a premade British narrator voice.

What makes it sound human rather than AI:

- **Model.** The default `eleven_multilingual_v2` is the steadiest for long narration and honours the `<break time="0.6s" />` pauses in the script. Try `--model eleven_v3` for more expressive delivery; break tags become ellipses there.
- **Settings** live at the top of `voice.py`: `stability 0.45`, `style 0.25`. Lower stability is more emotional but less consistent. If one scene sounds off, re-roll just that scene: `voice.py --only s09`.
- **Flow.** Each scene is sent with the text before and after it, so the intonation carries across cuts instead of resetting.
- **Pauses are deliberate.** Big numbers get a beat before them. Don't strip the break tags out.

## Music

Optional, and it should sit low. Pick a calm, minimal instrumental (pulsing synth or soft piano, no vocals) from the YouTube Audio Library or a track you've licensed, then pass it with `--music`. It loops, ducks automatically whenever the voice speaks, and the final mix is normalised to YouTube's −14 LUFS.

## Editing

| To change | Do this |
| --- | --- |
| Any spoken words | Edit `scenes.js`, re-run `voice.py` (only changed scenes are re-generated) |
| What appears on screen | The scene's function in `film.html` (`R.s01` … `R.s13`) |
| When something appears | It's keyed to a phrase, e.g. `B('twelve percent')`. If you reword the script, update the phrase too. A missing phrase shows a warning in the browser console. |
| Source line at the bottom | `SRC.s01` … `SRC.s13` in `film.html` |
| Sound effects | `SFX_MAP` in `film.html` (same sound types as the intro film) |

## Before you publish

- [ ] Re-check every figure against a fresh source. Facts are as of 16–17 October 2026; scene 12 mentions the Fed meeting on 27–28 October.
- [ ] Watch it once start to finish with sound, once on mute.
- [ ] Upload `captions.srt` as subtitles (YouTube Studio → Subtitles), rather than burning them in.
- [ ] Paste `chapters.txt` into the description. It's regenerated with real timestamps every time you run `voice.py`.
- [ ] Add a YouTube end screen in the last 6 seconds (the film holds on the closing card for it).

### Description template

```
On 16 October 2026 the Nasdaq fell 2.14% and a cloud company carrying roughly $50 billion of debt dropped 12%. I follow the debt to work out whether AI is a bubble.

▶ Play Poker Finance — poker against 37 bots that play like trading firms: https://dmu-poker-finance.vercel.app

[paste chapters.txt here]

Sources
TheStreet — Stock market today, 16 Oct 2026
Federal Reserve FOMC, 16 Sep 2026
Nasdaq Composite, Mar 2000 – Oct 2002

Not financial advice. Figures as of 16–17 October 2026.
DMU Quant Society · De Montfort University, Leicester · launching February 2027
```
