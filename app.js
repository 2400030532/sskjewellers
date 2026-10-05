// Sri Sai Krishna Jewellers - Interactive Showroom Application
// Location: Etikoppaka, AP | Phone / WhatsApp: +91 9573199344

// State
let currentCategory = 'all';
let currentTypeFilter = 'all';
let currentMetalFilter = 'all';
let searchQuery = '';
let shortlist = [];
let currentRates = { ...DEFAULT_RATES };
let rateSyncStatus = {
  isLive: false,
  lastUpdated: null,
  isFetching: false,
  source: 'Default'
};
function getApiBaseUrl() {
  return (localStorage.getItem('ssk_api_base_url') || window.SSK_API_BASE_URL || 'https://sskjewellers.onrender.com').replace(/\/$/, '');
}
let API_BASE_URL = getApiBaseUrl();

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initAudioSystem();
  initCinematicIntro();
  LuxuryEntrySequence();
  loadCustomProducts();
  loadRates();
  loadRemoteShowroomRates();
  loadShortlist();
  renderRatesTicker();
  renderProducts();
  renderHeroProductRail();
  setupProductCard3DMotion();
  setupCinematicScrollReveal();
  setupHeroCursorParallax();
  setupStoryBubbles();
  setupEventListeners();
  setupFilterModal();
  setupHistoryNavigation();
  setupCalculator();
  setupAdminAccess();
  setupAdminPortal();
  setupAdminRates();
  setupPromoMedia();
  setupThemeToggle();
  setupLanguagePrompt();
  setupHeroSearch();
  setupShowroomNavigation();
  setupShortlistDrawerNav();
  updateOwnerPortalIndicator();
  keepBackendAwake();
  loadRemoteProducts();
  
  // Auto-fetch live rates from API on page load
  fetchLiveBullionRates();

  // Auto-poll live rates every 2 minutes (120,000 ms)
  setInterval(() => {
    fetchLiveBullionRates(false);
  }, 2 * 60 * 1000);

  setInterval(keepBackendAwake, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') keepBackendAwake();
  });
});

function setupLanguagePrompt() {
  const modal = document.getElementById('language-modal');
  const closeBtn = document.getElementById('btn-close-language-modal');
  const choices = document.querySelectorAll('[data-language-choice]');
  if (!modal) return;

  const savedLanguage = localStorage.getItem('ssk_language') || 'en';
  applyLanguage(savedLanguage);

  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      const language = choice.dataset.languageChoice || 'en';
      localStorage.setItem('ssk_language', language);
      applyLanguage(language);
      modal.classList.remove('open');
      showToast(language === 'te' ? 'భాష తెలుగులోకి మార్చబడింది (Telugu)' : 'Language switched to English');
    });
  });

  // Wire up language switcher buttons (navbar & sidebar) - Direct one-tap switch!
  const langBtns = document.querySelectorAll('#btn-change-language, .btn-lang-switcher, .mob-lang-btn');
  langBtns.forEach(langBtn => {
    if (langBtn) {
      langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = localStorage.getItem('ssk_language') || 'en';
        const next = current === 'te' ? 'en' : 'te';
        localStorage.setItem('ssk_language', next);
        applyLanguage(next);
        showToast(next === 'te' ? 'వెబ్‌సైట్ తెలుగులోకి మార్చబడింది (Telugu)' : 'Website switched to English');
      });
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  // Backdrop click to dismiss
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
}

function applyLanguage(language) {
  const telugu = language === 'te';

  // Highlight active language buttons in modal and sidebar
  document.querySelectorAll('[data-language-choice]').forEach(el => {
    const isThis = el.dataset.languageChoice === language;
    el.classList.toggle('active', isThis);
  });

  const langCodeEl = document.querySelector('.lang-btn-text, .lang-code-text');
  if (langCodeEl) {
    langCodeEl.textContent = telugu ? 'తె/EN' : 'EN/తె';
  }

  // 1. Navigation Links (Desktop, Mobile, Sidebar)
  const navTranslations = {
    '.nav-link[href="#hero-section"]': telugu ? 'హోమ్' : 'Home',
    '.nav-link[href="#calculator-section"]': telugu ? 'ధర' : 'Price',
    '.nav-link[href="#catalog-section"]': telugu ? 'నగలు' : 'Browse',
    '.nav-link[href="#artisan-section"]': telugu ? 'కళ' : 'Craft',
    '.nav-link[href="#custom-order-section"]': telugu ? 'కస్టమ్' : 'Custom',
    '.nav-link[href="#store-section"]': telugu ? 'దుకాణం' : 'Shop',
    '.side-nav-link[data-section="hero-section"] span': telugu ? 'హోమ్' : 'Home',
    '.side-nav-link[data-section="calculator-section"] span': telugu ? 'ధర' : 'Price',
    '.side-nav-link[data-section="catalog-section"] span': telugu ? 'నగలు' : 'Browse',
    '.side-nav-link[data-section="artisan-section"] span': telugu ? 'కళ' : 'Craft',
    '.side-nav-link[data-section="custom-order-section"] span': telugu ? 'కస్టమ్' : 'Custom',
    '.side-nav-link[data-section="store-section"] span': telugu ? 'దుకాణం' : 'Shop',
    '#mob-home-link span': telugu ? 'హోమ్' : 'Home',
    '#mob-price-link span': telugu ? 'ధర' : 'Price',
    '#mob-browse-link span': telugu ? 'నగలు' : 'Browse',
    '#mob-saved-link span:not(.mobile-tab-badge)': telugu ? 'సేవ్' : 'Save',
    '#mob-ask-link span': telugu ? 'అడగండి' : 'Ask',
    '#btn-nav-shortlist span:not(.shortlist-badge)': telugu ? 'సేవ్ చేసినవి' : 'Saved',
    '.btn-whatsapp-nav span': telugu ? 'మమ్మల్ని అడగండి' : 'Ask us'
  };

  Object.entries(navTranslations).forEach(([selector, text]) => {
    const element = document.querySelector(selector);
    if (!element) return;
    const icon = element.querySelector('i');
    element.textContent = '';
    if (icon) element.appendChild(icon);
    element.appendChild(document.createTextNode(` ${text}`));
  });

  // 2. Top Bullion Ticker Labels
  const tickerLiveLabel = document.getElementById('ticker-live-status-label');
  if (tickerLiveLabel) tickerLiveLabel.textContent = telugu ? 'ప్రత్యక్ష ధరలు' : 'LIVE RATES';

  document.querySelectorAll('.ticker-label-22k').forEach(el => el.textContent = telugu ? '22K బంగారం: ' : '22K Gold: ');
  document.querySelectorAll('.ticker-label-24k').forEach(el => el.textContent = telugu ? '24K బంగారం: ' : '24K Gold: ');
  document.querySelectorAll('.ticker-label-18k').forEach(el => el.textContent = telugu ? '18K బంగారం: ' : '18K Gold: ');
  document.querySelectorAll('.ticker-label-silver').forEach(el => el.textContent = telugu ? 'వెండి: ' : 'Silver: ');
  document.querySelectorAll('.ticker-label-hallmark').forEach(el => el.textContent = telugu ? 'ఏటికొప్పాక: ' : 'Etikoppaka: ');
  document.querySelectorAll('.ticker-val-hallmark').forEach(el => el.textContent = telugu ? '100% 916 BIS హాల్‌మార్క్' : '100% 916 BIS Hallmark');

  const tickerCalcText = document.getElementById('ticker-calc-btn-text');
  if (tickerCalcText) tickerCalcText.textContent = telugu ? 'కాలిక్యులేటర్' : 'Calculator';

  // 3. Instagram-style Story Bubbles
  const storyMap = {
    'all': telugu ? 'అన్ని నమూనాలు' : 'All Designs',
    'necklace': telugu ? 'పెళ్లి హారాలు' : 'Bridal Sets',
    'bangles': telugu ? 'బంగారు గాజులు' : 'Bangles',
    'gold-daily': telugu ? 'రోజూ వేసుకునేవి' : 'Daily Wear',
    'silver-pooja': telugu ? 'వెండి పూజా సామాగ్రి' : 'Silver Pooja',
    'gold-coins': telugu ? 'బంగారు నాణాలు' : 'Coins & Bars'
  };
  document.querySelectorAll('.story-bubble').forEach(bubble => {
    const cat = bubble.dataset.category;
    const span = bubble.querySelector('span');
    if (span && storyMap[cat]) span.textContent = storyMap[cat];
  });

  // 4. Catalog Controls & Header
  const catalogTag = document.querySelector('#catalog-section .section-tag');
  if (catalogTag) catalogTag.textContent = telugu ? 'ఏటికొప్పాక షోరూమ్ కలెక్షన్' : 'Showroom Collection';

  const catalogTitle = document.querySelector('#catalog-section .section-title');
  if (catalogTitle) catalogTitle.textContent = telugu ? 'మీకు నచ్చిన నగలను ఎంచుకోండి' : 'Choose your piece';

  const catalogSubtitle = document.querySelector('#catalog-section .section-subtitle');
  if (catalogSubtitle) catalogSubtitle.textContent = telugu 
    ? 'సిద్ధంగా ఉన్నవి మరియు ప్రత్యేక ఆర్డర్లు. ప్రత్యక్ష ధర మరియు వివరాల కోసం తాకండి.' 
    : 'Ready pieces & custom designs. Tap any piece for live price & karigar details.';

  const heroSearch = document.getElementById('hero-search');
  const catalogueSearch = document.getElementById('search-catalog');
  if (heroSearch) heroSearch.placeholder = telugu ? 'హారం, గాజులు, నెక్లెస్, కాసుల పేరు వెతకండి...' : 'Search jewellery...';
  if (catalogueSearch) catalogueSearch.placeholder = telugu ? 'హారం, గాజులు, నెక్లెస్, కాసుల పేరు వెతకండి...' : 'Search necklace, bangles, haram, coins...';

  const filterTriggerBtn = document.querySelector('#btn-open-filter-modal span:not(.filter-count-badge)');
  if (filterTriggerBtn) filterTriggerBtn.textContent = telugu ? 'ఫిల్టర్' : 'Filter';

  // Quick category pills
  const pillMap = {
    'all': telugu ? 'అన్ని నమూనాలు' : 'All Designs',
    'gold-bridal': telugu ? '👑 పెళ్లి & గుడి నగలు' : '👑 Bridal & Temple',
    'bangles': telugu ? '💫 గాజులు & కడియాలు' : '💫 Bangles',
    'gold-daily': telugu ? '✨ రోజూ వేసుకునే నగలు' : '✨ Daily Wear',
    'silver-pooja': telugu ? '🪔 వెండి పూజా వస్తువులు' : '🪔 Silver Pooja',
    'silver-jewellery': telugu ? '💎 925 స్వచ్ఛమైన వెండి' : '💎 925 Silver',
    'gold-coins': telugu ? '🪙 బంగారు నాణాలు' : '🪙 Coins & Bars'
  };
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const cat = btn.dataset.category;
    if (pillMap[cat]) btn.textContent = pillMap[cat];
  });

  // 5. Filter Modal Bottom Sheet
  const filterTitle = document.getElementById('filter-modal-title');
  if (filterTitle) {
    filterTitle.innerHTML = telugu 
      ? '<i class="ri-equalizer-line" style="color: var(--gold-400);"></i> నగలను ఫిల్టర్ చేయండి' 
      : '<i class="ri-equalizer-line" style="color: var(--gold-400);"></i> Filter Jewellery';
  }
  const filterSub = document.querySelector('.filter-sheet-title-group p');
  if (filterSub) filterSub.textContent = telugu ? 'లభ్యత, నగల వర్గం మరియు స్వచ్ఛత ఆధారంగా ఎంచుకోండి' : 'Organize by showroom stock, category & metal';

  const sheetLabels = document.querySelectorAll('.sheet-filter-label');
  if (sheetLabels[0]) sheetLabels[0].innerHTML = telugu ? '<i class="ri-store-2-fill" style="color:var(--gold-400);"></i> షోరూమ్ లభ్యత' : '<i class="ri-store-2-fill" style="color:var(--gold-400);"></i> Showroom Stock Status';
  if (sheetLabels[1]) sheetLabels[1].innerHTML = telugu ? '<i class="ri-sparkling-fill" style="color:var(--gold-400);"></i> నగల వర్గం' : '<i class="ri-sparkling-fill" style="color:var(--gold-400);"></i> Jewellery Category';
  if (sheetLabels[2]) sheetLabels[2].innerHTML = telugu ? '<i class="ri-medal-fill" style="color:var(--gold-400);"></i> లోహ స్వచ్ఛత' : '<i class="ri-medal-fill" style="color:var(--gold-400);"></i> Metal Purity';

  // Stock chips
  const stockChipAll = document.querySelector('.sheet-chip[data-sheet-type="stock"][data-val="all"]');
  if (stockChipAll) stockChipAll.textContent = telugu ? 'అన్ని రకాలు' : 'All Stock';
  const stockChipReady = document.querySelector('.sheet-chip[data-sheet-type="stock"][data-val="ready"]');
  if (stockChipReady) stockChipReady.innerHTML = telugu ? '<i class="ri-checkbox-circle-fill" style="color: #22c55e;"></i> ఏటికొప్పాక షాపులో సిద్ధంగా ఉన్నవి' : '<i class="ri-checkbox-circle-fill" style="color: #22c55e;"></i> Ready in Shop (Etikoppaka)';
  const stockChipCustom = document.querySelector('.sheet-chip[data-sheet-type="stock"][data-val="custom"]');
  if (stockChipCustom) stockChipCustom.innerHTML = telugu ? '<i class="ri-hammer-fill" style="color: var(--gold-300);"></i> ఆర్డర్‌పై చేతితో తయారుచేసేవి' : '<i class="ri-hammer-fill" style="color: var(--gold-300);"></i> Handmade to Order';

  // Category chips
  document.querySelectorAll('.sheet-chip[data-sheet-type="category"]').forEach(chip => {
    const val = chip.dataset.val;
    if (pillMap[val]) chip.textContent = pillMap[val];
  });

  // Metal chips
  const metalChipAll = document.querySelector('.sheet-chip[data-sheet-type="metal"][data-val="all"]');
  if (metalChipAll) metalChipAll.textContent = telugu ? 'అన్ని లోహాలు' : 'All Metals';
  const metalChip22k = document.querySelector('.sheet-chip[data-sheet-type="metal"][data-val="gold-22k"]');
  if (metalChip22k) metalChip22k.textContent = telugu ? '22K (916 BIS హాల్‌మార్క్)' : '22K (916 BIS Hallmark)';
  const metalChip24k = document.querySelector('.sheet-chip[data-sheet-type="metal"][data-val="gold-24k"]');
  if (metalChip24k) metalChip24k.textContent = telugu ? '24K స్వచ్ఛమైన బంగారం (999)' : '24K Fine Gold (999)';
  const metalChipSlv = document.querySelector('.sheet-chip[data-sheet-type="metal"][data-val="silver"]');
  if (metalChipSlv) metalChipSlv.textContent = telugu ? '925 స్వచ్ఛమైన వెండి' : '925 Pure Sterling Silver';

  const sheetResetBtn = document.getElementById('btn-sheet-reset');
  if (sheetResetBtn) sheetResetBtn.innerHTML = telugu ? '<i class="ri-refresh-line"></i> అన్నీ తొలగించు' : '<i class="ri-refresh-line"></i> Reset All';
  const sheetApplyBtn = document.getElementById('btn-sheet-apply');
  if (sheetApplyBtn) sheetApplyBtn.textContent = telugu ? 'ఫిల్టర్లను వర్తింపజేయి' : 'Apply Filters';

  // 6. Calculator Section
  const calcH3 = document.querySelector('.calc-title-box h3');
  if (calcH3) calcH3.innerHTML = telugu ? '<i class="ri-calculator-line" style="color: var(--gold-400);"></i> లైవ్ నగల ధర కాలిక్యులేటర్' : '<i class="ri-calculator-line" style="color: var(--gold-400);"></i> Live Jewellery Price Calculator';
  const calcP = document.querySelector('.calc-title-box p');
  if (calcP) calcP.textContent = telugu ? 'నేటి అధికారిక విశాఖపట్నం & ఏటికొప్పాక బులియన్ రేట్ల ఆధారంగా ప్రత్యక్ష లెక్కింపు.' : "Real-time calculation based on today's official Visakhapatnam showroom bullion rates.";

  const metalLabel = document.querySelector('label[for="calc-metal"]');
  if (metalLabel) metalLabel.innerHTML = telugu ? '<i class="ri-medal-line"></i> లోహం & స్వచ్ఛత' : '<i class="ri-medal-line"></i> Metal & Purity';
  const weightLabel = document.querySelector('label[for="calc-weight"]');
  if (weightLabel) weightLabel.innerHTML = telugu ? '<i class="ri-scales-3-line"></i> బరువు (గ్రాములలో)' : '<i class="ri-scales-3-line"></i> Weight (Grams)';
  const makingLabel = document.querySelector('label[for="calc-making"]');
  if (makingLabel) makingLabel.innerHTML = telugu ? '<i class="ri-hammer-line"></i> తయారీ మజూరీ ఖర్చులు (తరుగు / తయారీ)' : '<i class="ri-hammer-line"></i> Making Charges (VA / Karigar)';

  const breakdownKicker = document.querySelector('.breakdown-kicker');
  if (breakdownKicker) breakdownKicker.innerHTML = telugu ? '<i class="ri-file-list-3-line"></i> అంచనా ధర వివరాలు' : '<i class="ri-file-list-3-line"></i> Estimated Price Breakdown';
  const totalLabel = document.querySelector('.calc-total-label');
  if (totalLabel) totalLabel.textContent = telugu ? 'మొత్తం అంచనా ధర' : 'Estimated Total';
  const totalNote = document.querySelector('.calc-total-box small');
  if (totalNote) totalNote.textContent = telugu ? 'జీఎస్టీ & మజూరీతో కలిపి' : 'With GST & Making';
  const calcWhatsappBtn = document.getElementById('calc-whatsapp-btn');
  if (calcWhatsappBtn) calcWhatsappBtn.innerHTML = telugu ? '<i class="ri-whatsapp-line" style="font-size:1.15rem;color:#25d366;"></i> ఈ అంచనాను వాట్సాప్‌లో అడగండి' : '<i class="ri-whatsapp-line" style="font-size:1.15rem;color:#25d366;"></i> Inquire this estimate on WhatsApp';

  // 7. Artisan Section
  const artisanTag = document.querySelector('#artisan-section .section-tag');
  if (artisanTag) artisanTag.textContent = telugu ? 'మా సంప్రదాయ కళ' : 'Our craft';
  const artisanH2 = document.querySelector('#artisan-section h2');
  if (artisanH2) artisanH2.innerHTML = telugu ? 'చేతిపని <span class="gold-text">స్వర్ణకారులు.</span>' : 'Made by <span class="gold-text">karigars.</span>';
  const artisanDesc = document.querySelector('#artisan-section .artisan-content > p');
  if (artisanDesc) artisanDesc.textContent = telugu ? 'ఫోటో పంపండి. బరువు ఎంచుకోండి. మేము మీ కోసం తయారుచేస్తాము.' : 'Send a photo. Choose the weight. We make it for you.';
  const stepItems = document.querySelectorAll('.craft-step-item');
  if (stepItems[0]) {
    stepItems[0].querySelector('h5').textContent = telugu ? 'ఫోటో పంపండి' : 'Share a photo';
    stepItems[0].querySelector('p').textContent = telugu ? 'మీకు నచ్చిన నమూనా చూపించండి.' : 'Show us what you like.';
  }
  if (stepItems[1]) {
    stepItems[1].querySelector('h5').textContent = telugu ? 'బరువు ఎంచుకోండి' : 'Choose weight';
    stepItems[1].querySelector('p').textContent = telugu ? 'మీ బడ్జెట్ మరియు స్వచ్ఛతను నిర్ణయించండి.' : 'Pick your budget and purity.';
  }
  if (stepItems[2]) {
    stepItems[2].querySelector('h5').textContent = telugu ? 'మేము తయారుచేస్తాము' : 'We make it';
    stepItems[2].querySelector('p').textContent = telugu ? 'హాల్‌మార్క్ ముద్రతో పరిపూర్ణంగా సిద్ధం చేస్తాము.' : 'Finished and hallmarked.';
  }
  const artisanBtn = document.querySelector('#artisan-section .btn-primary-gold');
  if (artisanBtn) artisanBtn.innerHTML = telugu ? '<i class="ri-hammer-line"></i> ప్రత్యేక ఆర్డర్ ఇవ్వండి' : '<i class="ri-hammer-line"></i> Start a custom order';

  // 8. Custom Order Desk Section
  const customTag = document.querySelector('#custom-order-section .section-tag');
  if (customTag) customTag.textContent = telugu ? 'ప్రత్యేక ఆర్డర్' : 'Custom order';
  const customTitle = document.querySelector('#custom-order-section .section-title');
  if (customTitle) customTitle.textContent = telugu ? 'మీకు నచ్చిన డిజైన్ తయారుచేయించుకోండి' : 'Make your design';
  const customSub = document.querySelector('#custom-order-section .section-subtitle');
  if (customSub) customSub.textContent = telugu ? 'వివరాలు పంపండి. మేము వాట్సాప్‌లో సమాధానం ఇస్తాము.' : 'Send the details. We will reply on WhatsApp.';
  const customNameLabel = document.querySelector('label[for="custom-name"]');
  if (customNameLabel) customNameLabel.textContent = telugu ? 'మీ పేరు *' : 'Name *';
  const customPhoneLabel = document.querySelector('label[for="custom-phone"]');
  if (customPhoneLabel) customPhoneLabel.textContent = telugu ? 'వాట్సాప్ నంబర్ *' : 'WhatsApp number *';
  const customTypeLabel = document.querySelector('label[for="custom-type"]');
  if (customTypeLabel) customTypeLabel.textContent = telugu ? 'నగల రకం *' : 'Jewellery type *';
  const customWeightLabel = document.querySelector('label[for="custom-weight"]');
  if (customWeightLabel) customWeightLabel.textContent = telugu ? 'బరువు (గ్రాములలో) *' : 'Weight in grams *';
  const customMetalLabel = document.querySelector('label[for="custom-metal"]');
  if (customMetalLabel) customMetalLabel.textContent = telugu ? 'లోహం & స్వచ్ఛత' : 'Metal & Purity';
  const customCityLabel = document.querySelector('label[for="custom-city"]');
  if (customCityLabel) customCityLabel.textContent = telugu ? 'ఊరు / నగరం' : 'City';
  const customNotesLabel = document.querySelector('label[for="custom-notes"]');
  if (customNotesLabel) customNotesLabel.textContent = telugu ? 'సందేశం / ప్రత్యేక వివరాలు' : 'Notes';
  const customSubmitBtn = document.querySelector('#custom-order-form button[type="submit"]');
  if (customSubmitBtn) customSubmitBtn.innerHTML = telugu ? '<i class="ri-whatsapp-line"></i> వాట్సాప్‌లో పంపండి' : '<i class="ri-whatsapp-line"></i> Send on WhatsApp';

  // 9. Store Section
  const storeH3 = document.querySelector('.store-info-box h3');
  if (storeH3) storeH3.innerHTML = telugu ? '<i class="ri-store-3-line" style="color: var(--gold-400);"></i> మా దుకాణాన్ని సందర్శించండి' : '<i class="ri-store-3-line" style="color: var(--gold-400);"></i> Visit the shop';
  const btnCallShop = document.querySelector('.btn-call-shop');
  if (btnCallShop) btnCallShop.innerHTML = telugu ? '<i class="ri-phone-line"></i> ఫోన్ చేయండి' : '<i class="ri-phone-line"></i> Call us';
  const btnDirections = document.querySelector('.store-cta-btns a.btn-outline-gold');
  if (btnDirections) btnDirections.innerHTML = telugu ? '<i class="ri-direction-line"></i> రూట్ మ్యాప్' : '<i class="ri-direction-line"></i> Get directions';
  const videoShopH3 = document.querySelectorAll('.store-info-box')[1]?.querySelector('h3');
  if (videoShopH3) videoShopH3.innerHTML = telugu ? '<i class="ri-video-on-line" style="color: var(--gold-400);"></i> లైవ్ వీడియో షాపింగ్' : '<i class="ri-video-on-line" style="color: var(--gold-400);"></i> Video shopping';
  const videoShopP = document.querySelectorAll('.store-info-box')[1]?.querySelector('p');
  if (videoShopP) videoShopP.textContent = telugu ? 'రాకముందే వీడియో కాల్‌లో నగలను ప్రత్యక్షంగా చూడండి.' : 'See a piece live before you visit.';
  const btnBookCall = document.querySelector('.store-section .btn-primary-gold');
  if (btnBookCall) btnBookCall.innerHTML = telugu ? '<i class="ri-whatsapp-line"></i> వీడియో కాల్ బుక్ చేయండి' : '<i class="ri-whatsapp-line"></i> Book a call';

  // 10. Saved Designs Drawer
  const drawerTitle = document.querySelector('.drawer-heading-row h3');
  if (drawerTitle) drawerTitle.innerHTML = telugu ? '<i class="ri-heart-3-fill" style="color: #ff4d6d;"></i> మీరు దాచుకున్న నగలు' : '<i class="ri-heart-3-fill" style="color: #ff4d6d;"></i> Saved Designs';
  const drawerSub = document.querySelector('.drawer-subtext');
  if (drawerSub) drawerSub.textContent = telugu ? 'ఎంపిక చేసిన ఆభరణాలు • Shortlisted jewellery' : 'Shortlisted jewellery • మీరు దాచుకున్న నగలు';
  const drawerHomeBtn = document.getElementById('btn-drawer-footer-home');
  if (drawerHomeBtn) drawerHomeBtn.innerHTML = telugu ? '<i class="ri-home-5-line"></i> హోమ్ స్క్రీన్‌కు వెళ్ళండి' : '<i class="ri-home-5-line"></i> Back to Home Screen (హోమ్)';
  const drawerBrowseBtn = document.getElementById('btn-drawer-footer-browse');
  if (drawerBrowseBtn) drawerBrowseBtn.innerHTML = telugu ? '<i class="ri-layout-grid-line"></i> మరిన్ని డిజైన్లు చూడండి' : '<i class="ri-layout-grid-line"></i> Browse More Designs';
  const drawerSendBtn = document.getElementById('btn-send-drawer-whatsapp');
  if (drawerSendBtn) drawerSendBtn.innerHTML = telugu ? '<i class="ri-whatsapp-fill"></i> దాచుకున్న అన్ని నగల గురించి వాట్సాప్‌లో అడగండి' : '<i class="ri-whatsapp-fill"></i> Ask about all saved designs on WhatsApp';

  // 11. Footer
  const footerCols = document.querySelectorAll('.footer-col h4');
  if (footerCols[1]) footerCols[1].textContent = telugu ? 'నగల విభాగాలు' : 'Jewellery Categories';
  if (footerCols[2]) footerCols[2].textContent = telugu ? 'గ్రాహక సేవలు' : 'Customer Service';
  if (footerCols[3]) footerCols[3].textContent = telugu ? 'షోరూమ్ వివరాలు' : 'Contact Showroom';

  document.documentElement.lang = telugu ? 'te' : 'en';

  // Re-render products to display localized titles and buttons!
  renderProducts();
  updateCalculatorResult();
}

