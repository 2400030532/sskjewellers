/**
 * Sri Sai Krishna Jewellers - Computer Vision Virtual Try-On Engine (VTO)
 * Real-time 3D Facial Landmark Tracking using Google MediaPipe Face Mesh
 * Location: Etikoppaka, AP | Phone / WhatsApp: +91 9573199344
 */

class JewelleryVirtualTryOnManager {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.camera = null;
    this.faceMesh = null;
    this.isInitialized = false;
    this.isRunning = false;
    this.currentProduct = null;
    this.currentMode = 'camera'; // 'camera' or 'photo'
    this.facingMode = 'user'; // 'user' (selfie) or 'environment'
    
    // User Fine-Tuning Offsets
    this.userScaleFactor = 1.0;
    this.userOffsetY = 0;
    this.userOffsetX = 0;
    this.userRotation = 0;
    this.showMatchingEarrings = true;

    // Loaded asset image cache
    this.imageCache = {};

    // 3D Extracted Model Sprite Cache
    this.model3DCache = new Map();
    this.currentModel3D = null;
    this.currentEarring3D = null;

    // Landmark Smoothing (Exponential Moving Average) to eliminate jitter
    this.smoothedPoints = {};
    this.smoothingAlpha = 0.32; // Optimized for silky smooth tracking

    // Decoupled 60 FPS Render Loop & AI Timers
    this.renderLoopId = null;
    this.aiTimerId = null;
    this.mediaStream = null;
    this.photoImage = null;

    // MediaPipe Hands & Face Mesh landmarks
    this.hands = null;
    this.latestFaceLandmarks = null;
    this.latestHandLandmarks = null;
    this.latestHandedness = null;
    this.isProcessingFrame = false;

    // Bangles Display Mode: 'single' (1 bangle per wrist) or 'pair' (stacked pair)
    this.bangleStackMode = 'single';

