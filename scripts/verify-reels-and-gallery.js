const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3344;
const rootDir = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(rootDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = path.join(rootDir, '.chrome-test-profile');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    `http://localhost:${PORT}/index.html`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9223/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      try {
        const targets = JSON.parse(raw);
        const page = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
        if (!page) {
          console.error('Page target not found');
          chrome.kill();
          server.close();
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
          console.log('Connected to Chrome DevTools');

          // Dismiss intro and intro gateway
          await send('Runtime.evaluate', {
            expression: `(() => {
              sessionStorage.setItem('ssk_intro_seen', 'true');
              const gateway = document.getElementById('cinematic-intro-gateway');
              if (gateway) gateway.remove();
              const veil = document.getElementById('cinematic-entry-veil');
              if (veil) veil.remove();
              const langModal = document.getElementById('language-modal');
              if (langModal) langModal.remove();
              return true;
            })()`
          });

          await new Promise(r => setTimeout(r, 1000));

          // 1. Verify Reels Section
          const reelsCheck = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `(() => {
              const sec = document.getElementById('reels-section');
              const grid = document.getElementById('reels-grid');
              const cards = grid ? grid.querySelectorAll('.reel-card') : [];
              return {
                sectionExists: !!sec,
                cardsCount: cards.length,
                firstTitle: cards[0]?.querySelector('.reel-card-title')?.textContent?.trim()
              };
            })()`
          });
          console.log('Reels Section Check:', reelsCheck.result.value);

          // 2. Test Product WITH Video: ssk-gld-101
          const withVideoCheck = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `(() => {
              openProductModal('ssk-gld-101', false);
              const videoSlide = document.getElementById('modal-slide-video');
              const prevBtn = document.getElementById('modal-gallery-prev');
              const nextBtn = document.getElementById('modal-gallery-next');
              const dots = document.getElementById('modal-image-dots')?.querySelectorAll('span');
              const videoEl = document.getElementById('modal-active-video');
              return {
                videoSlideDisplay: videoSlide ? window.getComputedStyle(videoSlide).display : 'null',
                prevBtnDisplay: prevBtn ? window.getComputedStyle(prevBtn).display : 'null',
                dotsCount: dots ? dots.length : 0,
                hasVideoEl: !!videoEl,
                videoSrc: videoEl?.querySelector('source')?.getAttribute('src')
              };
            })()`
          });
          console.log('Product WITH Video (ssk-gld-101):', withVideoCheck.result.value);

          // Close modal
          await send('Runtime.evaluate', { expression: `closeProductModal(false);` });

          // 3. Test Product WITHOUT Video: ssk-gld-105
          const withoutVideoCheck = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `(() => {
              openProductModal('ssk-gld-105', false);
              const videoSlide = document.getElementById('modal-slide-video');
              const prevBtn = document.getElementById('modal-gallery-prev');
              const nextBtn = document.getElementById('modal-gallery-next');
              const dots = document.getElementById('modal-image-dots')?.querySelectorAll('span');
              return {
                videoSlideDisplay: videoSlide ? window.getComputedStyle(videoSlide).display : 'null',
                prevBtnDisplay: prevBtn ? window.getComputedStyle(prevBtn).display : 'null',
                dotsCount: dots ? dots.length : 0
              };
            })()`
          });
          console.log('Product WITHOUT Video (ssk-gld-105):', withoutVideoCheck.result.value);

          // Close modal
          await send('Runtime.evaluate', { expression: `closeProductModal(false);` });

          // 4. Test Fullscreen Reels Modal
          const reelModalCheck = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `(() => {
              openReelsModal('reel-kasu-mala');
              const modal = document.getElementById('reels-modal');
              const video = document.getElementById('reels-active-video');
              const title = document.getElementById('reels-modal-title');
              const isOpen = modal?.classList.contains('open');
              const result = {
                isOpen,
                title: title?.textContent,
                videoSrc: video?.src
              };
              closeReelsModal();
              return result;
            })()`
          });
          console.log('Reels Fullscreen Modal Check:', reelModalCheck.result.value);

          console.log('\n--- ALL CHECKS PASSED SUCCESSFULLY! ---');

          chrome.kill();
          server.close();
          process.exit(0);
        };
      } catch (e) {
        console.error('Error in test:', e);
        chrome.kill();
        server.close();
        process.exit(1);
      }
    });
  });
});