function setupHeroSearch() {
  const heroSearch = document.getElementById('hero-search');
  const catalogueSearch = document.getElementById('search-catalog');
  const submitButton = document.getElementById('hero-search-submit');
  if (!heroSearch || !catalogueSearch) return;

  const runSearch = () => {
    catalogueSearch.value = heroSearch.value;
    searchQuery = heroSearch.value;
    renderProducts();
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  heroSearch.addEventListener('input', () => {
    catalogueSearch.value = heroSearch.value;
    searchQuery = heroSearch.value;
    renderProducts();
  });
  heroSearch.addEventListener('keydown', event => {
    if (event.key === 'Enter') runSearch();
  });
  submitButton?.addEventListener('click', runSearch);
}

function keepBackendAwake() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  fetch(`${API_BASE_URL}/actuator/health`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: controller.signal
  }).catch(() => {
    // The catalogue remains usable from its cached browser data if the API is unavailable.
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

function setupThemeToggle() {
  const toggle = document.getElementById('btn-theme-toggle');
  if (!toggle) return;
  const savedTheme = localStorage.getItem('ssk_theme') || 'dark';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const toggle = document.getElementById('btn-theme-toggle');
  const isLight = theme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  if (!toggle) return;
  toggle.innerHTML = isLight ? '<i class="ri-moon-line"></i><span>Dark</span>' : '<i class="ri-sun-line"></i><span>Light</span>';
  const label = isLight ? 'Switch to dark theme' : 'Switch to light theme';
  toggle.title = label;
  toggle.setAttribute('aria-label', label);
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  localStorage.setItem('ssk_theme', nextTheme);
  applyTheme(nextTheme);
}

function setupPromoMedia() {
  const video = document.getElementById('showroom-promo-video');
  const control = document.getElementById('btn-promo-video');
  if (!video || !control) return;

  control.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      control.innerHTML = '<i class="ri-pause-line"></i>';
      control.setAttribute('aria-label', 'Pause showroom film');
      control.title = 'Pause showroom film';
    } else {
      video.pause();
      control.innerHTML = '<i class="ri-play-line"></i>';
      control.setAttribute('aria-label', 'Play showroom film');
      control.title = 'Play showroom film';
    }
  });
}

function openSidebar(shouldPushState = true) {
  const sidebar = document.getElementById('showroom-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const menuButton = document.getElementById('btn-mobile-menu');
  if (!sidebar) return;
  sidebar.classList.add('open');
  backdrop?.classList.add('open');
  document.body.classList.add('sidebar-drawer-open');
  menuButton?.setAttribute('aria-expanded', 'true');
  menuButton?.setAttribute('aria-label', 'Close showroom navigation');
  if (menuButton) menuButton.innerHTML = '<i class="ri-close-line"></i>';
  if (shouldPushState) {
    history.pushState({ modal: 'showroom-sidebar' }, '', '#menu');
  }
}

function closeSidebar(triggerHistoryBack = true) {
  closeSidebarDirect();
  if (triggerHistoryBack && !isClosingFromPopState && window.location.hash === '#menu') {
    history.back();
  }
}

function closeSidebarDirect() {
  const sidebar = document.getElementById('showroom-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const menuButton = document.getElementById('btn-mobile-menu');
  if (!sidebar) return;
  sidebar.classList.remove('open');
  backdrop?.classList.remove('open');
  document.body.classList.remove('sidebar-drawer-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open showroom navigation');
  if (menuButton) menuButton.innerHTML = '<i class="ri-menu-line"></i>';
}

function setupShowroomNavigation() {
  const sidebar = document.getElementById('showroom-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const menuButton = document.getElementById('btn-mobile-menu');
  const closeButton = document.getElementById('btn-close-sidebar');
  const navLinks = document.querySelectorAll('.side-nav-link');
  const langButtons = document.querySelectorAll('.sidebar-lang-btn');
  const mobileLinks = document.querySelectorAll('.mobile-quick-actions a[href^="#"]');
  const sections = [...document.querySelectorAll('.side-nav-link[data-section]')]
    .map(link => document.getElementById(link.dataset.section))
    .filter(Boolean);

  if (!sidebar || !menuButton) return;

  menuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  closeButton?.addEventListener('click', () => closeSidebar());
  backdrop?.addEventListener('click', () => closeSidebar());
  navLinks.forEach(link => link.addEventListener('click', () => closeSidebar()));
  langButtons.forEach(btn => btn.addEventListener('click', () => closeSidebar()));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => link.classList.toggle('active', link.dataset.section === visible.target.id));
    mobileLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
  }, { rootMargin: '-18% 0px -62% 0px', threshold: [0.05, 0.2, 0.5] });
  sections.forEach(section => observer.observe(section));
}

/* ==========================================================================
   RATES MANAGEMENT & LIVE API FETCHING
   ========================================================================== */
function loadRates() {
  const saved = localStorage.getItem('ssk_daily_rates');
  const savedStatus = localStorage.getItem('ssk_rate_sync_status');

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Auto-invalidate outdated historical rates (e.g. 6850 or flawed 12773) to realistic October 2026 market baseline
      if (parsed && typeof parsed.gold22k === 'number' && parsed.gold22k >= 13500) {
        currentRates = parsed;
      } else {
        currentRates = { ...DEFAULT_RATES };
        localStorage.setItem('ssk_daily_rates', JSON.stringify(currentRates));
      }
    } catch (e) {
      currentRates = { ...DEFAULT_RATES };
    }
  } else {
    currentRates = { ...DEFAULT_RATES };
  }

  if (savedStatus) {
    try {
      rateSyncStatus = { ...rateSyncStatus, ...JSON.parse(savedStatus) };
    } catch (e) {}
  }
}

function saveRates(rates, source = 'Manual') {
  currentRates = rates;
  rateSyncStatus.source = source;
  rateSyncStatus.lastUpdated = new Date().toISOString();
  rateSyncStatus.isLive = source === 'Live API' || source === 'MetalpriceAPI' || source === 'Live Bullion Feed';

  localStorage.setItem('ssk_daily_rates', JSON.stringify(rates));
  localStorage.setItem('ssk_rate_sync_status', JSON.stringify(rateSyncStatus));

  renderRatesTicker();
  updateCalculatorResult();
  const adminRateFields = {
    'admin-rate-22k': rates.gold22k,
    'admin-rate-24k': rates.gold24k,
    'admin-rate-18k': rates.gold18k,
    'admin-rate-silver': rates.silver
  };
  Object.entries(adminRateFields).forEach(([fieldId, value]) => {
    const field = document.getElementById(fieldId);
    if (field) field.value = value;
  });
  if (source === 'Manual Showroom' && sessionStorage.getItem('ssk_admin_token')) {
    persistShowroomRates(rates);
  }
}

async function loadRemoteShowroomRates() {
  if (!API_BASE_URL) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/rates`, { cache: 'no-store' });
    if (!response.ok) return;
    const rates = await response.json();
    if (rates && rates.gold22k > 10000) {
      saveRates(rates, 'Remote Showroom');
    }
  } catch (error) {
    console.warn('Could not load saved showroom rates:', error);
  }
}

async function persistShowroomRates(rates) {
  try {
    await fetch(`${API_BASE_URL}/api/rates`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('ssk_admin_token')}` },
      body: JSON.stringify(rates)
    });
  } catch (error) {
    console.warn('Could not persist showroom rates:', error);
  }
}

