const http = require('http');

async function testAi3D() {
  http.get('http://127.0.0.1:9222/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      try {
        const targets = JSON.parse(raw);
        const page = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
        if (!page) {
          console.error('No localhost page found');
          return;
        }

        const ws = new WebSocket(page.webSocketDebuggerUrl);
        let idCounter = 1;
        const pending = new Map();

        const send = (method, params = {}) => new Promise(res => {
          const id = idCounter++;
          pending.set(id, res);
          ws.send(JSON.stringify({ id, method, params }));
        });

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.id && pending.has(data.id)) {
            const resolve = pending.get(data.id);
            pending.delete(data.id);
            resolve(data.result);
          }
        };

        ws.onopen = async () => {
          console.log('Connected to Chrome CDP!');
          await send('Page.reload', { ignoreCache: true });
          await new Promise(r => setTimeout(r, 2000));

          // 1. Verify window.SSK_AI_3D exists
          const checkEngine = await send('Runtime.evaluate', {
            expression: `({
              hasAi3D: typeof window.SSK_AI_3D !== 'undefined',
              hasThree: typeof THREE !== 'undefined',
              hasVto: typeof window.SSK_VTO !== 'undefined',
              hasAiStylist: typeof window.SSK_AI_STYLIST !== 'undefined'
            })`,
            returnByValue: true
          });
          console.log('Engine check:', checkEngine.result?.value);

          // 2. Test AI Catalogue Image Analysis on a product
          const testAnalysis = await send('Runtime.evaluate', {
            expression: `(async () => {
              const prod = window.PRODUCTS_DATA[0];
              const analysis = await window.SSK_AI_3D.analyzeCatalogueImage(prod.image);
              return analysis;
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('Catalogue Image Analysis Result:', testAnalysis.result?.value);

          // 3. Test opening 3D Showroom Modal
          const open3D = await send('Runtime.evaluate', {
            expression: `(() => {
              const prod = window.PRODUCTS_DATA[1]; // Bangles
              window.SSK_AI_3D.openShowroomViewer(prod);
              const modal = document.getElementById('ai-3d-modal');
              const canvas = modal ? modal.querySelector('canvas') : null;
              return {
                modalOpen: modal ? modal.classList.contains('open') : false,
                hasCanvas: !!canvas,
                canvasWidth: canvas ? canvas.width : 0,
                canvasHeight: canvas ? canvas.height : 0
              };
            })()`,
            returnByValue: true
          });
          console.log('3D Showroom Modal Open Result:', open3D.result?.value);

          // 4. Capture screenshot of 3D Showroom
          const screenshot = await send('Page.captureScreenshot', { format: 'png' });
          if (screenshot && screenshot.data) {
            const fs = require('fs');
            fs.writeFileSync('vto_3d_showroom_verified.png', Buffer.from(screenshot.data, 'base64'));
            console.log('Saved 3D showroom screenshot to vto_3d_showroom_verified.png');
          }

          ws.close();
          process.exit(0);
        };
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    });
  });
}

testAi3D();
