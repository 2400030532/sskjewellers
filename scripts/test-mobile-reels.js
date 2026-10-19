const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function run() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = path.resolve(__dirname, '..', '.chrome-test-reels-profile');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--window-size=390,844',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9224/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      try {
        const targets = JSON.parse(raw);
        const page = targets.find(t => t.type === 'page');
        if (!page) {
          console.error('No page target found');
          chrome.kill();
          process.exit(1);
        }

        const ws = new WebSocket(page.webSocketDebuggerUrl);
        let idCounter = 1;
        const pending = new Map();

        const send = (method, params = {}) => new Promise(resolve => {
          const id = idCounter++;
          pending.set(id, resolve);
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
          console.log('Connected to Chrome DevTools WebSocket');
          await send('Emulation.setDeviceMetricsOverride', {
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            mobile: true
          });

          await send('Page.enable');
          await send('Runtime.enable');

          console.log('Navigating to http://localhost:3000/reels.html');
          await send('Page.navigate', { url: 'http://localhost:3000/reels.html' });
          await new Promise(r => setTimeout(r, 3000));

          // Check DOM
          const domCheck = await send('Runtime.evaluate', {
            expression: `(() => {
              const items = document.querySelectorAll('.reel-snap-item');
              const iframe = document.querySelector('.reel-snap-iframe');
              const feed = document.getElementById('reels-snap-feed');
              return {
                itemCount: items.length,
                iframeSrc: iframe ? iframe.src : null,
                feedScrollHeight: feed ? feed.scrollHeight : 0,
                feedClientHeight: feed ? feed.clientHeight : 0,
                bodyScrollWidth: document.body.scrollWidth,
                viewportWidth: window.innerWidth,
                errors: window.__errors || []
              };
            })()`,
            returnByValue: true
          });

          console.log('DOM Check Result:', JSON.stringify(domCheck, null, 2));

          // Take screenshot of top
          const ss1 = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.resolve(__dirname, '..', 'reels_mobile_test_top.png'), Buffer.from(ss1.data, 'base64'));
          console.log('Saved reels_mobile_test_top.png');

          // Scroll reel into view
          await send('Runtime.evaluate', {
            expression: `(() => {
              const firstItem = document.querySelector('.reel-snap-item');
              if (firstItem) {
                firstItem.scrollIntoView({ behavior: 'instant', block: 'center' });
              }
              return true;
            })()`
          });

          await new Promise(r => setTimeout(r, 2000));

          const ss2 = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.resolve(__dirname, '..', 'reels_mobile_test_reel_card.png'), Buffer.from(ss2.data, 'base64'));
          console.log('Saved reels_mobile_test_reel_card.png');

          // Test switching to Explore Grid
          await send('Runtime.evaluate', {
            expression: `(() => {
              if (typeof switchReelsView === 'function') {
                switchReelsView('grid');
              }
              return true;
            })()`
          });

          await new Promise(r => setTimeout(r, 1000));

          const ss3 = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.resolve(__dirname, '..', 'reels_mobile_test_grid.png'), Buffer.from(ss3.data, 'base64'));
          console.log('Saved reels_mobile_test_grid.png');

          chrome.kill();
          process.exit(0);
        };
      } catch (err) {
        console.error('Error during test:', err);
        chrome.kill();
        process.exit(1);
      }
    });
  });
}

run();