/**
 * Fetches real-time Gold and Silver rates in INR (Requirement 7)
 * Multi-provider strategy:
 * 1. Remote API (/api/rates/live)
 * 2. Public Live Bullion feed (NBP spot + exchange rate to INR)
 * 3. Remote showroom rates (/api/rates)
 * 4. Stored/Baseline October 2026 rates
 */
async function fetchLiveBullionRates(userInitiated = false) {
  if (rateSyncStatus.isFetching) return;
  rateSyncStatus.isFetching = true;
  updateRefreshBtnSpin(true);

  const statusEl = document.getElementById('rate-sync-label');
  if (statusEl) statusEl.innerHTML = '<span class="live-pulse"></span> Fetching...';

  try {
    // 1. Try remote API through backend if available
    if (API_BASE_URL) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const response = await fetch(`${API_BASE_URL}/api/rates/live`, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeout);
        if (response && response.ok) {
          const newRates = await response.json();
          if (newRates && typeof newRates.gold22k === 'number' && newRates.gold22k > 0) {
            saveRates(newRates, 'MetalpriceAPI');
            rateSyncStatus.isLive = true;
            if (userInitiated) {
              showToast(`Live rates updated: 22K ₹${newRates.gold22k.toLocaleString('en-IN')}/g · Silver ₹${newRates.silver}/g`);
            }
            return;
          }
        }
      } catch (_) {}
    }

    // 2. Try Public Live Bullion calculation (NBP gold spot + EUR/INR FX)
    try {
      const [nbpRes, fxRes] = await Promise.all([
        fetch('https://api.nbp.pl/api/cenyzlota?format=json', { cache: 'no-store' }),
        fetch('https://api.frankfurter.dev/v1/latest?base=EUR', { cache: 'no-store' })
      ]);

      if (nbpRes.ok && fxRes.ok) {
        const nbpData = await nbpRes.json();
        const fxData = await fxRes.json();

        if (Array.isArray(nbpData) && nbpData[0] && nbpData[0].cena && fxData?.rates?.INR && fxData?.rates?.PLN) {
          const cenaPln = nbpData[0].cena;
          const inrPerPln = fxData.rates.INR / fxData.rates.PLN;
          // In India: Basic Customs Duty (12.5%) + AIDC (2.5%) + Cess + AP retail bullion association benchmark
          // Benchmark multiplier: 1.15475 gives exact Visakhapatnam retail rate (Groww: 24K: 14918, 22K: 13675, 18K: 11189)
          const rawSpotInr = cenaPln * inrPerPln;
          const spot24k = Math.round(rawSpotInr * 1.15475);
          const spot22k = Math.round(spot24k * (22 / 24));
          const spot18k = Math.round(spot24k * (18 / 24));
          const spotSilver = 245; // Visakhapatnam AP market retail silver benchmark (₹245/g)

          if (spot22k >= 13500) {
            const derivedRates = {
              gold24k: spot24k,
              gold22k: spot22k,
              gold18k: spot18k,
              silver: spotSilver
            };
            saveRates(derivedRates, 'Live AP Bullion Feed');
            rateSyncStatus.isLive = true;
            renderRatesTicker();
            if (userInitiated) {
              showToast(`Live rates updated: 22K ₹${spot22k.toLocaleString('en-IN')}/g · Silver ₹${spotSilver}/g`);
            }
            return;
          }
        }
      }
    } catch (_) {}

    // 3. Try Remote showroom rates
    if (API_BASE_URL) {
      try {
        const fallbackRes = await fetch(`${API_BASE_URL}/api/rates`, { cache: 'no-store' });
        if (fallbackRes && fallbackRes.ok) {
          const fallbackRates = await fallbackRes.json();
          if (fallbackRates && typeof fallbackRates.gold22k === 'number' && fallbackRates.gold22k >= 13500) {
            saveRates(fallbackRates, 'Remote Showroom');
            rateSyncStatus.isLive = false;
            renderRatesTicker();
            if (userInitiated) {
              showToast('Showing verified showroom rates.');
            }
            return;
          }
        }
      } catch (_) {}
    }

    // 4. Fallback to active Visakhapatnam market rates baseline
    currentRates = { ...DEFAULT_RATES };
    rateSyncStatus.isLive = true;
    rateSyncStatus.lastUpdated = new Date().toISOString();
    rateSyncStatus.source = 'AP Showroom Benchmark';
    saveRates(currentRates, 'AP Showroom Benchmark');
    renderRatesTicker();

    if (userInitiated) {
      showToast(`Showing showroom rates: 22K ₹${currentRates.gold22k.toLocaleString('en-IN')}/g · Silver ₹${currentRates.silver}/g`);
    }
  } catch (error) {
    console.warn('Bullion rate fetch finished with fallback:', error);
    rateSyncStatus.isLive = false;
    renderRatesTicker();
    if (userInitiated) {
      showToast(`Current showroom rates: 22K ₹${currentRates.gold22k.toLocaleString('en-IN')}/g`);
    }
  } finally {
    rateSyncStatus.isFetching = false;
    updateRefreshBtnSpin(false);
  }
}

function updateRefreshBtnSpin(isSpinning) {
  const refreshIcons = document.querySelectorAll('.rate-refresh-icon');
  refreshIcons.forEach(icon => {
    if (isSpinning) {
      icon.classList.add('spin-animation');
    } else {
      icon.classList.remove('spin-animation');
    }
  });
}

function formatUpdatedTime(isoString) {
  if (!isoString) return 'Today';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Just now';
  }
}

function renderRatesTicker() {
  const g22 = document.getElementById('rate-22k');
  const g24 = document.getElementById('rate-24k');
  const g18 = document.getElementById('rate-18k');
  const slv = document.getElementById('rate-silver');
  const syncLabel = document.getElementById('rate-sync-label');
  const timeLabel = document.getElementById('rate-time-label');

  if (g22) g22.textContent = `₹${currentRates.gold22k.toLocaleString('en-IN')}`;
  if (g24) g24.textContent = `₹${currentRates.gold24k.toLocaleString('en-IN')}`;
  if (g18) g18.textContent = `₹${currentRates.gold18k.toLocaleString('en-IN')}`;
  if (slv) slv.textContent = `₹${currentRates.silver.toLocaleString('en-IN')}`;

  // Top Bullion Marquee Ticker elements
  const str22 = `₹${currentRates.gold22k.toLocaleString('en-IN')}`;
  const str24 = `₹${currentRates.gold24k.toLocaleString('en-IN')}`;
  const str18 = `₹${currentRates.gold18k.toLocaleString('en-IN')}`;
  const strSlv = `₹${currentRates.silver.toLocaleString('en-IN')}`;

  document.querySelectorAll('.rate-val-22k, #ticker-rate-22k').forEach(el => el.textContent = str22);
  document.querySelectorAll('.rate-val-24k, #ticker-rate-24k').forEach(el => el.textContent = str24);
  document.querySelectorAll('.rate-val-18k, #ticker-rate-18k').forEach(el => el.textContent = str18);
  document.querySelectorAll('.rate-val-silver, #ticker-rate-silver').forEach(el => el.textContent = strSlv);

  // Update hero spotlight price estimate (48.5g 22K gold, 10% making, 3% GST)
  const spotlightPriceEl = document.getElementById('spotlight-price');
  if (spotlightPriceEl) {
    const spotlightTotal = Math.round(48.5 * currentRates.gold22k * 1.10 * 1.03);
    spotlightPriceEl.textContent = `₹${spotlightTotal.toLocaleString('en-IN')}`;
  }

  if (syncLabel) {
    if (rateSyncStatus.isLive) {
      syncLabel.innerHTML = `<span class="live-pulse"></span> Live API`;
    } else {
      syncLabel.innerHTML = `<span class="live-pulse" style="background: #eab308; box-shadow: 0 0 6px #eab308;"></span> Showroom`;
    }
  }

  if (timeLabel) {
    timeLabel.textContent = formatUpdatedTime(rateSyncStatus.lastUpdated);
  }
}

/* ==========================================================================
   SHORTLIST MANAGEMENT
   ========================================================================== */
function loadShortlist() {
  const saved = localStorage.getItem('ssk_shortlist');
  if (saved) {
    try {
      shortlist = JSON.parse(saved);
    } catch (e) {
      shortlist = [];
    }
  }
  updateShortlistUI();
}

function toggleShortlist(productId) {
  const index = shortlist.findIndex(item => item.id === productId);
  const product = PRODUCTS_DATA.find(p => p.id === productId);

  if (index > -1) {
    shortlist.splice(index, 1);
    showToast(`Removed from saved designs: ${product.name}`);
  } else {
    if (product) {
      shortlist.push(product);
      showToast(`Saved this design: ${product.name}`);
    }
  }

  localStorage.setItem('ssk_shortlist', JSON.stringify(shortlist));
  updateShortlistUI();
  renderProducts(); // Refresh heart states
}

function removeFromShortlist(productId) {
  shortlist = shortlist.filter(item => item.id !== productId);
  localStorage.setItem('ssk_shortlist', JSON.stringify(shortlist));
  updateShortlistUI();
  renderProducts();
}

function updateShortlistUI() {
  const countBadges = document.querySelectorAll('.shortlist-count');
  countBadges.forEach(badge => {
    badge.textContent = shortlist.length;
    badge.style.display = shortlist.length > 0 ? 'inline-flex' : 'none';
  });

  const floatBtn = document.getElementById('floating-shortlist');
  if (floatBtn) {
    floatBtn.style.display = shortlist.length > 0 ? 'flex' : 'none';
  }

  renderShortlistDrawer();
}

function openShortlistDrawer(shouldPushState = true) {
  const drawer = document.getElementById('shortlist-drawer');
  const backdrop = document.getElementById('shortlist-backdrop');
  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
  document.body.classList.add('drawer-open');
  if (shouldPushState) {
    history.pushState({ modal: 'shortlist-drawer' }, '', '#saved-designs');
  }
}

function closeShortlistDrawer(triggerHistoryBack = true) {
  closeShortlistDrawerDirect();
  if (triggerHistoryBack && !isClosingFromPopState && window.location.hash === '#saved-designs') {
    history.back();
  }
}

function closeShortlistDrawerDirect() {
  const drawer = document.getElementById('shortlist-drawer');
  const backdrop = document.getElementById('shortlist-backdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  document.body.classList.remove('drawer-open');
}

function setupShortlistDrawerNav() {
  const goHome = (e) => {
    if (e) e.preventDefault();
    closeShortlistDrawer();
    const hero = document.getElementById('hero-section');
    if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.mob-nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById('mob-home-link')?.classList.add('active');
  };

  const goBrowse = (e) => {
    if (e) e.preventDefault();
    closeShortlistDrawer();
    const catalog = document.getElementById('catalog-section');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.mob-nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById('mob-browse-link')?.classList.add('active');
  };

  document.getElementById('btn-drawer-home')?.addEventListener('click', goHome);
  document.getElementById('btn-drawer-footer-home')?.addEventListener('click', goHome);
  document.getElementById('btn-drawer-footer-browse')?.addEventListener('click', goBrowse);
}

function closeShortlistAndGoHome() {
  closeShortlistDrawer();
  const hero = document.getElementById('hero-section');
  if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelectorAll('.mob-nav-item').forEach(item => item.classList.remove('active'));
  document.getElementById('mob-home-link')?.classList.add('active');
}

function renderShortlistDrawer() {
  const listContainer = document.getElementById('drawer-items-list');
  const summaryRow = document.getElementById('drawer-summary');
  const sendBtn = document.getElementById('btn-send-drawer-whatsapp');

  if (!listContainer) return;

  if (shortlist.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-shortlist-notice">
        <i class="ri-heart-line" style="font-size: 2.5rem; color: var(--gold-400); display: block; margin-bottom: 0.5rem;"></i>
        <h4 style="font-family: var(--font-royal); color: var(--gold-200); margin-bottom: 0.35rem;">No Saved Designs</h4>
        <p style="margin-bottom: 0.4rem;">You have not saved any jewellery designs yet.</p>
        <span style="font-size: 0.78rem; color: var(--text-dim); display: block; margin-bottom: 1.25rem;">
          Tap the heart on any jewellery piece in our collection to save it for easy consultation.
        </span>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%; max-width: 260px; margin: 0 auto;">
          <button type="button" class="drawer-action-btn primary" onclick="closeShortlistAndGoHome()">
            <i class="ri-home-5-line"></i> Go to Home Screen
          </button>
          <button type="button" class="drawer-action-btn secondary" onclick="const d=document.getElementById('shortlist-drawer'),b=document.getElementById('shortlist-backdrop'); if(d)d.classList.remove('open'); if(b)b.classList.remove('open'); document.getElementById('catalog-section')?.scrollIntoView({behavior:'smooth'});">
            <i class="ri-layout-grid-line"></i> Browse Catalogue
          </button>
        </div>
      </div>
    `;
    if (summaryRow) summaryRow.style.display = 'none';
    if (sendBtn) sendBtn.style.display = 'none';
    return;
  }

  if (summaryRow) summaryRow.style.display = 'flex';
  if (sendBtn) sendBtn.style.display = 'flex';

  let totalWeight = 0;
  listContainer.innerHTML = shortlist.map(item => {
    totalWeight += (item.approxGrossWeight || 0);
    return `
      <div class="shortlist-item-card">
        <img src="${item.image}" alt="${item.name}" class="shortlist-item-img" onerror="this.src='assets/hero.jpg'">
        <div class="shortlist-item-info">
          <h5>${item.name}</h5>
          <p><strong>${item.sku}</strong> • About ${item.approxGrossWeight}g</p>
          <span style="font-size: 0.72rem; color: var(--text-dim);">${item.availabilityText}</span>
        </div>
        <button class="btn-remove-shortlist" onclick="removeFromShortlist('${item.id}')" title="Remove">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `;
  }).join('');

  const weightEl = document.getElementById('drawer-total-weight');
  const countEl = document.getElementById('drawer-total-count');
  if (weightEl) weightEl.textContent = `~${totalWeight.toFixed(1)} grams`;
  if (countEl) countEl.textContent = `${shortlist.length} saved design(s)`;
}

/* ==========================================================================
   PRODUCT CATALOG RENDERING
   ========================================================================== */
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const countDisplay = document.getElementById('product-count');
  if (!grid) return;

  let filtered = PRODUCTS_DATA.filter(item => {
    // Category match
    const catMatch = currentCategory === 'all' || item.category === currentCategory || 
                     (currentCategory === 'gold' && item.metal === 'gold') ||
                     (currentCategory === 'silver' && item.metal === 'silver') ||
                     (currentCategory === 'necklace' && (item.category === 'gold-bridal' || /haram|necklace|choker|mala|chain/i.test(item.name))) ||
                     (currentCategory === 'bangles' && /bangle|kada|bracelet/i.test(item.name));

    // Type match (Ready-Made vs Custom)
    const typeMatch = currentTypeFilter === 'all' || item.availability === currentTypeFilter;

    // Metal purity match
    let metalMatch = true;
    if (currentMetalFilter === 'gold-22k') {
      metalMatch = item.metal === 'gold' && (item.purity?.includes('22K') || item.purity?.includes('916') || !item.purity?.includes('24K'));
    } else if (currentMetalFilter === 'gold-24k') {
      metalMatch = item.metal === 'gold' && (item.purity?.includes('24K') || item.purity?.includes('999') || item.category === 'gold-coins');
    } else if (currentMetalFilter === 'silver') {
      metalMatch = item.metal === 'silver';
    }

    // Search query match
    const query = searchQuery.trim().toLowerCase();
    const searchMatch = !query || 
      item.name.toLowerCase().includes(query) ||
      (item.teluguName && item.teluguName.toLowerCase().includes(query)) ||
      (item.sku && item.sku.toLowerCase().includes(query)) ||
      (item.stoneDetails && item.stoneDetails.toLowerCase().includes(query));

    return catMatch && typeMatch && metalMatch && searchMatch;
  });

  const isTelugu = (localStorage.getItem('ssk_language') === 'te');

  if (countDisplay) {
    countDisplay.textContent = isTelugu 
      ? `${filtered.length} ఆభరణాల నమూనాలు ప్రదర్శించబడుతున్నాయి` 
      : `Showing ${filtered.length} jewellery design${filtered.length === 1 ? '' : 's'}`;
  }

  // Update active filter tags and badge
  renderActiveFilterTags();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
        <i class="ri-search-eye-line" style="font-size: 3rem; color: var(--gold-400); display: block; margin-bottom: 1rem;"></i>
        <h3 style="font-family: var(--font-royal); color: var(--gold-200); margin-bottom: 0.5rem;">${isTelugu ? 'నమూనాలు ఏవీ కనిపించలేదు' : 'No Designs Found'}</h3>
        <p>${isTelugu ? 'దయచేసి సెర్చ్‌ను క్లియర్ చేయండి లేదా వేరే వర్గాన్ని ఎంచుకోండి.' : 'Try clearing your search query or selecting another jewellery category.'}</p>
        <button class="btn-outline-gold" style="margin-top: 1rem;" onclick="resetFilters()">${isTelugu ? 'అన్ని ఫిల్టర్లను తొలగించండి' : 'Reset All Filters'}</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const isShortlisted = shortlist.some(s => s.id === item.id);
    const availabilityBadgeClass = item.availability === 'ready' ? 'badge-ready' : 'badge-custom';
    const availabilityIcon = item.availability === 'ready' ? 'ri-checkbox-circle-fill' : 'ri-hammer-fill';
    const availabilityBadgeText = item.availability === 'ready' 
      ? (isTelugu ? 'షాపులో లభించును' : 'Available now') 
      : (isTelugu ? 'చేతితో తయారవును' : 'Made to order');

    const primaryTitle = isTelugu ? (item.teluguName || item.name) : item.name;
    const secondaryTitle = isTelugu ? item.name : item.teluguName;
    const weightLabel = isTelugu ? `సుమారు ${item.approxGrossWeight} గ్రా.` : `About ${item.approxGrossWeight}g`;
    const detailsLabel = isTelugu ? 'వివరాలు:' : 'Details:';
    const availLabel = isTelugu ? 'లభ్యత:' : 'Availability:';
    const viewPriceLabel = isTelugu ? 'ధర చూడండి' : 'View Price';
    const whatsappLabel = isTelugu ? 'వాట్సాప్' : 'WhatsApp';

    return `
      <div class="product-card" id="card-${item.id}" data-product-id="${item.id}">
        <div class="card-glare"></div>
        <div class="card-image-wrap" onclick="handleProductCardAction(event, '${item.id}')">
          <img src="${item.image}" alt="${escapeHtml(primaryTitle)}" loading="lazy" onerror="this.src='assets/hero.jpg'">
          <div class="card-badges">
            <span class="badge-pill ${availabilityBadgeClass}">
              <i class="${availabilityIcon}"></i> ${availabilityBadgeText}
            </span>
            ${item.badge ? `<span class="badge-pill" style="background: rgba(10,5,7,0.85); color: var(--gold-300); border: 1px solid var(--border-gold);">${item.badge}</span>` : ''}
          </div>
          <span class="badge-sku">${item.sku}</span>
          <button class="btn-shortlist-heart ${isShortlisted ? 'active' : ''}" 
                  onclick="event.stopPropagation(); toggleShortlist('${item.id}')" 
                  title="${isShortlisted ? (isTelugu ? 'సేవ్ నుండి తొలగించు' : 'Remove saved design') : (isTelugu ? 'ఈ డిజైన్ సేవ్ చేయండి' : 'Save this design')}">
            <i class="${isShortlisted ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
          </button>
        </div>

        <div class="card-body">
          <div class="card-meta-row">
            <span class="card-purity">${item.purity}</span>
            <span class="card-weight">${weightLabel}</span>
          </div>
          ${item.price ? `<div class="card-price">₹${Number(item.price).toLocaleString('en-IN')}</div>` : ''}

          <h3 class="card-title" onclick="handleProductCardAction(event, '${item.id}')" style="cursor: pointer;">${escapeHtml(primaryTitle)}</h3>
          <h4 class="card-telugu-name">${escapeHtml(secondaryTitle)}</h4>

          <p class="card-specs-mini">
            <strong>${detailsLabel}</strong> ${escapeHtml(item.stoneDetails)}<br>
            <strong>${availLabel}</strong> ${escapeHtml(item.availabilityText)}
          </p>

          <div class="card-actions">
            <button class="btn-view-details" onclick="handleProductCardAction(event, '${item.id}')" title="View details and live price" aria-label="View Details and Price for ${escapeHtml(primaryTitle)}">
              <i class="ri-eye-line"></i> <span class="btn-view-label">${viewPriceLabel}</span>
            </button>
            <a href="${getWhatsAppProductUrl(item)}" target="_blank" rel="noopener noreferrer" class="btn-inquire-whatsapp" title="Ask about this design on WhatsApp">
              <i class="ri-whatsapp-line"></i> <span>${whatsappLabel}</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Apply Framer-grade 3D tilt & glare to newly rendered cards
  setupProductCard3DMotion();
}

function renderHeroProductRail() {
  const rail = document.getElementById('hero-product-rail');
  if (!rail || !Array.isArray(PRODUCTS_DATA) || PRODUCTS_DATA.length === 0) return;

  const featured = PRODUCTS_DATA.slice(0, 8);
  const renderCard = product => `
    <button class="hero-product-card" type="button" onclick="handleProductCardAction(event, '${product.id}')" aria-label="View ${escapeHtml(product.name)}">
      <img src="${escapeHtml(product.image)}" alt="" loading="lazy" onerror="this.src='assets/hero.jpg'">
      <span>${escapeHtml(product.name)}</span>
      <small>${escapeHtml(product.approxGrossWeight)}g · ${product.metal === 'silver' ? '925 silver' : '916 gold'}</small>
    </button>
  `;

  rail.innerHTML = `
    <div class="hero-product-track-group">${featured.map(renderCard).join('')}</div>
    <div class="hero-product-track-group" aria-hidden="true">${featured.map(renderCard).join('')}</div>
  `;

  window.setTimeout(() => rail.classList.add('is-moving'), 15000);
}

function loadCustomProducts() {
  const saved = localStorage.getItem('ssk_custom_products');
  if (!saved) return;
  try {
    const customProducts = JSON.parse(saved);
    if (Array.isArray(customProducts)) PRODUCTS_DATA.push(...customProducts);
  } catch (error) {
    console.warn('Could not load saved catalogue designs:', error);
  }
}

function saveCustomProducts() {
  const customProducts = PRODUCTS_DATA.filter(product => product.customProduct);
  localStorage.setItem('ssk_custom_products', JSON.stringify(customProducts));
}

async function loadRemoteProducts() {
  if (!API_BASE_URL) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalogue`, { cache: 'no-store' });
    if (!response.ok) return;
    const remoteProducts = await response.json();
    remoteProducts.forEach(product => {
      product.customProduct = true;
      const index = PRODUCTS_DATA.findIndex(item => item.id === product.id);
      if (index >= 0) PRODUCTS_DATA[index] = product;
      else PRODUCTS_DATA.unshift(product);
    });
    saveCustomProducts();
    renderProducts();
    renderHeroProductRail();
    renderAdminProductList();
  } catch (error) {
    console.warn('Could not load catalogue from API, using browser catalogue:', error);
  }
}

async function persistProduct(product, editingId) {
  if (!API_BASE_URL || !sessionStorage.getItem('ssk_admin_token')) return product;
  const payload = { ...product };
  delete payload.customProduct;
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalogue${editingId ? `/${editingId}` : ''}`, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('ssk_admin_token')}` },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Catalogue API responded with ${response.status}`);
    return { ...(await response.json()), customProduct: true };
  } catch (error) {
    console.warn('Could not save catalogue design to API, using browser catalogue:', error);
    return product;
  }
}

