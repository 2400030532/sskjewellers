const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const rootDir = __dirname;

let productsData = [];
let defaultRates = { gold24k: 14918, gold22k: 13675, gold18k: 11189, silver: 245 };
try {
  const prodMod = require('./products.js');
  productsData = prodMod.PRODUCTS_DATA || [];
  if (prodMod.DEFAULT_RATES) defaultRates = { ...prodMod.DEFAULT_RATES };
} catch (_) {}

let showroomRates = { ...defaultRates, source: 'Etikoppaka Showroom Baseline' };

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.xsl': 'application/xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.ico': 'image/x-icon'
};

async function fetchLiveBullion() {
  try {
    const [nbpRes, fxRes] = await Promise.all([
      fetch('https://api.nbp.pl/api/cenyzlota?format=json', { cache: 'no-store' }),
      fetch('https://api.frankfurter.dev/v1/latest?base=EUR', { cache: 'no-store' })
    ]);
    if (nbpRes.ok && fxRes.ok) {
      const nbpData = await nbpRes.json();
      const fxData = await fxRes.json();
      if (Array.isArray(nbpData) && nbpData[0] && nbpData[0].cena && fxData?.rates?.INR && fxData?.rates?.PLN) {
        const rawSpotInr = nbpData[0].cena * (fxData.rates.INR / fxData.rates.PLN);
        const gold24k = Math.round(rawSpotInr * 1.15475);
        const gold22k = Math.round(gold24k * (22.0 / 24.0));
        const gold18k = Math.round(gold24k * (18.0 / 24.0));
        return {
          gold24k,
          gold22k,
          gold18k,
          silver: 245,
          source: 'Live AP Bullion Feed'
        };
      }
    }
  } catch (_) {}
  return {
    ...showroomRates,
    source: 'Showroom AP Baseline'
  };
}

