// Sri Sai Krishna Jewellers - Interactive Showroom Application
// Location: Etikoppaka, AP | Phone / WhatsApp: +91 9573199344

// State
let currentCategory = 'all';
let currentTypeFilter = 'all';
let searchQuery = '';
let shortlist = [];
let currentRates = { ...DEFAULT_RATES };
let rateSyncStatus = {
  isLive: false,
  lastUpdated: null,
  isFetching: false,
  source: 'Default'
};
const API_BASE_URL = window.SSK_API_BASE_URL || '';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadRates();
  loadShortlist();
  renderRatesTicker();
  renderProducts();
  setupEventListeners();
  setupCalculator();
  setupAdminAccess();
  
  // Auto-fetch live rates from API on page load
  fetchLiveBullionRates();

  // Auto-poll live rates every 5 minutes (300,000 ms)
  setInterval(() => {
    fetchLiveBullionRates(false);
  }, 5 * 60 * 1000);
});

/* ==========================================================================
   RATES MANAGEMENT & LIVE API FETCHING
   ========================================================================== */
function loadRates() {
  const saved = localStorage.getItem('ssk_daily_rates');
  const savedStatus = localStorage.getItem('ssk_rate_sync_status');

  if (saved) {
    try {
      currentRates = JSON.parse(saved);
    } catch (e) {
      currentRates = { ...DEFAULT_RATES };
    }
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
  rateSyncStatus.isLive = source === 'Live API';

  localStorage.setItem('ssk_daily_rates', JSON.stringify(rates));
  localStorage.setItem('ssk_rate_sync_status', JSON.stringify(rateSyncStatus));

  renderRatesTicker();
  updateCalculatorResult();
}

/**
 * Fetches real-time Gold and Silver rates in INR from free, public Live Bullion APIs
 */
async function fetchLiveBullionRates(userInitiated = false) {
  if (rateSyncStatus.isFetching) return;
  rateSyncStatus.isFetching = true;
  updateRefreshBtnSpin(true);

  const statusEl = document.getElementById('rate-sync-label');
  if (statusEl) statusEl.textContent = 'Fetching live rates...';

  try {
    // Fetch Gold (XAU) and Silver (XAG) in INR simultaneously
    const [goldRes, silverRes] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU/INR', { cache: 'no-store' }),
      fetch('https://api.gold-api.com/price/XAG/INR', { cache: 'no-store' })
    ]);

    if (!goldRes.ok || !silverRes.ok) {
      throw new Error(`API responded with status: Gold (${goldRes.status}), Silver (${silverRes.status})`);
    }

    const goldData = await goldRes.json();
    const silverData = await silverRes.json();

    // 1 Troy Ounce = 31.1034768 Grams
    const TROY_OUNCE_TO_GRAMS = 31.1034768;

    if (!goldData.price || !silverData.price) {
      throw new Error('Invalid price data received from Live Bullion API');
    }

    // Calculate rates per gram
    const rawGoldPerGram = goldData.price / TROY_OUNCE_TO_GRAMS;
    const rawSilverPerGram = silverData.price / TROY_OUNCE_TO_GRAMS;

    // 24K pure gold per gram
    const rate24k = Math.round(rawGoldPerGram);
    // 22K (916 BIS Hallmark) = 22/24th of 24K (91.67% purity)
    const rate22k = Math.round((rate24k * 22) / 24);
    // 18K gold = 18/24th of 24K (75% purity)
    const rate18k = Math.round((rate24k * 18) / 24);
    // 925 Pure Silver per gram
    const rateSilver = Math.round(rawSilverPerGram * 10) / 10;

    const newRates = {
      gold22k: rate22k,
      gold24k: rate24k,
      gold18k: rate18k,
      silver: rateSilver
    };

    saveRates(newRates, 'Live API');
    rateSyncStatus.isLive = true;

    if (userInitiated) {
      showToast(`Updated from Live Bullion API: 22K: ₹${rate22k.toLocaleString('en-IN')}/g, Silver: ₹${rateSilver}/g`);
    }
  } catch (error) {
    console.warn('Live rate fetch failed, maintaining cached/default rates:', error);
    rateSyncStatus.isLive = false;
    renderRatesTicker();

    if (userInitiated) {
      showToast('Could not reach Live API. Using latest cached rates.');
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
    showToast(`Removed from Shortlist: ${product.name}`);
  } else {
    if (product) {
      shortlist.push(product);
      showToast(`Added to Shortlist: ${product.name}`);
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

function renderShortlistDrawer() {
  const listContainer = document.getElementById('drawer-items-list');
  const summaryRow = document.getElementById('drawer-summary');
  const sendBtn = document.getElementById('btn-send-drawer-whatsapp');

  if (!listContainer) return;

  if (shortlist.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-shortlist-notice">
        <i class="ri-heart-line" style="font-size: 2.5rem; color: var(--gold-400); display: block; margin-bottom: 0.5rem;"></i>
        <p>Your inquiry tray is empty.</p>
        <span style="font-size: 0.78rem; color: var(--text-dim);">Tap the heart icon on any design to add it to your consultation list.</span>
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
          <p><strong>${item.sku}</strong> • Approx ${item.approxGrossWeight}g</p>
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
  if (countEl) countEl.textContent = `${shortlist.length} item(s)`;
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
                     (currentCategory === 'silver' && item.metal === 'silver');

    // Type match (Ready-Made vs Custom)
    const typeMatch = currentTypeFilter === 'all' || item.availability === currentTypeFilter;

    // Search query match
    const query = searchQuery.trim().toLowerCase();
    const searchMatch = !query || 
      item.name.toLowerCase().includes(query) ||
      item.teluguName.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.stoneDetails.toLowerCase().includes(query);

    return catMatch && typeMatch && searchMatch;
  });

  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} jewellery design${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
        <i class="ri-search-eye-line" style="font-size: 3rem; color: var(--gold-400); display: block; margin-bottom: 1rem;"></i>
        <h3 style="font-family: var(--font-royal); color: var(--gold-200); margin-bottom: 0.5rem;">No Designs Found</h3>
        <p>Try clearing your search query or selecting another jewellery category.</p>
        <button class="btn-outline-gold" style="margin-top: 1rem;" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const isShortlisted = shortlist.some(s => s.id === item.id);
    const availabilityBadgeClass = item.availability === 'ready' ? 'badge-ready' : 'badge-custom';
    const availabilityIcon = item.availability === 'ready' ? 'ri-checkbox-circle-fill' : 'ri-hammer-fill';

    return `
      <div class="product-card" id="card-${item.id}">
        <div class="card-image-wrap" onclick="openProductModal('${item.id}')">
          <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='assets/hero.jpg'">
          <div class="card-badges">
            <span class="badge-pill ${availabilityBadgeClass}">
              <i class="${availabilityIcon}"></i> ${item.availability === 'ready' ? 'Ready in Shop' : 'Handmade to Order'}
            </span>
            ${item.badge ? `<span class="badge-pill" style="background: rgba(10,5,7,0.85); color: var(--gold-300); border: 1px solid var(--border-gold);">${item.badge}</span>` : ''}
          </div>
          <span class="badge-sku">${item.sku}</span>
          <button class="btn-shortlist-heart ${isShortlisted ? 'active' : ''}" 
                  onclick="event.stopPropagation(); toggleShortlist('${item.id}')" 
                  title="${isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}">
            <i class="${isShortlisted ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
          </button>
        </div>

        <div class="card-body">
          <div class="card-meta-row">
            <span class="card-purity">${item.purity}</span>
            <span class="card-weight">Approx ${item.approxGrossWeight}g</span>
          </div>

          <h3 class="card-title" onclick="openProductModal('${item.id}')" style="cursor: pointer;">${item.name}</h3>
          <h4 class="card-telugu-name">${item.teluguName}</h4>

          <p class="card-specs-mini">
            <strong>Stones / Finish:</strong> ${item.stoneDetails}<br>
            <strong>Craftsmanship:</strong> ${item.availabilityText}
          </p>

          <div class="card-actions">
            <a href="${getWhatsAppProductUrl(item)}" target="_blank" class="btn-inquire-whatsapp">
              <i class="ri-whatsapp-line"></i> Inquire on WhatsApp
            </a>
            <button class="btn-view-details" onclick="openProductModal('${item.id}')" title="View Details">
              <i class="ri-eye-line"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  currentCategory = 'all';
  currentTypeFilter = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('search-catalog');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
  document.querySelectorAll('.chip-filter').forEach(c => c.classList.toggle('active', c.dataset.type === 'all'));

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
    `Namaste Sri Sai Krishna Jewellers (Etikoppaka), I am interested in this design. Kindly share today's price quotation based on today's bullion rate, making charges, and dispatch/walk-in availability. Thank you!`;

  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function sendAllShortlistWhatsApp() {
  if (shortlist.length === 0) {
    showToast('Your shortlist is empty!');
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
    `Please review these designs and let me know today's quotation, availability in your Etikoppaka shop, or timeframe for crafting. Thank you!`;

  const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/* ==========================================================================
   PRODUCT DETAILS MODAL
   ========================================================================== */
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

  if (imgEl) imgEl.src = product.image;
  if (purityEl) purityEl.textContent = product.purity;
  if (titleEl) titleEl.textContent = product.name;
  if (teluguEl) teluguEl.textContent = product.teluguName;
  if (descEl) descEl.textContent = product.description;
  if (skuEl) skuEl.textContent = product.sku;
  if (grossEl) grossEl.textContent = `${product.approxGrossWeight} grams`;
  if (netEl) netEl.textContent = `${product.approxNetWeight} grams`;
  if (stonesEl) stonesEl.textContent = product.stoneDetails;
  if (availEl) availEl.textContent = product.availabilityText;
  if (leadEl) leadEl.textContent = product.leadTime;

  if (whatsappBtn) {
    whatsappBtn.href = getWhatsAppProductUrl(product);
  }

  if (shortlistBtn) {
    const isSaved = shortlist.some(s => s.id === product.id);
    shortlistBtn.innerHTML = isSaved ? `<i class="ri-heart-fill"></i> In Shortlist Tray` : `<i class="ri-heart-line"></i> Add to Shortlist Tray`;
    shortlistBtn.onclick = () => {
      toggleShortlist(product.id);
      const nowSaved = shortlist.some(s => s.id === product.id);
      shortlistBtn.innerHTML = nowSaved ? `<i class="ri-heart-fill"></i> In Shortlist Tray` : `<i class="ri-heart-line"></i> Add to Shortlist Tray`;
    };
  }

  if (modal) modal.classList.add('open');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('open');
}

/* ==========================================================================
   CALCULATOR LOGIC
   ========================================================================== */
function setupCalculator() {
  const weightInput = document.getElementById('calc-weight');
  const metalSelect = document.getElementById('calc-metal');

  if (weightInput) {
    weightInput.addEventListener('input', updateCalculatorResult);
  }
  if (metalSelect) {
    metalSelect.addEventListener('change', updateCalculatorResult);
  }
  updateCalculatorResult();
}

function updateCalculatorResult() {
  const weightInput = document.getElementById('calc-weight');
  const metalSelect = document.getElementById('calc-metal');
  const resultEl = document.getElementById('calc-result');

  if (!weightInput || !metalSelect || !resultEl) return;

  const weight = parseFloat(weightInput.value) || 0;
  const metalType = metalSelect.value;
  let rate = 0;

  switch (metalType) {
    case '22k':
      rate = currentRates.gold22k;
      break;
    case '24k':
      rate = currentRates.gold24k;
      break;
    case '18k':
      rate = currentRates.gold18k;
      break;
    case 'silver':
      rate = currentRates.silver;
      break;
  }

  const estimatedValue = Math.round(weight * rate);
  resultEl.textContent = `₹${estimatedValue.toLocaleString('en-IN')}`;
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
    showToast('Please fill in your name, contact number, and target weight.');
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
  showToast('Opening WhatsApp to send your custom design request!');
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
   EVENT LISTENERS & MODALS
   ========================================================================== */
function setupEventListeners() {
  // Category buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderProducts();
    });
  });

  // Type filter chips (Ready-Made vs Custom)
  document.querySelectorAll('.chip-filter').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-filter').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTypeFilter = chip.dataset.type;
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
  const drawer = document.getElementById('shortlist-drawer');
  const backdrop = document.getElementById('shortlist-backdrop');

  openDrawerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    });
  });

  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', () => {
      if (drawer) drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      if (drawer) drawer.classList.remove('open');
      backdrop.classList.remove('open');
    });
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

  // Rate Edit Modal
  const editRateBtn = document.getElementById('btn-edit-rates');
  const rateModal = document.getElementById('rate-edit-modal');
  const closeRateModalBtn = document.getElementById('btn-close-rate-modal');
  const rateForm = document.getElementById('rate-edit-form');
  const refreshRatesBtn = document.getElementById('btn-refresh-rates');
  const modalFetchLiveBtn = document.getElementById('btn-modal-fetch-live');
  const mobileMenuBtn = document.getElementById('btn-mobile-menu');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
      mobileMenuBtn.innerHTML = `<i class="${isOpen ? 'ri-close-line' : 'ri-menu-line'}"></i>`;
    });
    navLinks.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      mobileMenuBtn.innerHTML = '<i class="ri-menu-line"></i>';
    });
  }

  if (refreshRatesBtn) {
    refreshRatesBtn.addEventListener('click', () => {
      fetchLiveBullionRates(true);
    });
  }

  if (modalFetchLiveBtn) {
    modalFetchLiveBtn.addEventListener('click', async () => {
      await fetchLiveBullionRates(true);
      document.getElementById('input-rate-22k').value = currentRates.gold22k;
      document.getElementById('input-rate-24k').value = currentRates.gold24k;
      document.getElementById('input-rate-18k').value = currentRates.gold18k;
      document.getElementById('input-rate-silver').value = currentRates.silver;
    });
  }

  if (editRateBtn && rateModal) {
    editRateBtn.addEventListener('click', () => {
      if (!sessionStorage.getItem('ssk_admin_token')) {
        document.getElementById('admin-login-modal')?.classList.add('open');
        return;
      }
      document.getElementById('input-rate-22k').value = currentRates.gold22k;
      document.getElementById('input-rate-24k').value = currentRates.gold24k;
      document.getElementById('input-rate-18k').value = currentRates.gold18k;
      document.getElementById('input-rate-silver').value = currentRates.silver;
      rateModal.classList.add('open');
    });
  }

  if (closeRateModalBtn && rateModal) {
    closeRateModalBtn.addEventListener('click', () => {
      rateModal.classList.remove('open');
    });
  }

  if (rateForm) {
    rateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        gold22k: parseFloat(document.getElementById('input-rate-22k').value) || currentRates.gold22k,
        gold24k: parseFloat(document.getElementById('input-rate-24k').value) || currentRates.gold24k,
        gold18k: parseFloat(document.getElementById('input-rate-18k').value) || currentRates.gold18k,
        silver: parseFloat(document.getElementById('input-rate-silver').value) || currentRates.silver
      };
      saveRates(updated, 'Manual Showroom');
      showToast('Showroom rates saved and updated across catalog!');
      rateModal.classList.remove('open');
    });
  }
}