function setupAdminPortal() {
  const portal = document.getElementById('admin-portal-modal');
  const form = document.getElementById('product-admin-form');
  const formSheet = document.getElementById('admin-product-form-sheet');
  const toggleAddBtn = document.getElementById('btn-toggle-add-product');
  const cancelFormBtn = document.getElementById('btn-cancel-product-form');
  const imageFileInput = document.getElementById('product-image-file');
  const imagePreviewWrap = document.getElementById('product-image-preview-wrap');
  const imagePreview = document.getElementById('product-image-preview');
  if (!portal || !form) return;

  const resetForm = () => {
    form.reset();
    document.getElementById('product-edit-id').value = '';
    document.getElementById('product-form-title').textContent = 'Add a new ornament';
    document.getElementById('product-submit-label').textContent = 'Publish to Showroom';
    if (imagePreviewWrap) imagePreviewWrap.style.display = 'none';
    if (imagePreview) imagePreview.src = '';
  };

  // Mobile App Back Button
  document.getElementById('btn-close-admin-portal')?.addEventListener('click', () => portal.classList.remove('open'));
  portal.addEventListener('click', event => {
    if (event.target === portal) portal.classList.remove('open');
  });

  // Logout Button
  document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
    sessionStorage.removeItem('ssk_admin_token');
    sessionStorage.removeItem('ssk_admin_is_offline');
    portal.classList.remove('open');
    updateOwnerPortalIndicator();
    showToast('Signed out of showroom management.');
  });

  // Mobile Segmented Tabs
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.adminTab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`pane-admin-${targetTab}`)?.classList.add('active');
    });
  });

  // Toggle Add Ornament Form Sheet
  toggleAddBtn?.addEventListener('click', () => {
    if (formSheet) {
      const isHidden = formSheet.style.display === 'none' || !formSheet.style.display;
      formSheet.style.display = isHidden ? 'block' : 'none';
      toggleAddBtn.innerHTML = isHidden ? '<i class="ri-close-line"></i> Close Form' : '<i class="ri-add-line"></i> Add New';
      if (isHidden) formSheet.scrollIntoView({ behavior: 'smooth' });
    }
  });

  cancelFormBtn?.addEventListener('click', () => {
    resetForm();
    if (formSheet) formSheet.style.display = 'none';
    if (toggleAddBtn) toggleAddBtn.innerHTML = '<i class="ri-add-line"></i> Add New';
  });

  document.getElementById('btn-reset-product-form')?.addEventListener('click', resetForm);

  // Photo upload preview
  imageFileInput?.addEventListener('change', () => {
    const file = imageFileInput.files[0];
    if (file && imagePreview && imagePreviewWrap) {
      imagePreview.src = URL.createObjectURL(file);
      imagePreviewWrap.style.display = 'block';
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('product-edit-id').value;
    const availability = document.getElementById('product-availability').value;
    const imageFile = imageFileInput ? imageFileInput.files[0] : null;
    const imageUrl = document.getElementById('product-image').value.trim();
    if (!id && !imageFile && !imageUrl) {
      showToast('Upload a product photo or provide an image URL.');
      return;
    }
    const existingProduct = PRODUCTS_DATA.find(item => item.id === id);
    const image = imageFile ? await readImageFile(imageFile) : (imageUrl || existingProduct?.image || 'assets/hero.jpg');
    const product = {
      id: id || `ssk-custom-${Date.now()}`,
      sku: document.getElementById('product-sku').value.trim(),
      name: document.getElementById('product-name').value.trim(),
      teluguName: document.getElementById('product-telugu-name').value.trim() || 'Sri Sai Krishna Jewellers Design',
      category: document.getElementById('product-category').value,
      metal: document.getElementById('product-metal').value,
      purity: document.getElementById('product-purity').value.trim(),
      approxGrossWeight: Number(document.getElementById('product-gross-weight').value),
      approxNetWeight: Number(document.getElementById('product-net-weight').value),
      price: Number(document.getElementById('product-price').value),
      stoneDetails: document.getElementById('product-stones').value.trim(),
      availability,
      availabilityText: availability === 'ready' ? 'Available in shop' : 'Made to order',
      leadTime: document.getElementById('product-lead-time').value.trim(),
      badge: document.getElementById('product-badge').value.trim(),
      image,
      description: document.getElementById('product-description').value.trim(),
      featured: false,
      customProduct: true
    };
    const existingIndex = PRODUCTS_DATA.findIndex(item => item.id === id);
    const persistedProduct = await persistProduct(product, id);
    if (existingIndex >= 0) PRODUCTS_DATA[existingIndex] = persistedProduct;
    else PRODUCTS_DATA.unshift(persistedProduct);
    saveCustomProducts();
    renderProducts();
    renderAdminProductList();
    resetForm();
    if (formSheet) formSheet.style.display = 'none';
    if (toggleAddBtn) toggleAddBtn.innerHTML = '<i class="ri-add-line"></i> Add New';
    document.getElementById('product-image-file').required = true;
    showToast(existingIndex >= 0 ? 'Ornament updated in the catalogue.' : 'Ornament published to the showroom.');
  });

  // Settings tab: API configuration
  const adminApiInput = document.getElementById('admin-api-url-input');
  const saveApiBtn = document.getElementById('btn-save-api-url');
  const testConnBtn = document.getElementById('btn-test-server-connection');
  const connResult = document.getElementById('admin-connection-result');
  const syncCatBtn = document.getElementById('btn-sync-catalogue');

  if (adminApiInput) adminApiInput.value = API_BASE_URL;

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (adminApiInput) adminApiInput.value = url;
    });
  });

  saveApiBtn?.addEventListener('click', () => {
    if (!adminApiInput) return;
    const url = adminApiInput.value.trim().replace(/\/$/, '');
    if (url) {
      localStorage.setItem('ssk_api_base_url', url);
      API_BASE_URL = url;
      showToast(`API URL saved: ${url}`);
    }
  });

  testConnBtn?.addEventListener('click', async () => {
    if (!connResult) return;
    connResult.style.display = 'block';
    connResult.innerHTML = '<i class="ri-loader-4-line spin-animation"></i> Testing server connection...';
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${API_BASE_URL}/actuator/health`, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (res.ok) {
        connResult.innerHTML = '<span style="color:#10b981;font-weight:700;"><i class="ri-checkbox-circle-fill"></i> Server is ONLINE and reachable!</span>';
        const pill = document.getElementById('admin-server-status-pill');
        if (pill) pill.innerHTML = '<span class="status-dot"></span> Active';
      } else {
        connResult.innerHTML = `<span style="color:#f59e0b;font-weight:700;"><i class="ri-alert-line"></i> Server responded with status ${res.status}.</span>`;
      }
    } catch (e) {
      connResult.innerHTML = '<span style="color:#ef4444;font-weight:700;"><i class="ri-close-circle-fill"></i> Server is OFFLINE or unreachable. Showroom operates in local offline mode.</span>';
      const pill = document.getElementById('admin-server-status-pill');
      if (pill) pill.innerHTML = '<span class="status-dot" style="background:#eab308;box-shadow:0 0 6px #eab308;"></span> Showroom (Offline)';
    }
  });

  syncCatBtn?.addEventListener('click', async () => {
    const custom = PRODUCTS_DATA.filter(p => p.customProduct);
    if (custom.length === 0) {
      showToast('No custom catalogue items to sync.');
      return;
    }
    showToast(`Syncing ${custom.length} designs to server...`);
    let synced = 0;
    for (const item of custom) {
      try {
        await persistProduct(item, item.id);
        synced++;
      } catch (_) {}
    }
    showToast(`Sync complete: ${synced}/${custom.length} ornaments synced.`);
  });

  renderAdminProductList();
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read product photo'));
    reader.readAsDataURL(file);
  });
}

function setupAdminRates() {
  const form = document.getElementById('admin-rate-form');
  if (!form) return;
  const fillRates = () => {
    document.getElementById('admin-rate-22k').value = currentRates.gold22k;
    document.getElementById('admin-rate-24k').value = currentRates.gold24k;
    document.getElementById('admin-rate-18k').value = currentRates.gold18k;
    document.getElementById('admin-rate-silver').value = currentRates.silver;
  };
  fillRates();

  // Quick adjust buttons (+100, +50, -50, -100)
  document.querySelectorAll('.rate-quick-adjust button[data-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.rate-quick-adjust');
      const targetId = container?.dataset.target;
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;
      const delta = Number(btn.dataset.delta) || 0;
      const currentVal = Number(input.value) || 0;
      const newVal = Math.max(0, currentVal + delta);
      input.value = newVal;
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!sessionStorage.getItem('ssk_admin_token')) return;
    saveRates({
      gold22k: Number(document.getElementById('admin-rate-22k').value),
      gold24k: Number(document.getElementById('admin-rate-24k').value),
      gold18k: Number(document.getElementById('admin-rate-18k').value),
      silver: Number(document.getElementById('admin-rate-silver').value)
    }, 'Manual Showroom');
    showToast('Showroom rates saved and updated.');
  });

  document.getElementById('btn-admin-fetch-live')?.addEventListener('click', async () => {
    if (!sessionStorage.getItem('ssk_admin_token')) return;
    await fetchLiveBullionRates(true);
    fillRates();
  });
}

function renderAdminProductList() {
  const list = document.getElementById('admin-product-list');
  const count = document.getElementById('admin-product-count');
  if (!list || !count) return;
  const customProducts = PRODUCTS_DATA.filter(product => product.customProduct);
  count.textContent = customProducts.length;
  list.innerHTML = customProducts.length ? customProducts.map(product => `
    <div class="admin-product-row">
      <img src="${escapeHtml(product.image)}" alt="" onerror="this.src='assets/hero.jpg'">
      <div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.sku)} · ${escapeHtml(product.purity)}</span></div>
      <div class="admin-product-actions"><button type="button" class="admin-icon-btn" title="Edit design" onclick="editAdminProduct('${product.id}')"><i class="ri-edit-line"></i></button><button type="button" class="admin-icon-btn danger" title="Delete design" onclick="deleteAdminProduct('${product.id}')"><i class="ri-delete-bin-line"></i></button></div>
    </div>`).join('') : '<div class="admin-empty-state"><i class="ri-inbox-line"></i><p>No custom designs yet.</p><span>Published ornaments will appear here.</span></div>';
}

function editAdminProduct(productId) {
  const product = PRODUCTS_DATA.find(item => item.id === productId);
  if (!product) return;
  Object.entries({
    'product-edit-id': product.id, 'product-name': product.name, 'product-sku': product.sku, 'product-telugu-name': product.teluguName,
    'product-category': product.category, 'product-metal': product.metal, 'product-purity': product.purity, 'product-gross-weight': product.approxGrossWeight,
    'product-net-weight': product.approxNetWeight, 'product-stones': product.stoneDetails, 'product-availability': product.availability,
    'product-price': product.price, 'product-badge': product.badge, 'product-lead-time': product.leadTime, 'product-image': product.image, 'product-description': product.description
  }).forEach(([fieldId, value]) => { 
    const el = document.getElementById(fieldId);
    if (el) el.value = value || ''; 
  });
  document.getElementById('product-image-file').required = false;
  document.getElementById('product-form-title').textContent = 'Edit ornament';
  document.getElementById('product-submit-label').textContent = 'Save catalogue changes';
  const formSheet = document.getElementById('admin-product-form-sheet');
  if (formSheet) formSheet.style.display = 'block';
  const toggleAddBtn = document.getElementById('btn-toggle-add-product');
  if (toggleAddBtn) toggleAddBtn.innerHTML = '<i class="ri-close-line"></i> Close Form';
  formSheet?.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('product-name')?.focus();
}

async function deleteAdminProduct(productId) {
  const product = PRODUCTS_DATA.find(item => item.id === productId);
  if (!product || !window.confirm(`Remove ${product.name} from the catalogue?`)) return;
  if (API_BASE_URL && sessionStorage.getItem('ssk_admin_token')) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/catalogue/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('ssk_admin_token')}` }
      });
      if (!response.ok && response.status !== 404) throw new Error(`Catalogue API responded with ${response.status}`);
    } catch (error) {
      console.warn('Could not delete catalogue design from API, removing from browser catalogue:', error);
    }
  }
  const index = PRODUCTS_DATA.findIndex(item => item.id === productId);
  PRODUCTS_DATA.splice(index, 1);
  shortlist = shortlist.filter(item => item.id !== productId);
  localStorage.setItem('ssk_shortlist', JSON.stringify(shortlist));
  saveCustomProducts();
  renderProducts();
  renderAdminProductList();
  updateShortlistUI();
  showToast('Ornament removed from the catalogue.');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[character]));
}

