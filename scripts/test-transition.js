const http = require('http');

async function testTransitionAndAdmin() {
  http.get('http://127.0.0.1:9222/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      try {
        const targets = JSON.parse(raw);
        const page = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
        if (!page) return;

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
          console.log('Connected to CDP for transition test...');

          // 1. Click "Try On Live in Camera" inside 3D showroom modal
          const clickTryOn = await send('Runtime.evaluate', {
            expression: `(() => {
              const btn = document.getElementById('btn-3d-launch-tryon');
              if (btn) btn.click();
              const vtoModal = document.getElementById('vto-modal');
              const aiModal = document.getElementById('ai-3d-modal');
              return {
                aiModalOpen: aiModal ? aiModal.classList.contains('open') : false,
                vtoModalOpen: vtoModal ? vtoModal.classList.contains('open') : false,
                vtoCurrentType: window.SSK_VTO?.currentProduct?.tryOn?.type
              };
            })()`,
            returnByValue: true
          });
          console.log('Transition to Live Try-On:', clickTryOn.result?.value);

          // 2. Test Admin Portal AI Scan simulation
          const testAdminAiScan = await send('Runtime.evaluate', {
            expression: `(async () => {
              const imgUrlInput = document.getElementById('product-image');
              if (!imgUrlInput) return { error: 'no input' };
              imgUrlInput.value = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80';
              imgUrlInput.dispatchEvent(new Event('change'));
              
              await new Promise(r => setTimeout(r, 600));
              const scanBox = document.getElementById('product-ai-scan-result');
              const tryOnSelect = document.getElementById('product-tryon-mode');
              return {
                scanBoxVisible: scanBox ? scanBox.style.display !== 'none' : false,
                scanBoxHtml: scanBox ? scanBox.innerHTML : '',
                selectedWearStyle: tryOnSelect ? tryOnSelect.value : ''
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          });
          console.log('Admin AI Scan Result:', testAdminAiScan.result?.value);

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

testTransitionAndAdmin();
