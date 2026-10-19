const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function verifyVtoLive() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = path.join(__dirname, '..', '.chrome-test-profile');
  
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:3000/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  http.get('http://127.0.0.1:9222/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      try {
        const targets = JSON.parse(raw);
        const page = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
        if (!page) {
          chrome.kill();
          process.exit(1);
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
          console.log('Connected to CDP for Live VTO check...');
          await send('Page.reload', { ignoreCache: true });
          await new Promise(r => setTimeout(r, 2000));

          // 1. Dismiss intro and language picker
          await send('Runtime.evaluate', {
            expression: `(() => {
              sessionStorage.setItem('ssk_intro_seen', 'true');
              const g = document.getElementById('cinematic-intro-gateway');
              if (g) g.remove();
              const l = document.getElementById('language-modal');
              if (l) l.remove();
            })()`
          });

          await new Promise(r => setTimeout(r, 800));

          // 2. Open VTO for Bangles (product 1)
          const openRes = await send('Runtime.evaluate', {
            expression: `(async () => {
              const prod = window.PRODUCTS_DATA[1];
              window.SSK_VTO.open(prod);
              
              await new Promise(r => setTimeout(r, 1200));

              const video = window.SSK_VTO.video;
              const canvas = window.SSK_VTO.canvas;
              const statusEl = document.getElementById('vto-status-pill');

              return {
                isRunning: window.SSK_VTO.isRunning,
                videoReadyState: video ? video.readyState : -1,
                videoPaused: video ? video.paused : true,
                canvasW: canvas ? canvas.width : 0,
                canvasH: canvas ? canvas.height : 0,
                statusText: statusEl ? statusEl.innerText : '',
                hasHands: !!window.SSK_VTO.hands,
                hasFace: !!window.SSK_VTO.faceMesh
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('Live VTO Status:', openRes.result?.value);

          await new Promise(r => setTimeout(r, 1500));

          // 3. Capture screenshot
          const screenshot = await send('Page.captureScreenshot', { format: 'png' });
          if (screenshot && screenshot.data) {
            fs.writeFileSync('vto_live_camera_smooth.png', Buffer.from(screenshot.data, 'base64'));
            console.log('Captured live camera screenshot to vto_live_camera_smooth.png');
          }

          ws.close();
          chrome.kill();
          process.exit(0);
        };
      } catch (err) {
        console.error(err);
        chrome.kill();
        process.exit(1);
      }
    });
  });
}

verifyVtoLive();