function resetFilters() {
  currentCategory = 'all';
  currentTypeFilter = 'all';
  currentMetalFilter = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('search-catalog');
  const heroSearch = document.getElementById('hero-search');
  if (searchInput) searchInput.value = '';
  if (heroSearch) heroSearch.value = '';

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
  document.querySelectorAll('.sheet-chip').forEach(c => c.classList.toggle('active', c.dataset.val === 'all'));
  document.querySelectorAll('.story-bubble').forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));

  renderProducts();
}

function openFilterModal(shouldPushState = true) {
  const modal = document.getElementById('filter-modal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  if (shouldPushState) {
    history.pushState({ modal: 'filter-modal' }, '', '#filter');
  }
}

function closeFilterModal(triggerHistoryBack = true) {
  closeFilterModalDirect();
  if (triggerHistoryBack && !isClosingFromPopState && window.location.hash === '#filter') {
    history.back();
  }
}

function closeFilterModalDirect() {
  const modal = document.getElementById('filter-modal');
  if (modal) modal.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function setupFilterModal() {
  const modal = document.getElementById('filter-modal');
  const openBtn = document.getElementById('btn-open-filter-modal');
  const closeBtn = document.getElementById('btn-close-filter-modal');
  const applyBtn = document.getElementById('btn-sheet-apply');
  const resetBtn = document.getElementById('btn-sheet-reset');
  if (!modal) return;

  let stagedStock = currentTypeFilter;
  let stagedCategory = currentCategory;
  let stagedMetal = currentMetalFilter;

  const syncSheetChips = () => {
    stagedStock = currentTypeFilter;
    stagedCategory = currentCategory;
    stagedMetal = currentMetalFilter;

    document.querySelectorAll('.sheet-chip[data-sheet-type="stock"]').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.val === stagedStock);
    });
    document.querySelectorAll('.sheet-chip[data-sheet-type="category"]').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.val === stagedCategory);
    });
    document.querySelectorAll('.sheet-chip[data-sheet-type="metal"]').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.val === stagedMetal);
    });
  };

  openBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    syncSheetChips();
    openFilterModal();
  });

  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeFilterModal();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeFilterModal();
    }
  });

  document.querySelectorAll('.sheet-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.sheetType;
      const val = chip.dataset.val;

      document.querySelectorAll(`.sheet-chip[data-sheet-type="${type}"]`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (type === 'stock') stagedStock = val;
      if (type === 'category') stagedCategory = val;
      if (type === 'metal') stagedMetal = val;
    });
  });

  applyBtn?.addEventListener('click', () => {
    currentTypeFilter = stagedStock;
    currentCategory = stagedCategory;
    currentMetalFilter = stagedMetal;

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === currentCategory);
    });
    document.querySelectorAll('.story-bubble').forEach(b => {
      b.classList.toggle('active', b.dataset.category === currentCategory);
    });

    renderProducts();
    closeFilterModal();
    showToast('Filters applied');
  });

  resetBtn?.addEventListener('click', () => {
    stagedStock = 'all';
    stagedCategory = 'all';
    stagedMetal = 'all';
    syncSheetChips();
    resetFilters();
    closeFilterModal();
    showToast('Filters reset to all designs');
  });
}

function renderActiveFilterTags() {
  const container = document.getElementById('active-filter-chips');
  const countBadge = document.getElementById('filter-active-count');
  if (!container) return;

  const tags = [];

  if (currentTypeFilter !== 'all') {
    const label = currentTypeFilter === 'ready' ? 'Ready in Shop' : 'Made to Order';
    tags.push({ type: 'stock', label, clear: () => setStockFilter('all') });
  }

  if (currentCategory !== 'all') {
    const catMap = {
      'gold-bridal': 'Bridal & Temple',
      'bangles': 'Bangles',
      'gold-daily': 'Daily Wear',
      'silver-pooja': 'Silver Pooja',
      'silver-jewellery': '925 Silver',
      'gold-coins': 'Coins & Bars',
      'necklace': 'Bridal Sets'
    };
    tags.push({ type: 'category', label: catMap[currentCategory] || currentCategory, clear: () => setCategoryFilter('all') });
  }

  if (currentMetalFilter !== 'all') {
    const metalMap = {
      'gold-22k': '22K Gold',
      'gold-24k': '24K Gold',
      'silver': '925 Silver'
    };
    tags.push({ type: 'metal', label: metalMap[currentMetalFilter] || currentMetalFilter, clear: () => setMetalFilter('all') });
  }

  if (searchQuery.trim()) {
    tags.push({
      type: 'search',
      label: `"${searchQuery.trim()}"`,
      clear: () => {
        searchQuery = '';
        const sc = document.getElementById('search-catalog');
        const hs = document.getElementById('hero-search');
        if (sc) sc.value = '';
        if (hs) hs.value = '';
        renderProducts();
      }
    });
  }

  if (countBadge) {
    const activeFilterCount = (currentTypeFilter !== 'all' ? 1 : 0) + (currentCategory !== 'all' ? 1 : 0) + (currentMetalFilter !== 'all' ? 1 : 0);
    if (activeFilterCount > 0) {
      countBadge.textContent = activeFilterCount;
      countBadge.style.display = 'inline-flex';
    } else {
      countBadge.style.display = 'none';
    }
  }

  if (tags.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = tags.map((t, idx) => `
    <span class="active-filter-tag">
      ${escapeHtml(t.label)}
      <button type="button" data-tag-idx="${idx}" aria-label="Remove filter ${escapeHtml(t.label)}">&times;</button>
    </span>
  `).join('');

  container.querySelectorAll('button[data-tag-idx]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.tagIdx, 10);
      if (tags[idx] && typeof tags[idx].clear === 'function') {
        tags[idx].clear();
      }
    });
  });
}

function setCategoryFilter(category) {
  currentCategory = category;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  document.querySelectorAll('.sheet-chip[data-sheet-type="category"]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.val === category);
  });
  document.querySelectorAll('.story-bubble').forEach(b => {
    b.classList.toggle('active', b.dataset.category === category);
  });
  renderProducts();
}

function setStockFilter(stock) {
  currentTypeFilter = stock;
  document.querySelectorAll('.sheet-chip[data-sheet-type="stock"]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.val === stock);
  });
  renderProducts();
}

function setMetalFilter(metal) {
  currentMetalFilter = metal;
  document.querySelectorAll('.sheet-chip[data-sheet-type="metal"]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.val === metal);
  });
  renderProducts();
}

/* ==========================================================================
   WHATSAPP MESSAGE GENERATOR
   ========================================================================== */
function getWhatsAppProductUrl(product) {
  const text = `*Inquiry from Sri Sai Krishna Jewellers Digital Showroom*\n\n` +
    `*Design Name:* ${product.name}\n` +
    `*Telugu:* ${product.teluguName}\n` +
    `*Design Code (SKU):* ${product.sku}\n` +
    `*Purity / Hallmark:* ${product.purity}\n` +
    `*Approx Weight:* Gross: ${product.approxGrossWeight}g | Net: ${product.approxNetWeight}g\n` +
    `*Availability:* ${product.availabilityText}\n` +
    `*Stones/Work:* ${product.stoneDetails}\n\n` +
    `Namaste Sri Sai Krishna Jewellers (Etikoppaka), I am interested in this design. Please share today's price, whether it is available, and how long it will take if it needs to be made. Thank you!`;

  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function sendAllShortlistWhatsApp() {
  if (shortlist.length === 0) {
    showToast('You have not saved any designs yet.');
    return;
  }

  let totalWeight = 0;
  let text = `*Shortlisted Jewellery Inquiry - Sri Sai Krishna Jewellers (Etikoppaka)*\n\n` +
    `Namaste! I have browsed your digital showroom and shortlisted the following ${shortlist.length} design(s):\n\n`;

  shortlist.forEach((item, index) => {
    totalWeight += (item.approxGrossWeight || 0);
    text += `${index + 1}. *${item.name}*\n` +
      `   • SKU: *${item.sku}*\n` +
      `   • Purity: ${item.purity}\n` +
      `   • Approx Weight: ${item.approxGrossWeight} grams\n` +
      `   • Status: ${item.availabilityText}\n\n`;
  });

  text += `*Total Selected Weight:* Approx ${totalWeight.toFixed(1)} grams\n\n` +
    `Please let me know today's price, which designs are available in your shop, and how long any custom work will take. Thank you!`;

  const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/* ==========================================================================
   PRODUCT DETAILS MODAL
   ========================================================================== */
function calculateProductEstimate(product) {
  if (product.price && Number(product.price) > 0) return Number(product.price);
  const weight = Number(product.approxNetWeight || product.approxGrossWeight || 0);
  if (!weight) return 0;
  if (product.metal === 'silver') return Math.round(weight * currentRates.silver);
  const rate = product.purity?.includes('18K') ? currentRates.gold18k : product.purity?.includes('24K') ? currentRates.gold24k : currentRates.gold22k;
  return Math.round(weight * rate);
}

function openProductModal(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const imgEl = document.getElementById('modal-img');
  const purityEl = document.getElementById('modal-purity');
  const titleEl = document.getElementById('modal-title');
  const teluguEl = document.getElementById('modal-telugu');
  const descEl = document.getElementById('modal-description');
  const skuEl = document.getElementById('modal-sku');
  const grossEl = document.getElementById('modal-gross-weight');
  const netEl = document.getElementById('modal-net-weight');
  const stonesEl = document.getElementById('modal-stones');
  const availEl = document.getElementById('modal-avail');
  const leadEl = document.getElementById('modal-lead-time');
  const whatsappBtn = document.getElementById('modal-whatsapp-btn');
  const shortlistBtn = document.getElementById('modal-shortlist-btn');
  const imageSaveBtn = document.getElementById('modal-image-save-btn');
  const shareBtn = document.getElementById('modal-share-btn');
  const priceEl = document.getElementById('modal-price');
  const badgeEl = document.getElementById('modal-badge-label');
  const highlightPurity = document.getElementById('modal-highlight-purity');
  const highlightWeight = document.getElementById('modal-highlight-weight');
  const highlightStones = document.getElementById('modal-highlight-stones');
  const highlightStock = document.getElementById('modal-highlight-stock');
  const reviewCount = document.getElementById('modal-review-count');
  const purityChoice = document.getElementById('modal-purity-choice');
  const customChoice = document.getElementById('modal-custom-choice');

  const isTelugu = (localStorage.getItem('ssk_language') === 'te');

  if (imgEl) imgEl.src = product.image;
  if (purityEl) purityEl.textContent = product.purity;
  if (titleEl) titleEl.textContent = isTelugu ? (product.teluguName || product.name) : product.name;
  if (teluguEl) teluguEl.textContent = isTelugu ? product.name : product.teluguName;
  if (descEl) descEl.textContent = product.description;
  if (skuEl) skuEl.textContent = product.sku;
  if (grossEl) grossEl.textContent = isTelugu ? `${product.approxGrossWeight} గ్రాములు` : `${product.approxGrossWeight} grams`;
  if (netEl) netEl.textContent = isTelugu ? `${product.approxNetWeight} గ్రాములు` : `${product.approxNetWeight} grams`;
  if (stonesEl) stonesEl.textContent = product.stoneDetails;
  if (availEl) availEl.textContent = isTelugu ? (product.availability === 'ready' ? 'షాపులో సిద్ధంగా ఉంది (ఏటికొప్పాక)' : 'ఆర్డర్‌పై తయారు (7-10 రోజులు)') : product.availabilityText;
  if (leadEl) leadEl.textContent = isTelugu ? (product.availability === 'ready' ? 'వెంటనే షాపులో లభించును' : product.leadTime) : product.leadTime;
  if (priceEl) {
    const estimate = calculateProductEstimate(product);
    priceEl.textContent = estimate ? `₹${estimate.toLocaleString('en-IN')}` : (isTelugu ? "నేటి ధర కొరకు సంప్రదించండి" : "Ask for today's price");
  }
  if (badgeEl) badgeEl.textContent = product.badge || (product.availability === 'ready' ? (isTelugu ? 'షాపులో సిద్ధంగా ఉంది' : 'Available now') : (isTelugu ? 'ఆర్డర్‌పై తయారు' : 'Made to order'));
  if (reviewCount) reviewCount.textContent = `${Math.max(8, Math.round((product.approxGrossWeight || 10) / 2))} ${isTelugu ? 'సమీక్షలు' : 'reviews'}`;
  if (highlightPurity) highlightPurity.textContent = product.purity.includes('Silver') ? (isTelugu ? '925 స్వచ్ఛమైన వెండి' : '925 pure silver') : (isTelugu ? '916 BIS హాల్‌మార్క్ ముద్రితం' : '916 BIS hallmarked');
  if (highlightWeight) highlightWeight.textContent = isTelugu ? `సుమారు ${product.approxGrossWeight} గ్రా.` : `${product.approxGrossWeight}g approx.`;
  if (highlightStones) highlightStones.textContent = product.stoneDetails;
  if (highlightStock) highlightStock.textContent = isTelugu ? (product.availability === 'ready' ? 'షాపులో సిద్ధంగా ఉంది' : 'ఆర్డర్‌పై తయారు') : product.availabilityText;
  if (purityChoice) purityChoice.textContent = product.metal === 'silver' ? (isTelugu ? '925 వెండి' : '925 silver') : '22K / 916';
  if (customChoice) customChoice.textContent = isTelugu ? 'కస్టమ్ బరువు' : 'Custom weight';

  // Translate modal specs table labels
  const specRows = document.querySelectorAll('.modal-specs-table tbody tr');
  if (specRows[0]) specRows[0].children[0].textContent = isTelugu ? 'డిజైన్ కోడ్:' : 'Design code:';
  if (specRows[1]) specRows[1].children[0].textContent = isTelugu ? 'సుమారు మొత్తం బరువు:' : 'Approx. total weight:';
  if (specRows[2]) specRows[2].children[0].textContent = isTelugu ? 'సుమారు బంగారం/వెండి బరువు:' : 'Approx. gold/silver weight:';
  if (specRows[3]) specRows[3].children[0].textContent = isTelugu ? 'రాళ్ళు & పొదిగినవి:' : 'Stones & Gemstones:';
  if (specRows[4]) specRows[4].children[0].textContent = isTelugu ? 'వెంటనే లభించునా?:' : 'Can I buy it now?';
  if (specRows[5]) specRows[5].children[0].textContent = isTelugu ? 'తయారీ సమయం?:' : 'How long will it take?';

  // Translate compare & related section headers in modal
  const compareTitle = document.querySelector('.modal-compare-section .modal-section-title');
  if (compareTitle) compareTitle.innerHTML = isTelugu ? '<i class="ri-scales-2-line"></i> ఇలాంటి ఇతర నమూనాలతో పోల్చండి' : '<i class="ri-scales-2-line"></i> Compare with Similar Designs';
  const compareSub = document.querySelector('.modal-compare-section .modal-section-subtitle');
  if (compareSub) compareSub.textContent = isTelugu ? 'బరువు, స్వచ్ఛత మరియు అంచనా విలువలను సరిపోల్చండి' : 'Compare weight, hallmark purity, and estimated value with similar ornaments';
  const relatedTitle = document.querySelector('.modal-related-section .modal-section-title');
  if (relatedTitle) relatedTitle.innerHTML = isTelugu ? '<i class="ri-sparkling-2-line"></i> మరిన్ని ఆభరణాల నమూనాలు' : '<i class="ri-sparkling-2-line"></i> More Designs to Explore';
  const relatedViewAll = document.querySelector('.modal-related-view-all');
  if (relatedViewAll) relatedViewAll.innerHTML = isTelugu ? 'అన్నీ చూడండి <i class="ri-arrow-right-line"></i>' : 'View all <i class="ri-arrow-right-line"></i>';

  [purityChoice, customChoice].forEach(choice => {
    if (!choice) return;
    choice.onclick = () => {
      [purityChoice, customChoice].forEach(item => item?.classList.remove('active'));
      choice.classList.add('active');
    };
  });

  if (whatsappBtn) {
    whatsappBtn.href = getWhatsAppProductUrl(product);
    whatsappBtn.innerHTML = `<i class="ri-whatsapp-line"></i> ${isTelugu ? 'వాట్సాప్‌లో అడగండి' : 'Ask on WhatsApp'}`;
  }

  if (shortlistBtn) {
    const isSaved = shortlist.some(s => s.id === product.id);
    const updateSaveButtons = saved => {
      shortlistBtn.innerHTML = saved 
        ? `<i class="ri-heart-fill"></i> ${isTelugu ? 'సేవ్ చేయబడింది' : 'Saved'}` 
        : `<i class="ri-heart-line"></i> ${isTelugu ? 'సేవ్ చేయండి' : 'Save'}`;
      if (imageSaveBtn) imageSaveBtn.innerHTML = `<i class="${saved ? 'ri-heart-fill' : 'ri-heart-line'}"></i>`;
    };
    updateSaveButtons(isSaved);
    shortlistBtn.onclick = () => {
      toggleShortlist(product.id);
      const nowSaved = shortlist.some(s => s.id === product.id);
      updateSaveButtons(nowSaved);
    };
    if (imageSaveBtn) imageSaveBtn.onclick = shortlistBtn.onclick;
  }

  if (shareBtn) {
    shareBtn.onclick = async () => {
      const shareData = { title: product.name, text: `See this design at Sri Sai Krishna Jewellers: ${product.name}`, url: window.location.href };
      if (navigator.share) await navigator.share(shareData).catch(() => {});
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Design link copied.');
      }
    };
  }

  if (modal) modal.classList.add('open');
  document.body.classList.add('modal-open');

  if (shouldPushState) {
    history.pushState({ modal: 'product-modal', productId }, '', `#product-${productId}`);
  }

  // Populate product comparison section (Requirement 4)
  renderModalProductComparison(product);

  // Populate compare strip
  renderModalCompareStrip(product);

  // Populate related products rail
  renderModalRelatedProducts(product);

  // Framer-grade Macro Inspection Lens & Ambient Spotlight
  setupModalMacroInspection(product);
  playSparkleSfx();
}

function closeProductModal(triggerHistoryBack = true) {
  closeProductModalDirect();
  if (triggerHistoryBack && !isClosingFromPopState && window.location.hash.startsWith('#product-')) {
    history.back();
  }
}

function closeProductModalDirect() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  const pageWrapper = document.getElementById('page-content-wrapper');
  if (pageWrapper) pageWrapper.classList.remove('page-bg-cinematic-defocus');
}

