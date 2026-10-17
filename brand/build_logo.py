#!/usr/bin/env python3
"""
Builds every DMU Quant Society logo asset from one geometry definition.

The mark ("Signal"): 24 positions every 15 degrees around a ring. 23 are
off-white bars; the position at 135 degrees (4:30 on a clock) is replaced by
a longer red bar that breaks out of the ring and turns the O into a Q.

Geometry is in a 400 x 400 box, centre (200, 200), measured from the master
artwork:
  ring bars : 18 wide, from radius 85 to 138
  red bar   : 22.6 wide, from radius 63.6 to 173.2, at 135 degrees

Run:  python3 brand/build_logo.py
Needs: pip3 install playwright  &&  python3 -m playwright install chromium
"""
import pathlib
import subprocess

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "brand"
PUBLIC = ROOT / "public"

BG = "#0e0e0c"
INK = "#f2f0eb"
RED = "#e5251b"
BLACK = "#0e0e0c"

BAR_W, R_IN, R_OUT = 18, 85, 138
RED_W, RED_IN, RED_OUT = 22.6, 63.6, 173.2
STEP, GAP_AT = 15, 135


def mark_svg(ink=INK, red=RED, bg=None, size=None, rounded=0, pad=0):
    """Return the mark as an SVG string. `pad` adds breathing room (in 400-box units)."""
    vb = f"{-pad} {-pad} {400 + 2 * pad} {400 + 2 * pad}"
    dims = f' width="{size}" height="{size}"' if size else ""
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"{dims}>']
    if bg:
        parts.append(
            f'<rect x="{-pad}" y="{-pad}" width="{400 + 2 * pad}" height="{400 + 2 * pad}" rx="{rounded}" fill="{bg}"/>'
        )
    parts.append(f'<g fill="{ink}">')
    for k in range(24):
        angle = k * STEP
        if angle == GAP_AT:
            continue
        parts.append(
            f'<rect x="{200 - BAR_W / 2}" y="{200 - R_OUT}" width="{BAR_W}" height="{R_OUT - R_IN}" '
            f'transform="rotate({angle} 200 200)"/>'
        )
    parts.append("</g>")
    # Drawn pointing straight down (180 deg), then rotated back 45 deg to 135 deg.
    parts.append(
        f'<rect x="{200 - RED_W / 2}" y="{200 + RED_IN}" width="{RED_W}" height="{RED_OUT - RED_IN}" '
        f'fill="{red}" transform="rotate(-45 200 200)"/>'
    )
    parts.append("</svg>")
    return "".join(parts)


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text + "\n")
    print("wrote", path.relative_to(ROOT))


def render_png(page, svg_text, path, size):
    page.set_viewport_size({"width": size, "height": size})
    page.set_content(
        f'<html><body style="margin:0;background:transparent">'
        f'<div style="width:{size}px;height:{size}px">{svg_text.replace("<svg ", f"<svg width=\'{size}\' height=\'{size}\' ", 1)}</div>'
        f"</body></html>"
    )
    page.screenshot(path=str(path), omit_background=True, clip={"x": 0, "y": 0, "width": size, "height": size})
    print("wrote", path.relative_to(ROOT))


