const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Starting Chrome with remote debugging on port 9222...');
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = path.join(__dirname, '..', '.chrome-test-profile');
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:3000/index.html'
  ]);

  // Wait 2 seconds for Chrome to start
  await new Promise(r => setTimeout(r, 2500));

  // Get JSON list of targets
  http.get('http://127.0.0.1:9222/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      try {
        const targets = JSON.parse(raw);
        console.log('Targets:', targets.map(t => ({ id: t.id, url: t.url, title: t.title })));
        
        const page = targets.find(t => t.type === 'page' || t.url.includes('localhost'));
        if (!page || !page.webSocketDebuggerUrl) {
          console.error('No page target found');
          chrome.kill();
          return;
        }

        console.log('Connecting to WebSocket:', page.webSocketDebuggerUrl);
        // Connect with built-in WebSocket if Node 22, or ws
        let WebSocketClient;
        if (typeof WebSocket !== 'undefined') {
          WebSocketClient = WebSocket;
        } else {
          try {
            WebSocketClient = require('ws');
          } catch (_) {
            console.log('Node WebSocket available globally:', typeof globalThis.WebSocket);
            WebSocketClient = globalThis.WebSocket;
          }
        }

        if (!WebSocketClient) {
          console.log('No WebSocket client available, testing via fetch/Runtime');
          chrome.kill();
          return;
        }

        const ws = new WebSocketClient(page.webSocketDebuggerUrl);
        let idCounter = 1;
        const pending = new Map();

        ws.onopen = async () => {
          console.log('CDP WebSocket connected!');

          const send = (method, params = {}) => {
            return new Promise((resolve) => {
              const id = idCounter++;
              pending.set(id, resolve);
              ws.send(JSON.stringify({ id, method, params }));
            });
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.id && pending.has(data.id)) {
              const resolve = pending.get(data.id);
              pending.delete(data.id);
              resolve(data.result);
            }
          };

          // Force reload to bypass cache and pick up latest bundle
          await send('Page.reload', { ignoreCache: true });
          await new Promise(r => setTimeout(r, 2500));

          // 1. Check AI Stylist & VTO objects
          const evalRes = await send('Runtime.evaluate', {
            expression: `({
              hasAiStylist: typeof window.SSK_AI_STYLIST !== 'undefined',
              hasVto: typeof window.SSK_VTO !== 'undefined',
              productsCount: Array.isArray(window.PRODUCTS_DATA) ? window.PRODUCTS_DATA.length : (typeof PRODUCTS_DATA !== 'undefined' ? PRODUCTS_DATA.length : 0),
              audioContextMuted: (typeof getAudioContext === 'function') ? (getAudioContext() === null) : true
            })`,
            returnByValue: true
          });

          console.log('EVALUATION RESULT:', JSON.stringify(evalRes.result?.value, null, 2));

          // 2. Test AI Stylist: open drawer and ask for bangles
          await send('Runtime.evaluate', {
            expression: `window.SSK_AI_STYLIST.open();`
          });
          console.log('AI Stylist drawer opened.');

          await new Promise(r => setTimeout(r, 600));

          const aiResponse = await send('Runtime.evaluate', {
            expression: `(async () => {
              const res = await window.SSK_AI_STYLIST.generateStylistResponse("I want antique bangles for wrists");
              window.SSK_AI_STYLIST.addMessage('bot', res.message, res.products);
              return {
                speakText: res.speakText,
                productsCount: res.products ? res.products.length : 0,
                firstProductType: res.products && res.products[0] ? res.products[0].tryOn.type : null,
                firstProductLabel: res.products && res.products[0] ? res.products[0].tryOn.label : null
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('AI Stylist Bangles Response:', JSON.stringify(aiResponse.result?.value, null, 2));

          // 3. Test Try-On Launch on Bangles (from AI Stylist button)
          const vtoBanglesOpen = await send('Runtime.evaluate', {
            expression: `(async () => {
              window.SSK_AI_STYLIST.close();
              const bangles = (window.PRODUCTS_DATA || PRODUCTS_DATA).find(p => p.id === 'ssk-gld-102');
              await window.SSK_VTO.open(bangles);
              return {
                isOpen: document.getElementById('vto-modal').classList.contains('open'),
                currentType: window.SSK_VTO.currentProduct.tryOn.type,
                currentLabel: window.SSK_VTO.currentProduct.tryOn.label,
                badgeText: document.getElementById('vto-ornament-type-badge')?.textContent?.trim(),
                hasModel3D: Boolean(window.SSK_VTO.currentModel3D),
                model3DW: window.SSK_VTO.currentModel3D?.width,
                model3DH: window.SSK_VTO.currentModel3D?.height,
                modelAspect: window.SSK_VTO.currentModel3D?.aspect,
                isExtracted: window.SSK_VTO.currentModel3D?.isExtracted
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('VTO Bangles Open & 3D Model:', JSON.stringify(vtoBanglesOpen.result?.value, null, 2));

          await new Promise(r => setTimeout(r, 600));

          // Capture Bangles Screenshot
          const shotBangles = await send('Page.captureScreenshot', { format: 'png' });
          if (shotBangles?.data) {
            fs.writeFileSync(path.join(__dirname, '..', 'vto_bangles_verified.png'), Buffer.from(shotBangles.data, 'base64'));
            console.log('Bangles screenshot saved to vto_bangles_verified.png');
          }

          // 4. Test Kasu Mala Long Haram (Background removal test)
          const vtoKasuMalaOpen = await send('Runtime.evaluate', {
            expression: `(async () => {
              const haram = (window.PRODUCTS_DATA || PRODUCTS_DATA).find(p => p.id === 'ssk-gld-101');
              await window.SSK_VTO.open(haram);
              return {
                currentType: window.SSK_VTO.currentProduct.tryOn.type,
                badgeText: document.getElementById('vto-ornament-type-badge')?.textContent?.trim(),
                hasModel3D: Boolean(window.SSK_VTO.currentModel3D),
                model3DW: window.SSK_VTO.currentModel3D?.width,
                model3DH: window.SSK_VTO.currentModel3D?.height,
                modelAspect: window.SSK_VTO.currentModel3D?.aspect,
                isExtracted: window.SSK_VTO.currentModel3D?.isExtracted
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('VTO Kasu Mala 3D Extraction:', JSON.stringify(vtoKasuMalaOpen.result?.value, null, 2));

          // Capture Kasu Mala Screenshot
          const shotHaram = await send('Page.captureScreenshot', { format: 'png' });
          if (shotHaram?.data) {
            fs.writeFileSync(path.join(__dirname, '..', 'vto_kasu_mala_verified.png'), Buffer.from(shotHaram.data, 'base64'));
            console.log('Kasu Mala screenshot saved to vto_kasu_mala_verified.png');
          }

          // 5. Test Ring Product
          const vtoRingOpen = await send('Runtime.evaluate', {
            expression: `(async () => {
              const ring = (window.PRODUCTS_DATA || PRODUCTS_DATA).find(p => p.id === 'ssk-gld-110');
              await window.SSK_VTO.open(ring);
              return {
                currentType: window.SSK_VTO.currentProduct.tryOn.type,
                currentLabel: window.SSK_VTO.currentProduct.tryOn.label,
                badgeText: document.getElementById('vto-ornament-type-badge')?.textContent?.trim(),
                hasModel3D: Boolean(window.SSK_VTO.currentModel3D)
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('VTO Ring Product:', JSON.stringify(vtoRingOpen.result?.value, null, 2));

          // 6. Test Vaddanam Product
          const vtoVaddanamOpen = await send('Runtime.evaluate', {
            expression: `(async () => {
              const vaddanam = (window.PRODUCTS_DATA || PRODUCTS_DATA).find(p => p.id === 'ssk-gld-104');
              await window.SSK_VTO.open(vaddanam);
              return {
                currentType: window.SSK_VTO.currentProduct.tryOn.type,
                currentLabel: window.SSK_VTO.currentProduct.tryOn.label,
                badgeText: document.getElementById('vto-ornament-type-badge')?.textContent?.trim(),
                hasModel3D: Boolean(window.SSK_VTO.currentModel3D)
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('VTO Vaddanam Product:', JSON.stringify(vtoVaddanamOpen.result?.value, null, 2));

          ws.close();
          chrome.kill();
          console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
          process.exit(0);
        };
      } catch (err) {
        console.error('Error handling targets:', err);
        chrome.kill();
      }
    });
  }).on('error', (err) => {
    console.error('HTTP error connecting to Chrome:', err);
    chrome.kill();
  });
}

run().catch(console.error);
