"""
Simple background color removal script using Pillow.
It turns pixels that are near a target RGB color into transparent pixels.

Usage:
  python remove_bg.py input.png output.png --color 74,55,255 --tolerance 30

If you don't provide color, it will sample the top-left pixel as the background color.
"""
import sys
import argparse
from PIL import Image


def parse_color(s: str):
    parts = s.split(',')
    if len(parts) != 3:
        raise argparse.ArgumentTypeError('Color must be R,G,B')
    return tuple(int(p) for p in parts)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input', help='Input image path')
    parser.add_argument('output', help='Output image path (PNG)')
    parser.add_argument('--color', type=parse_color, help='Background RGB color to remove, e.g. 255,255,255')
    parser.add_argument('--tolerance', type=int, default=30, help='Tolerance for color matching (0-255)')
    args = parser.parse_args()

    img = Image.open(args.input).convert('RGBA')
    pixels = img.load()
    w, h = img.size

    if args.color:
        target = args.color
    else:
        target = pixels[0, 0][:3]
        print(f"Sampled background color: {target}")

    tol = args.tolerance

    def close_enough(c1, c2, tol):
        return all(abs(a - b) <= tol for a, b in zip(c1, c2))

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if close_enough((r, g, b), target, tol):
                pixels[x, y] = (r, g, b, 0)

    img.save(args.output, 'PNG')
    print('Saved', args.output)


if __name__ == '__main__':
    main()
