/**
 * Sri Sai Krishna Jewellers - AI Jewellery Stylist & Voice Assistant ("కృష్ణ AI")
 * ChatGPT-Style Conversational Stylist with Real-Time Speech Recognition & 3D Try-On Engine
 * Location: Etikoppaka, AP | Phone / WhatsApp: +91 9573199344
 */

class JewelleryAiStylist {
  constructor() {
    this.isOpen = false;
    this.isListening = false;
    this.currentLanguage = 'en'; // 'en' or 'te'
    this.recognition = null;
    this.synth = window.speechSynthesis || null;
    this.chatHistory = [];
    this.isSpeaking = false;
    this.apiKey = localStorage.getItem('ssk_ai_api_key') || '';
  }

  init() {
    this.createDomElements();
    this.bindEvents();
    this.initSpeechRecognition();
  }

  createDomElements() {
    if (document.getElementById('ai-stylist-modal')) return;

    // 1. Floating AI Stylist Action Button
    const fab = document.createElement('button');
    fab.id = 'ai-stylist-fab';
    fab.className = 'ai-stylist-fab';
    fab.type = 'button';
    fab.title = 'AI Jewellery Stylist & Voice Assistant / నగల సలహాదారు';
    fab.innerHTML = `
      <div class="ai-fab-glow"></div>
      <div class="ai-fab-icon-wrap">
        <i class="ri-sparkling-2-fill ai-fab-sparkle"></i>
        <i class="ri-mic-fill ai-fab-mic"></i>
      </div>
      <span class="ai-fab-text">AI Stylist ✨</span>
    `;
    document.body.appendChild(fab);

    // 2. AI Stylist Drawer / Modal
    const modal = document.createElement('div');
    modal.id = 'ai-stylist-modal';
    modal.className = 'ai-stylist-drawer-backdrop';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="ai-stylist-drawer" role="dialog" aria-label="AI Jewellery Stylist">
        <!-- Drawer Header -->
        <div class="ai-drawer-header">
          <div class="ai-drawer-title-wrap">
            <div class="ai-avatar-badge">
              <i class="ri-sparkling-fill"></i>
            </div>
            <div>
              <h3 class="ai-drawer-title">Sri Sai Krishna AI Stylist</h3>
              <p class="ai-drawer-subtitle">Personal Goldsmith & Bridal Concierge • Etikoppaka</p>
            </div>
          </div>
          <div class="ai-drawer-header-actions">
            <button type="button" id="ai-lang-toggle" class="ai-header-btn" title="Toggle Language (English / తెలుగు)">
              <span id="ai-lang-label">తెలుగు</span>
            </button>
            <button type="button" id="ai-drawer-close" class="ai-header-btn close-btn" title="Close AI Stylist">
              <i class="ri-close-line"></i>
            </button>
          </div>
        </div>

        <!-- Suggestion Chips Bar -->
        <div class="ai-chips-bar" id="ai-chips-bar">
          <button type="button" class="ai-chip" data-prompt="Show me bridal harams under 50 grams">👑 Bridal Harams &lt; 50g</button>
          <button type="button" class="ai-chip" data-prompt="I want antique bangles for wrists">✨ Antique Bangles</button>
          <button type="button" class="ai-chip" data-prompt="Show me precious rings for fingers">💎 Solitaire Rings</button>
          <button type="button" class="ai-chip" data-prompt="Heritage Vaddanam for waist">🪞 Temple Vaddanam</button>
          <button type="button" class="ai-chip" data-prompt="What is today's 22K gold rate?">📈 Today's Gold Rate</button>
          <button type="button" class="ai-chip" data-prompt="నాకు పెళ్లి నగల డిజైన్లు చూపించండి">🗣️ తెలుగులో మాట్లాడండి</button>
        </div>

        <!-- Messages Container -->
        <div class="ai-chat-messages" id="ai-chat-messages">
          <!-- Initial AI Welcome Greeting -->
          <div class="ai-msg ai-msg-bot">
            <div class="ai-msg-avatar"><i class="ri-sparkling-fill"></i></div>
            <div class="ai-msg-content">
              <p><strong>Namaste! 🙏 Welcome to Sri Sai Krishna Jewellers.</strong></p>
              <p>I am your personal AI Jewellery Stylist. You can <strong>type or speak</strong> to me in English or తెలుగు.</p>
              <p>Ask for bridal harams, antique bangles, solitaire rings, vaddanam, or today's live 916 gold rates. Whenever you select an ornament, I will <strong>instantly convert it into an exact 3D model</strong> for live virtual try-on on your body!</p>
            </div>
          </div>
        </div>

        <!-- Voice Active Indicator Strip -->
        <div class="ai-voice-indicator" id="ai-voice-indicator" style="display:none;">
          <div class="ai-voice-waves">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <span class="ai-voice-status-text" id="ai-voice-status-text">Listening in English... Speak now</span>
        </div>

        <!-- Input Footer -->
        <div class="ai-drawer-footer">
          <div class="ai-input-wrap">
            <textarea id="ai-input-field" placeholder="Ask for jewellery designs, rates, or bridal sets..." rows="1"></textarea>
            <button type="button" id="ai-voice-mic-btn" class="ai-input-btn mic-btn" title="Voice Search / వాయిస్ అసిస్టెంట్">
              <i class="ri-mic-line"></i>
            </button>
            <button type="button" id="ai-send-btn" class="ai-input-btn send-btn" title="Send message">
              <i class="ri-send-plane-2-fill"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  bindEvents() {
    const fab = document.getElementById('ai-stylist-fab');
    if (fab) fab.onclick = () => this.toggle();

    const closeBtn = document.getElementById('ai-drawer-close');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const backdrop = document.getElementById('ai-stylist-modal');
    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) this.close();
      };
    }

    const langToggle = document.getElementById('ai-lang-toggle');
    if (langToggle) {
      langToggle.onclick = () => {
        this.currentLanguage = (this.currentLanguage === 'en') ? 'te' : 'en';
        const label = document.getElementById('ai-lang-label');
        if (label) label.textContent = (this.currentLanguage === 'en') ? 'తెలుగు' : 'English';
        this.addMessage('bot', (this.currentLanguage === 'te')
          ? 'నమస్కారం! నేను శ్రీ సాయి కృష్ణ జ్యువెలర్స్ ఏఐ స్టైలిస్ట్. మీరు తెలుగులో మాట్లాడవచ్చు లేదా టైప్ చేయవచ్చు. ఏ డిజైన్ కావాలన్నా వెంటనే 3D మోడల్‌గా మార్చి లైవ్ ట్రై-ఆన్ చేయవచ్చు!'
          : 'Language switched to English. You can speak or type your bridal and jewellery preferences!');
      };
    }

    const sendBtn = document.getElementById('ai-send-btn');
    const inputField = document.getElementById('ai-input-field');
    if (sendBtn && inputField) {
      sendBtn.onclick = () => this.handleSendMessage();
      inputField.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      };
    }

    const micBtn = document.getElementById('ai-voice-mic-btn');
    if (micBtn) {
      micBtn.onclick = () => this.toggleSpeechRecognition();
    }

    // Chips click delegation
    const chipsBar = document.getElementById('ai-chips-bar');
    if (chipsBar) {
      chipsBar.onclick = (e) => {
        const chip = e.target.closest('.ai-chip');
        if (chip) {
          const prompt = chip.getAttribute('data-prompt');
          if (prompt) {
            const input = document.getElementById('ai-input-field');
            if (input) input.value = prompt;
            this.handleSendMessage();
          }
        }
      };
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser environment');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      const micBtn = document.getElementById('ai-voice-mic-btn');
      if (micBtn) micBtn.classList.add('listening');
      const indicator = document.getElementById('ai-voice-indicator');
      if (indicator) indicator.style.display = 'flex';
      const statusText = document.getElementById('ai-voice-status-text');
      if (statusText) {
        statusText.textContent = (this.currentLanguage === 'te')
          ? 'తెలుగులో మాట్లాడుతున్నారు... దయచేసి చెప్పండి'
          : 'Listening in English... Speak your jewellery preference';
      }
    };

    this.recognition.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        transcript += e.results[i][0].transcript;
      }
      const inputField = document.getElementById('ai-input-field');
      if (inputField && transcript) {
        inputField.value = transcript;
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      const micBtn = document.getElementById('ai-voice-mic-btn');
      if (micBtn) micBtn.classList.remove('listening');
      const indicator = document.getElementById('ai-voice-indicator');
      if (indicator) indicator.style.display = 'none';

      const inputField = document.getElementById('ai-input-field');
      if (inputField && inputField.value.trim().length > 1) {
        this.handleSendMessage();
      }
    };

    this.recognition.onerror = (e) => {
      console.warn('Speech recognition notice:', e.error);
      this.isListening = false;
      const micBtn = document.getElementById('ai-voice-mic-btn');
      if (micBtn) micBtn.classList.remove('listening');
      const indicator = document.getElementById('ai-voice-indicator');
      if (indicator) indicator.style.display = 'none';
    };
  }

  toggleSpeechRecognition() {
    if (!this.recognition) {
      alert('Voice assistant is supported on Google Chrome, Edge, and Android Safari. Please type your query or allow microphone access.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.lang = (this.currentLanguage === 'te') ? 'te-IN' : 'en-IN';
      try {
        this.recognition.start();
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  }

  open() {
    this.isOpen = true;
    const modal = document.getElementById('ai-stylist-modal');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
    const input = document.getElementById('ai-input-field');
    if (input) setTimeout(() => input.focus(), 200);
  }

  openStylistModal() {
    return this.open();
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('ai-stylist-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (this.isListening && this.recognition) {
      this.recognition.stop();
    }
  }

  closeStylistModal() {
    return this.close();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  handleSendMessage() {
    const input = document.getElementById('ai-input-field');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Add user message to UI
    this.addMessage('user', text);

    // Show bot thinking indicator
    const thinkingId = this.showThinking();

    setTimeout(async () => {
      const response = await this.generateStylistResponse(text);
      this.removeThinking(thinkingId);
      this.addMessage('bot', response.message, response.products);

      // Optional text-to-speech voice response
      if (response.speakText && this.synth) {
        this.speak(response.speakText);
      }
    }, 450);
  }

  showThinking() {
    const id = 'thinking-' + Date.now();
    const container = document.getElementById('ai-chat-messages');
    if (!container) return id;

    const div = document.createElement('div');
    div.id = id;
    div.className = 'ai-msg ai-msg-bot thinking';
    div.innerHTML = `
      <div class="ai-msg-avatar"><i class="ri-sparkling-fill"></i></div>
      <div class="ai-msg-content">
        <div class="ai-typing-dots"><span></span><span></span><span></span></div>
      </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
  }

  removeThinking(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  addMessage(sender, htmlContent, products = []) {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ai-msg-${sender}`;

    let avatarHtml = '';
    if (sender === 'bot') {
      avatarHtml = `<div class="ai-msg-avatar"><i class="ri-sparkling-fill"></i></div>`;
    }

    let productsHtml = '';
    if (products && products.length > 0) {
      productsHtml = `
        <div class="ai-msg-products-grid">
          ${products.map(p => this.renderProductMiniCard(p)).join('')}
        </div>
      `;
    }

    msgDiv.innerHTML = `
      ${avatarHtml}
      <div class="ai-msg-content">
        <div>${htmlContent}</div>
        ${productsHtml}
      </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  renderProductMiniCard(product) {
    const live22k = (typeof currentRates !== 'undefined' && currentRates.gold22k) ? currentRates.gold22k : (DEFAULT_RATES?.gold22k || 13675);
    const estPrice = Math.round(product.approxGrossWeight * live22k);
    const formattedPrice = estPrice > 0 ? `₹${estPrice.toLocaleString('en-IN')}` : 'Live Rate';
    const thumb = product.image || product.tryOn?.asset || 'assets/kasu_mala.jpg';
    const typeLabel = product.tryOn?.label || product.tryOn?.type || 'Jewellery';

    return `
      <div class="ai-product-card" data-product-id="${product.id}">
        <div class="ai-card-img-wrap">
          <img src="${thumb}" alt="${escapeHtml(product.name)}" onerror="this.src='assets/hero.jpg'">
          <span class="ai-card-badge">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="ai-card-details">
          <div class="ai-card-title">${escapeHtml(product.name)}</div>
          <div class="ai-card-meta">
            <span>⚖️ ${product.approxGrossWeight}g</span>
            <span>⚜️ ${escapeHtml(product.purity || '916 BIS')}</span>
          </div>
          <div class="ai-card-price">${formattedPrice} <small>(est. at live rate)</small></div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button type="button" class="ai-btn-tryon-instant" style="flex:1;" onclick="window.SSK_AI_STYLIST.launchTryOnForProduct('${product.id}')">
              <i class="ri-sparkling-fill"></i> Try On in 3D Live ✨
            </button>
            <button type="button" class="ai-btn-tryon-instant" style="background:rgba(223,183,108,0.15); border:1px solid rgba(223,183,108,0.4); color:var(--gold-300); padding:0 10px;" onclick="window.SSK_AI_STYLIST.launchShowroomForProduct('${product.id}')" title="Inspect 360° 3D Mesh">
              <i class="ri-box-3-line"></i> 3D
            </button>
          </div>
        </div>
      </div>
    `;
  }

  launchShowroomForProduct(productId) {
    const product = (window.PRODUCTS_DATA || PRODUCTS_DATA).find(p => p.id === productId);
    if (!product) return;
    this.close();
    if (window.SSK_AI_3D) {
      window.SSK_AI_3D.openShowroomViewer(product);
    }
  }

  launchTryOnForProduct(productId) {
    const product = (window.PRODUCTS_DATA || PRODUCTS_DATA).find(p => p.id === productId);
    if (!product) return;

    // Close AI drawer
    this.close();

    // Notify user visually
    if (typeof showToast === 'function') {
      showToast(`✨ Converting "${product.name}" into 3D wearable model...`, 'success');
    }

    // Launch virtual try-on engine
    if (typeof launchVirtualTryOn === 'function') {
      launchVirtualTryOn(productId);
    } else if (window.SSK_VTO) {
      window.SSK_VTO.open(product);
    }
  }

  speak(text) {
    if (!this.synth) return;
    try {
      this.synth.cancel();
      const clean = text.replace(/<[^>]*>/g, '').replace(/[•*#_]/g, '');
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = (this.currentLanguage === 'te') ? 'te-IN' : 'en-IN';
      utter.rate = 1.0;
      utter.pitch = 1.05;
      this.synth.speak(utter);
    } catch (_) {}
  }

  /* ==========================================================================
     INTELLIGENT NATURAL LANGUAGE JEWELLERY EXPERT ENGINE
     ========================================================================== */
  async generateStylistResponse(userInput) {
    const raw = userInput.toLowerCase();
    const isTelugu = /[\u0C00-\u0C7F]/.test(userInput) || this.currentLanguage === 'te';

    // 1. Bullion Gold Rate Inquiry
    if (/gold rate|rate|price|gram|rate today|ధర|రేటు|ఎంత/i.test(raw) && !/necklace|bangle|ring|haram/i.test(raw)) {
      const live22k = (typeof currentRates !== 'undefined' && currentRates.gold22k) ? currentRates.gold22k : (DEFAULT_RATES?.gold22k || 13675);
      const live24k = (typeof currentRates !== 'undefined' && currentRates.gold24k) ? currentRates.gold24k : (DEFAULT_RATES?.gold24k || 14918);
      const liveSilver = (typeof currentRates !== 'undefined' && currentRates.silver) ? currentRates.silver : (DEFAULT_RATES?.silver || 245);

      if (isTelugu) {
        return {
          message: `<p><strong>ఈ రోజు ప్రత్యక్ష బులియన్ రేట్లు (ఎటికొప్పాక షోరూమ్):</strong></p>` +
                   `<p>• <strong>22K (916 హాల్‌మార్క్ బంగారం):</strong> ₹${live22k.toLocaleString('en-IN')} / గ్రాము<br>` +
                   `• <strong>24K (999 స్వచ్ఛమైన బంగారం):</strong> ₹${live24k.toLocaleString('en-IN')} / గ్రాము<br>` +
                   `• <strong>ప్యూర్ సిల్వర్ (వెండి):</strong> ₹${liveSilver.toLocaleString('en-IN')} / గ్రాము</p>` +
                   `<p>మీరు ఎంచుకున్న ఏ ఆభరణాన్ని అయినా పై రేటు ప్రకారం అంచనా వేసి లైవ్ 3D లో ధరించి చూడవచ్చు!</p>`,
          speakText: `ఈ రోజు 22 క్యారెట్ హాల్ మార్క్ బంగారం గ్రాము ధర ₹${live22k}. వెండి గ్రాము ధర ₹${liveSilver}.`
        };
      }
      return {
        message: `<p><strong>Today's Live Showroom Bullion Rates (Etikoppaka):</strong></p>` +
                 `<p>• <strong>22K (916 BIS Hallmark Gold):</strong> ₹${live22k.toLocaleString('en-IN')} / gram<br>` +
                 `• <strong>24K (999 Fine Pure Gold):</strong> ₹${live24k.toLocaleString('en-IN')} / gram<br>` +
                 `• <strong>Pure 925 Silver:</strong> ₹${liveSilver.toLocaleString('en-IN')} / gram</p>` +
                 `<p>Select any jewellery from our catalogue to see its live price estimate and try it on in 3D!</p>`,
        speakText: `Today's 22K 916 Hallmark gold rate is ₹${live22k} per gram.`
      };
    }

    // 2. Bangles / Kadas / Bracelets Inquiry (Wrists)
    if (/bangle|bangles|kada|kadas|bracelet|gajulu|గాజులు|కంకణం|కడియం|wrist/i.test(raw)) {
      const bangles = PRODUCTS_DATA.filter(p => p.tryOn?.type === 'BANGLES' || /bangle|kada|gajulu/i.test(p.name));
      if (isTelugu) {
        return {
          message: `<p><strong>నక్షి మయూర రాయల్ గాజులు (Bangles Pair):</strong></p>` +
                   `<p>ఇవి చేతి మణికట్టు (Wrists) పై ఖచ్చితంగా సరిపోయే 22K 916 BIS హాల్‌మార్క్ సాంప్రదాయ నక్షి వర్క్ గాజులు. సైడ్-స్క్రూ లాక్‌తో రాచరిక అందాన్ని ఇస్తాయి.</p>` +
                   `<p>క్రింది <strong>"Try On in 3D Live"</strong> బటన్ నొక్కండి. మీ చేతిని కెమెరా ముందు చూపితే గాజులు మీ మణికట్టుపై ధరించి కనిపిస్తాయి!</p>`,
          products: bangles,
          speakText: `నక్షి మయూర గాజులు మీ చేతి మణికట్టుపై ట్రై-ఆన్ చేయడానికి సిద్ధంగా ఉన్నాయి.`
        };
      }
      return {
        message: `<p><strong>Handcrafted Nakshi Peacock Bangles & Kadas:</strong></p>` +
                 `<p>Featuring pure 22K 916 BIS Hallmarked antique Nakshi work, Burmese rubies, and comfortable side-screw clasp. Designed to grace your <strong>wrists</strong>.</p>` +
                 `<p>Tap <strong>"Try On in 3D Live"</strong> below. When you raise your wrist to the camera, the bangles will automatically fit on your wrists in real-time!</p>`,
        products: bangles,
        speakText: `Here are our 22K antique peacock bangles. Tap Try On in 3D to wear them on your wrists!`
      };
    }

    // 3. Rings Inquiry (Fingers)
    if (/ring|rings|vungaram|solitaire|finger|ఉంగరం|వేలి/i.test(raw)) {
      const rings = PRODUCTS_DATA.filter(p => p.tryOn?.type === 'RING' || /ring|vungaram/i.test(p.name));
      if (isTelugu) {
        return {
          message: `<p><strong>సంప్రదాయ నవరత్న & సాలిటైర్ ఉంగరాలు (Rings):</strong></p>` +
                   `<p>నవగ్రహాల శుభశక్తితో కూడిన 22K స్వచ్ఛమైన బంగారు ఉంగరం. మీ వేళ్లపై (Fingers) అందంగా సరిపోతుంది.</p>` +
                   `<p>క్రింద ఉన్న <strong>"Try On in 3D Live"</strong> నొక్కి, మీ వేళ్లను కెమెరా ముందు ఉంచితే ఉంగరం వేలికి అలంకరింపబడుతుంది!</p>`,
          products: rings,
          speakText: `నవరత్న ఉంగరం మీ వేలికి సరిపోయేలా 3D మోడల్ సిద్ధంగా ఉంది.`
        };
      }
      return {
        message: `<p><strong>22K Traditional Navaratna & Solitaire Finger Rings:</strong></p>` +
                 `<p>Adorned with certified Navaratna gems and brilliant solitaire setting. Specifically tracked for your <strong>fingers (ring finger)</strong>.</p>` +
                 `<p>Click <strong>"Try On in 3D Live"</strong> below, and hold your fingers towards the camera to see the ring fit onto your finger seamlessly!</p>`,
        products: rings,
        speakText: `Here is our 22K Navaratna solitaire ring. Tap Try On in 3D to see it on your finger!`
      };
    }

    // 4. Vaddanam / Waist Belt Inquiry (Waist)
    if (/vaddanam|vaddanamu|waist belt|kamarbandh|oddiyanam|వడ్డాణం|ఒడ్డాణం|నడుము/i.test(raw)) {
      const vaddanams = PRODUCTS_DATA.filter(p => p.tryOn?.type === 'VADDANAM' || /vaddanam/i.test(p.name));
      if (isTelugu) {
        return {
          message: `<p><strong>సంప్రదాయ దేవాలయ అష్టలక్ష్మి నక్షి వడ్డాణం (Waist Belt):</strong></p>` +
                   `<p>పెళ్లి కూతురికి నిండుదనం తెచ్చే అత్యంత వైభవోపేతమైన బంగారు వడ్డాణం. ఇది మీ నడుము (Waistline) భాగానికి సరిగ్గా అమరుతుంది.</p>` +
                   `<p>క్రింది <strong>"Try On in 3D Live"</strong> నొక్కి, కెమెరా ముందు నిలబడితే వడ్డాణం మీ నడుము చుట్టూ 3D ఆర్క్‌లో అమర్చబడుతుంది!</p>`,
          products: vaddanams,
          speakText: `దేవాలయ అష్టలక్ష్మి నక్షి వడ్డాణం మీ నడుముకు సరిపోయేలా సిద్ధంగా ఉంది.`
        };
      }
      return {
        message: `<p><strong>22K Antique Heritage Temple Ashtalakshmi Vaddanam:</strong></p>` +
                 `<p>A showstopping South Indian bridal waist belt sculpted with divine Ashtalakshmi motifs. Fitted along your <strong>waistline contour</strong>.</p>` +
                 `<p>Tap <strong>"Try On in 3D Live"</strong> below. The camera will fit the Vaddanam around your waist in an authentic 3D curved drape!</p>`,
        products: vaddanams,
        speakText: `Here is our Heritage Temple Vaddanam. Tap Try On in 3D to fit it around your waist!`
      };
    }

    // 5. Anklets / Payal / Pattilu Inquiry (Ankles)
    if (/anklet|anklets|pattilu|payal|golusu|పట్టీలు|గజ్జెలు/i.test(raw)) {
      const anklets = PRODUCTS_DATA.filter(p => p.tryOn?.type === 'ANKLETS' || /pattilu|anklet|payal/i.test(p.name));
      if (isTelugu) {
        return {
          message: `<p><strong>స్వచ్ఛమైన వెండి వధువు పట్టీలు (925 Silver Anklets):</strong></p>` +
                   `<p>మధురమైన ఘుమఘుమల గజ్జెల సవ్వడితో, యాంటిక్ ఆక్సిడైజ్డ్ డిజైన్‌తో కూడిన స్వచ్ఛమైన వెండి పట్టీలు.</p>` +
                   `<p>క్రింది <strong>"Try On in 3D Live"</strong> నొక్కి మీ పాదాల అందాన్ని పరీక్షించండి!</p>`,
          products: anklets,
          speakText: `స్వచ్ఛమైన వెండి పట్టీలు 3D లో చూడటానికి సిద్ధంగా ఉన్నాయి.`
        };
      }
      return {
        message: `<p><strong>925 Pure Silver Bridal Pattilu (Payal / Anklets):</strong></p>` +
                 `<p>Traditional handcrafted silver bridal anklets with melodic chiming bells and antique detailing.</p>` +
                 `<p>Tap <strong>"Try On in 3D Live"</strong> below to view them positioned on your ankles!</p>`,
        products: anklets,
        speakText: `Here are our 925 silver bridal pattilu. Tap Try On in 3D to view!`
      };
    }

    // 6. Bridal Harams & Necklaces / Chokers (Chest & Neck)
    if (/haram|necklace|mala|choker|bridal|wedding|పెళ్లి|నెక్లెస్|హారం|చోకర్|50g|50 grams|weight/i.test(raw)) {
      const neckWear = PRODUCTS_DATA.filter(p => p.tryOn?.type === 'NECKLACE' || p.tryOn?.type === 'CHOKER');
      if (isTelugu) {
        return {
          message: `<p><strong>సంప్రదాయ రాయల్ పెళ్లి హారాలు & గుత్తపూసల చోకర్లు:</strong></p>` +
                   `<p>శ్రీ లక్ష్మీ కాసుల పేరు లాంగ్ హారం మరియు బసవన్న ముత్యాల గుత్తపూసల చోకర్ సెట్లు. 916 హాల్‌మార్క్ గ్యారెంటీతో మీ ఛాతీ మరియు మెడకు హుందాగా నప్పుతాయి.</p>` +
                   `<p>మీకు నచ్చిన నెక్లెస్‌పై <strong>"Try On in 3D Live"</strong> నొక్కండి. ఫోటో వెంటనే 3D మోడల్‌గా మారి మీ మెడలో అలంకరింపబడుతుంది!</p>`,
          products: neckWear.slice(0, 3),
          speakText: `శ్రీ లక్ష్మీ కాసుల హారం మరియు గుత్తపూసల చోకర్ సెట్లు మీకోసం సిద్ధంగా ఉన్నాయి.`
        };
      }
      return {
        message: `<p><strong>Royal Heritage Bridal Harams & Guttapusalu Chokers:</strong></p>` +
                 `<p>Masterpieces including the 22K Lakshmi Kasu Mala Long Haram andBasara Pearl Guttapusalu Choker Set. Handcrafted with Kemp rubies and natural emeralds.</p>` +
                 `<p>Select any design below and tap <strong>"Try On in 3D Live"</strong>. Our vision engine removes all background and conforms the necklace naturally to your neck contour!</p>`,
        products: neckWear.slice(0, 3),
        speakText: `Here are our royal bridal harams and chokers. Tap Try On in 3D to drape them over your neck!`
      };
    }

    // 7. Earrings / Buttalu / Jhumkas (Earlobes)
    if (/earring|earrings|jhumka|jhumkas|buttalu|studs|బుట్టలు|జుంకాలు|కమ్మలు/i.test(raw)) {
      const earrings = PRODUCTS_DATA.filter(p => p.tryOn?.type === 'EARRINGS' || /buttalu|jhumka/i.test(p.name));
      if (isTelugu) {
        return {
          message: `<p><strong>22K యాంటిక్ టెంపుల్ నెమలి బుట్టలు (Jhumkas):</strong></p>` +
                   `<p>దక్షిణ భారత సంప్రదాయ గొడుగు బుట్టలు. మీ చెవుల కమ్మలు (Earlobes) పై సరిగ్గా వేలాడేలా 3D లో రూపొందించబడింది.</p>`,
          products: earrings,
          speakText: `నెమలి బుట్టలు మీ చెవులకు సరిపోయేలా 3D మోడల్ సిద్ధంగా ఉంది.`
        };
      }
      return {
        message: `<p><strong>22K Antique Temple Peacock Buttalu / Jhumkas:</strong></p>` +
                 `<p>Classic South Indian bell jhumkas topped with an embossed peacock stud. Tracked directly onto your <strong>earlobes</strong> with natural gravity pendulum motion.</p>`,
        products: earrings,
        speakText: `Here are our 22K antique peacock buttalu. Tap Try On in 3D to see them on your earlobes!`
      };
    }

    // 8. General Recommendation / Showcase
    const featuredItems = PRODUCTS_DATA.filter(p => p.tryOn && p.tryOn.enabled).slice(0, 4);
    if (isTelugu) {
      return {
        message: `<p><strong>శ్రీ సాయి కృష్ణ జ్యువెలర్స్ విశేష ఆభరణాలు:</strong></p>` +
                 `<p>మా వద్ద ఉన్న అత్యుత్తమ 916 BIS హాల్‌మార్క్ బంగారు ఆభరణాలు ఇక్కడ ఉన్నాయి. మీరు ఏ ఆభరణాన్ని ఎంచుకున్నా, అది వెంటనే <strong>వాస్తవిక 3D మోడల్‌గా మార్చబడి</strong> మీ శరీర భాగాలపై (మెడ, మణికట్టు, వేళ్లు, నడుము) లైవ్ కెమెరాలో ప్రత్యక్షమవుతుంది!</p>`,
        products: featuredItems,
        speakText: `మా షోరూమ్ లోని ప్రముఖ డిజైన్లు ఇక్కడ ఉన్నాయి. మీరు లైవ్ 3D లో ధరించి చూడవచ్చు.`
      };
    }
    return {
      message: `<p><strong>Sri Sai Krishna Jewellers Curated Bridal Showcase:</strong></p>` +
               `<p>Here are our most celebrated 22K 916 BIS Hallmarked bridal masterworks. Pick any product below and tap <strong>"Try On in 3D Live"</strong> to immediately see it converted into an exact 3D model placed naturally on your body!</p>`,
      products: featuredItems,
      speakText: `Here are our featured jewellery designs. Tap Try On in 3D on any item to see how it looks on you!`
    };
  }
}

// Global Singleton Instance
window.SSK_AI_STYLIST = new JewelleryAiStylist();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.SSK_AI_STYLIST.init());
} else {
  window.SSK_AI_STYLIST.init();
}
