"""Generate PNG icons for the PWA. Run once; output checked into git."""
from PIL import Image, ImageDraw
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BG = (11, 18, 32, 255)
GRAD_A = (91, 140, 255, 255)
GRAD_B = (62, 201, 167, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def draw_dumbbell(size, bg_color=BG, corner_radius_ratio=96 / 512, margin=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Rounded square background
    r = int(size * corner_radius_ratio)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=bg_color)

    # Scale reference geometry from 512
    def sc(v):
        return int(round(v * size / 512))

    # Dumbbell pieces, horizontally gradient-filled
    # We'll paint each rect by blending along x
    bars = [
        (sc(64),  sc(216), sc(64  + 48),  sc(216 + 80),  sc(10)),
        (sc(112), sc(196), sc(112 + 36),  sc(196 + 120), sc(10)),
        (sc(148), sc(236), sc(148 + 216), sc(236 + 40),  sc(12)),
        (sc(364), sc(196), sc(364 + 36),  sc(196 + 120), sc(10)),
        (sc(400), sc(216), sc(400 + 48),  sc(216 + 80),  sc(10)),
    ]
    # Build gradient lookup across full icon width
    grad = [lerp(GRAD_A, GRAD_B, x / max(size - 1, 1)) for x in range(size)]

    mask_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(mask_layer)
    for (x1, y1, x2, y2, rad) in bars:
        mdraw.rounded_rectangle([x1, y1, x2, y2], radius=rad, fill=(255, 255, 255, 255))

    # Apply gradient using mask
    grad_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gpix = grad_img.load()
    for x in range(size):
        col = grad[x]
        for y in range(size):
            gpix[x, y] = col
    img.paste(grad_img, (0, 0), mask_layer)
    return img


def save(img, name):
    p = os.path.join(HERE, name)
    img.save(p, "PNG", optimize=True)
    print("wrote", p)


def main():
    save(draw_dumbbell(192), "icon-192.png")
    save(draw_dumbbell(512), "icon-512.png")
    # Apple touch icon: 180x180 standard, no transparent corners (iOS applies its own mask)
    save(draw_dumbbell(180, corner_radius_ratio=0), "apple-touch-icon.png")
    # Maskable: add extra padding (safe zone)
    maskable = Image.new("RGBA", (512, 512), BG)
    inner = draw_dumbbell(360, corner_radius_ratio=0)
    maskable.paste(inner, ((512 - 360) // 2, (512 - 360) // 2), inner)
    save(maskable, "icon-512-maskable.png")


if __name__ == "__main__":
    main()
