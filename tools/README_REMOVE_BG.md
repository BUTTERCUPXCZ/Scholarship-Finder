Remove background script

Requirements
- Python 3.8+
- Pillow

Install Pillow:

pip install pillow

Usage:

python remove_bg.py input.png output.png --color R,G,B --tolerance 30

- If --color is omitted, the script samples the top-left pixel as the background color.
- Tolerance controls how similar a pixel must be to the background color to be removed.

Example:

python remove_bg.py ./assets/illustration.png ./assets/illustration_nobg.png --color 74,55,255 --tolerance 40