    // Snapshot storage
    this.lastSnapshotDataUrl = null;
  }

  init() {
    this.video = document.getElementById('vto-video');
    this.canvas = document.getElementById('vto-canvas');
    if (!this.canvas || !this.video) return;

    this.ctx = this.canvas.getContext('2d');

    // Initialize MediaPipe Face Mesh & Hands models
    this.initFaceMesh();
    this.initHands();

    // Preload default jewellery template graphics into cache
    this.preloadImage('assets/tryon/peacock_jhumka.svg');
    this.preloadImage('assets/tryon/guttapusalu_choker.svg');
    this.preloadImage('assets/tryon/kasu_mala_pendant.svg');
    this.preloadImage('assets/tryon/maang_tikka.svg');
    this.preloadImage('assets/tryon/peacock_kada_single_transparent.png');
    this.preloadImage('assets/tryon/peacock_kada_single.jpg');
    this.preloadImage('assets/tryon/diamond_ring.svg');

    this.bindUiEvents();
    this.isInitialized = true;
  }

  initFaceMesh() {
    if (this.faceMesh) return true;
    if (typeof FaceMesh !== 'undefined') {
      try {
        this.faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        this.faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false, // 2x faster, avoids heavy iris sub-models
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults((results) => {
          this.latestFaceLandmarks = (results && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0)
            ? results.multiFaceLandmarks[0]
            : null;
          if (this.currentMode === 'photo') {
            this.renderCurrentFrame();
          }
        });
        return true;
      } catch (e) {
        console.warn('FaceMesh initialization note:', e);
      }
    }
    return false;
  }

  initHands() {
    if (this.hands) return true;
    if (typeof Hands !== 'undefined') {
      try {
        this.hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0, // Lite model: 4x faster, real-time 60 FPS without CPU freezing
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => {
          this.latestHandLandmarks = (results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0)
            ? results.multiHandLandmarks
            : null;
          this.latestHandedness = (results && results.multiHandedness) ? results.multiHandedness : null;
          if (this.currentMode === 'photo') {
            this.renderCurrentFrame();
          }
        });
        return true;
      } catch (handErr) {
        console.warn('Hands model initialization note:', handErr);
      }
    }
    return false;
  }

  /**
   * One-Euro Velocity-Adaptive Exponential Landmark Filter
   * Eliminates micro-tremor jitter while keeping responsive tracking with zero lag
   */
  smoothPoint(name, x, y, z = 0) {
    const now = performance.now();
    const prev = this.smoothedPoints[name];

    if (!prev) {
      this.smoothedPoints[name] = { x, y, z, vx: 0, vy: 0, lastTime: now };
      return { x, y, z };
    }

    const dt = Math.max(0.001, (now - prev.lastTime) / 1000);
    const dist = Math.hypot(x - prev.x, y - prev.y);
    const speed = dist / dt; // pixels per second

    // Dynamic Alpha:
    // Still (speed < 15 px/s): alpha = 0.22 (silky stable, no jitter)
    // Moving fast (speed > 120 px/s): alpha = 0.88 (instant tracking, 0ms lag)
    const minAlpha = 0.22;
    const maxAlpha = 0.88;
    const speedFactor = Math.min(1.0, speed / 120);
    const alpha = minAlpha + (maxAlpha - minAlpha) * (speedFactor * speedFactor);

    const smoothX = prev.x + (x - prev.x) * alpha;
    const smoothY = prev.y + (y - prev.y) * alpha;
    const smoothZ = prev.z + ((z !== undefined ? z : 0) - prev.z) * alpha;

    this.smoothedPoints[name] = {
      x: smoothX,
      y: smoothY,
      z: smoothZ,
      vx: (smoothX - prev.x) / dt,
      vy: (smoothY - prev.y) / dt,
      lastTime: now
    };

    return { x: smoothX, y: smoothY, z: smoothZ };
  }

  /**
   * Reusable Offscreen Canvas for Isolated Specular Glint Rendering
   * Guarantees glint sheen only illuminates jewellery pixels without bleeding onto video
   */
  getJewelleryBuffer(w, h) {
    if (!this._bufferCanvas) {
      this._bufferCanvas = document.createElement('canvas');
    }
    const bufW = Math.max(1, Math.ceil(w));
    const bufH = Math.max(1, Math.ceil(h));
    if (this._bufferCanvas.width !== bufW || this._bufferCanvas.height !== bufH) {
      this._bufferCanvas.width = bufW;
      this._bufferCanvas.height = bufH;
    }
    const bCtx = this._bufferCanvas.getContext('2d');
    bCtx.clearRect(0, 0, bufW, bufH);
    return { canvas: this._bufferCanvas, ctx: bCtx };
  }

  bindUiEvents() {
    const modalCloseBtn = document.getElementById('btn-close-vto');
    if (modalCloseBtn) modalCloseBtn.onclick = () => this.close();

    const captureBtn = document.getElementById('btn-vto-shutter');
    if (captureBtn) captureBtn.onclick = () => this.captureSnapshot();

    const flipBtn = document.getElementById('btn-vto-flip-camera');
    if (flipBtn) flipBtn.onclick = () => this.flipCamera();

    const scaleUp = document.getElementById('btn-vto-scale-up');
    const scaleDown = document.getElementById('btn-vto-scale-down');
    if (scaleUp) scaleUp.onclick = () => { this.userScaleFactor = Math.min(2.0, this.userScaleFactor + 0.08); this.updateControlLabels(); };
    if (scaleDown) scaleDown.onclick = () => { this.userScaleFactor = Math.max(0.4, this.userScaleFactor - 0.08); this.updateControlLabels(); };

    const moveUp = document.getElementById('btn-vto-move-up');
    const moveDown = document.getElementById('btn-vto-move-down');
    const moveLeft = document.getElementById('btn-vto-move-left');
    const moveRight = document.getElementById('btn-vto-move-right');
    if (moveUp) moveUp.onclick = () => { this.userOffsetY -= 6; this.updateControlLabels(); };
    if (moveDown) moveDown.onclick = () => { this.userOffsetY += 6; this.updateControlLabels(); };
    if (moveLeft) moveLeft.onclick = () => { this.userOffsetX -= 6; this.updateControlLabels(); };
    if (moveRight) moveRight.onclick = () => { this.userOffsetX += 6; this.updateControlLabels(); };

    const rotCcw = document.getElementById('btn-vto-rot-ccw');
    const rotCw = document.getElementById('btn-vto-rot-cw');
    if (rotCcw) rotCcw.onclick = () => { this.userRotation -= (Math.PI / 36); this.updateControlLabels(); };
    if (rotCw) rotCw.onclick = () => { this.userRotation += (Math.PI / 36); this.updateControlLabels(); };

    const resetControls = document.getElementById('btn-vto-reset-adj');
    if (resetControls) resetControls.onclick = () => {
      this.userScaleFactor = 1.0;
      this.userOffsetY = 0;
      this.userOffsetX = 0;
      this.userRotation = 0;
      this.updateControlLabels();
    };

    const bangleModeBtn = document.getElementById('btn-vto-bangle-mode');
    if (bangleModeBtn) {
      bangleModeBtn.onclick = () => {
        this.bangleStackMode = (this.bangleStackMode === 'single') ? 'pair' : 'single';
        bangleModeBtn.textContent = (this.bangleStackMode === 'single') ? '1 Bangle' : 'Pair Stack';
      };
    }

    // Photo Upload mode
    const photoInput = document.getElementById('vto-photo-input');
    if (photoInput) {
      photoInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.loadUserPhoto(file);
      };
    }

    const modeCamBtn = document.getElementById('vto-mode-camera');
    const modePhotoBtn = document.getElementById('vto-mode-upload');
    if (modeCamBtn) modeCamBtn.onclick = () => this.switchToCameraMode();
    if (modePhotoBtn) modePhotoBtn.onclick = () => {
      if (photoInput) photoInput.click();
    };

    // Snapshot preview modal buttons
    const snapClose = document.getElementById('btn-close-snap');
    if (snapClose) snapClose.onclick = () => this.closeSnapshotModal();

    const snapDownload = document.getElementById('btn-download-snap');
    if (snapDownload) snapDownload.onclick = () => this.downloadSnapshot();

    const snapWa = document.getElementById('btn-whatsapp-snap');
    if (snapWa) snapWa.onclick = () => this.shareSnapshotToWhatsApp();
  }

  updateControlLabels() {
    const scaleLabel = document.getElementById('vto-scale-value');
    if (scaleLabel) scaleLabel.textContent = `${Math.round(this.userScaleFactor * 100)}%`;
  }

  onHandResults(results) {
    if (!this.canvas || !this.isRunning) return;
    this.latestHandLandmarks = (results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0)
      ? results.multiHandLandmarks
      : null;
    this.latestHandedness = (results && results.multiHandedness) ? results.multiHandedness : null;
    if (this.currentMode === 'photo') {
      this.renderCurrentFrame();
    }
  }

  async preloadImage(src) {
    if (!src) return null;
    if (this.imageCache[src]) return this.imageCache[src];

    let loadUrl = src;
    // For remote HTTP/HTTPS images, attempt blob fetching with 2.5s timeout
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const ctrl = new AbortController();
        const tId = setTimeout(() => ctrl.abort(), 2500);
        const resp = await fetch(src, { mode: 'cors', signal: ctrl.signal });
        clearTimeout(tId);
        if (resp.ok) {
          const blob = await resp.blob();
          loadUrl = URL.createObjectURL(blob);
        }
      } catch (_) {
        loadUrl = src;
      }
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache[src] = img;
        resolve(img);
      };
      img.onerror = () => {
        console.warn('Failed to load try-on asset:', src);
        resolve(null);
      };
      img.src = loadUrl;
    });
  }

  async open(product) {
    this.init();
    if (!product.tryOn || !product.tryOn.enabled) {
      if (typeof autoClassifyTryOn === 'function') {
        product.tryOn = autoClassifyTryOn(product);
      } else {
        product.tryOn = {
          enabled: true,
          type: 'NECKLACE',
          asset: product.image || 'assets/tryon/kasu_mala_pendant.svg',
          fallbackAsset: 'assets/tryon/kasu_mala_pendant.svg',
          earringAsset: 'assets/tryon/peacock_jhumka.svg',
          scale: 1.45,
          offsetY: 45,
          label: product.name
        };
      }
      product.tryOn.enabled = true;
    }

    this.currentProduct = product;
    this.userScaleFactor = 1.0;
    this.userOffsetY = 0;
    this.smoothedPoints = {};
    this.updateControlLabels();

    const modal = document.getElementById('vto-modal');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }

    // Populate Product Card Header inside modal
    this.renderModalHeader(product);
    this.renderOrnamentSwitcher();

    // Start live camera immediately so user gets instant 60 FPS video feed without waiting
    this.switchToCameraMode();

    // Show AI 3D Conversion indicator
    const statusEl = document.getElementById('vto-status-pill');
    if (statusEl) {
      statusEl.innerHTML = `<i class="ri-sparkling-fill" style="color:var(--gold-400)"></i> Initializing Design: ${escapeHtml(product.name)}...`;
      statusEl.className = 'vto-status-pill loading';
    }

    // Convert exact catalogue / uploaded design in background
    this.prepare3DModelForProduct(product).then(() => {
      const s = document.getElementById('vto-status-pill');
      if (s) {
        s.innerHTML = `<i class="ri-checkbox-circle-fill" style="color:#10b981"></i> 3D Wearable Ready: ${escapeHtml(product.name)}`;
        s.className = 'vto-status-pill ready';
      }
    });
  }

  /* ==========================================================================
     3D COMPUTER VISION MODEL EXTRACTION (PHOTO -> 3D WEARABLE ASSET)
     ========================================================================== */

  async prepare3DModelForProduct(product) {
    if (!product) return;
    this.currentModel3D = null;
    this.currentEarring3D = null;

    try {
      // 1. Convert the exact product image into a transparent 3D-depth-mapped sprite
      this.currentModel3D = await this.getOrGenerate3DModel(product);

      // 2. If it's a choker or necklace, also prepare matching earrings
      const type = product.tryOn?.type || 'NECKLACE';
      if (type === 'CHOKER' || type === 'NECKLACE') {
        const earringSrc = product.tryOn?.earringAsset || 'assets/tryon/peacock_jhumka.svg';
        const earringImg = await this.preloadImage(earringSrc);
        if (earringImg) {
          const earringModel = this.extract3DWearableOrnament(earringImg, { tryOn: { type: 'EARRINGS' } });
          this.currentEarring3D = earringModel || {
            canvas: earringImg,
            width: earringImg.naturalWidth || 160,
            height: earringImg.naturalHeight || 260,
            aspect: (earringImg.naturalHeight || 260) / (earringImg.naturalWidth || 160),
            isExtracted: false
          };
        }
      }
    } catch (err) {
      console.warn('Could not complete 3D model preparation:', err);
    }
  }

  async getOrGenerate3DModel(product) {
    if (!product) return null;
    // Use the designated high-res try-on asset first, then fallback to product image
    const imageSrc = product.tryOn?.asset || product.image;
    if (!imageSrc) return null;

    const cacheKey = `${product.id || ''}_${imageSrc}`;
    if (this.model3DCache.has(cacheKey)) {
      return this.model3DCache.get(cacheKey);
    }

    try {
      const sourceImg = await this.preloadImage(imageSrc);
      if (sourceImg) {
        const model3D = this.extract3DWearableOrnament(sourceImg, product);
        if (model3D) {
          this.model3DCache.set(cacheKey, model3D);
          return model3D;
        }
      }
    } catch (err) {
      console.warn('3D model extraction note:', err);
    }

    // Fallback: If image cannot be read, use default vector template
    const fallbackSrc = product.tryOn?.fallbackAsset || this.getDefaultAssetForType(product.tryOn?.type);
    const fallbackImg = await this.preloadImage(fallbackSrc);
    if (fallbackImg) {
      const fallbackModel = {
        canvas: fallbackImg,
        width: fallbackImg.naturalWidth || 400,
        height: fallbackImg.naturalHeight || 400,
        aspect: (fallbackImg.naturalHeight || 400) / (fallbackImg.naturalWidth || 400),
        isExtracted: false
      };
      this.model3DCache.set(cacheKey, fallbackModel);
      return fallbackModel;
    }
    return null;
  }

  getDefaultAssetForType(type) {
    switch (type) {
      case 'EARRINGS': return 'assets/tryon/peacock_jhumka.svg';
      case 'CHOKER': return 'assets/tryon/guttapusalu_choker.svg';
      case 'MAANG_TIKKA': return 'assets/tryon/maang_tikka.svg';
      case 'BANGLES': return 'assets/tryon/peacock_kada_single_transparent.png';
      case 'RING': return 'assets/tryon/diamond_ring.svg';
      case 'NECKLACE':
      default: return 'assets/tryon/kasu_mala_pendant.svg';
    }
  }

  /**
   * Automatic Computer Vision Background Removal & 3D Contour Cropping
   * For vector SVGs and transparent PNGs, retains pristine native resolution and instant 0ms shadow generation.
   * For studio/velvet catalog photos, uses BFS perimeter flood-fill to keep gold and gems solid while cutting background.
   */
  extract3DWearableOrnament(img, product) {
    const origW = img.naturalWidth || img.width || 400;
    const origH = img.naturalHeight || img.height || 400;

    const isVectorOrClean = (img.src && (img.src.includes('.svg') || img.src.includes('_transparent.png')));
    // For vector SVGs and clean transparent PNGs, retain crisp resolution (max 800px)
    // For complex photo flood fills, scale to max 360px to prevent UI thread lockup
    const maxDim = isVectorOrClean ? 800 : 360;
    let procW = origW;
    let procH = origH;
    if (procW > maxDim || procH > maxDim) {
      const ratio = Math.min(maxDim / procW, maxDim / procH);
      procW = Math.round(procW * ratio);
      procH = Math.round(procH * ratio);
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = procW;
    offscreen.height = procH;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    offCtx.drawImage(img, 0, 0, procW, procH);

    let imgData;
    try {
      imgData = offCtx.getImageData(0, 0, procW, procH);
    } catch (corsErr) {
      // Return unextracted if cross-origin canvas security prevents pixel reading
      return {
        canvas: img,
        width: procW,
        height: procH,
        aspect: procH / procW,
        isExtracted: false
      };
    }

    const data = imgData.data;
    const totalPixels = procW * procH;

    // Check if image is already a transparent PNG / SVG
    let transparentCount = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 200) transparentCount++;
    }
    const alreadyTransparent = isVectorOrClean || ((transparentCount / totalPixels) > 0.06);

    if (!alreadyTransparent) {
      // 1. Comprehensive Perimeter Sampling (top 4 rows, bottom 4 rows, left 4 cols, right 4 cols)
      let sumR = 0, sumG = 0, sumB = 0, sampleCount = 0;
      let darkCount = 0, lightCount = 0;

      const samplePixel = (x, y) => {
        const idx = (y * procW + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        sumR += r; sumG += g; sumB += b; sampleCount++;
        if (lum < 100) darkCount++;
        if (lum > 150) lightCount++;
      };

      for (let x = 0; x < procW; x += 2) {
        for (let y = 0; y < 4; y++) samplePixel(x, y);
        for (let y = procH - 4; y < procH; y++) samplePixel(x, y);
      }
      for (let y = 4; y < procH - 4; y += 2) {
        for (let x = 0; x < 4; x++) samplePixel(x, y);
        for (let x = procW - 4; x < procW; x++) samplePixel(x, y);
      }

      const bgR = Math.round(sumR / Math.max(1, sampleCount));
      const bgG = Math.round(sumG / Math.max(1, sampleCount));
      const bgB = Math.round(sumB / Math.max(1, sampleCount));
      const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

      const isDarkVelvet = (darkCount > lightCount) || (bgLum < 105);
      const isLightStudio = !isDarkVelvet && (bgLum > 140);

      // Optical jewellery signature detector: protects gold, rubies, emeralds, diamonds, pearls, silver
      const isJewelleryPixel = (r, g, b) => {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        // 22K Gold: warm metallic yellow (high R & G, low B, warm ratio)
        if (r >= 105 && g >= 75 && r > b + 20 && g > b + 10 && ((r + g) / (2 * (b + 1)) > 1.20) && (r + g + b > 210)) return true;
        // Rubies / Kemp crimson stones
        if (r >= 115 && r > g * 1.35 && r > b * 1.25 && (r - g) > 35) return true;
        // Natural Emeralds
        if (g >= 78 && g > r * 1.05 && g > b * 1.05 && (g - r) > 10) return true;
        // Pearls (ivory sheen)
        if (r >= 140 && g >= 135 && b >= 115 && Math.abs(r - g) < 25 && (r + g + b > 410)) return true;
        // Diamonds / Specular sparkle on dark background
        if (isDarkVelvet && lum > 140 && (r + g + b > 380)) return true;
        // Polki / Diamonds on light background
        if (isLightStudio && lum < 185 && (Math.max(r, g, b) - Math.min(r, g, b) > 28)) return true;
        // Silver jewellery
        if (product?.metal === 'silver' && r > 110 && g > 110 && b > 110 && Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && lum > 120) return true;
        return false;
      };

      // Background Classifier for residual pixels (velvet folds / studio shadows)
      const isDefiniteBackground = (r, g, b) => {
        if (isJewelleryPixel(r, g, b)) return false;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (isDarkVelvet) {
          // Velvet folds in kasu_mala and gold_bangles: G is always < 55 and lum is < 95
          if (g < 55 && lum < 95) return true;
          if (g < 65 && r < 125 && b < 85 && lum < 105) return true;
          const dr = r - bgR, dg = g - bgG, db = b - bgB;
          if (Math.hypot(dr, dg, db) < 48) return true;
        } else if (isLightStudio) {
          // Studio backdrop & grey drop shadows: low chroma, neutral grey
          if (lum > 185 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) return true;
          // Grey shadow under jewellery (no gold warmth)
          if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16 && (r - b) < 20) return true;
          const dr = r - bgR, dg = g - bgG, db = b - bgB;
          if (Math.hypot(dr, dg, db) < 52) return true;
        } else {
          const dr = r - bgR, dg = g - bgG, db = b - bgB;
          if (Math.hypot(dr, dg, db) < 45) return true;
        }
        return false;
      };

      // 2. High-speed typed BFS queue
      const visited = new Uint8Array(totalPixels);
      const isBg = new Uint8Array(totalPixels);
      const queue = new Int32Array(totalPixels);
      let head = 0;
      let tail = 0;

      for (let x = 0; x < procW; x++) {
        let topPos = x;
        let topIdx = topPos * 4;
        if (!isJewelleryPixel(data[topIdx], data[topIdx + 1], data[topIdx + 2])) {
          queue[tail++] = topPos;
          visited[topPos] = 1;
          isBg[topPos] = 1;
        }
        let botPos = (procH - 1) * procW + x;
        let botIdx = botPos * 4;
        if (!isJewelleryPixel(data[botIdx], data[botIdx + 1], data[botIdx + 2])) {
          queue[tail++] = botPos;
          visited[botPos] = 1;
          isBg[botPos] = 1;
        }
      }

      for (let y = 0; y < procH; y++) {
        let leftPos = y * procW;
        let leftIdx = leftPos * 4;
        if (!visited[leftPos] && !isJewelleryPixel(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2])) {
          queue[tail++] = leftPos;
          visited[leftPos] = 1;
          isBg[leftPos] = 1;
        }
        let rightPos = y * procW + (procW - 1);
        let rightIdx = rightPos * 4;
        if (!visited[rightPos] && !isJewelleryPixel(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2])) {
          queue[tail++] = rightPos;
          visited[rightPos] = 1;
          isBg[rightPos] = 1;
        }
      }

      // 3. Seed Interior Enclosed Hollows
      const midX = Math.floor(procW / 2);
      for (let stepY = Math.floor(procH * 0.12); stepY <= Math.floor(procH * 0.70); stepY += 3) {
        for (let off = -Math.floor(procW * 0.28); off <= Math.floor(procW * 0.28); off += 4) {
          const checkX = midX + off;
          if (checkX > 2 && checkX < procW - 2) {
            const pos = stepY * procW + checkX;
            if (!visited[pos]) {
              const cIdx = pos * 4;
              const cr = data[cIdx], cg = data[cIdx + 1], cb = data[cIdx + 2];
              if (isDefiniteBackground(cr, cg, cb)) {
                queue[tail++] = pos;
                visited[pos] = 1;
                isBg[pos] = 1;
              }
            }
          }
        }
      }

      // 4. Fast BFS propagation
      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % procW;
        const cy = Math.floor(curr / procW);

        const neighbors = [
          cy > 0 ? curr - procW : -1,
          cy < procH - 1 ? curr + procW : -1,
          cx > 0 ? curr - 1 : -1,
          cx < procW - 1 ? curr + 1 : -1
        ];

        for (let n = 0; n < 4; n++) {
          const next = neighbors[n];
          if (next >= 0 && !visited[next]) {
            visited[next] = 1;
            const nIdx = next * 4;
            const nr = data[nIdx], ng = data[nIdx + 1], nb = data[nIdx + 2];
            if (isDefiniteBackground(nr, ng, nb)) {
              isBg[next] = 1;
              queue[tail++] = next;
            }
          }
        }
      }

      // 5. Apply Alpha Matting with Global Background Fallback & Edge Feathering
      for (let p = 0; p < totalPixels; p++) {
        const pIdx = p * 4;
        const pr = data[pIdx], pg = data[pIdx + 1], pb = data[pIdx + 2];

        if (isBg[p]) {
          data[pIdx + 3] = 0;
        } else if (isDefiniteBackground(pr, pg, pb)) {
          data[pIdx + 3] = 0;
        } else if (!isJewelleryPixel(pr, pg, pb)) {
          // Semi-transparent edge transition
          const lum = 0.299 * pr + 0.587 * pg + 0.114 * pb;
          if (isDarkVelvet && lum < 105) {
            data[pIdx + 3] = Math.max(0, Math.min(255, Math.round(((lum - 85) / 20) * 255)));
          } else if (isLightStudio && lum > 175) {
            data[pIdx + 3] = Math.max(0, Math.min(255, Math.round(((195 - lum) / 20) * 255)));
          }
        }
      }

      offCtx.putImageData(imgData, 0, 0);
    }

    // Auto-Crop tight around the extracted ornament
    const finalData = offCtx.getImageData(0, 0, procW, procH).data;
    let minX = procW, minY = procH, maxX = 0, maxY = 0;
    let visiblePixels = 0;

    for (let y = 0; y < procH; y++) {
      for (let x = 0; x < procW; x++) {
        const a = finalData[(y * procW + x) * 4 + 3];
        if (a > 30) {
          visiblePixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (visiblePixels < 80 || maxX <= minX || maxY <= minY) {
      const fallbackShadow = document.createElement('canvas');
      fallbackShadow.width = procW;
      fallbackShadow.height = procH;
      const fbCtx = fallbackShadow.getContext('2d');
      fbCtx.drawImage(offscreen, 0, 0);
      fbCtx.globalCompositeOperation = 'source-in';
      fbCtx.fillStyle = 'rgba(25, 12, 6, 0.75)';
      fbCtx.fillRect(0, 0, procW, procH);

      return {
        canvas: offscreen,
        shadowCanvas: fallbackShadow,
        width: procW,
        height: procH,
        aspect: procH / procW,
        isExtracted: true
      };
    }

    const pad = 4;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(procW - cropX, (maxX - minX) + pad * 2);
    const cropH = Math.min(procH - cropY, (maxY - minY) + pad * 2);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(offscreen, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Create realistic skin contact ambient occlusion shadow silhouette
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = cropW;
    shadowCanvas.height = cropH;
    const shadowCtx = shadowCanvas.getContext('2d');
    shadowCtx.drawImage(croppedCanvas, 0, 0);
    shadowCtx.globalCompositeOperation = 'source-in';
    shadowCtx.fillStyle = 'rgba(25, 12, 6, 0.75)';
    shadowCtx.fillRect(0, 0, cropW, cropH);

    const modelObj = {
      canvas: croppedCanvas,
      shadowCanvas: shadowCanvas,
      width: cropW,
      height: cropH,
      aspect: cropH / cropW,
      isExtracted: true
    };

    // If earring image contains a pair side-by-side (wider than tall)
    const ornamentType = product?.tryOn?.type;
    if (ornamentType === 'EARRINGS' && cropW > cropH * 1.05) {
      const halfW = Math.floor(cropW / 2);

      const leftCanvas = document.createElement('canvas');
      leftCanvas.width = halfW;
      leftCanvas.height = cropH;
      leftCanvas.getContext('2d').drawImage(croppedCanvas, 0, 0, halfW, cropH, 0, 0, halfW, cropH);

      const rightCanvas = document.createElement('canvas');
      rightCanvas.width = halfW;
      rightCanvas.height = cropH;
      rightCanvas.getContext('2d').drawImage(croppedCanvas, halfW, 0, halfW, cropH, 0, 0, halfW, cropH);

      modelObj.leftCanvas = leftCanvas;
      modelObj.rightCanvas = rightCanvas;
      modelObj.width = halfW;
      modelObj.aspect = cropH / halfW;
    }

    // If bangles: provide clean single bangle cuff to prevent clumps on wrists
    if (ornamentType === 'BANGLES') {
      if (this.imageCache['assets/tryon/peacock_kada_single.jpg']) {
        modelObj.singleBangleCanvas = this.imageCache['assets/tryon/peacock_kada_single.jpg'];
      } else if (cropW > cropH * 1.15) {
        const singleW = Math.floor(cropW * 0.65);
        const singleH = Math.floor(cropH * 0.75);
        const singleCanvas = document.createElement('canvas');
        singleCanvas.width = singleW;
        singleCanvas.height = singleH;
        singleCanvas.getContext('2d').drawImage(croppedCanvas, 0, Math.floor(cropH * 0.25), singleW, singleH, 0, 0, singleW, singleH);
        modelObj.singleBangleCanvas = singleCanvas;
      }
    }

    return modelObj;
  }

  renderModalHeader(product) {
    const titleEl = document.getElementById('vto-product-title');
    const skuEl = document.getElementById('vto-product-sku');
    const typeBadge = document.getElementById('vto-ornament-type-badge');
    const bangleToggle = document.getElementById('btn-vto-bangle-mode');

    if (titleEl) titleEl.textContent = product.name;
    if (skuEl) skuEl.textContent = product.sku || '';
    if (typeBadge) {
      const typeLabel = product.tryOn?.label || product.tryOn?.type || 'Jewellery';
      typeBadge.innerHTML = `<i class="ri-sparkling-fill"></i> ${typeLabel}`;
    }

    if (bangleToggle) {
      if (product.tryOn?.type === 'BANGLES') {
        bangleToggle.style.display = 'inline-flex';
        bangleToggle.textContent = (this.bangleStackMode === 'single') ? '1 Bangle' : 'Pair Stack';
      } else {
        bangleToggle.style.display = 'none';
      }
    }
  }

  renderOrnamentSwitcher() {
    const tray = document.getElementById('vto-ornament-tray');
    if (!tray) return;

    // Ensure all items in catalogue are classified so any newly added design appears
    if (Array.isArray(PRODUCTS_DATA)) {
      PRODUCTS_DATA.forEach(p => {
        if (!p.tryOn && typeof autoClassifyTryOn === 'function') {
          p.tryOn = autoClassifyTryOn(p);
        }
      });
    }

    // Filter catalogue products that have tryOn enabled
    const tryOnItems = PRODUCTS_DATA.filter(p => p.tryOn && p.tryOn.enabled);
    if (tryOnItems.length === 0) return;

    tray.innerHTML = tryOnItems.map(item => {
      const isSelected = item.id === this.currentProduct.id;
      const thumb = item.tryOn.asset || item.image;
      const label = item.tryOn.label || item.name.split(' ').slice(0, 3).join(' ');
      return `
        <button type="button" class="vto-tray-btn ${isSelected ? 'active' : ''}" data-id="${item.id}" title="${escapeHtml(item.name)}">
          <img src="${thumb}" alt="${escapeHtml(item.name)}" onerror="this.src='${item.image}'">
          <span>${escapeHtml(label)}</span>
        </button>
      `;
    }).join('');

    tray.querySelectorAll('.vto-tray-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const next = PRODUCTS_DATA.find(p => p.id === id);
        if (next) {
          if (!next.tryOn && typeof autoClassifyTryOn === 'function') {
            next.tryOn = autoClassifyTryOn(next);
          }
          if (next.tryOn) next.tryOn.enabled = true;
          this.currentProduct = next;
          this.smoothedPoints = {};
          this.latestHandLandmarks = null;
          this.latestFaceLandmarks = null;
          const statusEl = document.getElementById('vto-status-pill');
          if (statusEl) {
            statusEl.innerHTML = `<i class="ri-sparkling-fill" style="color:var(--gold-400)"></i> Initializing ${escapeHtml(next.name)}...`;
            statusEl.className = 'vto-status-pill loading';
          }
          this.renderModalHeader(next);
          this.renderOrnamentSwitcher();
          await this.prepare3DModelForProduct(next);
        }
      };
    });
  }

  stopCamera() {
    this.isRunning = false;
    if (this.renderLoopId) {
      cancelAnimationFrame(this.renderLoopId);
      this.renderLoopId = null;
    }
    if (this.aiTimerId) {
      clearTimeout(this.aiTimerId);
      this.aiTimerId = null;
    }
    if (this.camera) {
      try { this.camera.stop(); } catch (_) {}
      this.camera = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(track => track.stop());
      } catch (_) {}
      this.mediaStream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  async switchToCameraMode() {
    this.currentMode = 'camera';
    const statusEl = document.getElementById('vto-status-pill');
    if (statusEl) {
      statusEl.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Starting camera & AI...`;
      statusEl.className = 'vto-status-pill loading';
    }

    const privBanner = document.getElementById('vto-privacy-banner');
    if (privBanner) privBanner.style.display = 'none';

    const uploadArea = document.getElementById('vto-upload-placeholder');
    if (uploadArea) uploadArea.style.display = 'none';

    try {
      this.stopCamera();

      this.canvas.width = 640;
      this.canvas.height = 480;

      // 1. Acquire video stream directly via MediaDevices
      let stream = null;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: this.facingMode,
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });
        } catch (e1) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: this.facingMode },
            audio: false
          });
        }
      }

      if (stream) {
        this.mediaStream = stream;
        this.video.srcObject = stream;
        await this.video.play();
        this.canvas.width = this.video.videoWidth || 640;
        this.canvas.height = this.video.videoHeight || 480;
      } else if (typeof Camera !== 'undefined') {
        this.camera = new Camera(this.video, {
          onFrame: async () => {},
          width: 640,
          height: 480,
          facingMode: this.facingMode
        });
        await this.camera.start();
      }

      this.isRunning = true;
      this.isProcessingFrame = false;

      // 2. Start Decoupled 60 FPS Render Loop (crystal-clear, never freezes)
      this.startRenderLoop();

      // 3. Start Decoupled Background AI Loop (~30 FPS lightweight detection)
      this.startAiLoop();

      if (statusEl) {
        statusEl.innerHTML = `<i class="ri-focus-3-line"></i> Camera active & tracking`;
        statusEl.className = 'vto-status-pill ready';
      }
    } catch (err) {
      console.warn('Camera access issue:', err);
      if (statusEl) {
        statusEl.innerHTML = `<i class="ri-camera-off-line"></i> Camera unavailable. Try Photo Upload!`;
        statusEl.className = 'vto-status-pill warning';
      }
    }
  }

  startRenderLoop() {
    if (this.renderLoopId) {
      cancelAnimationFrame(this.renderLoopId);
      this.renderLoopId = null;
    }

    const render = () => {
      if (!this.isRunning || this.currentMode !== 'camera') return;
      try {
        this.renderCurrentFrame();
      } catch (renderErr) {
        // Safe catch - render loop never stops on any drawing error
      }
      if (this.isRunning && this.currentMode === 'camera') {
        this.renderLoopId = requestAnimationFrame(render);
      }
    };

    this.renderLoopId = requestAnimationFrame(render);
  }

  startAiLoop() {
    if (this.aiTimerId) {
      clearTimeout(this.aiTimerId);
      this.aiTimerId = null;
    }

    const process = async () => {
      if (!this.isRunning || this.currentMode !== 'camera') return;

      // Always schedule next frame check first so timer loop NEVER dies
      this.aiTimerId = setTimeout(process, 33);

      if (this.isProcessingFrame) {
        // If an inference has been hung for > 450ms, unlock watchdog
        if (Date.now() - (this.lastAiStartTime || 0) > 450) {
          this.isProcessingFrame = false;
        } else {
          return;
        }
      }

      if (!this.video || this.video.readyState < 2 || this.video.paused) return;

      this.isProcessingFrame = true;
      this.lastAiStartTime = Date.now();

      try {
        const currentType = this.currentProduct?.tryOn?.type || 'NECKLACE';
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI inference timeout')), 350));

        if (currentType === 'BANGLES' || currentType === 'RING') {
          if (!this.hands) this.initHands();
          if (this.hands) {
            await Promise.race([this.hands.send({ image: this.video }), timeoutPromise]);
          }
        } else {
          if (!this.faceMesh) this.initFaceMesh();
          if (this.faceMesh) {
            await Promise.race([this.faceMesh.send({ image: this.video }), timeoutPromise]);
          }
        }
      } catch (e) {
        // Safe ignore frame drops / timeout
      } finally {
        this.isProcessingFrame = false;
      }
    };

    this.aiTimerId = setTimeout(process, 33);
  }

  renderCurrentFrame() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;

    // Dynamically synchronize canvas resolution with active video stream
    if (this.currentMode === 'camera' && this.video && this.video.videoWidth > 0) {
      if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
      }
    }

    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (this.currentMode === 'camera') {
      if (this.facingMode === 'user') {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      if (this.video && this.video.readyState >= 2) {
        ctx.drawImage(this.video, 0, 0, w, h);
      }
    } else if (this.currentMode === 'photo' && this.photoImage) {
      ctx.drawImage(this.photoImage, 0, 0, w, h);
    }

    const tryOnConfig = this.currentProduct?.tryOn || {};
    const ornamentType = tryOnConfig.type || 'NECKLACE';

    if (ornamentType === 'BANGLES') {
      this.drawBangles(ctx, w, h, tryOnConfig);
    } else if (ornamentType === 'RING') {
      this.drawRing(ctx, w, h, tryOnConfig);
    } else {
      this.drawFaceOrnaments(ctx, w, h, ornamentType, tryOnConfig);
    }

    ctx.restore();
  }

  drawFaceOrnaments(ctx, w, h, ornamentType, tryOnConfig) {
    const statusEl = document.getElementById('vto-status-pill');
    const raw = this.latestFaceLandmarks;

    if (raw) {
      if (statusEl && !statusEl.classList.contains('active-tracking')) {
        statusEl.innerHTML = `<i class="ri-sparkling-fill" style="color:var(--gold-400)"></i> Adorned & Tracking Live`;
        statusEl.className = 'vto-status-pill active-tracking';
      }

      const leftLobeRaw = raw[234] || raw[132] || raw[58];
      const rightLobeRaw = raw[454] || raw[361] || raw[288];
      const chinRaw = raw[152];
      const foreheadRaw = raw[10];
      const noseRaw = raw[1];

      if (!leftLobeRaw || !rightLobeRaw || !chinRaw || !foreheadRaw || !noseRaw) return;

      const leftLobe = this.smoothPoint('leftLobe', leftLobeRaw.x * w, leftLobeRaw.y * h, leftLobeRaw.z);
      const rightLobe = this.smoothPoint('rightLobe', rightLobeRaw.x * w, rightLobeRaw.y * h, rightLobeRaw.z);
      const chin = this.smoothPoint('chin', chinRaw.x * w, chinRaw.y * h, chinRaw.z);
      const forehead = this.smoothPoint('forehead', foreheadRaw.x * w, foreheadRaw.y * h, foreheadRaw.z);
      const nose = this.smoothPoint('nose', noseRaw.x * w, noseRaw.y * h, noseRaw.z);

      const earDistance = Math.hypot(rightLobe.x - leftLobe.x, rightLobe.y - leftLobe.y);
      const headRollAngle = Math.atan2(rightLobe.y - leftLobe.y, rightLobe.x - leftLobe.x);

      const midEarX = (leftLobe.x + rightLobe.x) / 2;
      const midEarY = (leftLobe.y + rightLobe.y) / 2;
      const yawAngle = Math.max(-0.65, Math.min(0.65, (nose.x - midEarX) / (earDistance * 0.45)));

      const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);
      const pitchAngle = Math.max(-0.55, Math.min(0.55, ((nose.y - midEarY) / (faceHeight * 0.28)) - 0.22));

      if (ornamentType === 'EARRINGS') {
        this.drawEarrings(ctx, leftLobe, rightLobe, earDistance, headRollAngle, yawAngle, tryOnConfig);
      } else if (ornamentType === 'CHOKER') {
        this.drawChoker(ctx, chin, leftLobe, rightLobe, nose, forehead, earDistance, headRollAngle, yawAngle, pitchAngle, tryOnConfig);
        if (this.showMatchingEarrings && (this.currentEarring3D || tryOnConfig.earringAsset)) {
          this.drawEarrings(ctx, leftLobe, rightLobe, earDistance, headRollAngle, yawAngle, { asset: tryOnConfig.earringAsset, scale: 0.20, offsetY: 0 });
        }
      } else if (ornamentType === 'NECKLACE') {
        this.drawLongHaram(ctx, chin, leftLobe, rightLobe, nose, forehead, earDistance, headRollAngle, yawAngle, pitchAngle, tryOnConfig);
        if (this.showMatchingEarrings && (this.currentEarring3D || tryOnConfig.earringAsset)) {
          this.drawEarrings(ctx, leftLobe, rightLobe, earDistance, headRollAngle, yawAngle, { asset: tryOnConfig.earringAsset, scale: 0.20, offsetY: 0 });
        }
      } else if (ornamentType === 'MAANG_TIKKA') {
        this.drawMaangTikka(ctx, forehead, nose, chin, earDistance, headRollAngle, yawAngle, tryOnConfig);
      } else if (ornamentType === 'VADDANAM') {
        this.drawVaddanam(ctx, chin, earDistance, headRollAngle, yawAngle, tryOnConfig);
      } else if (ornamentType === 'ANKLETS') {
        this.drawAnklets(ctx, w, h, tryOnConfig);
      }
    } else {
      if (statusEl) {
        statusEl.innerHTML = `<i class="ri-user-search-line"></i> Please look at the camera`;
        statusEl.className = 'vto-status-pill searching';
      }
    }
  }

  flipCamera() {
    this.facingMode = (this.facingMode === 'user') ? 'environment' : 'user';
    this.switchToCameraMode();
  }

  loadUserPhoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        this.stopCamera();
        this.currentMode = 'photo';
        this.photoImage = img;

        const privBanner = document.getElementById('vto-privacy-banner');
        if (privBanner) privBanner.style.display = 'flex';

        const statusEl = document.getElementById('vto-status-pill');
        if (statusEl) {
          statusEl.innerHTML = `<i class="ri-scan-line"></i> Analyzing photo (In-Memory)...`;
          statusEl.className = 'vto-status-pill loading';
        }

        this.canvas.width = img.naturalWidth || 640;
        this.canvas.height = img.naturalHeight || 480;

        const currentType = this.currentProduct?.tryOn?.type;
        if (currentType === 'BANGLES' || currentType === 'RING') {
          if (this.hands) await this.hands.send({ image: img });
        } else if (this.faceMesh) {
          await this.faceMesh.send({ image: img });
        }
        this.renderCurrentFrame();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  close() {
    this.stopCamera();

    const modal = document.getElementById('vto-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }
  }

  /* ==========================================================================
     3D ANATOMICAL DRAPING & PHYSICAL PERSPECTIVE ENGINE
     ========================================================================== */

  /**
   * 3D Anatomical Drape Renderer for Necklaces and Chokers
   * - Soft ambient skin contact shadow beneath the metal
   * - 28-strip cylindrical mesh wrap conforming to neck/chest curves
   * - 3D head yaw perspective foreshortening & depth tilt
   * - Specular luster gleam masked strictly to jewellery pixels via buffer
   */
  render3DAnatomicalDrape(ctx, model, anchorX, anchorY, targetWidth, targetHeight, rollAngle, yawAngle, type) {
    if (!model || !model.canvas) return;

    ctx.save();
    // 1. Position and roll rotation anchored to the neck / chest
    ctx.translate(anchorX + (this.userOffsetX || 0), anchorY);
    ctx.rotate(rollAngle + (this.userRotation || 0));

    // 2. Render realistic skin contact ambient occlusion shadow FIRST
    if (model.shadowCanvas) {
      ctx.save();
      ctx.globalAlpha = 0.30;
      const shadowOffX = 2 - (yawAngle * 6);
      const shadowOffY = 6;
      this.renderCurvedMesh(ctx, model.shadowCanvas, targetWidth, targetHeight, yawAngle, type, shadowOffX, shadowOffY, true);
      ctx.restore();
    }

    // 3. Render 3D sliced curved mesh into isolated offscreen buffer
    const padW = Math.ceil(targetWidth * 0.25);
    const padH = Math.ceil(targetHeight * 0.35);
    const bufW = Math.ceil(targetWidth + padW * 2);
    const bufH = Math.ceil(targetHeight + padH * 2);

    const buf = this.getJewelleryBuffer(bufW, bufH);
    const bCtx = buf.ctx;
    const centerX = bufW / 2;
    const centerY = padH;

    bCtx.save();
    bCtx.translate(centerX, centerY);
    this.renderCurvedMesh(bCtx, model.canvas, targetWidth, targetHeight, yawAngle, type, 0, 0, false);

    // 4. Render specular luster overlay: masked STRICTLY over jewellery pixels (source-atop)
    this.renderSpecularLuster(bCtx, targetWidth, targetHeight, yawAngle, rollAngle);
    bCtx.restore();

    // 5. Composite lighted jewellery cleanly onto main canvas with zero rectangular glare
    ctx.drawImage(buf.canvas, -centerX, -centerY);

    ctx.restore();
  }

  /**
   * 28-Slice Cylindrical Mesh Slicing Algorithm
   * Wraps the flat jewellery photo around the cylindrical 3D contour of the neck.
   */
  renderCurvedMesh(ctx, sourceCanvas, targetW, targetH, yaw, type, offX = 0, offY = 0, isShadow = false) {
    const sW = sourceCanvas.width;
    const sH = sourceCanvas.height;
    if (!sW || !sH) return;

    const numSlices = 28;
    const sliceSrcW = sW / numSlices;
    const sliceBaseDestW = targetW / numSlices;

    const isChoker = (type === 'CHOKER');
    const wrapAngleMax = isChoker ? 1.05 : 0.85; // radians around cylinder
    const sagStrength = isChoker ? (targetH * 0.08) : (targetH * 0.05);

    for (let i = 0; i < numSlices; i++) {
      const u = (i + 0.5) / numSlices; // 0..1 from left to right
      const s = (u - 0.5) * 2;        // -1..+1 from left edge to right edge

      // 1. Source strip coordinates
      const sx = Math.floor(i * sliceSrcW);
      const sw = Math.ceil(sliceSrcW);
      const sy = 0;
      const sh = sH;

      // 2. Cylindrical Foreshortening
      const cylinderAngle = s * wrapAngleMax;
      const cosAngle = Math.cos(cylinderAngle);

      // 3. 3D Head Yaw Perspective Compression
      const perspectiveScale = Math.max(0.2, 1.0 - (s * yaw * 0.40));
      const destW = Math.max(1, sliceBaseDestW * cosAngle * perspectiveScale) + 0.85;

      // 4. Horizontal Position around cylinder
      const sinAngle = Math.sin(cylinderAngle);
      const destX = (sinAngle * (targetW / 2) * 0.96) - (destW / 2) + offX + (yaw * 8 * (1 - s * s));

      // 5. Vertical Position: Parabolic neck wrap sag + yaw tilt
      const curvatureRise = -(s * s) * sagStrength;
      const yawTiltY = (s * yaw * targetH * 0.14);
      const destY = curvatureRise + yawTiltY + offY;

      // 6. Height scaling with perspective
      const destH = targetH * (1.0 - Math.abs(yaw) * 0.06 * Math.abs(s));

      ctx.drawImage(
        sourceCanvas,
        sx, sy, sw, sh,
        destX, destY, destW, destH
      );
    }
  }

  /**
   * Dynamic Metallic Luster & Showroom Reflection Gleam
   * Restricted to jewellery pixels via source-atop composition
   */
  renderSpecularLuster(ctx, targetW, targetH, yaw, roll) {
    ctx.save();
    const sheenX = (yaw * targetW * 0.35);
    const grad = ctx.createLinearGradient(
      sheenX - targetW * 0.28, 0,
      sheenX + targetW * 0.28, targetH
    );
    grad.addColorStop(0, 'rgba(255, 235, 180, 0)');
    grad.addColorStop(0.35, 'rgba(255, 245, 215, 0.06)');
    grad.addColorStop(0.5, 'rgba(255, 255, 240, 0.32)');
    grad.addColorStop(0.65, 'rgba(255, 245, 215, 0.06)');
    grad.addColorStop(1, 'rgba(255, 235, 180, 0)');

    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.rect(-targetW / 2 - 20, -10, targetW + 40, targetH + 20);
    ctx.fill();
    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     1. Earrings / Jhumkas / Buttalu
     -------------------------------------------------------------------------- */
  drawEarrings(ctx, leftLobe, rightLobe, earDistance, rollAngle, yawAngle, config) {
    const isMainEarring = (this.currentProduct?.tryOn?.type === 'EARRINGS');
    const model = isMainEarring ? this.currentModel3D : (this.currentEarring3D || null);

    const assetImg = model?.canvas || (config.asset && this.imageCache[config.asset]) || this.imageCache['assets/tryon/peacock_jhumka.svg'];
    if (!assetImg) return;

    const baseScale = (config.scale || 0.22) * this.userScaleFactor;
    const earringWidth = earDistance * baseScale;
    const aspect = model?.aspect || ((assetImg.naturalHeight || 260) / (assetImg.naturalWidth || 160));
    const earringHeight = earringWidth * aspect;
    const userOffY = (config.offsetY || 0) + this.userOffsetY;

    // Natural pendulum physics: gravity keeps earrings mostly hanging downward
    const swingAngle = rollAngle * 0.22;

    const leftSprite = model?.leftCanvas || assetImg;
    const rightSprite = model?.rightCanvas || assetImg;
    const isSingleMirrored = !model?.leftCanvas;

    // True anatomical earlobe positioning (lower than tragus, hanging slightly outward)
    const cosRoll = Math.cos(rollAngle);
    const sinRoll = Math.sin(rollAngle);
    const lobeDown = earDistance * 0.10;
    const lobeOut = earDistance * 0.04;

    const leftX = leftLobe.x - (cosRoll * lobeOut) - (sinRoll * lobeDown);
    const leftY = leftLobe.y - (sinRoll * lobeOut) + (cosRoll * lobeDown);

    const rightX = rightLobe.x + (cosRoll * lobeOut) - (sinRoll * lobeDown);
    const rightY = rightLobe.y + (sinRoll * lobeOut) + (cosRoll * lobeDown);

    // 1. Draw Left Earring (Screen Left, User's Right Ear if selfie mirrored)
    const leftScaleX = Math.max(0.2, (1.0 - yawAngle * 0.35) * Math.cos(Math.max(-0.8, Math.min(0.8, yawAngle))));
    const leftScaleY = Math.max(0.4, 1.0 - yawAngle * 0.15);
    const leftAlpha = Math.max(0.0, Math.min(1.0, 1.0 - (yawAngle - 0.25) * 2.5));

    if (leftAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = leftAlpha;
      ctx.translate(leftX + (this.userOffsetX || 0), leftY + userOffY);
      ctx.rotate(swingAngle + (this.userRotation || 0));
      ctx.scale(leftScaleX, leftScaleY);

      // Contact shadow on skin
      if (model?.shadowCanvas) {
        ctx.save();
        ctx.globalAlpha = 0.30 * leftAlpha;
        ctx.drawImage(model.shadowCanvas, -earringWidth / 2 + 2, 5, earringWidth, earringHeight);
        ctx.restore();
      }

      if (isSingleMirrored) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(leftSprite, -earringWidth / 2, 0, earringWidth, earringHeight);
      ctx.restore();
    }

    // 2. Draw Right Earring (Screen Right)
    const rightScaleX = Math.max(0.2, (1.0 + yawAngle * 0.35) * Math.cos(Math.max(-0.8, Math.min(0.8, yawAngle))));
    const rightScaleY = Math.max(0.4, 1.0 + yawAngle * 0.15);
    const rightAlpha = Math.max(0.0, Math.min(1.0, 1.0 + (yawAngle + 0.25) * 2.5));

    if (rightAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = rightAlpha;
      ctx.translate(rightX + (this.userOffsetX || 0), rightY + userOffY);
      ctx.rotate(swingAngle + (this.userRotation || 0));
      ctx.scale(rightScaleX, rightScaleY);

      // Contact shadow on skin
      if (model?.shadowCanvas) {
        ctx.save();
        ctx.globalAlpha = 0.30 * rightAlpha;
        ctx.drawImage(model.shadowCanvas, -earringWidth / 2 + 2, 5, earringWidth, earringHeight);
        ctx.restore();
      }

      ctx.drawImage(rightSprite, -earringWidth / 2, 0, earringWidth, earringHeight);
      ctx.restore();
    }
  }

  /* --------------------------------------------------------------------------
     2. Guttapusalu Choker / Short Bridal Necklace
     -------------------------------------------------------------------------- */
  drawChoker(ctx, chin, leftLobe, rightLobe, nose, forehead, earDistance, rollAngle, yawAngle, pitchAngle, config) {
    let model = this.currentModel3D;
    const baseScale = (config.scale || 1.18) * this.userScaleFactor;
    const chokerWidth = earDistance * baseScale;
    
    if (!model || !model.canvas) {
      const assetImg = (config.asset && this.imageCache[config.asset]) || this.imageCache['assets/tryon/guttapusalu_choker.svg'];
      if (assetImg) {
        model = {
          canvas: assetImg,
          width: assetImg.naturalWidth || 460,
          height: assetImg.naturalHeight || 220,
          aspect: (assetImg.naturalHeight || 220) / (assetImg.naturalWidth || 460)
        };
      }
    }
    if (!model || !model.canvas) return;

    const chokerHeight = chokerWidth * model.aspect;
    const userOffY = (config.offsetY || 0) + this.userOffsetY;
    const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);

    // Anatomical mid-neck placement: ~22% of faceHeight below chin, adapting to vertical pitch tilt
    const neckDrop = (faceHeight * 0.22) + (pitchAngle * faceHeight * 0.20);
    const anchorX = chin.x + (yawAngle * earDistance * 0.10);
    const anchorY = chin.y + neckDrop + userOffY;

    this.render3DAnatomicalDrape(ctx, model, anchorX, anchorY, chokerWidth, chokerHeight, rollAngle, yawAngle, 'CHOKER');
  }

  /* --------------------------------------------------------------------------
     3. Kasu Mala / Long Haram Necklace
     -------------------------------------------------------------------------- */
  drawLongHaram(ctx, chin, leftLobe, rightLobe, nose, forehead, earDistance, rollAngle, yawAngle, pitchAngle, config) {
    let model = this.currentModel3D;
    const baseScale = (config.scale || 1.38) * this.userScaleFactor;
    const haramWidth = earDistance * baseScale;

    if (!model || !model.canvas) {
      const assetImg = (config.asset && this.imageCache[config.asset]) || this.imageCache['assets/tryon/kasu_mala_pendant.svg'];
      if (assetImg) {
        model = {
          canvas: assetImg,
          width: assetImg.naturalWidth || 480,
          height: assetImg.naturalHeight || 320,
          aspect: (assetImg.naturalHeight || 320) / (assetImg.naturalWidth || 480)
        };
      }
    }
    if (!model || !model.canvas) return;

    const haramHeight = haramWidth * model.aspect;
    const userOffY = (config.offsetY || 0) + this.userOffsetY;
    const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);

    // Suprasternal notch (collarbone hollow) placement: ~36% of faceHeight below chin
    const collarDrop = (faceHeight * 0.36) + (pitchAngle * faceHeight * 0.26);
    const anchorX = chin.x + (yawAngle * earDistance * 0.12);
    const anchorY = chin.y + collarDrop + userOffY;

    this.render3DAnatomicalDrape(ctx, model, anchorX, anchorY, haramWidth, haramHeight, rollAngle, yawAngle, 'NECKLACE');
  }

  /* --------------------------------------------------------------------------
     4. Papidi Billa / Maang Tikka
     -------------------------------------------------------------------------- */
  drawMaangTikka(ctx, forehead, nose, chin, earDistance, rollAngle, yawAngle, config) {
    let model = this.currentModel3D;
    const baseScale = (config.scale || 0.26) * this.userScaleFactor;
    const tikkaWidth = earDistance * baseScale;

    if (!model || !model.canvas) {
      const assetImg = (config.asset && this.imageCache[config.asset]) || this.imageCache['assets/tryon/maang_tikka.svg'];
      if (assetImg) {
        model = {
          canvas: assetImg,
          width: assetImg.naturalWidth || 140,
          height: assetImg.naturalHeight || 220,
          aspect: (assetImg.naturalHeight || 220) / (assetImg.naturalWidth || 140)
        };
      }
    }
    if (!model || !model.canvas) return;

    const tikkaHeight = tikkaWidth * model.aspect;
    const userOffY = (config.offsetY || 0) + this.userOffsetY;
    const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);

    // Medallion rests in upper third of forehead (approx 16% of face height below hairline point 10)
    const anchorX = forehead.x + (yawAngle * earDistance * 0.08);
    const anchorY = forehead.y + (faceHeight * 0.16) + userOffY;

    ctx.save();
    ctx.translate(anchorX, anchorY);
    ctx.rotate(rollAngle + (yawAngle * 0.15));

    // Forehead contact shadow
    if (model.shadowCanvas) {
      ctx.save();
      ctx.globalAlpha = 0.30;
      ctx.drawImage(model.shadowCanvas, -tikkaWidth / 2 + 1, 3, tikkaWidth, tikkaHeight);
      ctx.restore();
    }

    // Isolated buffer for specular glint
    const buf = this.getJewelleryBuffer(tikkaWidth * 1.2, tikkaHeight * 1.2);
    const bCtx = buf.ctx;
    const bW = buf.canvas.width;
    const bH = buf.canvas.height;
    bCtx.save();
    bCtx.translate(bW / 2, bH * 0.1);
    bCtx.drawImage(model.canvas, -tikkaWidth / 2, 0, tikkaWidth, tikkaHeight);
    this.renderSpecularLuster(bCtx, tikkaWidth, tikkaHeight, yawAngle, rollAngle);
    bCtx.restore();

    ctx.drawImage(buf.canvas, -bW / 2, -bH * 0.1);
    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     5. Bangles / Kadas / Bracelets (Wrist Landmark Tracking)
     -------------------------------------------------------------------------- */
  drawBangles(ctx, w, h, config) {
    const model = this.currentModel3D;
    const hands = this.latestHandLandmarks;

    if (hands && hands.length > 0) {
      hands.forEach((hand, handIdx) => {
        const wristRaw = hand[0]; // WRIST landmark
        const mcpRaw = hand[9];   // MIDDLE_FINGER_MCP landmark
        if (!wristRaw || !mcpRaw) return;

        // Smooth hand landmarks for jitter-free tracking
        const wrist = this.smoothPoint(`hand_${handIdx}_wrist`, wristRaw.x * w, wristRaw.y * h, wristRaw.z);
        const mcp = this.smoothPoint(`hand_${handIdx}_mcp`, mcpRaw.x * w, mcpRaw.y * h, mcpRaw.z);

        const vx = wrist.x - mcp.x;
        const vy = wrist.y - mcp.y;
        const handLen = Math.hypot(vx, vy);
        if (handLen < 15) return;

        const ux = vx / handLen;
        const uy = vy / handLen;
        const angle = Math.atan2(vy, vx) - Math.PI / 2;

        let palmWidth = handLen * 0.75;
        if (hand[1] && hand[17]) {
          const pt1 = this.smoothPoint(`hand_${handIdx}_thumb_cmc`, hand[1].x * w, hand[1].y * h);
          const pt17 = this.smoothPoint(`hand_${handIdx}_pinky_mcp`, hand[17].x * w, hand[17].y * h);
          palmWidth = Math.hypot(pt17.x - pt1.x, pt17.y - pt1.y);
        }

        const bangleWidth = Math.max(50, Math.min(220, palmWidth * 1.18 * (config.scale || 0.70) * this.userScaleFactor));
        const aspect = model?.aspect || 0.45;
        const bangleHeight = bangleWidth * aspect;

        const baseForearmOffset = handLen * 0.18;
        const sprite = model?.singleBangleCanvas || model?.canvas || this.imageCache['assets/tryon/peacock_kada_single_transparent.png'] || this.imageCache['assets/tryon/peacock_kada_single.jpg'];

        const banglesCount = (hands.length >= 2 || this.bangleStackMode === 'single') ? 1 : 2;

        for (let bIdx = 0; bIdx < banglesCount; bIdx++) {
          const stackShift = bIdx * (bangleWidth * 0.22);
          const bx = wrist.x + ux * (baseForearmOffset + stackShift) + (this.userOffsetX || 0);
          const by = wrist.y + uy * (baseForearmOffset + stackShift) + this.userOffsetY;

          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(angle + (this.userRotation || 0));

          if (model?.shadowCanvas) {
            ctx.save();
            ctx.globalAlpha = 0.32;
            ctx.drawImage(model.shadowCanvas, -bangleWidth / 2 + 2, 4, bangleWidth, bangleHeight);
            ctx.restore();
          }

          if (sprite) {
            ctx.drawImage(sprite, -bangleWidth / 2, -bangleHeight / 2, bangleWidth, bangleHeight);
          }

          ctx.restore();
        }
      });

      const statusEl = document.getElementById('vto-status-pill');
      if (statusEl) {
        statusEl.innerHTML = `<i class="ri-sparkling-fill" style="color:var(--gold-400)"></i> Bangles Fitted on Wrists & Tracking`;
        statusEl.className = 'vto-status-pill active-tracking';
      }
    } else {
      const statusEl = document.getElementById('vto-status-pill');
      if (statusEl) {
        statusEl.innerHTML = `<i class="ri-hand-coin-line"></i> Raise wrists to camera for Bangles`;
        statusEl.className = 'vto-status-pill searching';
      }
      this.renderWristGuideOverlay(ctx, w, h, '👋 Please raise your wrists to the camera to wear Bangles');
    }
  }

  /* --------------------------------------------------------------------------
     6. Precious Rings (Finger Landmark Tracking)
     -------------------------------------------------------------------------- */
  drawRing(ctx, w, h, config) {
    const model = this.currentModel3D;
    const hands = this.latestHandLandmarks;

    if (hands && hands.length > 0) {
      const hand = hands[0];
      const mcpRaw = hand[13]; // RING_FINGER_MCP
      const pipRaw = hand[14]; // RING_FINGER_PIP
      if (mcpRaw && pipRaw) {
        const mcp = this.smoothPoint('ring_mcp', mcpRaw.x * w, mcpRaw.y * h);
        const pip = this.smoothPoint('ring_pip', pipRaw.x * w, pipRaw.y * h);

        const ringX = mcp.x + (pip.x - mcp.x) * 0.45;
        const ringY = mcp.y + (pip.y - mcp.y) * 0.45;
        const angle = Math.atan2(pip.y - mcp.y, pip.x - mcp.x) + Math.PI / 2;
        const fingerLength = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);
        const ringWidth = Math.max(24, fingerLength * (config.scale || 0.45) * this.userScaleFactor);
        const aspect = model?.aspect || 1.0;
        const ringHeight = ringWidth * aspect;

        ctx.save();
        ctx.translate(ringX + (this.userOffsetX || 0), ringY + this.userOffsetY);
        ctx.rotate(angle + (this.userRotation || 0));

        if (model?.shadowCanvas) {
          ctx.save();
          ctx.globalAlpha = 0.32;
          ctx.drawImage(model.shadowCanvas, -ringWidth / 2 + 1, 2, ringWidth, ringHeight);
          ctx.restore();
        }

        const sprite = model?.canvas || this.imageCache['assets/tryon/diamond_ring.svg'];
        if (sprite) {
          ctx.drawImage(sprite, -ringWidth / 2, -ringHeight / 2, ringWidth, ringHeight);
        }

        ctx.restore();

        const statusEl = document.getElementById('vto-status-pill');
        if (statusEl) {
          statusEl.innerHTML = `<i class="ri-sparkling-fill" style="color:var(--gold-400)"></i> Ring Fitted on Ring Finger & Tracking`;
          statusEl.className = 'vto-status-pill active-tracking';
        }
      }
    } else {
      const statusEl = document.getElementById('vto-status-pill');
      if (statusEl) {
        statusEl.innerHTML = `<i class="ri-hand-line"></i> Hold fingers to camera for Ring`;
        statusEl.className = 'vto-status-pill searching';
      }
      this.renderWristGuideOverlay(ctx, w, h, '🖐️ Hold your fingers towards the camera to try on the Ring');
    }
  }

  /* --------------------------------------------------------------------------
     7. Heritage Vaddanam / Waist Belt (Waistline Contour Fit)
     -------------------------------------------------------------------------- */
  drawVaddanam(ctx, chin, earDistance, rollAngle, yawAngle, config) {
    let model = this.currentModel3D;
    const baseScale = (config.scale || 1.85) * this.userScaleFactor;
    const vaddanamWidth = earDistance * baseScale;

    if (!model || !model.canvas) {
      const assetImg = (config.asset && this.imageCache[config.asset]) || this.imageCache['assets/kasu_mala_pendant.svg'];
      if (assetImg) {
        model = {
          canvas: assetImg,
          width: assetImg.naturalWidth || 500,
          height: assetImg.naturalHeight || 200,
          aspect: (assetImg.naturalHeight || 200) / (assetImg.naturalWidth || 500)
        };
      }
    }
    if (!model || !model.canvas) return;

    const vaddanamHeight = vaddanamWidth * model.aspect;
    const userOffY = (config.offsetY || 120) + this.userOffsetY;
    const anchorX = chin.x + (yawAngle * earDistance * 0.12);
    const anchorY = chin.y + (earDistance * 2.6) + userOffY;

    this.render3DAnatomicalDrape(ctx, model, anchorX, anchorY, vaddanamWidth, vaddanamHeight, rollAngle, yawAngle, 'VADDANAM');

    const statusEl = document.getElementById('vto-status-pill');
    if (statusEl) {
      statusEl.innerHTML = `<i class="ri-sparkling-fill" style="color:var(--gold-400)"></i> Vaddanam Fitted to Waistline`;
      statusEl.className = 'vto-status-pill active-tracking';
    }
  }

  /* --------------------------------------------------------------------------
     8. Pure Silver Bridal Pattilu / Anklets (Ankle Fit)
     -------------------------------------------------------------------------- */
  drawAnklets(ctx, w, h, config) {
    let model = this.currentModel3D;
    const sprite = model?.canvas || this.imageCache['assets/kasu_mala.jpg'];
    if (!sprite) return;

    const ankletWidth = Math.min(w * 0.38, 220) * (config.scale || 0.70) * this.userScaleFactor;
    const aspect = model?.aspect || 0.35;
    const ankletHeight = ankletWidth * aspect;

    const leftX = w * 0.32;
    const rightX = w * 0.68;
    const anchorY = h * 0.82 + this.userOffsetY;

    // Left Anklet
    ctx.save();
    ctx.translate(leftX, anchorY);
    ctx.drawImage(sprite, -ankletWidth / 2, 0, ankletWidth, ankletHeight);
    ctx.restore();

    // Right Anklet
    ctx.save();
    ctx.translate(rightX, anchorY);
    ctx.drawImage(sprite, -ankletWidth / 2, 0, ankletWidth, ankletHeight);
    ctx.restore();

    const statusEl = document.getElementById('vto-status-pill');
    if (statusEl) {
      statusEl.innerHTML = `<i class="ri-sparkling-fill" style="color:var(--gold-400)"></i> Bridal Pattilu Fitted on Ankles`;
      statusEl.className = 'vto-status-pill active-tracking';
    }
  }

  renderWristGuideOverlay(ctx, w, h, promptText) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Pure identity matrix: guarantees un-mirrored readable text

    ctx.fillStyle = 'rgba(14, 8, 12, 0.88)';
    const boxW = Math.min(w * 0.90, 440);
    const boxH = 50;
    const boxX = (w - boxW) / 2;
    const boxY = h - 110;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxW, boxH, 25);
    } else {
      // Safe fallback for browsers/webviews without roundRect
      const r = 25;
      ctx.moveTo(boxX + r, boxY);
      ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + boxH, r);
      ctx.arcTo(boxX + boxW, boxY + boxH, boxX, boxY + boxH, r);
      ctx.arcTo(boxX, boxY + boxH, boxX, boxY, r);
      ctx.arcTo(boxX, boxY, boxX + boxW, boxY, r);
      ctx.closePath();
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(223, 183, 108, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = '600 13px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(promptText, w / 2, boxY + boxH / 2);
    ctx.restore();
  }

  /* ==========================================================================
     SNAPSHOT CAPTURE & WHATSAPP INTEGRATION
     ========================================================================== */

  captureSnapshot() {
    if (!this.canvas) return;

    // Trigger visual camera shutter flash animation
    const flashEl = document.getElementById('vto-shutter-flash');
    if (flashEl) {
      flashEl.classList.remove('active');
      void flashEl.offsetWidth; // trigger reflow
      flashEl.classList.add('active');
    }

    // Visual shutter flash (sound muted per user request)

    // Create high-resolution snapshot with watermark
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.canvas.width;
    offCanvas.height = this.canvas.height;
    const offCtx = offCanvas.getContext('2d');

    // Draw the decorated canvas
    offCtx.drawImage(this.canvas, 0, 0);

    // Luxury Watermark Branding
    const w = offCanvas.width;
    const h = offCanvas.height;

    // Bottom dark gradient strip
    const grad = offCtx.createLinearGradient(0, h - 80, 0, h);
    grad.addColorStop(0, 'rgba(10, 5, 7, 0)');
    grad.addColorStop(1, 'rgba(10, 5, 7, 0.88)');
    offCtx.fillStyle = grad;
    offCtx.fillRect(0, h - 80, w, 80);

    // Brand Text
    offCtx.fillStyle = '#dfb76c';
    offCtx.font = 'bold 16px "Cinzel", Georgia, serif';
    offCtx.fillText(STORE_CONFIG.name, 20, h - 35);

    offCtx.fillStyle = '#e8d8be';
    offCtx.font = '12px "Outfit", sans-serif';
    const prodName = this.currentProduct ? `${this.currentProduct.name} (${this.currentProduct.sku})` : 'Virtual Try-On';
    offCtx.fillText(prodName, 20, h - 16);

    offCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    offCtx.font = '11px "Outfit", sans-serif';
    offCtx.textAlign = 'right';
    offCtx.fillText(`Etikoppaka • WhatsApp: ${STORE_CONFIG.phoneDisplay}`, w - 20, h - 24);

    this.lastSnapshotDataUrl = offCanvas.toDataURL('image/jpeg', 0.92);

    // Display Preview Modal
    this.openSnapshotModal(this.lastSnapshotDataUrl);
  }

  openSnapshotModal(dataUrl) {
    const snapModal = document.getElementById('vto-snapshot-modal');
    const snapImg = document.getElementById('vto-snapshot-preview');
    const snapTitle = document.getElementById('vto-snap-title');

    if (snapImg) snapImg.src = dataUrl;
    if (snapTitle && this.currentProduct) {
      snapTitle.textContent = `Try-On Look: ${this.currentProduct.name}`;
    }

    if (snapModal) {
      snapModal.classList.add('open');
      snapModal.setAttribute('aria-hidden', 'false');
    }
  }

  closeSnapshotModal() {
    const snapModal = document.getElementById('vto-snapshot-modal');
    if (snapModal) {
      snapModal.classList.remove('open');
      snapModal.setAttribute('aria-hidden', 'true');
    }
  }

  downloadSnapshot() {
    if (!this.lastSnapshotDataUrl) return;
    const a = document.createElement('a');
    a.href = this.lastSnapshotDataUrl;
    const sku = this.currentProduct?.sku || 'JEWELLERY';
    a.download = `Sri-Sai-Krishna-TryOn-${sku}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof showToast === 'function') showToast('Try-On photo downloaded successfully!');
  }

  shareSnapshotToWhatsApp() {
    if (!this.currentProduct) return;
    const product = this.currentProduct;
    const isTelugu = (localStorage.getItem('ssk_language') === 'te');

    const message = isTelugu 
      ? `నమస్తే శ్రీ సాయి కృష్ణ జ్యువెలర్స్ (ఏటికొప్పాక),\n\nనేను మీ వెబ్‌సైట్‌లో *వర్చువల్ ట్రై-ఆన్ (Online Try-On)* ద్వారా ఈ డిజైన్‌ను ట్రై చేశాను:\n\n` +
        `• *ఆభరణం:* ${product.teluguName || product.name}\n` +
        `• *కోడ్:* ${product.sku}\n` +
        `• *బరువు:* సుమారు ${product.approxGrossWeight} గ్రా.\n` +
        `• *స్వచ్ఛత:* ${product.purity}\n\n` +
        `నాకు ఈ డిజైన్ చాలా నచ్చింది. నేటి ధర మరియు తయారీ వివరాలు తెలపగలరు.`
      : `Namaste Sri Sai Krishna Jewellers (Etikoppaka),\n\nI just tried on this jewellery design using your *Online Virtual Try-On* feature on your website:\n\n` +
        `• *Design:* ${product.name}\n` +
        `• *Telugu:* ${product.teluguName || ''}\n` +
        `• *SKU:* ${product.sku}\n` +
        `• *Approx Weight:* ${product.approxGrossWeight} grams\n` +
        `• *Hallmark:* ${product.purity}\n\n` +
        `I have downloaded my try-on photo and would love to check today's live price and availability at your shop. Thank you!`;

    const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}

// Global Singleton Instance
window.SSK_VTO = new JewelleryVirtualTryOnManager();

// Global Helper invoked from product cards or detail modals
function launchVirtualTryOn(productId) {
  const product = (window.PRODUCTS_DATA || PRODUCTS_DATA).find(p => p.id === productId);
  if (!product) return;
  if (!product.tryOn || !product.tryOn.enabled) {
    if (typeof autoClassifyTryOn === 'function') {
      product.tryOn = autoClassifyTryOn(product);
    }
  }
  window.SSK_VTO.open(product);
}
window.launchVirtualTryOn = launchVirtualTryOn;

function launchShowroom3D(productId) {
  const product = (window.PRODUCTS_DATA || PRODUCTS_DATA).find(p => p.id === productId);
  if (!product) return;
  if (window.SSK_AI_3D) {
    window.SSK_AI_3D.openShowroomViewer(product);
  } else {
    launchVirtualTryOn(productId);
  }
}
window.launchShowroom3D = launchShowroom3D;