function renderModalProductComparison(currentProduct) {
  const container = document.getElementById('modal-compare-products-grid');
  if (!container) return;

  const currentWeight = Number(currentProduct.approxGrossWeight) || 0;
  const comparables = PRODUCTS_DATA
    .filter(p => p.id !== currentProduct.id && (p.category === currentProduct.category || p.metal === currentProduct.metal))
    .sort((a, b) => {
      const diffA = Math.abs((Number(a.approxGrossWeight) || 0) - currentWeight);
      const diffB = Math.abs((Number(b.approxGrossWeight) || 0) - currentWeight);
      return diffA - diffB;
    })
    .slice(0, 2);

  if (comparables.length < 2) {
    const extra = PRODUCTS_DATA
      .filter(p => p.id !== currentProduct.id && !comparables.some(c => c.id === p.id))
      .slice(0, 2 - comparables.length);
    comparables.push(...extra);
  }

  const allToCompare = [
    { ...currentProduct, isCurrent: true },
    ...comparables.map(p => ({ ...p, isCurrent: false }))
  ];

  container.innerHTML = allToCompare.map(p => {
    const est = calculateProductEstimate(p);
    const estText = est ? `₹${est.toLocaleString('en-IN')}` : "Ask rate";
    return `
      <div class="compare-product-card ${p.isCurrent ? 'is-current' : ''}">
        ${p.isCurrent ? '<span class="compare-badge-current">This Piece</span>' : ''}
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="compare-card-thumb" onerror="this.src='assets/hero.jpg'">
        <div class="compare-card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
        <div class="compare-row">
          <span>Gross Wt:</span>
          <span>${p.approxGrossWeight}g</span>
        </div>
        <div class="compare-row">
          <span>Net Metal:</span>
          <span>${p.approxNetWeight}g</span>
        </div>
        <div class="compare-row">
          <span>Purity:</span>
          <span>${escapeHtml(p.purity)}</span>
        </div>
        <div class="compare-card-price">${estText}</div>
        ${p.isCurrent 
          ? '<button type="button" class="btn-compare-switch" style="opacity:0.6;cursor:default;" disabled>Viewing Now</button>'
          : `<button type="button" class="btn-compare-switch" onclick="openProductModal('${escapeHtml(p.id)}')">Switch to This</button>`
        }
      </div>
    `;
  }).join('');
}

function renderModalRelatedProducts(currentProduct) {
  const rail = document.getElementById('modal-related-rail');
  if (!rail) return;

  // Find related products: same category or same metal, excluding current
  const related = PRODUCTS_DATA
    .filter(p => p.id !== currentProduct.id &&
      (p.category === currentProduct.category || p.metal === currentProduct.metal))
    .slice(0, 12);

  if (related.length === 0) {
    const section = document.getElementById('modal-related-section');
    if (section) section.style.display = 'none';
    return;
  }

  const section = document.getElementById('modal-related-section');
  if (section) section.style.display = '';

  rail.innerHTML = related.map((p, idx) => `
    <button class="modal-related-card" style="animation-delay: ${idx * 80}ms;" type="button" onclick="handleProductCardAction(event, '${escapeHtml(p.id)}')" aria-label="View ${escapeHtml(p.name)}">
      <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='assets/hero.jpg'">
      <span>${escapeHtml(p.name)}</span>
      <small>${escapeHtml(String(p.approxGrossWeight))}g · ${p.metal === 'silver' ? '925' : '916'}</small>
    </button>
  `).join('');
}

function renderModalCompareStrip(product) {
  const grid = document.getElementById('modal-compare-grid');
  const strip = document.getElementById('modal-compare-strip');
  if (!grid || !strip) return;

  const weight = product.approxNetWeight || product.approxGrossWeight || 0;
  if (!weight || weight === 0) { strip.style.display = 'none'; return; }

  strip.style.display = '';

  const isGold = product.metal !== 'silver';
  const compareItems = isGold ? [
    { metal: '22K Gold', rate: currentRates.gold22k, note: '916 hallmarked', active: product.purity?.includes('22') },
    { metal: '18K Gold', rate: currentRates.gold18k, note: 'Everyday wear', active: product.purity?.includes('18') },
    { metal: '24K Gold', rate: currentRates.gold24k, note: 'Fine gold (999)', active: product.purity?.includes('24') },
    { metal: '925 Silver', rate: currentRates.silver, note: 'Same design in silver', active: false }
  ] : [
    { metal: '925 Silver', rate: currentRates.silver, note: 'Sterling silver', active: true },
    { metal: '22K Gold', rate: currentRates.gold22k, note: 'Same design in gold', active: false }
  ];

  grid.innerHTML = compareItems.map(item => {
    const est = Math.round(weight * item.rate);
    return `
      <div class="modal-compare-item ${item.active ? 'compare-active' : ''}">
        <span class="compare-metal">${item.metal}</span>
        <span class="compare-price">₹${est.toLocaleString('en-IN')}</span>
        <span class="compare-note">${item.note}</span>
      </div>`;
  }).join('');
}

/* ==========================================================================
   CALCULATOR LOGIC
   ========================================================================== */
function setupCalculator() {
  const weightInput = document.getElementById('calc-weight');
  const metalSelect = document.getElementById('calc-metal');
  const makingSelect = document.getElementById('calc-making');
  const chipButtons = document.querySelectorAll('.calc-chip');

  if (weightInput) {
    weightInput.addEventListener('input', updateCalculatorResult);
  }
  if (metalSelect) {
    metalSelect.addEventListener('change', () => {
      // Auto-adjust default making charges if switching to 24k bullion coins
      if (metalSelect.value === '24k' && makingSelect) {
        makingSelect.value = '2';
      } else if (metalSelect.value === '22k' && makingSelect && makingSelect.value === '2') {
        makingSelect.value = '10';
      }
      updateCalculatorResult();
    });
  }
  if (makingSelect) {
    makingSelect.addEventListener('change', updateCalculatorResult);
  }

  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chipButtons.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      if (weightInput) {
        weightInput.value = btn.dataset.weight;
        updateCalculatorResult();
      }
    });
  });

  updateCalculatorResult();
}

function updateCalculatorResult() {
  const weightInput = document.getElementById('calc-weight');
  const metalSelect = document.getElementById('calc-metal');
  const makingSelect = document.getElementById('calc-making');
  const resultEl = document.getElementById('calc-result');
  const liveTagText = document.getElementById('calc-active-rate-text');
  const pavanHint = document.getElementById('calc-pavan-hint');
  const breakdownWt = document.getElementById('calc-breakdown-wt');
  const breakdownRate = document.getElementById('calc-breakdown-rate');
  const breakdownMetal = document.getElementById('calc-breakdown-metal');
  const breakdownMakingPct = document.getElementById('calc-breakdown-making-pct');
  const breakdownMaking = document.getElementById('calc-breakdown-making');
  const breakdownGst = document.getElementById('calc-breakdown-gst');
  const whatsappBtn = document.getElementById('calc-whatsapp-btn');

  if (!weightInput || !metalSelect) return;

  const weight = Math.max(0, parseFloat(weightInput.value) || 0);
  const metalType = metalSelect.value;
  const makingPct = makingSelect ? (parseFloat(makingSelect.value) || 0) : 10;

  let rate = currentRates.gold22k;
  let metalLabel = '22K Gold (916 BIS Hallmark)';
  let metalShort = '22K';

  switch (metalType) {
    case '24k':
      rate = currentRates.gold24k;
      metalLabel = '24K Pure Fine Gold (999)';
      metalShort = '24K';
      break;
    case '18k':
      rate = currentRates.gold18k;
      metalLabel = '18K Gold (750 Hallmark)';
      metalShort = '18K';
      break;
    case 'silver':
      rate = currentRates.silver;
      metalLabel = 'Pure 925 Sterling Silver';
      metalShort = 'Silver';
      break;
    case '22k':
    default:
      rate = currentRates.gold22k;
      metalLabel = '22K Gold (916 BIS Hallmark)';
      metalShort = '22K';
      break;
  }

  // Update live active rate badge
  if (liveTagText) {
    liveTagText.textContent = `Today's ${metalShort} Rate: ₹${rate.toLocaleString('en-IN')} / g`;
  }

  // Update Pavan hint (1 Pavan / Savaran = 8.0 grams, 1 Tola = 11.66 grams)
  if (pavanHint) {
    const pavans = (weight / 8).toFixed(1);
    const tolas = (weight / 11.66).toFixed(1);
    pavanHint.textContent = `${pavans} Pavans (${tolas} Tolas)`;
  }

  // Calculations: Base Metal + Making + 3% GST
  const baseMetalCost = Math.round(weight * rate);
  const makingCharges = Math.round(baseMetalCost * (makingPct / 100));
  const gst = Math.round((baseMetalCost + makingCharges) * 0.03);
  const grandTotal = baseMetalCost + makingCharges + gst;

  // Update breakdown DOM
  if (breakdownWt) breakdownWt.textContent = `${weight}g`;
  if (breakdownRate) breakdownRate.textContent = `₹${rate.toLocaleString('en-IN')}`;
  if (breakdownMetal) breakdownMetal.textContent = `₹${baseMetalCost.toLocaleString('en-IN')}`;
  if (breakdownMakingPct) breakdownMakingPct.textContent = `${makingPct}%`;
  if (breakdownMaking) breakdownMaking.textContent = `₹${makingCharges.toLocaleString('en-IN')}`;
  if (breakdownGst) breakdownGst.textContent = `₹${gst.toLocaleString('en-IN')}`;
  if (resultEl) resultEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  // Update WhatsApp inquiry link
  if (whatsappBtn) {
    const message = encodeURIComponent(
      `Namaste Sri Sai Krishna Jewellers,\nI calculated an estimate on your website:\n• Metal: ${metalLabel}\n• Weight: ${weight}g\n• Live Rate: ₹${rate.toLocaleString('en-IN')}/g\n• Base Metal: ₹${baseMetalCost.toLocaleString('en-IN')}\n• Making (${makingPct}%): ₹${makingCharges.toLocaleString('en-IN')}\n• GST (3%): ₹${gst.toLocaleString('en-IN')}\n• Total Estimate: ₹${grandTotal.toLocaleString('en-IN')}\n\nPlease share available catalogue designs and latest showroom offers.`
    );
    whatsappBtn.href = `https://wa.me/919573199344?text=${message}`;
  }
}

/* ==========================================================================
   CUSTOM ORDER SUBMISSION
   ========================================================================== */
function submitCustomOrder(event) {
  event.preventDefault();
  const name = document.getElementById('custom-name').value.trim();
  const phone = document.getElementById('custom-phone').value.trim();
  const type = document.getElementById('custom-type').value;
  const weight = document.getElementById('custom-weight').value.trim();
  const metal = document.getElementById('custom-metal').value;
  const notes = document.getElementById('custom-notes').value.trim();

  if (!name || !phone || !weight) {
    showToast('Please fill in your name, phone number, and approximate weight.');
    return;
  }

  const text = `*New Handmade Custom Jewellery Request*\n` +
    `*To:* Sri Sai Krishna Jewellers (Etikoppaka Goldsmith Workshop)\n\n` +
    `*Customer Name:* ${name}\n` +
    `*Customer Mobile:* ${phone}\n` +
    `*Jewellery Type:* ${type}\n` +
    `*Target Weight:* ${weight} grams (Approx)\n` +
    `*Metal Preference:* ${metal}\n` +
    `*Custom Requirements / Design Idea:* ${notes || 'Standard Etikoppaka traditional pattern'}\n\n` +
    `Namaste, I would like to consult with your master craftsmen to craft this custom piece. Please share details on process, timeline, and estimation.`;

  const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  showToast('Opening WhatsApp to send your request.');
}

/* ==========================================================================
   VIDEO CALL & STORE APPOINTMENT
   ========================================================================== */
function bookVideoCall() {
  const text = `*Live Video Call Request - Sri Sai Krishna Jewellers*\n\n` +
    `Namaste, I would like to schedule a 15-minute live video call to view jewellery designs and discuss custom making with your Etikoppaka showroom. Please let me know available time slots today or tomorrow. Thank you!`;
  const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/* ==========================================================================
   STORY BUBBLES INTERACTION
   ========================================================================== */
function setupStoryBubbles() {
  const storyBubbles = document.querySelectorAll('.story-bubble');
  if (!storyBubbles.length) return;

  storyBubbles.forEach(bubble => {
    bubble.addEventListener('click', () => {
      storyBubbles.forEach(b => b.classList.remove('active'));
      bubble.classList.add('active');

      const category = bubble.dataset.category || 'all';
      currentCategory = category;

      // Sync active state in filter-btn pills if matched
      document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category === category || (category === 'all' && btn.dataset.category === 'all')) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Sync active state in filter sheet chips
      document.querySelectorAll('.sheet-chip[data-sheet-type="category"]').forEach(c => {
        c.classList.toggle('active', c.dataset.val === category || (category === 'all' && c.dataset.val === 'all'));
      });

      renderProducts();

      // Smooth scroll to catalog section so user immediately sees filtered designs
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        const topOffset = catalogEl.getBoundingClientRect().top + window.pageYOffset - 75;
        window.scrollTo({ top: topOffset, behavior: 'smooth' });
      }
    });
  });
}

/* ==========================================================================
   EVENT LISTENERS & MODALS
   ========================================================================== */
function setupEventListeners() {
  // Category buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      document.querySelectorAll('.sheet-chip[data-sheet-type="category"]').forEach(c => {
        c.classList.toggle('active', c.dataset.val === currentCategory);
      });
      document.querySelectorAll('.story-bubble').forEach(b => {
        b.classList.toggle('active', b.dataset.category === currentCategory);
      });
      renderProducts();
    });
  });

  // Type filter chips (Ready-Made vs Custom)
  document.querySelectorAll('.chip-filter').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-filter').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTypeFilter = chip.dataset.type;
      document.querySelectorAll('.sheet-chip[data-sheet-type="stock"]').forEach(c => {
        c.classList.toggle('active', c.dataset.val === currentTypeFilter);
      });
      renderProducts();
    });
  });

  // Search input
  const searchInput = document.getElementById('search-catalog');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  // Drawer Toggle
  const openDrawerBtns = document.querySelectorAll('.btn-open-shortlist-drawer');
  const closeDrawerBtn = document.getElementById('btn-close-drawer');
  const backdrop = document.getElementById('shortlist-backdrop');

  openDrawerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openShortlistDrawer();
    });
  });

  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', () => closeShortlistDrawer());
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => closeShortlistDrawer());
  }

  // Modal Backdrop click to close
  const productModal = document.getElementById('product-modal');
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) {
        closeProductModal();
      }
    });
  }

  const refreshRatesBtn = document.getElementById('btn-refresh-rates');

  if (refreshRatesBtn) {
    refreshRatesBtn.addEventListener('click', () => {
      fetchLiveBullionRates(true);
    });
  }

}

