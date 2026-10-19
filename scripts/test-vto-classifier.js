const fs = require('fs');
const path = require('path');

// Read app.js and products.js
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const productsJs = fs.readFileSync(path.join(__dirname, '..', 'products.js'), 'utf8');

// Evaluate in sandbox
const sandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  console: console
};

// Extract autoClassifyTryOn and helper functions from app.js
const vm = require('vm');
const context = vm.createContext(sandbox);

vm.runInContext(productsJs, context);
vm.runInContext(appJs, context);

vm.runInContext('var PRODUCTS_DATA_EXPORT = PRODUCTS_DATA; var autoClassifyExport = autoClassifyTryOn;', context);

const autoClassifyTryOn = context.autoClassifyExport;
const PRODUCTS_DATA = context.PRODUCTS_DATA_EXPORT;

console.log('--- TESTING AUTO-CLASSIFIER ---');

const testCases = [
  {
    input: { name: 'Antique 22K Peacock Buttalu', category: 'gold-bridal', metal: 'gold' },
    expectedType: 'EARRINGS',
    expectedEnabled: true
  },
  {
    input: { name: 'Burmese Ruby Guttapusalu Choker', category: 'gold-bridal', metal: 'gold' },
    expectedType: 'CHOKER',
    expectedEnabled: true
  },
  {
    input: { name: 'Bridal Temple Kasu Mala Haram', category: 'gold-bridal', metal: 'gold' },
    expectedType: 'NECKLACE',
    expectedEnabled: true
  },
  {
    input: { name: 'Kemp Stone Papidi Billa', category: 'gold-bridal', metal: 'gold' },
    expectedType: 'MAANG_TIKKA',
    expectedEnabled: true
  },
  {
    input: { name: 'Pure 24K Gold Coin 8g', category: 'gold-coins', metal: 'gold' },
    expectedEnabled: false
  },
  {
    input: { name: 'Silver Kamakshi Deepam', category: 'silver-pooja', metal: 'silver' },
    expectedEnabled: false
  },
  {
    input: { name: 'Royal Grand Bridal Set', category: 'gold-bridal', metal: 'gold' },
    expectedType: 'NECKLACE',
    expectedEnabled: true
  },
  {
    input: { name: '22K Antique Nakshi Peacock Bangles', category: 'gold-bridal', metal: 'gold' },
    expectedType: 'BANGLES',
    expectedEnabled: true
  },
  {
    input: { name: '22K Diamond Solitaire Ring', category: 'gold-daily', metal: 'gold' },
    expectedType: 'RING',
    expectedEnabled: true
  },
  {
    input: { name: 'Heritage Temple Ashtalakshmi Vaddanam', category: 'gold-bridal', metal: 'gold' },
    expectedType: 'VADDANAM',
    expectedEnabled: true
  }
];

let allPassed = true;
testCases.forEach((tc, idx) => {
  const result = autoClassifyTryOn(tc.input);
  const enabledMatch = result.enabled === tc.expectedEnabled;
  const typeMatch = !tc.expectedType || result.type === tc.expectedType;
  if (enabledMatch && typeMatch) {
    console.log(`[PASS] Case ${idx + 1}: "${tc.input.name}" -> Type: ${result.type}, Enabled: ${result.enabled}`);
  } else {
    console.error(`[FAIL] Case ${idx + 1}: "${tc.input.name}" -> Expected Type: ${tc.expectedType}, Enabled: ${tc.expectedEnabled}, Got:`, result);
    allPassed = false;
  }
});

console.log('\n--- TESTING PRODUCTS_DATA CATALOGUE ---');
console.log(`Total showcase products: ${PRODUCTS_DATA.length}`);
PRODUCTS_DATA.forEach(p => {
  console.log(`- ${p.sku} (${p.name.slice(0, 35)}...): TryOn=${p.tryOn?.enabled} Type=${p.tryOn?.type}`);
});

if (allPassed) {
  console.log('\n>>> ALL AUTO-CLASSIFIER TESTS PASSED SUCCESSFULLY! <<<');
} else {
  process.exit(1);
}
