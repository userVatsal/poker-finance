# Intro video

A 30-second, 1080 × 1080 launch film for Poker Finance, written entirely in code so anyone can edit the words and re-render it.

The approach follows the "product launch motion film" style from [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos): one story told with the game's real UI, kinetic type, spring easing, camera pans instead of crossfades, and one soft sound per element that appears.

## Storyboard

| Time        | Scene         | On screen                                                                                                       |
| ----------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| 0–4.6 s     | Hook          | Signal mark draws itself, `dmu/quant_` types in, "Can you beat Wall Street at poker?"                           |
| 4.6–11.2 s  | The opponents | 37 firm chips pop in, then fly into six trading-style tiles that count them up                                  |
| 11.2–19.6 s | How they play | Optiver (earning the spread), Millennium (drawdown limit), Renaissance (Kelly criterion), each with a desk note |
| 19.6–25.6 s | The maths     | Real table UI: cards deal, win chance counts to 61%, cursor clicks Call, river, "You win"                       |
| 25.6–30 s   | Logo reveal   | Poker Finance, free · play money · no sign-up, the URL, society credit                                          |

Square format plays well in the LinkedIn feed. The film is readable with the sound off, since LinkedIn autoplays muted.

## Preview

Open `video/intro.html` in Chrome. It loops.

## Render

```bash
brew install ffmpeg
pip3 install playwright numpy
python3 -m playwright install chromium

python3 video/render.py            # → video/out/poker-finance-intro.mp4 (about 2 minutes)
python3 video/render.py --still 14 # one PNG frame at 14 s, for checking a change
python3 video/render.py --silent   # no sound effects
```

## Editing

| To change                              | Edit in `intro.html`                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| Headline words                         | Scene 1 markup (`#w0` to `#w4`)                                                      |
| Firms shown                            | `FIRMS`                                                                              |
| The three example plays and desk notes | `PLAYS`                                                                              |
| Scene timing                           | `T` and the start times inside `seek()`                                              |
| URL on the end card                    | `#url5`                                                                              |
| Sounds                                 | `SFX` cue list (types: tick, pop, hit, swish, whoosh, chip, card, click, win, chime) |

If the live URL changes from `poker-finance.vercel.app`, update `#url5` and re-render.

Fonts (Inter Tight, JetBrains Mono) are bundled in `video/fonts/` under the SIL Open Font License, so renders look identical on any machine.
