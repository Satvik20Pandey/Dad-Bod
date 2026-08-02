"""Crop ui-references/image.png → transparent assets/hero-body.png."""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "ui-references" / "image.png"
OUT = ROOT / "assets" / "hero-body.png"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b

    white_score = np.clip((luma - 235) / 20.0, 0, 1) * np.clip(1 - chroma / 18.0, 0, 1)
    near_white = (r > 248) & (g > 248) & (b > 248)
    alpha = (1.0 - white_score) * 255.0
    alpha[near_white] = 0
    fade = np.clip((luma - 242) / 13.0, 0, 1) * np.clip((8 - chroma) / 8.0, 0, 1)
    alpha = alpha * (1.0 - fade)
    arr[:, :, 3] = np.clip(alpha, 0, 255)

    mask = arr[:, :, 3] > 12
    ys, xs = np.where(mask)
    if len(xs) == 0:
        raise SystemExit("no foreground found")

    pad = 8
    x0 = max(0, int(xs.min()) - pad)
    x1 = min(arr.shape[1], int(xs.max()) + pad + 1)
    y0 = max(0, int(ys.min()) - pad)
    y1 = min(arr.shape[0], int(ys.max()) + pad + 1)
    fig_h = y1 - y0
    y1_crop = y0 + int(fig_h * 0.72)
    cropped = arr[y0:y1_crop, x0:x1]

    out_im = Image.fromarray(cropped.astype(np.uint8), "RGBA")
    w, h = out_im.size
    target_w = 280
    target_h = int(h * (target_w / w))
    out_im = out_im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    out_im.save(OUT, optimize=True)
    print(f"saved {OUT} size={out_im.size} bbox=({x0},{y0},{x1},{y1_crop}) src={im.size}")


if __name__ == "__main__":
    main()