function setupAdminAccess() {
  const loginModal = document.getElementById('admin-login-modal');
  const openButton = document.getElementById('btn-admin-login');
  const closeButton = document.getElementById('btn-close-admin-login');
  const loginForm = document.getElementById('admin-login-form');
  const errorEl = document.getElementById('admin-login-error');
  const rateEditButton = document.getElementById('btn-edit-rates');

  if (!loginModal || !openButton || !loginForm) return;

  const closeLogin = () => loginModal.classList.remove('open');
  openButton.addEventListener('click', () => loginModal.classList.add('open'));
  closeButton?.addEventListener('click', closeLogin);
  loginModal.addEventListener('click', event => {
    if (event.target === loginModal) closeLogin();
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    errorEl.textContent = '';
    const formData = new FormData(loginForm);

    if (!API_BASE_URL) {
      errorEl.textContent = 'Admin API is not connected yet. Deploy the Spring Boot service to enable sign in.';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.get('username'), password: formData.get('password') })
      });
      if (!response.ok) throw new Error('Invalid credentials');
      const data = await response.json();
      sessionStorage.setItem('ssk_admin_token', data.token);
      closeLogin();
      rateEditButton?.click();
      showToast('Admin access granted for this session.');
    } catch (error) {
      errorEl.textContent = 'Sign in failed. Check your credentials and try again.';
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
