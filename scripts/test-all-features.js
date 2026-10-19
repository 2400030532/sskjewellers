const http = require('http');
const { spawn } = require('child_process');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9335', '--disable-gpu', '--no-sandbox', 'http://localhost:3000/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9335/json', res => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', async () => {
      try {
        const page = JSON.parse(raw).find(p => p.type === 'page');
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        let msgId = 1;
        const send = (method, params = {}) => new Promise(resolve => {
          const id = msgId++;
          const handler = e => {
            const d = JSON.parse(e.data);
            if (d.id === id) {
              ws.removeEventListener('message', handler);
              resolve(d.result);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id, method, params }));
        });

        ws.onopen = async () => {
          ws.send(JSON.stringify({ id: 999, method: 'Runtime.enable' }));
          ws.addEventListener('message', e => {
            const d = JSON.parse(e.data);
            if (d.method === 'Runtime.exceptionThrown') {
              console.log('[BROWSER EXCEPTION]', d.params.exceptionDetails.text, d.params.exceptionDetails.exception?.description);
            }
            if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
              console.log('[BROWSER CONSOLE ERROR]', d.params.args.map(a => a.value || a.description).join(' '));
            }
          });

          // Wait for DOM and all external scripts to fully load
          let ready = false;
          for (let i = 0; i < 20; i++) {
            const check = await send('Runtime.evaluate', {
              expression: `document.readyState === 'complete' && typeof window.PRODUCTS_DATA !== 'undefined'`
            });
            if (check.result?.value) {
              ready = true;
              break;
            }
            await new Promise(r => setTimeout(r, 400));
          }
          console.log('Page scripts ready:', ready);

          // 1. Dismiss intro
          await send('Runtime.evaluate', {
            expression: `(() => {
              sessionStorage.setItem('ssk_intro_seen', 'true');
              document.getElementById('cinematic-intro-gateway')?.remove();
              document.getElementById('language-modal')?.remove();
            })()`
          });

          // 2. Test VTO
          console.log('Testing VTO...');
          const vtoRes = await send('Runtime.evaluate', {
            expression: `(() => {
              try {
                launchVirtualTryOn('ssk-gld-105');
                const modal = document.getElementById('vto-modal');
                return { modalOpen: modal ? modal.classList.contains('open') : false };
              } catch(e) {
                return { error: e.message, stack: e.stack };
              }
            })()`,
            returnByValue: true
          });
          console.log('VTO result:', vtoRes.result?.value);

          // 3. Close VTO
          await send('Runtime.evaluate', { expression: `window.SSK_VTO?.close();` });

          // 4. Test 3D Showroom
          console.log('Testing 3D Showroom...');
          const threeRes = await send('Runtime.evaluate', {
            expression: `(() => {
              try {
                const prod = window.PRODUCTS_DATA[0];
                window.SSK_AI_3D.openShowroomViewer(prod);
                const modal = document.getElementById('ai-3d-modal');
                const canvas = modal ? modal.querySelector('canvas') : null;
                return {
                  modalOpen: modal ? modal.classList.contains('open') : false,
                  hasCanvas: !!canvas
                };
              } catch(e) {
                return { error: e.message, stack: e.stack };
              }
            })()`,
            returnByValue: true
          });
          console.log('3D Showroom result:', threeRes.result?.value);

          // 5. Test material switch in 3D showroom
          console.log('Testing Material Switch...');
          const matRes = await send('Runtime.evaluate', {
            expression: `(() => {
              try {
                window.SSK_AI_3D.setMaterialPreset('silver925');
                window.SSK_AI_3D.setMaterialPreset('goldAntique');
                window.SSK_AI_3D.setMaterialPreset('gold22k');
                return { ok: true };
              } catch(e) {
                return { error: e.message };
              }
            })()`,
            returnByValue: true
          });
          console.log('Material switch result:', matRes.result?.value);

          // 6. Close 3D Showroom
          await send('Runtime.evaluate', { expression: `window.SSK_AI_3D.closeShowroomViewer();` });

          // 7. Test AI Stylist
          console.log('Testing AI Stylist...');
          const stylistRes = await send('Runtime.evaluate', {
            expression: `(() => {
              try {
                window.SSK_AI_STYLIST?.openStylistModal();
                const modal = document.getElementById('ai-stylist-modal');
                return { modalOpen: modal ? modal.classList.contains('open') : false };
              } catch(e) {
                return { error: e.message };
              }
            })()`,
            returnByValue: true
          });
          console.log('Stylist result:', stylistRes.result?.value);

          // 8. Test Gold Calculator
          console.log('Testing Gold Calculator...');
          const calcRes = await send('Runtime.evaluate', {
            expression: `(() => {
              try {
                const wtInput = document.getElementById('calc-weight');
                const metalSelect = document.getElementById('calc-metal');
                if (wtInput) wtInput.value = '10';
                if (metalSelect) metalSelect.value = '22k';
                if (typeof updateCalculatorResult === 'function') updateCalculatorResult();
                const totalEl = document.getElementById('calc-result');
                const liveBadge = document.getElementById('calc-active-rate-text');
                return {
                  calcTotal: totalEl ? totalEl.textContent : null,
                  liveRateText: liveBadge ? liveBadge.textContent : null
                };
              } catch(e) {
                return { error: e.message };
              }
            })()`,
            returnByValue: true
          });
          console.log('Calculator result:', calcRes.result?.value);

          // 9. Test Filter & Search
          console.log('Testing Product Filtering...');
          const filterRes = await send('Runtime.evaluate', {
            expression: `(() => {
              try {
                currentCategory = 'silver';
                renderProducts();
                const cardsSilver = document.querySelectorAll('.product-card').length;
                currentCategory = 'all';
                renderProducts();
                const cardsAll = document.querySelectorAll('.product-card').length;
                return { cardsSilver, cardsAll };
              } catch(e) {
                return { error: e.message };
              }
            })()`,
            returnByValue: true
          });
          console.log('Filter result:', filterRes.result?.value);

          await new Promise(r => setTimeout(r, 1000));
          ws.close();
          chrome.kill();
          process.exit(0);
        };
      } catch (err) {
        console.error('Fatal test error:', err);
        chrome.kill();
        process.exit(1);
      }
    });
  });
}

run();
