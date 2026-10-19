from PIL import Image, ImageFilter
import numpy as np
import os

def extract_black_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    
    # Luminance / brightness
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Background threshold for pure black studio backdrop
    # Smooth alpha feathering between 15 and 45 luminance
    alpha = np.clip((lum - 16.0) / 32.0, 0.0, 1.0) * 255.0
    
    # For pixels where gold / red / green colors are clearly present
    color_boost = (r > 35) & ((r > b + 10) | (g > b + 10))
    alpha[color_boost] = np.maximum(alpha[color_boost], 255.0)
    
    arr[:, :, 3] = alpha
    
    res = Image.fromarray(arr.astype(np.uint8), "RGBA")
    
    # Find bounding box of non-zero alpha
    bbox = res.getbbox()
    if bbox:
        # Crop tight with 4px padding
        w, h = res.size
        pad = 4
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        res = res.crop(crop_box)
        
    res.save(output_path, "PNG")
    print(f"Saved: {output_path} (size: {res.size})")

kada_in = "assets/tryon/peacock_kada_single.jpg"
kada_out = "assets/tryon/peacock_kada_single_transparent.png"
if os.path.exists(kada_in):
    extract_black_bg(kada_in, kada_out)
