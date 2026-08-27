"""Generate all PWA icon sizes from the master SVG."""
import cairosvg
from PIL import Image
import io
import os

SVG_PATH = "/home/z/my-project/public/icons/icon-master.svg"
OUTPUT_DIR = "/home/z/my-project/public/icons"

SIZES = [1024, 512, 384, 256, 192, 128, 64, 32, 16]

os.makedirs(OUTPUT_DIR, exist_ok=True)

for size in SIZES:
    output_path = os.path.join(OUTPUT_DIR, f"icon-{size}.png")
    cairosvg.svg2png(
        url=SVG_PATH,
        write_to=output_path,
        output_width=size,
        output_height=size,
    )
    print(f"  ✓ icon-{size}.png ({size}x{size})")

# favicon-32.png and favicon-16.png (copies)
import shutil
shutil.copy(os.path.join(OUTPUT_DIR, "icon-32.png"), os.path.join(OUTPUT_DIR, "favicon-32.png"))
shutil.copy(os.path.join(OUTPUT_DIR, "icon-16.png"), os.path.join(OUTPUT_DIR, "favicon-16.png"))
print("  ✓ favicon-32.png")
print("  ✓ favicon-16.png")

# apple-touch-icon.png (180x180 is standard, but 192 works too)
cairosvg.svg2png(
    url=SVG_PATH,
    write_to=os.path.join(OUTPUT_DIR, "apple-touch-icon.png"),
    output_width=180,
    output_height=180,
)
print("  ✓ apple-touch-icon.png (180x180)")

# favicon.ico (multi-size ICO: 16, 32, 48)
ico_sizes = [16, 32, 48]
ico_images = []
for s in ico_sizes:
    png_data = cairosvg.svg2png(url=SVG_PATH, output_width=s, output_height=s)
    img = Image.open(io.BytesIO(png_data)).convert("RGBA")
    ico_images.append(img)

ico_images[0].save(
    os.path.join(OUTPUT_DIR, "favicon.ico"),
    format="ICO",
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_images[1:],
)
print("  ✓ favicon.ico (16, 32, 48)")

# Also copy favicon.ico to /public root for browser discovery
shutil.copy(
    os.path.join(OUTPUT_DIR, "favicon.ico"),
    "/home/z/my-project/public/favicon.ico",
)
print("  ✓ /public/favicon.ico (root)")

# Copy icon-192 and icon-512 to public root for PWA manifest
shutil.copy(
    os.path.join(OUTPUT_DIR, "icon-192.png"),
    "/home/z/my-project/public/icon-192.png",
)
shutil.copy(
    os.path.join(OUTPUT_DIR, "icon-512.png"),
    "/home/z/my-project/public/icon-512.png",
)
print("  ✓ /public/icon-192.png (root)")
print("  ✓ /public/icon-512.png (root)")

# Copy apple-touch-icon to public root
shutil.copy(
    os.path.join(OUTPUT_DIR, "apple-touch-icon.png"),
    "/home/z/my-project/public/apple-touch-icon.png",
)
print("  ✓ /public/apple-touch-icon.png (root)")

print("\n✅ All icons generated successfully!")
print(f"   Location: {OUTPUT_DIR}")
print(f"   Total files: {len(os.listdir(OUTPUT_DIR))}")
