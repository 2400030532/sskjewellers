"""
Test script for Phase 1 Jewellery Segmentation Pipeline & Quality Control
"""
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, os.path.abspath(backend_dir))

from ai_vision_segmenter import SEGMENTATION_ENGINE

test_images = [
    "assets/kasu_mala.jpg",
    "assets/gold_bangles.jpg",
    "assets/tryon/peacock_kada_single.jpg"
]

print("==========================================================")
print("  Sri Sai Krishna Jewellers - Phase 1 Segmentation Test")
print("==========================================================")

for img_path in test_images:
    full_path = os.path.join(os.path.dirname(__file__), "..", img_path)
    if not os.path.exists(full_path):
        print(f"Skipping missing image: {img_path}")
        continue
    
    print(f"\nProcessing: {img_path} ...")
    result = SEGMENTATION_ENGINE.segment_jewellery(full_path, sensitivity=1.0, preserve_chains=True)
    
    quality = result["quality"]
    bbox = result["bounding_box"]
    anchors = result["anchor_points"]
    meta = result["metadata"]
    
    print(f"  [Engine]     : {meta['engine']}")
    print(f"  [Dimensions] : {meta['width']}x{meta['height']}")
    print(f"  [BoundingBox]: x={bbox['x']}, y={bbox['y']}, w={bbox['width']}, h={bbox['height']}")
    print(f"  [Top Anchor] : {anchors['topCenter']}")
    print(f"  [Bot Anchor] : {anchors['bottomCenter']}")
    print(f"  [Quality]    : Score={quality['score']}/100 | Status={quality['status']}")
    print(f"  [Metrics]    : Continuity={quality['metrics']['chainContinuity']}% | "
          f"Isolation={quality['metrics']['backgroundIsolation']}% | "
          f"Smoothness={quality['metrics']['edgeSmoothness']}% | "
          f"GoldPreserve={quality['metrics']['goldPreservation']}%")
    print(f"  [Result]     : Transparent PNG Base64 length: {len(result['transparent_base64'])} chars")
    print(f"  [Status]     : {'PASSED (APPROVED)' if quality['status'] == 'APPROVED' else 'FLAGGED (NEEDS_REVIEW)'}")

print("\nPhase 1 verification complete.")
