# Logo files

The DMU Quant Society **Signal** mark: 24 positions around a ring, every 15°. Twenty-three are off-white bars; the one at 4:30 is replaced by a longer red bar that breaks out of the ring and turns the O into a Q.

Every file here is generated from one geometry definition by `build_logo.py`, so they always match.

## Files

| File                                                | Use                                                            |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `logo-mark.svg`                                     | Master. Off-white and red on transparent, for dark backgrounds |
| `logo-mark-on-light.svg`                            | Black and red on transparent, for light backgrounds            |
| `logo-mark-mono-white.svg`                          | All off-white, for watermarks or single-colour printing        |
| `logo-mark-square.svg`                              | Mark on the brand black square                                 |
| `logo-mark-square-1024.png`, `-512.png`, `-400.png` | Profile pictures (LinkedIn, Instagram, GitHub, Vercel)         |
| `logo-mark-1024.png`                                | Transparent PNG for slides and documents                       |
| `github-social-preview.png`                         | 1280 × 640 image for GitHub → Settings → Social preview        |

The website's icons live in `public/`: `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png` (LinkedIn preview card) and `site.webmanifest`.

## Colours

| Name       | Hex       |
| ---------- | --------- |
| Black      | `#0e0e0c` |
| Off-white  | `#f2f0eb` |
| Signal red | `#e5251b` |

## Geometry (400 × 400 box, centre 200, 200)

| Part            | Width | From radius | To radius | Angle                    |
| --------------- | ----- | ----------- | --------- | ------------------------ |
| Ring bars (×23) | 18    | 85          | 138       | every 15°, skipping 135° |
| Red bar         | 22.6  | 63.6        | 173.2     | 135°                     |

Square corners on every bar. The same numbers are used in `src/ui/Logo.tsx` and `video/intro.html`.

## Rules

- Keep clear space of at least one bar length (53 units) around the mark.
- Never recolour the red bar, rotate the mark or change the bar count.
- On light backgrounds use `logo-mark-on-light.svg`.

## Rebuilding

```bash
pip3 install playwright pillow
python3 -m playwright install chromium
python3 brand/build_logo.py
```