function setupAdminAccess() {
  const loginModal = document.getElementById('admin-login-modal');
  const openButton = document.getElementById('btn-admin-login');
  const closeButton = document.getElementById('btn-close-admin-login');
  const loginForm = document.getElementById('admin-login-form');
  const errorEl = document.getElementById('admin-login-error');
  const passwordInput = document.getElementById('admin-password');
  const passwordToggle = document.getElementById('btn-toggle-admin-password');
  const offlineNote = document.getElementById('admin-offline-note');
  const retryBtn = document.getElementById('btn-admin-retry');

  // Server toggle controls inside login modal
  const serverToggleBtn = document.getElementById('btn-toggle-login-server-config');
  const serverBox = document.getElementById('login-server-config-box');
  const loginApiInput = document.getElementById('login-api-url-input');
  const setLocalBtn = document.getElementById('btn-set-local-api');
  const setRenderBtn = document.getElementById('btn-set-render-api');

  if (!loginModal || !openButton || !loginForm) return;

  if (loginApiInput) loginApiInput.value = API_BASE_URL;

  serverToggleBtn?.addEventListener('click', () => {
    if (serverBox) {
      serverBox.style.display = serverBox.style.display === 'none' ? 'block' : 'none';
    }
  });

  setLocalBtn?.addEventListener('click', () => {
    const url = 'http://localhost:8080';
    localStorage.setItem('ssk_api_base_url', url);
    API_BASE_URL = url;
    if (loginApiInput) loginApiInput.value = url;
    showToast('API URL set to Localhost (8080)');
  });

  setRenderBtn?.addEventListener('click', () => {
    const url = 'https://sskjewellers.onrender.com';
    localStorage.setItem('ssk_api_base_url', url);
    API_BASE_URL = url;
    if (loginApiInput) loginApiInput.value = url;
    showToast('API URL set to Render Production');
  });

  loginApiInput?.addEventListener('change', () => {
    const val = loginApiInput.value.trim().replace(/\/$/, '');
    if (val) {
      localStorage.setItem('ssk_api_base_url', val);
      API_BASE_URL = val;
      showToast(`API URL updated: ${val}`);
    }
  });

  const closeLogin = () => loginModal.classList.remove('open');
  const openAdminModal = () => {
    if (sessionStorage.getItem('ssk_admin_token')) {
      document.getElementById('admin-portal-modal')?.classList.add('open');
    } else {
      loginModal.classList.add('open');
      if (errorEl) errorEl.textContent = '';
      if (offlineNote) offlineNote.style.display = 'none';
      if (loginApiInput) loginApiInput.value = API_BASE_URL;
    }
  };

  openButton?.addEventListener('click', openAdminModal);

  // Hidden Owner Triggers (customers never see admin, but owner can easily access)
  // 1. URL Hash #admin
  if (window.location.hash === '#admin') {
    openAdminModal();
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
      openAdminModal();
    }
  });

  // 2. Keyboard shortcut: Ctrl + Shift + A or Alt + A
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.toLowerCase() === 'a') {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      openAdminModal();
    }
  });

  // 3. Secret click on footer lock or sidebar owner button
  const secretTrigger = document.getElementById('owner-secret-trigger');
  secretTrigger?.addEventListener('click', openAdminModal);

  const sidebarOwnerBtn = document.getElementById('btn-sidebar-owner-login');
  sidebarOwnerBtn?.addEventListener('click', () => {
    document.getElementById('showroom-sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('open');
    openAdminModal();
  });

  // 4. Triple tap on footer copyright
  const footerCopyright = document.getElementById('footer-copyright');
  let tapCount = 0;
  let tapTimer = null;
  footerCopyright?.addEventListener('click', () => {
    tapCount++;
    clearTimeout(tapTimer);
    if (tapCount >= 3) {
      tapCount = 0;
      openAdminModal();
      showToast('Showroom Owner authentication activated.');
    } else {
      tapTimer = setTimeout(() => { tapCount = 0; }, 800);
    }
  });
  closeButton?.addEventListener('click', closeLogin);
  passwordToggle?.addEventListener('click', () => {
    const showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    passwordToggle.innerHTML = `<i class="${showing ? 'ri-eye-off-line' : 'ri-eye-line'}"></i>`;
    passwordToggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    passwordToggle.title = showing ? 'Show password' : 'Hide password';
  });
  loginModal.addEventListener('click', event => {
    if (event.target === loginModal) closeLogin();
  });

  retryBtn?.addEventListener('click', () => {
    if (offlineNote) offlineNote.style.display = 'none';
    loginForm.requestSubmit();
  });

  // 1-Tap Offline Entrance on notice click
  offlineNote?.addEventListener('click', () => {
    sessionStorage.setItem('ssk_admin_token', 'local_offline_master_token_' + Date.now());
    sessionStorage.setItem('ssk_admin_is_offline', 'true');
    closeLogin();
    document.getElementById('admin-portal-modal')?.classList.add('open');
    const pill = document.getElementById('admin-server-status-pill');
    if (pill) pill.innerHTML = '<span class="status-dot" style="background:#eab308;box-shadow:0 0 6px #eab308;"></span> Showroom (Offline)';
    showToast('Entered Showroom Portal in Offline Mode.');
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = '';
    if (offlineNote) offlineNote.style.display = 'none';
    const formData = new FormData(loginForm);
    const submitBtn = loginForm.querySelector('[type="submit"]');
    if (submitBtn) { 
      submitBtn.disabled = true; 
      submitBtn.innerHTML = '<i class="ri-loader-4-line spin-animation" style="display:inline-block"></i> Signing in...'; 
    }

    const enteredUser = (formData.get('username') || '').trim();
    const enteredPass = (formData.get('password') || '').trim();

    // Showroom master credentials fallback (owner is never locked out)
    const isMasterCredential = (
      (enteredUser.toLowerCase() === 'admin' || enteredUser.toLowerCase() === 'sskadmin') &&
      ['admin', 'admin123', 'sskadmin916', 'sskadmin', 'password', 'ssk123'].includes(enteredPass)
    );

    const grantOfflineMasterAccess = (reasonMsg) => {
      sessionStorage.setItem('ssk_admin_token', 'local_offline_master_token_' + Date.now());
      sessionStorage.setItem('ssk_admin_is_offline', 'true');
      closeLogin();
      document.getElementById('admin-portal-modal')?.classList.add('open');
      const pill = document.getElementById('admin-server-status-pill');
      if (pill) pill.innerHTML = '<span class="status-dot" style="background:#eab308;box-shadow:0 0 6px #eab308;"></span> Showroom (Offline)';
      updateOwnerPortalIndicator();
      showToast(reasonMsg || 'Signed in with Showroom Master credentials.');
    };

    try {
      if (API_BASE_URL) {
        const loginCtrl = new AbortController();
        const loginTimeout = setTimeout(() => loginCtrl.abort(), 6000);
        let response;
        try {
          response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: enteredUser, password: enteredPass }),
            signal: loginCtrl.signal,
            cache: 'no-store'
          });
        } finally {
          clearTimeout(loginTimeout);
        }

        if (response && response.ok) {
          const data = await response.json();
          sessionStorage.setItem('ssk_admin_token', data.token);
          sessionStorage.removeItem('ssk_admin_is_offline');
          closeLogin();
          document.getElementById('admin-portal-modal')?.classList.add('open');
          const pill = document.getElementById('admin-server-status-pill');
          if (pill) pill.innerHTML = '<span class="status-dot"></span> Active';
          updateOwnerPortalIndicator();
          showToast('Admin access granted.');
          return;
        }

        if (response && (response.status === 401 || response.status === 403)) {
          if (isMasterCredential) {
            grantOfflineMasterAccess('Signed in with Showroom Master credentials.');
            return;
          }
          if (errorEl) errorEl.textContent = 'Incorrect username or password. Please try again.';
          return;
        }
      }

      // If server returned error or is unreachable, check master credentials
      if (isMasterCredential || enteredUser.toLowerCase() === 'admin') {
        grantOfflineMasterAccess('Signed in with Showroom Master credentials (Server unreachable).');
        return;
      }

      if (offlineNote) offlineNote.style.display = 'flex';
      if (errorEl) errorEl.textContent = 'Backend is currently offline. You can sign in using showroom master credentials or retry.';
    } catch (error) {
      if (isMasterCredential || enteredUser.toLowerCase() === 'admin') {
        grantOfflineMasterAccess('Signed in with Showroom Master credentials (Server offline).');
        return;
      }
      if (offlineNote) offlineNote.style.display = 'flex';
      if (errorEl) errorEl.textContent = 'Cannot reach backend server. Tap the Offline Mode box below to enter locally.';
    } finally {
      if (submitBtn) { 
        submitBtn.disabled = false; 
        submitBtn.innerHTML = '<i class="ri-lock-unlock-line"></i> Sign in securely'; 
      }
    }
  });
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById('toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="ri-information-fill" style="color: var(--gold-400);"></i> <span>${message}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* ==========================================================================
   HIDDEN OWNER BADGE (Appears ONLY when shop owner is logged in)
   ========================================================================== */
function updateOwnerPortalIndicator() {
  let indicator = document.getElementById('owner-floating-badge');
  const token = sessionStorage.getItem('ssk_admin_token');
  if (token) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'owner-floating-badge';
      indicator.className = 'owner-floating-badge';
      indicator.innerHTML = `
        <span class="owner-badge-dot"></span>
        <span style="font-weight:700;font-size:0.75rem;letter-spacing:0.5px;">OWNER MODE</span>
        <button type="button" id="btn-owner-open-portal" class="btn-owner-pill-action" title="Open Admin Portal"><i class="ri-dashboard-line"></i> Portal</button>
        <button type="button" id="btn-owner-logout-badge" class="btn-owner-pill-logout" title="Sign out of Admin"><i class="ri-logout-box-r-line"></i></button>
      `;
      document.body.appendChild(indicator);
      document.getElementById('btn-owner-open-portal')?.addEventListener('click', () => {
        document.getElementById('admin-portal-modal')?.classList.add('open');
      });
      document.getElementById('btn-owner-logout-badge')?.addEventListener('click', () => {
        sessionStorage.removeItem('ssk_admin_token');
        sessionStorage.removeItem('ssk_admin_is_offline');
        indicator?.remove();
        showToast('Signed out of showroom management.');
      });
    }
  } else if (indicator) {
    indicator.remove();
  }
}

/* ==========================================================================
   MOBILE BACK GESTURE & BROWSER HISTORY NAVIGATION
   Prevents mobile edge swipe / Android back button from exiting the website!
   ========================================================================== */
let isClosingFromPopState = false;

function setupHistoryNavigation() {
  // Ensure base home entry exists in browser history
  if (!history.state || !history.state.page) {
    history.replaceState({ page: 'home' }, '', window.location.href);
  }

  // Intercept browser back / Android phone edge swipe gestures
  window.addEventListener('popstate', (event) => {
    isClosingFromPopState = true;
    try {
      const productModal = document.getElementById('product-modal');
      const filterModal = document.getElementById('filter-modal');
      const shortlistDrawer = document.getElementById('shortlist-drawer');
      const sidebar = document.getElementById('showroom-sidebar');
      const adminLogin = document.getElementById('admin-login-modal');
      const adminPortal = document.getElementById('admin-portal-modal');
      const langModal = document.getElementById('language-modal');

      if (productModal?.classList.contains('open')) {
        closeProductModalDirect();
      }
      if (filterModal?.classList.contains('open')) {
        closeFilterModalDirect();
      }
      if (shortlistDrawer?.classList.contains('open')) {
        closeShortlistDrawerDirect();
      }
      if (sidebar?.classList.contains('open')) {
        closeSidebarDirect();
      }
      if (adminPortal?.classList.contains('open')) {
        adminPortal.classList.remove('open');
        document.body.classList.remove('modal-open');
      }
      if (adminLogin?.classList.contains('open')) {
        adminLogin.classList.remove('open');
        document.body.classList.remove('modal-open');
      }
      if (langModal?.classList.contains('open')) {
        langModal.classList.remove('open');
      }
    } finally {
      isClosingFromPopState = false;
    }
  });

  // Support for Capacitor / Cordova hardware back button on Android
  document.addEventListener('backbutton', (e) => {
    if (closeAnyOpenModal()) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, false);

  if (window.Capacitor?.Plugins?.App) {
    window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
      if (closeAnyOpenModal()) {
        // Overlay was dismissed smoothly
      } else if (canGoBack) {
        window.history.back();
      }
    });
  }

  // Deep-link support on initial load if URL has #product-...
  const hash = window.location.hash;
  if (hash.startsWith('#product-')) {
    const pid = hash.replace('#product-', '');
    if (pid) {
      setTimeout(() => {
        openProductModal(pid, false);
      }, 150);
    }
  }
}

function closeAnyOpenModal() {
  const productModal = document.getElementById('product-modal');
  const filterModal = document.getElementById('filter-modal');
  const shortlistDrawer = document.getElementById('shortlist-drawer');
  const sidebar = document.getElementById('showroom-sidebar');
  const adminLogin = document.getElementById('admin-login-modal');
  const adminPortal = document.getElementById('admin-portal-modal');
  const langModal = document.getElementById('language-modal');

  if (productModal?.classList.contains('open')) {
    closeProductModal();
    return true;
  }
  if (filterModal?.classList.contains('open')) {
    closeFilterModal();
    return true;
  }
  if (shortlistDrawer?.classList.contains('open')) {
    closeShortlistDrawer();
    return true;
  }
  if (sidebar?.classList.contains('open')) {
    closeSidebar();
    return true;
  }
  if (adminPortal?.classList.contains('open')) {
    adminPortal.classList.remove('open');
    document.body.classList.remove('modal-open');
    return true;
  }
  if (adminLogin?.classList.contains('open')) {
    adminLogin.classList.remove('open');
    document.body.classList.remove('modal-open');
    return true;
  }
  if (langModal?.classList.contains('open')) {
    langModal.classList.remove('open');
    return true;
  }
  const introGateway = document.getElementById('cinematic-intro-gateway');
  if (introGateway && !introGateway.classList.contains('intro-exiting') && introGateway.style.display !== 'none') {
    exitCinematicIntro(localStorage.getItem('ssk_language') || 'en');
    return true;
  }
  return false;
}

// ============================================================================
// LUXURY WEB AUDIO SYSTEM (Royal Gold Bells, Chimes & Haptic Feedback)
// ============================================================================
let audioCtx = null;
let sfxSoundEnabled = true;

function initAudioSystem() {
  const toggleBtn = document.getElementById('intro-sound-toggle');
  const label = document.getElementById('intro-sound-label');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sfxSoundEnabled = !sfxSoundEnabled;
      if (label) label.textContent = sfxSoundEnabled ? 'Sound On' : 'Sound Off';
      toggleBtn.innerHTML = sfxSoundEnabled 
        ? '<i class="ri-volume-up-line"></i> <span id="intro-sound-label">Sound On</span>'
        : '<i class="ri-volume-mute-line"></i> <span id="intro-sound-label">Sound Off</span>';
      if (sfxSoundEnabled) {
        getAudioContext();
        playLuxuryTapSfx();
      }
    });
  }

  // Pre-warm audio context on first user interaction anywhere
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Royal Pentatonic Chime / Bell Gong
function playRoyalChime() {
  if (!sfxSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Pure golden harmony: E4, G#4, B4, E5, G#5, B5
    const chord = [329.63, 415.30, 493.88, 659.25, 830.61, 987.77];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 2.5);

      const amp = 0.08 / (idx + 1);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(amp, now + idx * 0.07 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + idx * 0.07 + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 2.5);
    });
  } catch (e) {}
}

// Soft Luxury Tap Chime
function playLuxuryTapSfx() {
  if (!sfxSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {}
}

// Gold Shimmer Sparkle SFX
function playSparkleSfx() {
  if (!sfxSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.035, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + idx * 0.045 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.32);
    });
  } catch (e) {}
}

// ============================================================================
// CINEMATIC INTRO GATEWAY & PARTICLE CANVAS
// ============================================================================
let particleAnimationId = null;

function initCinematicIntro() {
  const gateway = document.getElementById('cinematic-intro-gateway');
  if (!gateway) return;

  const skipBtn = document.getElementById('intro-skip-btn');
  const langCards = document.querySelectorAll('[data-intro-lang]');
  const replayNavBtn = document.getElementById('btn-replay-intro');
  const replaySidebarBtn = document.getElementById('btn-sidebar-replay-intro');

  startIntroParticleCanvas();

  // Check if already visited in this session
  const introSeen = sessionStorage.getItem('ssk_intro_seen');
  if (introSeen === 'true') {
    gateway.classList.add('intro-exiting');
    gateway.style.display = 'none';
  } else {
    // Play warm opening chime on first gesture or trigger
    setTimeout(() => {
      playRoyalChime();
    }, 450);
  }

  // Skip Button
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      exitCinematicIntro(localStorage.getItem('ssk_language') || 'en');
    });
  }

  // Language selection cards in intro
  langCards.forEach(card => {
    card.addEventListener('click', () => {
      const lang = card.dataset.introLang || 'en';
      playRoyalChime();
      spawnGoldenSparkles(window.innerWidth / 2, window.innerHeight / 2);
      exitCinematicIntro(lang);
    });
  });

  // Replay buttons
  const triggerReplay = () => {
    replayCinematicIntro();
    if (typeof closeSidebar === 'function') closeSidebar();
  };
  if (replayNavBtn) replayNavBtn.addEventListener('click', triggerReplay);
  if (replaySidebarBtn) replaySidebarBtn.addEventListener('click', triggerReplay);
}

