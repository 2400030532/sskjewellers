const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function testUpgrades() {
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
          // Dismiss intro gateway
          await send('Runtime.evaluate', {
            expression: `(() => {
              sessionStorage.setItem('ssk_intro_seen', 'true');
              const gateway = document.getElementById('cinematic-intro-gateway');
              if (gateway) gateway.remove();
              const langModal = document.getElementById('language-modal');
              if (langModal) langModal.remove();
            })()`
          });

          await new Promise(r => setTimeout(r, 600));

          // Open 3D showroom for Bangles
          const res = await send('Runtime.evaluate', {
            expression: `(async () => {
              const prod = window.PRODUCTS_DATA[1];
              window.SSK_AI_3D.openShowroomViewer(prod);
              await window.SSK_AI_3D.checkAi3DServiceStatus();
              await window.SSK_AI_3D.reconstructWithGenerativeAI(prod);
              const modal = document.getElementById('ai-3d-modal');
              return {
                modalOpen: modal ? modal.classList.contains('open') : false,
                modalHtml: modal ? modal.innerHTML.length : 0
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('3D Showroom result:', res.result?.value);

          await new Promise(r => setTimeout(r, 1500));

          const screenshot = await send('Page.captureScreenshot', { format: 'png' });
          if (screenshot && screenshot.data) {
            fs.writeFileSync('vto_upgraded_showroom.png', Buffer.from(screenshot.data, 'base64'));
            console.log('Saved upgraded showroom capture to vto_upgraded_showroom.png');
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

testUpgrades();