def social_html(w, h, headline, sub):
    mark = mark_svg(pad=0).replace("<svg ", '<svg width="300" height="300" ', 1)
    return f"""<html><head><style>
@font-face {{ font-family: 'Inter Tight'; font-weight: 600; src: url('{(ROOT / 'video/fonts/inter-tight-latin-600-normal.woff2').as_uri()}'); }}
@font-face {{ font-family: 'Inter Tight'; font-weight: 400; src: url('{(ROOT / 'video/fonts/inter-tight-latin-400-normal.woff2').as_uri()}'); }}
@font-face {{ font-family: 'JetBrains Mono'; font-weight: 500; src: url('{(ROOT / 'video/fonts/jetbrains-mono-latin-500-normal.woff2').as_uri()}'); }}
body {{ margin:0; width:{w}px; height:{h}px; background:{BG}; color:{INK}; font-family:'Inter Tight'; overflow:hidden; position:relative }}
.dots {{ position:absolute; inset:0; background-image:radial-gradient(#202022 1.6px, transparent 2px); background-size:22px 22px;
  -webkit-mask-image: radial-gradient(ellipse at 82% 50%, #000 0%, transparent 60%) }}
</style></head><body><div class="dots"></div>
<div style="position:absolute; right:{int(w*0.07)}px; top:{(h-300)//2}px">{mark}</div>
<div style="position:absolute; left:72px; top:64px; font-family:'JetBrains Mono'; font-size:26px; color:#a3a39e">dmu/quant<span style="color:{RED}">_</span></div>
<div style="position:absolute; left:72px; top:0; bottom:0; display:flex; flex-direction:column; justify-content:center; gap:28px; max-width:{int(w*0.6)}px">
<div style="font-size:84px; font-weight:600; letter-spacing:-3px; line-height:1">{headline}</div>
<div style="font-size:30px; color:#a3a39e; line-height:1.35">{sub}</div></div>
<div style="position:absolute; left:72px; bottom:56px; font-family:'JetBrains Mono'; font-size:22px">POKER FINANCE · free · play money · no sign-up</div>
</body></html>"""


def show(page, html):
    """Load HTML from a real file so the bundled fonts (file:// URLs) are allowed to load."""
    tmp = OUT / "_social.html"
    tmp.write_text(html)
    page.goto(tmp.as_uri())
    tmp.unlink()


def main():
    # Vector masters
    write(OUT / "logo-mark.svg", mark_svg())  # off-white + red, transparent background (for dark backgrounds)
    write(OUT / "logo-mark-on-light.svg", mark_svg(ink=BLACK))  # black + red, for light backgrounds
    write(OUT / "logo-mark-mono-white.svg", mark_svg(red=INK))  # single colour, for embossing / watermarks
    write(OUT / "logo-mark-square.svg", mark_svg(bg=BG))  # with background, for avatars
    write(PUBLIC / "favicon.svg", mark_svg(bg=BG, rounded=72, pad=20))

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        # Raster exports
        for size in (1024, 512, 400):
            render_png(page, mark_svg(bg=BG), OUT / f"logo-mark-square-{size}.png", size)
        render_png(page, mark_svg(), OUT / "logo-mark-1024.png", 1024)
        render_png(page, mark_svg(bg=BG, pad=40), PUBLIC / "apple-touch-icon.png", 180)
        render_png(page, mark_svg(bg=BG, pad=40), PUBLIC / "icon-512.png", 512)
        render_png(page, mark_svg(bg=BG, pad=40), PUBLIC / "icon-192.png", 192)
        for size in (16, 32, 48):
            render_png(page, mark_svg(bg=BG, rounded=72, pad=20), OUT / f"_fav{size}.png", size)

        # Social images
        page.set_viewport_size({"width": 1200, "height": 630})
        show(page, social_html(1200, 630, "Can you beat<br>Wall Street<br><span style='color:%s'>at poker?</span>" % RED,
                                     "Texas Hold'em against 37 banks, HFTs and hedge funds. Each one plays the way it trades."))
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(200)
        page.screenshot(path=str(PUBLIC / "og-image.png"))
        print("wrote public/og-image.png")

        page.set_viewport_size({"width": 1280, "height": 640})
        show(page, social_html(1280, 640, "Poker Finance",
                                     "Play poker against banks, HFTs and hedge funds. An open-source DMU Quant Society project."))
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / "github-social-preview.png"))
        print("wrote brand/github-social-preview.png")
        browser.close()

    # Multi-size favicon.ico for old browsers
    favs = [str(OUT / f"_fav{s}.png") for s in (16, 32, 48)]
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", favs[2], "-vf", "scale=48:48", str(PUBLIC / "favicon.ico")],
        check=True,
    )
    try:
        from PIL import Image

        img = Image.open(favs[2])
        img.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    except ImportError:
        pass
    for f in favs:
        pathlib.Path(f).unlink()
    print("wrote public/favicon.ico")


if __name__ == "__main__":
    main()