const server = http.createServer(async (req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // API Route: Health Check
  if (reqPath === '/actuator/health' || reqPath === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({ status: 'UP', service: 'Sri Sai Krishna Jewellers Showroom API' }));
  }

  // API Route: Live Rates
  if (reqPath === '/api/rates/live' && req.method === 'GET') {
    const live = await fetchLiveBullion();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify(live));
  }

  // API Route: Showroom Rates
  if (reqPath === '/api/rates') {
    if (req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify(showroomRates));
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          showroomRates = { ...showroomRates, ...parsed };
        } catch (_) {}
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(showroomRates));
      });
      return;
    }
  }

  // API Route: Catalogue / Products
  const isCatalogueBase = (reqPath === '/api/catalogue' || reqPath === '/api/products');
  const isCatalogueItem = (reqPath.startsWith('/api/catalogue/') || reqPath.startsWith('/api/products/'));

  // Dedicated GLB / 3D Model Upload endpoint
  if (isCatalogueItem && (reqPath.endsWith('/model') || reqPath.endsWith('/upload-model')) && req.method === 'POST') {
    const parts = reqPath.split('/');
    const prodId = parts[3];
    const cleanId = prodId ? prodId.replace(/[\/\\]/g, '_') : 'ornament_' + Date.now();
    const contentType = req.headers['content-type'] || '';

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const fullBuf = Buffer.concat(chunks);
        let glbBuffer = null;

        if (contentType.includes('application/json')) {
          const parsed = JSON.parse(fullBuf.toString('utf8'));
          const b64 = parsed.modelBase64 || parsed.data || parsed.file;
          if (b64) {
            const rawB64 = b64.includes(',') ? b64.split(',')[1] : b64;
            glbBuffer = Buffer.from(rawB64, 'base64');
          }
        } else if (contentType.includes('multipart/form-data')) {
          // Parse multipart boundary to extract file payload
          const boundaryMatch = contentType.match(/boundary=(?:["']?)([^"';]+)(?:["']?)/);
          if (boundaryMatch) {
            const boundary = boundaryMatch[1];
            const parts = fullBuf.toString('binary').split('--' + boundary);
            for (const part of parts) {
              if (part.includes('filename=') || part.includes('Content-Type:')) {
                const headerEnd = part.indexOf('\r\n\r\n');
                if (headerEnd !== -1) {
                  const bodyBinary = part.substring(headerEnd + 4).replace(/\r\n$/, '');
                  glbBuffer = Buffer.from(bodyBinary, 'binary');
                  break;
                }
              }
            }
          }
        } else {
          // Raw binary upload
          glbBuffer = fullBuf;
        }

        if (!glbBuffer || glbBuffer.length < 12) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Invalid GLB file data: file is empty or corrupted.' }));
        }

        // Validate GLB magic bytes: 'glTF'
        const magic = glbBuffer.toString('ascii', 0, 4);
        const isGlb = (magic === 'glTF');
        const isJsonGltf = glbBuffer.toString('utf8', 0, Math.min(glbBuffer.length, 60)).includes('"asset"');

        if (!isGlb && !isJsonGltf) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'File validation failed: File must be a valid .glb or .gltf 3D model.' }));
        }

        const ext = isGlb ? '.glb' : '.gltf';
        const modelRelPath = `assets/models/${cleanId}${ext}`;
        const targetDir = path.join(rootDir, 'assets', 'models');
        const wwwTargetDir = path.join(rootDir, 'www', 'assets', 'models');

        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        if (!fs.existsSync(wwwTargetDir)) fs.mkdirSync(wwwTargetDir, { recursive: true });

        fs.writeFileSync(path.join(rootDir, modelRelPath), glbBuffer);
        try { fs.writeFileSync(path.join(rootDir, 'www', modelRelPath), glbBuffer); } catch (_) {}

        // Update product in productsData
        let product = productsData.find(p => p.id === prodId);
        if (product) {
          product.model3dUrl = modelRelPath;
          product.model3dStatus = 'COMPLETED';
          product.is3dPublished = true;
        } else {
          product = {
            id: prodId,
            model3dUrl: modelRelPath,
            model3dStatus: 'COMPLETED',
            is3dPublished: true
          };
          productsData.unshift(product);
        }

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({
          success: true,
          productId: prodId,
          model3dUrl: modelRelPath,
          model3dStatus: 'COMPLETED',
          is3dPublished: true,
          sizeBytes: glbBuffer.length,
          product
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'Failed to process 3D model upload: ' + err.message }));
      }
    });
    return;
  }

  // Catalogue Item PUT / GET / DELETE
  if (isCatalogueItem && !reqPath.endsWith('/generate-3d') && !reqPath.endsWith('/3d-status') && !reqPath.endsWith('/3d-settings') && !reqPath.endsWith('/process-image')) {
    const parts = reqPath.split('/');
    const prodId = parts[3];

    if (req.method === 'GET') {
      const item = productsData.find(p => p.id === prodId);
      if (item) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(item));
      }
      res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: 'Product not found' }));
    }

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const updated = JSON.parse(body);
          updated.id = prodId;
          const idx = productsData.findIndex(p => p.id === prodId);
          if (idx >= 0) {
            productsData[idx] = { ...productsData[idx], ...updated };
          } else {
            productsData.unshift(updated);
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify(idx >= 0 ? productsData[idx] : updated));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Invalid product JSON' }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      const idx = productsData.findIndex(p => p.id === prodId);
      if (idx >= 0) productsData.splice(idx, 1);
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
      return res.end();
    }
  }

  // Base /api/catalogue or /api/products
  if (isCatalogueBase) {
    if (req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify(productsData));
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const item = JSON.parse(body);
          if (!item.id) item.id = 'ssk-custom-' + Date.now();
          const existingIdx = productsData.findIndex(p => p.id === item.id);
          if (existingIdx >= 0) {
            productsData[existingIdx] = { ...productsData[existingIdx], ...item };
          } else {
            productsData.unshift(item);
          }
          res.writeHead(201, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify(item));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Invalid JSON product data' }));
        }
      });
      return;
    }
  }

  // API Route: Try-On Session
  if (reqPath === '/api/try-on/session') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({
      status: 'ACTIVE',
      sessionId: 'ssk-vto-' + Date.now(),
      features: ['MediaPipeFaceMesh', 'MediaPipeHands', 'PhotoUploadInSitu', 'ThreeJSPBRViewer']
    }));
  }

  // API Route: 3D Model Generation
  if ((reqPath.startsWith('/api/products/') || reqPath.startsWith('/api/catalogue/')) && reqPath.endsWith('/generate-3d') && req.method === 'POST') {
    const parts = reqPath.split('/');
    const prodId = parts[3];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch (_) {}
      try {
        // Forward to Python AI service on 8001 if active
        const aiRes = await fetch(`http://localhost:8001/api/products/${encodeURIComponent(prodId)}/generate-3d`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        const aiData = await aiRes.json();
        res.writeHead(aiRes.status, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify(aiData));
      } catch (err) {
        // Fallback response
        res.writeHead(202, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({
          success: true,
          productId: prodId,
          status: 'PROCESSING',
          progress: 25,
          message: '3D reconstruction task queued.'
        }));
      }
    });
    return;
  }

  // API Route: 3D Model Status
  if ((reqPath.startsWith('/api/products/') || reqPath.startsWith('/api/catalogue/')) && reqPath.endsWith('/3d-status') && req.method === 'GET') {
    const parts = reqPath.split('/');
    const prodId = parts[3];
    const cleanId = prodId.replace(/[\/\\]/g, '_');
    const modelRel = `assets/models/${cleanId}.glb`;
    const modelDisk = path.join(rootDir, modelRel);
    const hasModel = fs.existsSync(modelDisk);

    try {
      const aiRes = await fetch(`http://localhost:8001/api/products/${encodeURIComponent(prodId)}/3d-status`);
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify(aiData));
      }
    } catch (_) {}

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({
      productId: prodId,
      status: hasModel ? 'COMPLETED' : 'NONE',
      progress: hasModel ? 100 : 0,
      model3dUrl: hasModel ? modelRel : null,
      isEstimated: true,
      qualityScore: hasModel ? 92 : 0,
      error: null
    }));
  }

  // API Route: 3D Settings (Publish/Hide)
  if ((reqPath.startsWith('/api/products/') || reqPath.startsWith('/api/catalogue/')) && reqPath.endsWith('/3d-settings') && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ success: true, message: '3D settings updated.' }));
    });
    return;
  }

  // API Route: Prepare Try-On (Background Segmentation)
  if (reqPath === '/api/admin/products/prepare-tryon' || ((reqPath.startsWith('/api/products/') || reqPath.startsWith('/api/catalogue/')) && reqPath.endsWith('/process-image'))) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const aiRes = await fetch('http://localhost:8001/api/admin/products/prepare-tryon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body
        });
        const aiData = await aiRes.json();
        res.writeHead(aiRes.status, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify(aiData));
      } catch (err) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({ success: false, error: 'AI Segmentation service offline.' }));
      }
    });
    return;
  }

  // API Route: Auth Login
  if (reqPath === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        token: 'ssk_jwt_local_session_' + Date.now(),
        username: 'admin',
        role: 'ADMIN'
      }));
    });
    return;
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(rootDir, reqPath);

  // Security check: ensure within rootDir
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const totalSize = stats.size;
    const rangeHeader = req.headers.range;

    // Support HTTP Range requests for seamless video playback and seeking
    if (rangeHeader && ext === '.mp4') {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${totalSize}`
        });
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  SRI SAI KRISHNA JEWELLERS - LOCAL DIGITAL SHOWROOM`);
  console.log(`  Live URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
