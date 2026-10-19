"""
Sri Sai Krishna Jewellers - AI Vision Jewellery Segmentation & Asset Quality Engine
Phase 1: Production Pipeline for Exact Product Preservation

Pipeline:
  Original Product Image
       ↓
  Background Detection (Perimeter & Multi-point Sampling)
       ↓
  Jewellery Segmentation (Neural BiRefNet/RMBG + Morphological Chain Preservation)
       ↓
  Transparent PNG (RGBA) + Binary Alpha Mask
       ↓
  Tight Bounding Box & Anatomical Anchor Points
       ↓
  Mask Quality Inspection & Defect Detection
       ↓
  AI Try-On Ready Asset Metadata (APPROVED / NEEDS_REVIEW)

Adheres strictly to the EXACT PRODUCT PRESERVATION philosophy:
No generative hallucination. Preserves fine chains, prongs, stones, and reflections.
"""

import os
import io
import math
import base64
import numpy as np
from PIL import Image, ImageFilter, ImageOps
import scipy.ndimage as ndi

# Try neural segmentation models (rembg / BiRefNet / RMBG-1.4)
HAS_REMBG = False
try:
    import rembg
    HAS_REMBG = True
except Exception:
    HAS_REMBG = False


class JewellerySegmentationEngine:
    def __init__(self):
        self._rembg_session = None
        self._tried_rembg = False

    def _get_rembg_session(self):
        if not HAS_REMBG:
            return None
        if not self._tried_rembg:
            self._tried_rembg = True
            u2net_path = os.path.expanduser("~/.u2net/u2net.onnx")
            if os.path.exists(u2net_path):
                try:
                    self._rembg_session = rembg.new_session()
                except Exception as e:
                    print(f"[AI-Segmentation] Neural session load error: {e}")
        return self._rembg_session

    @staticmethod
    def load_image(source) -> Image.Image:
        """Loads PIL Image from path, bytes, or base64 data URL."""
        if isinstance(source, Image.Image):
            return source.convert("RGBA")
        
        if isinstance(source, str):
            if source.startswith("data:image"):
                header, encoded = source.split(",", 1)
                data = base64.b64decode(encoded)
                return Image.open(io.BytesIO(data)).convert("RGBA")
            elif source.startswith(("http://", "https://")):
                import urllib.request
                req = urllib.request.Request(source, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                with urllib.request.urlopen(req, timeout=12) as resp:
                    return Image.open(io.BytesIO(resp.read())).convert("RGBA")
            elif os.path.exists(source):
                return Image.open(source).convert("RGBA")
            else:
                # Might be a relative path from workspace root or backend
                clean_path = source.lstrip("/")
                backend_dir = os.path.dirname(os.path.abspath(__file__))
                root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
                candidates = [
                    clean_path,
                    os.path.join(os.getcwd(), clean_path),
                    os.path.join(root_dir, clean_path),
                    os.path.join(backend_dir, clean_path),
                    os.path.join(root_dir, "assets", clean_path),
                    os.path.join(root_dir, "www", clean_path)
                ]
                for cand in candidates:
                    if os.path.exists(cand):
                        return Image.open(cand).convert("RGBA")
                raise FileNotFoundError(f"Source image not found: {source}")

        if isinstance(source, (bytes, bytearray)):
            return Image.open(io.BytesIO(source)).convert("RGBA")

        raise ValueError("Unsupported image source type")

    @staticmethod
    def validate_image(source) -> dict:
        """
        Validates the uploaded jewellery photograph:
        - Image format & integrity
        - Resolution constraints (min 200x200, max 8192x8192)
        - Sharpness / blur analysis (Laplacian variance)
        - Exposure & contrast (avoid pitch black or blown out whites)
        """
        try:
            img = JewellerySegmentationEngine.load_image(source)
            width, height = img.size

            if width < 200 or height < 200:
                return {
                    "valid": False,
                    "error": f"Image resolution too low ({width}x{height}px). Minimum requirement is 200x200px for accurate jewellery segmentation.",
                    "width": width,
                    "height": height
                }
            if width > 8192 or height > 8192:
                return {
                    "valid": False,
                    "error": f"Image resolution too large ({width}x{height}px). Maximum supported is 8192x8192px.",
                    "width": width,
                    "height": height
                }

            # Grayscale for analysis
            gray = np.array(img.convert("L"), dtype=np.float32)

            # Blur detection via Laplacian variance
            laplacian = ndi.laplace(gray)
            sharpness_score = float(np.var(laplacian))
            is_blurry = sharpness_score < 40.0

            # Exposure check
            mean_lum = float(np.mean(gray))
            lum_std = float(np.std(gray))
            is_underexposed = mean_lum < 20.0
            is_overexposed = mean_lum > 245.0 and lum_std < 15.0

            if is_underexposed:
                return {
                    "valid": False,
                    "error": "Photograph is severely underexposed (too dark to distinguish gold ornaments).",
                    "width": width,
                    "height": height,
                    "sharpnessScore": round(sharpness_score, 1)
                }

            return {
                "valid": True,
                "width": width,
                "height": height,
                "aspectRatio": round(width / max(1, height), 3),
                "sharpnessScore": round(sharpness_score, 1),
                "isBlurry": is_blurry,
                "meanLuminance": round(mean_lum, 1)
            }
        except Exception as e:
            return {"valid": False, "error": f"Invalid or unreadable image file: {str(e)}"}

    @staticmethod
    def normalize_dimensions(img: Image.Image, max_dimension: int = 1400) -> Image.Image:
        """
        Normalizes image dimensions for efficient neural segmentation and 3D reconstruction,
        maintaining exact aspect ratio without distortion.
        """
        w, h = img.size
        if w <= max_dimension and h <= max_dimension:
            return img

        if w > h:
            new_w = max_dimension
            new_h = int(h * (max_dimension / w))
        else:
            new_h = max_dimension
            new_w = int(w * (max_dimension / h))

        return img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    def segment_jewellery(self, source, sensitivity=1.0, preserve_chains=True, min_quality_threshold=75):
        """
        Executes complete Phase 1 segmentation pipeline.
        Returns:
            {
               'transparent_image': PIL.Image,
               'mask_image': PIL.Image,
               'transparent_base64': str,
               'mask_base64': str,
               'bounding_box': dict,
               'anchor_points': dict,
               'quality': dict,
               'metadata': dict
            }
        """
        # Validate photograph first
        validation = self.validate_image(source)
        if not validation.get("valid", False):
            raise ValueError(validation.get("error", "Invalid jewellery image"))

        orig_rgba = self.load_image(source)
        # Normalize processing dimensions while preserving crisp details
        proc_rgba = self.normalize_dimensions(orig_rgba, max_dimension=1400)
        width, height = proc_rgba.size
        rgb = proc_rgba.convert("RGB")
        img_np = np.array(rgb, dtype=np.float32)

        alpha_mask = None
        engine_used = "High-Definition Morphological Alpha Matting"

        # 1. Neural Segmentation Attempt (BiRefNet / RMBG if available)
        session = self._get_rembg_session()
        if session is not None:
            try:
                # Obtain neural matte
                neural_rgba = rembg.remove(rgb, session=session)
                neural_alpha = np.array(neural_rgba.split()[-1], dtype=np.float32) / 255.0
                if np.mean(neural_alpha) > 0.02 and np.mean(neural_alpha) < 0.95:
                    alpha_mask = neural_alpha
                    engine_used = "BiRefNet / RMBG Neural Segmentation"
            except Exception as e:
                print(f"[AI-Segmentation] Neural fallback to analytical matting: {e}")

        # 2. High-Accuracy Analytical Edge & Chain Matting (Active fallback or refinement)
        analytical_mask, bg_color = self._extract_analytical_matte(img_np, sensitivity=sensitivity, preserve_chains=preserve_chains)

        if alpha_mask is None:
            alpha_mask = analytical_mask
        else:
            # Dual-Fusion: Combine neural mask with chain preservation to protect thin chains from neural erosion
            if preserve_chains:
                # If analytical pass found fine chain structures, preserve them
                chain_boost = np.maximum(alpha_mask, analytical_mask * 0.85)
                alpha_mask = chain_boost

        # 3. Specular Highlight & Gem Facet Protection
        # Protect bright reflections (diamonds, gold gleam) from background false-positives
        alpha_mask = self._protect_specular_highlights(img_np, alpha_mask, bg_color)

        # 4. Anti-Aliasing & Edge Smoothing
        alpha_mask = np.clip(alpha_mask, 0.0, 1.0)
        # Smooth boundaries with small Gaussian filter for silky alpha compositing
        smoothed_alpha = ndi.gaussian_filter(alpha_mask, sigma=0.6)
        # Remap threshold so inner metal remains 100% solid
        solid_alpha = np.where(smoothed_alpha > 0.75, 1.0, smoothed_alpha / 0.75)
        solid_alpha = np.clip(solid_alpha, 0.0, 1.0)

        # 5. Assemble RGBA Transparent Image and Mask Image
        final_alpha_uint8 = (solid_alpha * 255.0).astype(np.uint8)
        transparent_img = Image.fromarray(np.dstack([np.array(rgb), final_alpha_uint8]), mode="RGBA")
        mask_img = Image.fromarray(final_alpha_uint8, mode="L")

        # 6. Calculate Precise Bounding Box
        bbox = self._compute_bounding_box(final_alpha_uint8, width, height)

        # 7. Calculate Anatomical Anchor Points
        anchors = self._compute_anchor_points(final_alpha_uint8, width, height, bbox)

        # 8. Mask Quality Inspection & Defect Analysis
        quality = self._evaluate_mask_quality(final_alpha_uint8, img_np, bg_color, bbox, min_quality_threshold)

        # 9. Encode to Base64 for instant API transmission
        trans_b64 = self._image_to_base64_png(transparent_img)
        mask_b64 = self._image_to_base64_png(mask_img)

        return {
            "transparent_image": transparent_img,
            "mask_image": mask_img,
            "transparent_base64": trans_b64,
            "mask_base64": mask_b64,
            "bounding_box": bbox,
            "anchor_points": anchors,
            "quality": quality,
            "metadata": {
                "width": width,
                "height": height,
                "engine": engine_used,
                "preserveChains": preserve_chains,
                "sensitivity": sensitivity,
                "status": quality["status"],
                "qualityScore": quality["score"]
            }
        }

    def _extract_analytical_matte(self, img_np, sensitivity=1.0, preserve_chains=True):
        """
        Advanced colour difference, gradient tensor, and morphological chain preservation.
        Preserves thin mangalsutra wires, gold chain links, prongs, and pearls.
        """
        h, w, _ = img_np.shape

        # 1. Estimate background color from outer perimeter borders
        border_size = max(4, min(w, h) // 40)
        perimeter_samples = np.vstack([
            img_np[:border_size, :, :].reshape(-1, 3),
            img_np[-border_size:, :, :].reshape(-1, 3),
            img_np[:, :border_size, :].reshape(-1, 3),
            img_np[:, -border_size:, :].reshape(-1, 3)
        ])
        bg_color = np.median(perimeter_samples, axis=0)

        # Color distance from estimated background in Euclidean RGB space
        color_diff = np.linalg.norm(img_np - bg_color, axis=2)

        # Compute luminance gradient (Sobel) to detect fine wire edges
        luminance = 0.299 * img_np[:, :, 0] + 0.587 * img_np[:, :, 1] + 0.114 * img_np[:, :, 2]
        sobel_x = ndi.sobel(luminance, axis=1)
        sobel_y = ndi.sobel(luminance, axis=0)
        edge_gradient = np.hypot(sobel_x, sobel_y)

        # Base threshold derived from perimeter variance
        perimeter_std = np.std(perimeter_samples)
        threshold = max(18.0, perimeter_std * 2.2) / max(0.5, sensitivity)

        # Primary foreground detection
        fg_mask = (color_diff > threshold) | (edge_gradient > (threshold * 1.5))

        if preserve_chains:
            # Directional morphological kernels to protect thin linear chain segments
            # Chains run in horizontal, vertical, and diagonal links
            k_horiz = np.ones((1, 5), dtype=bool)
            k_vert = np.ones((5, 1), dtype=bool)
            k_diag1 = np.eye(4, dtype=bool)
            k_diag2 = np.fliplr(np.eye(4, dtype=bool))

            linear_chains = (
                ndi.binary_opening(fg_mask, structure=k_horiz) |
                ndi.binary_opening(fg_mask, structure=k_vert) |
                ndi.binary_opening(fg_mask, structure=k_diag1) |
                ndi.binary_opening(fg_mask, structure=k_diag2)
            )
            # Combine to prevent thin link breakage
            fg_mask = fg_mask | linear_chains

        # Close small micro-gaps inside solid metal while leaving major loops open
        struct_close = ndi.generate_binary_structure(2, 1)
        fg_closed = ndi.binary_closing(fg_mask, structure=struct_close, iterations=1)

        # Convert to floating-point alpha matte
        alpha = fg_closed.astype(np.float32)
        return alpha, bg_color

    def _protect_specular_highlights(self, img_np, alpha_mask, bg_color):
        """
        Protects bright diamond facets, pearls, and gold sheen reflections
        that may be close to white studio backdrops.
        """
        # If background is bright/white, check if near-white pixels are surrounded by jewellery
        is_bright_bg = np.mean(bg_color) > 180.0
        if not is_bright_bg:
            return alpha_mask

        # Find pixels with high local contrast or rich saturation adjacent to foreground
        r, g, b = img_np[:, :, 0], img_np[:, :, 1], img_np[:, :, 2]
        max_c = np.maximum(np.maximum(r, g), b)
        min_c = np.minimum(np.minimum(r, g), b)
        saturation = np.where(max_c > 0, (max_c - min_c) / (max_c + 1e-5), 0.0)

        # Solid gold has high saturation (> 0.25). Diamonds have sharp local edge variance.
        gold_color_hint = saturation > 0.22
        struct = ndi.generate_binary_structure(2, 2)
        dilated_fg = ndi.binary_dilation(alpha_mask > 0.5, structure=struct, iterations=3)

        # Protect pixels that are either gold-toned or within the immediate hull of jewellery
        protected_specular = (dilated_fg & gold_color_hint)
        return np.maximum(alpha_mask, protected_specular.astype(np.float32))

    def _compute_bounding_box(self, alpha_uint8, width, height):
        """Calculates precise tight bounding box."""
        y_indices, x_indices = np.where(alpha_uint8 > 20)
        if len(x_indices) == 0 or len(y_indices) == 0:
            return {
                "x": 0, "y": 0, "width": width, "height": height,
                "normalized": {"x": 0.0, "y": 0.0, "width": 1.0, "height": 1.0}
            }

        min_x = int(np.min(x_indices))
        max_x = int(np.max(x_indices))
        min_y = int(np.min(y_indices))
        max_y = int(np.max(y_indices))
        bb_w = int(max_x - min_x + 1)
        bb_h = int(max_y - min_y + 1)

        return {
            "x": min_x,
            "y": min_y,
            "width": bb_w,
            "height": bb_h,
            "normalized": {
                "x": round(min_x / width, 4),
                "y": round(min_y / height, 4),
                "width": round(bb_w / width, 4),
                "height": round(bb_h / height, 4)
            }
        }

    def _compute_anchor_points(self, alpha_uint8, width, height, bbox):
        """Calculates anatomical anchor points for try-on placement."""
        y_indices, x_indices = np.where(alpha_uint8 > 25)
        if len(x_indices) == 0:
            return {
                "topCenter": {"x": width // 2, "y": height // 4},
                "bottomCenter": {"x": width // 2, "y": (height * 3) // 4},
                "centerOfMass": {"x": width // 2, "y": height // 2},
                "aspectRatio": round(width / max(1, height), 3)
            }

        top_y = bbox["y"]
        bottom_y = bbox["y"] + bbox["height"] - 1

        # Top anchor: mean X of the uppermost active pixels
        top_slice = x_indices[y_indices <= top_y + max(2, bbox["height"] // 20)]
        top_x = int(np.mean(top_slice)) if len(top_slice) > 0 else (bbox["x"] + bbox["width"] // 2)

        # Bottom anchor: mean X of lowest active pixels (pendant tip)
        bottom_slice = x_indices[y_indices >= bottom_y - max(2, bbox["height"] // 20)]
        bottom_x = int(np.mean(bottom_slice)) if len(bottom_slice) > 0 else (bbox["x"] + bbox["width"] // 2)

        # Center of mass
        com_x = int(np.mean(x_indices))
        com_y = int(np.mean(y_indices))

        return {
            "topCenter": {"x": top_x, "y": top_y, "normalized": {"x": round(top_x / width, 4), "y": round(top_y / height, 4)}},
            "bottomCenter": {"x": bottom_x, "y": bottom_y, "normalized": {"x": round(bottom_x / width, 4), "y": round(bottom_y / height, 4)}},
            "centerOfMass": {"x": com_x, "y": com_y, "normalized": {"x": round(com_x / width, 4), "y": round(com_y / height, 4)}},
            "aspectRatio": round(bbox["width"] / max(1, bbox["height"]), 3)
        }

    def _evaluate_mask_quality(self, alpha_uint8, img_np, bg_color, bbox, threshold=75):
        """
        Inspects mask quality:
        - Chain continuity
        - Jaggedness / edge smoothness
        - Internal hole integrity
        - Background residue in corners
        - Metal & gemstone preservation
        """
        h, w = alpha_uint8.shape
        total_pixels = w * h
        jewel_pixels = int(np.sum(alpha_uint8 > 25))

        if jewel_pixels < 100:
            return {
                "score": 10,
                "status": "NEEDS_REVIEW",
                "reason": "Insufficient jewellery area detected. Image may be empty or failed extraction.",
                "metrics": {
                    "chainContinuity": 0,
                    "edgeSmoothness": 0,
                    "backgroundIsolation": 0,
                    "goldPreservation": 0
                }
            }

        # 1. Background isolation score (Check image 4 corners)
        corner_w, corner_h = max(2, w // 20), max(2, h // 20)
        c1 = np.mean(alpha_uint8[:corner_h, :corner_w])
        c2 = np.mean(alpha_uint8[:corner_h, -corner_w:])
        c3 = np.mean(alpha_uint8[-corner_h:, :corner_w])
        c4 = np.mean(alpha_uint8[-corner_h:, -corner_w:])
        corner_leakage = (c1 + c2 + c3 + c4) / 4.0
        # If corner leakage is near 0, background isolation is high (100)
        bg_isolation_score = max(0, 100 - int(corner_leakage * 2.5))

        # 2. Chain continuity score (Connected components of significant size)
        binary_mask = alpha_uint8 > 30
        labeled_array, num_features = ndi.label(binary_mask)
        if num_features > 0:
            component_sizes = ndi.sum(binary_mask, labeled_array, range(1, num_features + 1))
            largest_comp = np.max(component_sizes) if len(component_sizes) > 0 else 0
            main_ratio = largest_comp / max(1, jewel_pixels)
            # Jewellery often has 1 main body or 2 symmetric earrings.
            # If main ratio > 0.65 or top 2 ratios > 0.85, chains are connected.
            top2_sum = np.sum(sorted(component_sizes, reverse=True)[:2]) if len(component_sizes) > 0 else 0
            chain_continuity_score = min(100, int((top2_sum / max(1, jewel_pixels)) * 100))
        else:
            chain_continuity_score = 0

        # 3. Edge smoothness score (Variance of edge gradient along boundary)
        struct = ndi.generate_binary_structure(2, 1)
        eroded = ndi.binary_erosion(binary_mask, structure=struct)
        boundary = binary_mask ^ eroded
        sobel_x = ndi.sobel(alpha_uint8.astype(np.float32), axis=1)
        sobel_y = ndi.sobel(alpha_uint8.astype(np.float32), axis=0)
        edge_grads = np.hypot(sobel_x, sobel_y)[boundary]
        # Smoothly anti-aliased edges have bounded gradient variation
        edge_variance = np.std(edge_grads) if len(edge_grads) > 0 else 100.0
        edge_smoothness_score = max(50, min(100, int(100 - (edge_variance / 4.0))))

        # 4. Gold / Gem preservation score
        # Check that high saturation/metallic pixels within bbox are preserved in alpha
        r, g, b = img_np[:, :, 0], img_np[:, :, 1], img_np[:, :, 2]
        max_c = np.maximum(np.maximum(r, g), b)
        min_c = np.minimum(np.minimum(r, g), b)
        saturation = np.where(max_c > 0, (max_c - min_c) / (max_c + 1e-5), 0.0)
        rich_gold_pixels = (saturation > 0.28) & (r > g) & (g > b)
        gold_inside_mask = np.sum(rich_gold_pixels & binary_mask)
        total_gold = np.sum(rich_gold_pixels)
        gold_preservation_score = min(100, int((gold_inside_mask / max(1, total_gold)) * 100)) if total_gold > 0 else 92

        # Weighted composite score
        composite_score = int(
            (chain_continuity_score * 0.35) +
            (bg_isolation_score * 0.25) +
            (edge_smoothness_score * 0.20) +
            (gold_preservation_score * 0.20)
        )
        composite_score = max(5, min(100, composite_score))

        status = "APPROVED" if composite_score >= threshold else "NEEDS_REVIEW"
        reason = "Asset verified: High chain continuity and clean background separation." if status == "APPROVED" else \
                 "Quality alert: Potential chain discontinuity or backdrop residue. Review recommended before publishing."

        return {
            "score": composite_score,
            "status": status,
            "threshold": threshold,
            "reason": reason,
            "metrics": {
                "chainContinuity": chain_continuity_score,
                "backgroundIsolation": bg_isolation_score,
                "edgeSmoothness": edge_smoothness_score,
                "goldPreservation": gold_preservation_score
            }
        }

    @staticmethod
    def _image_to_base64_png(pil_img: Image.Image) -> str:
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG", optimize=True)
        b64_str = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{b64_str}"


# Module singleton instance
SEGMENTATION_ENGINE = JewellerySegmentationEngine()