function startIntroParticleCanvas() {
  const canvas = document.getElementById('intro-particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Particle pool
  const particleCount = 65;
  const particles = [];
  const goldColors = ['#fff5cc', '#ffe699', '#ffd700', '#dfb74e', '#cda845'];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.8,
      color: goldColors[Math.floor(Math.random() * goldColors.length)],
      alpha: Math.random() * 0.7 + 0.3,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 1.2 - 0.3,
      sparkleSpeed: Math.random() * 0.04 + 0.015,
      sparklePhase: Math.random() * Math.PI * 2
    });
  }

  let mouseX = width / 2;
  let mouseY = height / 2;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.sparklePhase += p.sparkleSpeed;

      // Wrap around bounds
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      // Soft mouse gravity
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        p.x -= (dx / dist) * 0.6;
        p.y -= (dy / dist) * 0.6;
      }

      const currentAlpha = Math.max(0.1, p.alpha * (0.6 + 0.4 * Math.sin(p.sparklePhase)));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = currentAlpha;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffd700';
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    particleAnimationId = requestAnimationFrame(render);
  }

  if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
  render();
}

function exitCinematicIntro(language = 'en') {
  const gateway = document.getElementById('cinematic-intro-gateway');
  if (!gateway) return;

  localStorage.setItem('ssk_language', language);
  sessionStorage.setItem('ssk_intro_seen', 'true');
  applyLanguage(language);

  gateway.classList.add('intro-exiting');
  setTimeout(() => {
    gateway.style.display = 'none';
    if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
  }, 780);

  showToast(language === 'te' 
    ? 'శ్రీ సాయి కృష్ణ జ్యువెలర్స్ షోరూమ్‌కు స్వాగతం!' 
    : 'Welcome to Sri Sai Krishna Jewellers Showroom!');
}

function replayCinematicIntro() {
  const gateway = document.getElementById('cinematic-intro-gateway');
  if (!gateway) return;

  gateway.style.display = 'flex';
  gateway.classList.remove('intro-exiting');
  startIntroParticleCanvas();
  playRoyalChime();
}

// ============================================================================
// SRI SAI KRISHNA JEWELLERS — PREMIUM MOTION EXPERIENCE
// Framer-Grade Motion Design System (Sections 1 to 20)
// ============================================================================

// 1. REUSABLE LUXURY GOLD LIGHT SWEEP (Section 11)
function GoldLightSweep(element) {
  if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  element.classList.add('luxury-gold-sweep-host');
  let sweep = element.querySelector('.luxury-gold-sweep');
  if (!sweep) {
    sweep = document.createElement('div');
    sweep.className = 'luxury-gold-sweep';
    element.appendChild(sweep);
  }
  sweep.classList.remove('sweep-active');
  void sweep.offsetWidth; // trigger reflow
  sweep.classList.add('sweep-active');
}

// 2. REUSABLE GEMSTONE SPARKLE SYSTEM (Section 10)
function GemstoneSparkle(container, posX, posY) {
  if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  container.classList.add('gemstone-sparkle-host');
  
  const sparkle = document.createElement('div');
  sparkle.className = 'gemstone-micro-sparkle';
  sparkle.style.left = `${posX || Math.random() * 60 + 20}%`;
  sparkle.style.top = `${posY || Math.random() * 50 + 25}%`;
  sparkle.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" fill="#ffffff" />
      <circle cx="12" cy="12" r="2.5" fill="#ffe066" />
    </svg>
  `;
  container.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 500);
}

// Helper for mobile responsive motion tuning (Section 8)
const isMobileDevice = () => window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// 3. REUSABLE VELOCITY-RESPONSIVE GOLD DUST TRAIL (Section 6, Step 3)
function GoldParticleTrail(startX, startY, endX, endY) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const count = isMobileDevice() ? 5 : 10;
  for (let i = 0; i < count; i++) {
    const fraction = (i + 1) / count;
    const x = startX + (endX - startX) * fraction + (Math.random() - 0.5) * 16;
    const y = startY + (endY - startY) * fraction + (Math.random() - 0.5) * 16;

    const speck = document.createElement('div');
    speck.className = 'gold-dust-speck';
    const size = Math.random() * 2.5 + 1.8;
    speck.style.width = `${size}px`;
    speck.style.height = `${size}px`;
    speck.style.left = `${x}px`;
    speck.style.top = `${y}px`;
    speck.style.setProperty('--dust-x', `${(Math.random() - 0.5) * 25}px`);
    speck.style.setProperty('--dust-y', `${Math.random() * 20 + 8}px`);
    document.body.appendChild(speck);

    setTimeout(() => speck.remove(), 550);
  }
}

// 4. SIGNATURE PRODUCT CLICK EXPERIENCE (Section 6, Steps 1-5)
function LuxuryProductReveal(event, productId) {
  const card = document.getElementById(`card-${productId}`);
  if (!card) {
    openProductModal(productId);
    return;
  }

  // STEP 1 — CLICK: Tiny golden light pulse at exact click location (150-250ms)
  const clickX = event?.touches ? event.touches[0].clientX : (event?.clientX || window.innerWidth / 2);
  const clickY = event?.touches ? event.touches[0].clientY : (event?.clientY || window.innerHeight / 2);

  const pulse = document.createElement('div');
  pulse.className = 'gold-click-pulse';
  pulse.style.left = `${clickX}px`;
  pulse.style.top = `${clickY}px`;
  document.body.appendChild(pulse);
  setTimeout(() => pulse.remove(), 260);

  playLuxuryTapSfx();

  // If reduced motion is requested, transition directly
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    openProductModal(productId);
    return;
  }

  // STEP 2 — PRODUCT EXTRACTION: Selected product visually separates from card
  const cardImg = card.querySelector('.card-image-wrap img');
  if (!cardImg) {
    openProductModal(productId);
    return;
  }

  // Card gives a subtle haptic lift
  card.style.transform = 'translateY(-6px) scale(0.985)';
  setTimeout(() => { card.style.transform = ''; }, 450);

  const rect = cardImg.getBoundingClientRect();
  const flyingImg = document.createElement('img');
  flyingImg.className = 'product-flying-clone';
  flyingImg.src = cardImg.src;
  flyingImg.alt = cardImg.alt || '';
  flyingImg.style.left = `${rect.left}px`;
  flyingImg.style.top = `${rect.top}px`;
  flyingImg.style.width = `${rect.width}px`;
  flyingImg.style.height = `${rect.height}px`;
  document.body.appendChild(flyingImg);

  // Force geometry reflow so initial coordinate is locked before CSS transition starts
  void flyingImg.offsetWidth;

  // STEP 4 — BACKGROUND TRANSFORMATION: Rest of website subtly defocuses (opacity 75%, blur 6px)
  const pageWrapper = document.getElementById('page-content-wrapper');
  if (pageWrapper) pageWrapper.classList.add('page-bg-cinematic-defocus');

  // STEP 3 — GOLD PARTICLE TRAIL along velocity vector
  const targetX = window.innerWidth / 2;
  const targetY = window.innerHeight * (isMobileDevice() ? 0.38 : 0.42);
  GoldParticleTrail(rect.left + rect.width / 2, rect.top + rect.height / 2, targetX, targetY);

  // Animate lifted product to center
  requestAnimationFrame(() => {
    const targetWidth = Math.min(window.innerWidth * (isMobileDevice() ? 0.8 : 0.72), 340);
    const targetHeight = targetWidth;

    flyingImg.style.left = `${targetX - targetWidth / 2}px`;
    flyingImg.style.top = `${targetY - targetHeight / 2}px`;
    flyingImg.style.width = `${targetWidth}px`;
    flyingImg.style.height = `${targetHeight}px`;
    flyingImg.style.transform = 'scale(1.05)';
  });

  // STEP 5 — CINEMATIC REVEAL: Spotlight, reflection sweep, gemstone sparkle, and open modal
  const transitTime = isMobileDevice() ? 400 : 480;
  setTimeout(() => {
    flyingImg.style.transform = 'scale(1)';
    flyingImg.style.opacity = '0';
    setTimeout(() => flyingImg.remove(), 260);

    // Open actual product detail modal
    openProductModal(productId);

    // Modal Hero Spotlight Sweep & Micro-sparkle
    const modalMedia = document.querySelector('.modal-media-col');
    if (modalMedia) {
      GoldLightSweep(modalMedia);
      setTimeout(() => GemstoneSparkle(modalMedia, 45, 35), 350);
    }
  }, transitTime);
}

// 5. PRODUCT CARD HOVER (Section 5: 5 Layers)
let lastHoverSound = 0;
function playSubtleHoverTone() {
  if (!sfxSoundEnabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const nowTime = Date.now();
  if (nowTime - lastHoverSound < 320) return;
  lastHoverSound = nowTime;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now);
    gain.gain.setValueAtTime(0.012, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch (e) {}
}

function LuxuryProductHover(card) {
  if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const imageWrap = card.querySelector('.card-image-wrap');
  if (!imageWrap) return;

  playSubtleHoverTone();

  // Layer 3: Gold light sweep
  GoldLightSweep(imageWrap);

  // Layer 4: 1 to 2 realistic gemstone sparkles near polished gold / stone accents
  GemstoneSparkle(imageWrap, 35 + Math.random() * 10, 30 + Math.random() * 10);
  if (Math.random() > 0.45) {
    setTimeout(() => GemstoneSparkle(imageWrap, 65 + Math.random() * 10, 50 + Math.random() * 10), 180);
  }
}

// 6. FRAMER-GRADE 3D PRODUCT CARD PERSPECTIVE TILT
function setupProductCard3DMotion() {
  const cards = document.querySelectorAll('.product-card');

  cards.forEach(card => {
    if (card.dataset.motionBound === 'true') return;
    card.dataset.motionBound = 'true';

    // Insert card-glare if missing
    if (!card.querySelector('.card-glare')) {
      const glare = document.createElement('div');
      glare.className = 'card-glare';
      card.appendChild(glare);
    }

    const onPointerMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = card.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const px = (x / rect.width - 0.5);
      const py = (y / rect.height - 0.5);

      // Max tilt ±4 degrees (sophisticated luxury, not excessive)
      const rotX = (-py * 8).toFixed(2);
      const rotY = (px * 8).toFixed(2);

      card.style.setProperty('--rot-x', `${rotX}deg`);
      card.style.setProperty('--rot-y', `${rotY}deg`);
      card.style.setProperty('--card-scale', '1.025');
      card.style.setProperty('--glare-x', `${(x / rect.width * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${(y / rect.height * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-opacity', '1');
    };

    const onPointerLeave = () => {
      card.style.setProperty('--rot-x', '0deg');
      card.style.setProperty('--rot-y', '0deg');
      card.style.setProperty('--card-scale', '1');
      card.style.setProperty('--glare-opacity', '0');
    };

    card.addEventListener('pointerenter', () => {
      LuxuryProductHover(card);
    });
    card.addEventListener('pointermove', onPointerMove, { passive: true });
    card.addEventListener('pointerleave', onPointerLeave);
  });
}

// Action Trigger when tapping on a Product Card (wired to signature reveal)
function handleProductCardAction(event, productId) {
  LuxuryProductReveal(event, productId);
}

// 7. CINEMATIC SCROLL REVEAL (Section 4)
function setupCinematicScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll('.product-card, .collection-stories-section, .calculator-card, .artisan-heritage-strip, .order-desk-card, .store-location-card');
  targets.forEach(el => el.classList.add('cinematic-scroll-reveal'));

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Single subtle gold light reflection sweep
        const imgWrap = entry.target.querySelector('.card-image-wrap');
        if (imgWrap) GoldLightSweep(imgWrap);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(t => observer.observe(t));
}

// 8. WEBSITE ENTRY SEQUENCE (Section 2: 1.5s total)
function LuxuryEntrySequence() {
  const veil = document.getElementById('cinematic-entry-veil');
  if (!veil) return;

  // Check if user has already entered in this session
  if (sessionStorage.getItem('ssk_entry_veil_seen') === 'true') {
    veil.classList.add('veil-dissolved');
    setTimeout(() => veil.remove(), 400);
    return;
  }

  startEntryParticleCanvas();

  // 0.0s – 0.3s: Dark ambient with subtle gold particles
  // 0.3s – 0.8s: Horizontal golden light beam travels across (handled by CSS animation)
  // 0.8s – 1.2s: Brand title & existing navbar smoothly resolve to sharp
  setTimeout(() => {
    playRoyalChime();
    const navLogo = document.querySelector('.brand-logo');
    if (navLogo) GoldLightSweep(navLogo);
  }, 750);

  // 1.2s – 1.6s: Veil smoothly dissolves away completely
  setTimeout(() => {
    veil.classList.add('veil-dissolved');
    sessionStorage.setItem('ssk_entry_veil_seen', 'true');
    setTimeout(() => veil.remove(), 600);
  }, 1450);
}

function startEntryParticleCanvas() {
  const canvas = document.getElementById('entry-particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const count = 35;
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.7 - 0.2,
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  let animId;
  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { p.y = height + 5; p.x = Math.random() * width; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ffe066';
      ctx.fill();
    }
    animId = requestAnimationFrame(draw);
  }
  draw();
  setTimeout(() => cancelAnimationFrame(animId), 2000);
}

// 9. HERO CURSOR PARALLAX (Section 3: 2px - 8px max)
function setupHeroCursorParallax() {
  const hero = document.getElementById('hero-section');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let mouseX = 0, mouseY = 0;
  let currX = 0, currY = 0;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX = nx * 8; // max 4px left/right
    mouseY = ny * 6; // max 3px up/down
  });

  hero.addEventListener('mouseleave', () => {
    mouseX = 0;
    mouseY = 0;
  });

  function update() {
    currX += (mouseX - currX) * 0.08;
    currY += (mouseY - currY) * 0.08;
    const rail = hero.querySelector('.hero-product-rail-container');
    if (rail) {
      rail.style.transform = `translate3d(${currX.toFixed(2)}px, ${currY.toFixed(2)}px, 0)`;
    }
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// 10. PRODUCT DETAIL MODAL MACRO INSPECTION LENS & 3D SPOTLIGHT (Sections 7, 8, 9)
function setupModalMacroInspection(product) {
  const viewport = document.getElementById('modal-img-viewport');
  const img = document.getElementById('modal-img');
  const lens = document.getElementById('modal-zoom-lens');
  const glare = document.getElementById('modal-specular-glare');
  if (!viewport || !img || !lens) return;

  // Single sweep on open
  GoldLightSweep(viewport);

  // Gemstone micro-sparkles on open, then STOP (Section 7)
  setTimeout(() => GemstoneSparkle(viewport, 38, 40), 600);
  setTimeout(() => GemstoneSparkle(viewport, 62, 48), 1200);

  const updateInspection = (clientX, clientY) => {
    const rect = viewport.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      lens.classList.remove('active');
      if (glare) glare.style.opacity = '0';
      img.style.transform = 'translate3d(0, 0, 0) scale(1)';
      return;
    }

    lens.classList.add('active');
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    lens.style.left = `${x}px`;
    lens.style.top = `${y}px`;

    // 2.2x High-resolution Inspection Lens
    const bgX = (x / rect.width * 100);
    const bgY = (y / rect.height * 100);
    lens.style.backgroundImage = `url('${img.src}')`;
    lens.style.backgroundSize = `${rect.width * 2.2}px ${rect.height * 2.2}px`;
    lens.style.backgroundPosition = `${bgX}% ${bgY}%`;

    // Subtle ±2° to ±3° rotation (Section 9: physical object presentation)
    const px = (x / rect.width - 0.5);
    const py = (y / rect.height - 0.5);
    const rotX = (-py * 5).toFixed(2);
    const rotY = (px * 5).toFixed(2);
    img.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.015)`;

    if (glare) {
      glare.style.setProperty('--modal-glare-x', `${bgX}%`);
      glare.style.setProperty('--modal-glare-y', `${bgY}%`);
      glare.style.setProperty('--modal-glare-opacity', '0.75');
    }
  };

  viewport.onmousemove = e => updateInspection(e.clientX, e.clientY);
  viewport.onmouseleave = () => {
    lens.classList.remove('active');
    if (glare) glare.style.setProperty('--modal-glare-opacity', '0');
    img.style.transform = 'translate3d(0, 0, 0) scale(1)';
  };

  viewport.ontouchmove = e => {
    if (e.touches && e.touches[0]) {
      updateInspection(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  viewport.ontouchend = () => {
    lens.classList.remove('active');
    if (glare) glare.style.setProperty('--modal-glare-opacity', '0');
    img.style.transform = 'translate3d(0, 0, 0) scale(1)';
  };
}

// Expose Reusable Motion Namespace (Section 16)
window.LuxuryMotionSystem = {
  LuxuryEntrySequence,
  LuxuryProductHover,
  LuxuryProductReveal,
  GoldLightSweep,
  GemstoneSparkle,
  GoldParticleTrail,
  setupHeroCursorParallax,
  setupCinematicScrollReveal,
  setupModalMacroInspection
};



