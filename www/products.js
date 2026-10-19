// Sri Sai Krishna Jewellers - Product Showcase Catalog
// Location: Etikoppaka | Phone / WhatsApp: +91 9573199344

/* ==========================================================================
   AUTOMATIC VIRTUAL TRY-ON (VTO) CLASSIFICATION & ANATOMICAL MAPPING
   ========================================================================== */
function getDefaultTryOnAsset(type) {
  switch (type) {
    case 'EARRINGS': return 'assets/tryon/peacock_jhumka.svg';
    case 'CHOKER': return 'assets/tryon/guttapusalu_choker.svg';
    case 'MAANG_TIKKA': return 'assets/tryon/maang_tikka.svg';
    case 'BANGLES': return 'assets/tryon/peacock_kada_single_transparent.png';
    case 'RING': return 'assets/tryon/diamond_ring.svg';
    case 'VADDANAM': return 'assets/tryon/kasu_mala_pendant.svg';
    case 'ANKLETS': return 'assets/tryon/kasu_mala_pendant.svg';
    case 'NECKLACE':
    default: return 'assets/tryon/kasu_mala_pendant.svg';
  }
}

function getDefaultTryOnScale(type) {
  switch (type) {
    case 'EARRINGS': return 0.22;
    case 'CHOKER': return 1.15;
    case 'MAANG_TIKKA': return 0.24;
    case 'BANGLES': return 0.70;
    case 'RING': return 0.35;
    case 'VADDANAM': return 1.85;
    case 'ANKLETS': return 0.70;
    case 'NECKLACE':
    default: return 1.35;
  }
}

function getDefaultTryOnOffsetY(type) {
  switch (type) {
    case 'EARRINGS': return 0;
    case 'CHOKER': return 0;
    case 'MAANG_TIKKA': return 0;
    case 'BANGLES': return 0;
    case 'RING': return 0;
    case 'VADDANAM': return 40;
    case 'ANKLETS': return 0;
    case 'NECKLACE':
    default: return 0;
  }
}

function autoClassifyTryOn(product) {
  if (!product) return null;

  // Preserve existing explicit configuration if already present and valid
  if (product.tryOn && product.tryOn.type && product.tryOn.enabled !== undefined) {
    if (!product.tryOn.asset) {
      product.tryOn.asset = getDefaultTryOnAsset(product.tryOn.type);
    }
    return product.tryOn;
  }

  // Convert flat backend database fields if present
  if (product.tryOnEnabled !== undefined && product.tryOnType) {
    return {
      enabled: Boolean(product.tryOnEnabled),
      type: product.tryOnType,
      asset: product.tryOnAsset || getDefaultTryOnAsset(product.tryOnType),
      fallbackAsset: getDefaultTryOnAsset(product.tryOnType),
      earringAsset: (product.tryOnType === 'CHOKER' || product.tryOnType === 'NECKLACE') ? 'assets/tryon/peacock_jhumka.svg' : undefined,
      scale: product.tryOnScale || getDefaultTryOnScale(product.tryOnType),
      offsetY: product.tryOnOffsetY || getDefaultTryOnOffsetY(product.tryOnType),
      label: product.name
    };
  }

  const name = (product.name || '').toLowerCase();
  const telugu = (product.teluguName || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const stones = (product.stoneDetails || '').toLowerCase();
  const text = `${name} ${telugu} ${cat} ${desc} ${stones}`;

  // Exclude non-wearables like silver pooja articles or bullion gold coins
  if (cat === 'silver-pooja' || cat === 'gold-coins' ||
      /coin|coins|bullion|bar|bars|ginni|biscuit|deepam|kalasam|panchapatra|harathi|plate|diya|murti|idol|frame|samai|kumkum/i.test(name)) {
    return {
      enabled: false,
      type: 'NONE',
      label: 'Not Wearable'
    };
  }

  // 1. Bangles / Kadas / Bracelets / Kangan / Gajulu (Wrists)
  if (/bangle|bangles|kada|kadas|bracelet|bracelets|kangan|valayal|gajulu|గాజులు|కంకణం|కడియం/i.test(text)) {
    return {
      enabled: true,
      type: 'BANGLES',
      asset: 'assets/tryon/peacock_kada_single_transparent.png',
      fallbackAsset: 'assets/tryon/peacock_kada_single_transparent.png',
      scale: 0.70,
      offsetY: 0,
      label: product.name || 'Nakshi Bangles (Wrists)'
    };
  }

  // 2. Rings / Solitaires / Vungaram (Fingers)
  if (/ring|rings|vungaram|anguthi|solitaire|finger ring|ఉంగరం|వేలి/i.test(text)) {
    return {
      enabled: true,
      type: 'RING',
      asset: 'assets/tryon/diamond_ring.svg',
      fallbackAsset: 'assets/tryon/diamond_ring.svg',
      scale: 0.35,
      offsetY: 0,
      label: product.name || 'Precious Ring (Fingers)'
    };
  }

  // 3. Vaddanam / Waist Belt / Kamarbandh / Oddiyanam (Waist)
  if (/vaddanam|vaddanamu|waist belt|waistbelt|kamarbandh|oddiyanam|వడ్డాణం|ఒడ్డాణం/i.test(text)) {
    return {
      enabled: true,
      type: 'VADDANAM',
      asset: 'assets/tryon/kasu_mala_pendant.svg',
      fallbackAsset: 'assets/tryon/kasu_mala_pendant.svg',
      scale: 1.85,
      offsetY: 40,
      label: product.name || 'Heritage Vaddanam (Waist)'
    };
  }

  // 4. Anklets / Payal / Pattilu / Golusu (Ankles)
  if (/anklet|anklets|pattilu|payal|golusu|పట్టీలు|గజ్జెలు/i.test(text)) {
    return {
      enabled: true,
      type: 'ANKLETS',
      asset: 'assets/tryon/kasu_mala_pendant.svg',
      fallbackAsset: 'assets/tryon/kasu_mala_pendant.svg',
      scale: 0.70,
      offsetY: 0,
      label: product.name || 'Bridal Pattilu (Anklets)'
    };
  }

  // 5. Earrings / Buttalu / Jhumkas / Studs (Earlobes)
  if (/earring|earrings|jhumka|jhumkas|jhumki|buttalu|butta|stud|studs|kammalu|బుట్టలు|కమ్మలు|జుంకాలు/i.test(text)) {
    return {
      enabled: true,
      type: 'EARRINGS',
      asset: 'assets/tryon/peacock_jhumka.svg',
      fallbackAsset: 'assets/tryon/peacock_jhumka.svg',
      scale: 0.22,
      offsetY: 0,
      label: product.name || 'Temple Buttalu'
    };
  }

  // 6. Maang Tikka / Papidi Billa / Nethi Chutti (Forehead)
  if (/tikka|maang tikka|papidi billa|billa|chutti|పాపిడి బిళ్ళ|టిక్కా/i.test(text)) {
    return {
      enabled: true,
      type: 'MAANG_TIKKA',
      asset: 'assets/tryon/maang_tikka.svg',
      fallbackAsset: 'assets/tryon/maang_tikka.svg',
      scale: 0.24,
      offsetY: 0,
      label: product.name || 'Papidi Billa'
    };
  }

  // 7. Choker (Snug on Neck)
  if (/choker|chokers|hasli|guluband|చోకర్/i.test(text)) {
    return {
      enabled: true,
      type: 'CHOKER',
      asset: 'assets/tryon/guttapusalu_choker.svg',
      fallbackAsset: 'assets/tryon/guttapusalu_choker.svg',
      earringAsset: 'assets/tryon/peacock_jhumka.svg',
      scale: 1.18,
      offsetY: 0,
      label: product.name || 'Guttapusalu Choker'
    };
  }

  // 8. Necklaces / Harams / Mangalsutra (Chest)
  if (/necklace|haram|mala|chain|mangalsutra|nallapusalu|pendant|హారం|మాల|గొలుసు|నల్లపూసలు/i.test(text) || cat === 'gold-bridal' || cat === 'gold-daily') {
    return {
      enabled: true,
      type: 'NECKLACE',
      asset: 'assets/tryon/kasu_mala_pendant.svg',
      fallbackAsset: 'assets/tryon/kasu_mala_pendant.svg',
      earringAsset: 'assets/tryon/peacock_jhumka.svg',
      scale: 1.38,
      offsetY: 0,
      label: product.name || 'Bridal Long Haram'
    };
  }

  return {
    enabled: true,
    type: 'NECKLACE',
    asset: 'assets/tryon/kasu_mala_pendant.svg',
    fallbackAsset: 'assets/tryon/kasu_mala_pendant.svg',
    earringAsset: 'assets/tryon/peacock_jhumka.svg',
    scale: 1.38,
    offsetY: 0,
    label: product.name || 'Jewellery Try-On'
  };
}

if (typeof window !== 'undefined') {
  window.autoClassifyTryOn = autoClassifyTryOn;
  window.getDefaultTryOnAsset = getDefaultTryOnAsset;
  window.getDefaultTryOnScale = getDefaultTryOnScale;
  window.getDefaultTryOnOffsetY = getDefaultTryOnOffsetY;
}
if (typeof globalThis !== 'undefined') {
  globalThis.autoClassifyTryOn = autoClassifyTryOn;
}

const PRODUCTS_DATA = [
  {
    id: "ssk-gld-101",
    sku: "SSK-GLD-101",
    name: "22K Traditional Lakshmi Kasu Mala Long Haram",
    teluguName: "శ్రీ లక్ష్మీ కాసుల పేరు (లాంగ్ హారం)",
    category: "gold-bridal",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 48.5,
    approxNetWeight: 48.5,
    stoneDetails: "Kemp Rubies & Natural Emeralds",
    availability: "ready", // ready or custom
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in / Same Day Dispatch",
    badge: "Bestseller",
    image: "assets/kasu_mala.jpg",
    instagramReelUrl: "https://www.instagram.com/reel/DbBpkA7NEjb/",
    instagramEmbedId: "DbBpkA7NEjb",
    instagramHandle: "@sri_sai_krishna_jewellers",
    description: "Handcrafted masterwork featuring Lakshmi stamped gold coins (Kasu) interlinked with kemp stones, culminating in an opulent Nakshi Lakshmi peacock pendant with pearl drops.",
    featured: true,
    model3dUrl: "assets/models/lakshmi-kasu-necklace.glb",
    model3dStatus: "COMPLETED",
    is3dPublished: true,
    tryOn: {
      enabled: true,
      type: "NECKLACE",
      asset: "assets/tryon/kasu_mala_pendant.svg",
      earringAsset: "assets/tryon/peacock_jhumka.svg",
      scale: 1.4,
      offsetY: 45,
      label: "Kasu Mala Haram & Buttalu"
    }
  },
  {
    id: "ssk-gld-102",
    sku: "SSK-GLD-102",
    name: "22K Antique Nakshi Peacock Bangles (Kadas) Pair",
    teluguName: "నక్షి మయూర బంగారు గాజులు (జత)",
    category: "gold-bridal",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 42.0,
    approxNetWeight: 39.5,
    stoneDetails: "Burmese Cut Rubies & Seed Pearls",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in / Express Delivery",
    badge: "916 Hallmarked",
    image: "assets/gold_bangles.jpg",
    description: "Royal South Indian Nakshi work bangles with dancing peacock motifs, handset with glowing rubies and side-screw closure for a comfortable, regal fit.",
    featured: true,
    tryOn: {
      enabled: true,
      type: "BANGLES",
      asset: "assets/tryon/peacock_kada_single_transparent.png",
      fallbackAsset: "assets/tryon/peacock_kada_single_transparent.png",
      scale: 0.70,
      offsetY: 0,
      label: "Peacock Nakshi Bangles (Wrists)"
    }
  },
  {
    id: "ssk-gld-103",
    sku: "SSK-GLD-103",
    name: "22K Royal Guttapusalu Choker & Jhumka Bridal Set",
    teluguName: "రాయల్ గుత్తపూసల చోకర్ మరియు జుంకాల సెట్",
    category: "gold-bridal",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 56.2,
    approxNetWeight: 47.0,
    stoneDetails: "Basara Quality Rice Pearls, Rubies & Emerald",
    availability: "custom",
    availabilityText: "Made to order",
    leadTime: "7 - 10 Days Crafting Time",
    badge: "Artisan Handmade",
    image: "assets/hero.jpg",
    description: "Traditional coastal Andhra heritage Guttapusalu choker adorned with bunches of fine rice pearls, cabochon rubies, and emerald centerpiece with matching grand jhumkas.",
    featured: true,
    tryOn: {
      enabled: true,
      type: "CHOKER",
      asset: "assets/tryon/guttapusalu_choker.svg",
      earringAsset: "assets/tryon/peacock_jhumka.svg",
      scale: 1.15,
      offsetY: 0,
      label: "Guttapusalu Choker & Jhumkas"
    }
  },
  {
    id: "ssk-slv-201",
    sku: "SSK-SLV-201",
    name: "Pure 925 Silver Kamakshi Deepam & Kalasham Pooja Set",
    teluguName: "వెండి కామాక్షి దీపాలు & పూర్ణ కలశం పూజా సెట్",
    category: "silver-pooja",
    metal: "silver",
    purity: "Pure 925 Sterling Silver",
    approxGrossWeight: 320.0,
    approxNetWeight: 320.0,
    stoneDetails: "Plain Engraved Pure Silver",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in Available",
    badge: "Pooja Special",
    image: "assets/silver_pooja.jpg",
    description: "Sacred handcrafted pair of peacock Kamakshi oil lamps (diyas) accompanied by an embossed floral Kalasham and pooja spoon, ideal for Varalakshmi Vratham and housewarmings.",
    featured: true,
    tryOn: {
      enabled: false,
      type: "NONE",
      label: "Pooja Article"
    }
  },
  {
    id: "ssk-gld-104",
    sku: "SSK-GLD-104",
    name: "22K Antique Heritage Temple Vaddanam (Waist Belt)",
    teluguName: "సంప్రదాయ దేవాలయ నక్షి వడ్డాణం",
    category: "gold-bridal",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 92.5,
    approxNetWeight: 88.0,
    stoneDetails: "Kemp Stones, Polki & Natural Pearls",
    availability: "custom",
    availabilityText: "Made to order",
    leadTime: "12 - 15 Days Custom Crafting",
    badge: "Heritage Masterpiece",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    description: "A show-stopping bridal Vaddanam sculpted with Ashtalakshmi figurines, flanked by peacocks and floral scrolls. Adjustable gold waist belt for an impeccable bridal silhouette.",
    featured: false,
    tryOn: {
      enabled: true,
      type: "VADDANAM",
      asset: "assets/tryon/kasu_mala_pendant.svg",
      scale: 1.85,
      offsetY: 40,
      label: "Heritage Temple Vaddanam (Waist)"
    }
  },
  {
    id: "ssk-gld-105",
    sku: "SSK-GLD-105",
    name: "22K Antique Temple Peacock Buttalu / Jhumkas",
    teluguName: "నెమలి నక్షి బుట్టలు / జుంకాలు",
    category: "gold-daily",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 18.6,
    approxNetWeight: 17.2,
    stoneDetails: "Kemp Rubies & Gold Beaded Drops",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in Available",
    badge: "916 Hallmarked",
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    description: "Classic South Indian umbrella jhumkas with filigree bell work, topped with an embossed peacock stud. Perfectly weighted for comfort during wedding celebrations.",
    featured: true,
    tryOn: {
      enabled: true,
      type: "EARRINGS",
      asset: "assets/tryon/peacock_jhumka.svg",
      scale: 0.22,
      offsetY: 10,
      label: "Peacock Buttalu / Jhumkas"
    }
  },
  {
    id: "ssk-gld-106",
    sku: "SSK-GLD-106",
    name: "22K Traditional Nallapusalu (Black Beads) Mangalsutra Haram",
    teluguName: "సంప్రదాయ 22 క్యారెట్ నల్లపూసల గొలుసు",
    category: "gold-daily",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 16.5,
    approxNetWeight: 14.8,
    stoneDetails: "High-grade Black Spinel Beads & Rubies",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in / Customized Length in 2 Days",
    badge: "Auspicious",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
    description: "Double strand pure black beads chain handcrafted with 22K gold wire wrapping and an elegant floral Lakshmi pendant. Lightweight and durable for everyday wear.",
    featured: false,
    tryOn: {
      enabled: true,
      type: "NECKLACE",
      asset: "assets/tryon/kasu_mala_pendant.svg",
      earringAsset: "assets/tryon/peacock_jhumka.svg",
      scale: 1.35,
      offsetY: 40,
      label: "Nallapusalu Mangalsutra"
    }
  },
  {
    id: "ssk-gld-107",
    sku: "SSK-GLD-107",
    name: "22K Men's Solid Royal Cuban / Rope Chain",
    teluguName: "పురుషుల దృఢమైన రాయల్ బంగారు గొలుసు",
    category: "gold-daily",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 28.4,
    approxNetWeight: 28.4,
    stoneDetails: "Solid 22K Gold (No Stones)",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in Available",
    badge: "Solid 916 Gold",
    image: "https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80",
    description: "Durable, high-sheen 22K yellow gold men's chain with reinforced lobster clasp. Machine-cut precision interlinked with hand-finished polish.",
    featured: false,
    tryOn: {
      enabled: true,
      type: "NECKLACE",
      asset: "assets/tryon/kasu_mala_pendant.svg",
      scale: 1.25,
      offsetY: 35,
      label: "Men's Royal Chain"
    }
  },
  {
    id: "ssk-coin-301",
    sku: "SSK-COIN-301",
    name: "24K (999) Pure Gold Sri Lakshmi & Ganesha Coin (8g / 4g)",
    teluguName: "24 క్యారెట్ (999) శ్రీ లక్ష్మీ & వినాయక బంగారు కాయిన్",
    category: "gold-coins",
    metal: "gold",
    purity: "24K (999 Pure Gold)",
    approxGrossWeight: 8.0,
    approxNetWeight: 8.0,
    stoneDetails: "Tamper-proof Assay Certified Blister Pack",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in (Available in 1g, 2g, 4g, 8g)",
    badge: "999 Purity",
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
    description: "Certified 999 fineness 24 Karat gold coin embossed with Goddess Lakshmi and Lord Ganesha. Perfect for Diwali, Akshaya Tritiya, and wedding gifting.",
    featured: false,
    tryOn: {
      enabled: false,
      type: "NONE",
      label: "Bullion Coin"
    }
  },
  {
    id: "ssk-slv-202",
    sku: "SSK-SLV-202",
    name: "925 Pure Silver Bridal Pattilu (Payal / Anklets)",
    teluguName: "స్వచ్ఛమైన వెండి వధువు పట్టీలు (గజ్జెలు)",
    category: "silver-jewellery",
    metal: "silver",
    purity: "925 Sterling Silver",
    approxGrossWeight: 78.0,
    approxNetWeight: 78.0,
    stoneDetails: "Silver Ghungroo Bells & Mina Work",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in Available",
    badge: "92.5 Certified",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    description: "Heavy traditional silver bridal anklets with resonant melodic chiming bells, antique oxidized detailing, and smooth interlocking links.",
    featured: true,
    tryOn: {
      enabled: true,
      type: "ANKLETS",
      asset: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
      scale: 0.70,
      offsetY: 0,
      label: "925 Silver Bridal Pattilu (Anklets)"
    }
  },
  {
    id: "ssk-slv-203",
    sku: "SSK-SLV-203",
    name: "Handcrafted Pure Silver Mayuri Kumkum Bharani & Plate",
    teluguName: "చేతితో చేసిన వెండి నెమలి కుంకుమ భరిణె",
    category: "silver-pooja",
    metal: "silver",
    purity: "Pure 925 Silver",
    approxGrossWeight: 45.0,
    approxNetWeight: 45.0,
    stoneDetails: "Peacock Engraved Pure Silver",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in Available",
    badge: "Traditional Gift",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    description: "Auspicious pure silver peacock crest kumkum holder with an engraved matching base plate. Cherished wedding and festive gift.",
    featured: false,
    tryOn: {
      enabled: false,
      type: "NONE",
      label: "Pooja Article"
    }
  },
  {
    id: "ssk-gld-108",
    sku: "SSK-GLD-108",
    name: "22K Custom Handcrafted Muvvala Haram (Mango Mala)",
    teluguName: "హ్యాండ్‌మేడ్ మామిడి పిందెల హారం (మావిడి కాయ మాల)",
    category: "gold-bridal",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 52.0,
    approxNetWeight: 49.0,
    stoneDetails: "Natural Kemp Stones & Gold Balls",
    availability: "custom",
    availabilityText: "Made to order",
    leadTime: "8 - 12 Days Custom Crafting",
    badge: "Custom Order",
    image: "https://images.unsplash.com/photo-1611591475152-4c83136ab5b6?auto=format&fit=crop&w=800&q=80",
    description: "Timeless South Indian Mango Mala featuring intricately stamped mango paisleys strung with kemp rubies and dangling golden muvvalu (bells). Made to order to your desired weight.",
    featured: false,
    tryOn: {
      enabled: true,
      type: "NECKLACE",
      asset: "assets/tryon/kasu_mala_pendant.svg",
      earringAsset: "assets/tryon/peacock_jhumka.svg",
      scale: 1.45,
      offsetY: 45,
      label: "Mango Mala Haram"
    }
  },
  {
    id: "ssk-gld-109",
    sku: "SSK-GLD-109",
    name: "22K Traditional Temple Papidi Billa / Maang Tikka",
    teluguName: "సంప్రదాయ దేవాలయ పాపిడి బిళ్ళ (మాంగ్ టిక్కా)",
    category: "gold-bridal",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 14.5,
    approxNetWeight: 13.8,
    stoneDetails: "Kemp Rubies, Emerald & Natural Seed Pearls",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in Available",
    badge: "Bridal Special",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    description: "Exquisite South Indian bridal Papidi Billa adorned with kemp rubies, cabochon emerald centerpiece, and hanging Basara pearl bunches for an auspicious wedding radiance.",
    featured: true,
    tryOn: {
      enabled: true,
      type: "MAANG_TIKKA",
      asset: "assets/tryon/maang_tikka.svg",
      scale: 0.24,
      offsetY: -5,
      label: "Temple Papidi Billa"
    }
  },
  {
    id: "ssk-gld-110",
    sku: "SSK-GLD-110",
    name: "22K Traditional Navaratna & Solitaire Temple Ring",
    teluguName: "సంప్రదాయ నవరత్న & సాలిటైర్ దేవాలయ ఉంగరం",
    category: "gold-bridal",
    metal: "gold",
    purity: "22K (916 BIS Hallmark)",
    approxGrossWeight: 8.5,
    approxNetWeight: 7.8,
    stoneDetails: "Certified Navaratna Gems & American Diamond",
    availability: "ready",
    availabilityText: "Available in shop",
    leadTime: "Instant Walk-in Available / Sizing in 1 Hr",
    badge: "Navaratna",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    description: "Royal 22K yellow gold finger ring embellished with auspicious nine planetary gemstones (Navaratna) encircling a brilliant solitaire crown. Hand-crafted to grace fingers with positive energy and divine elegance.",
    featured: true,
    tryOn: {
      enabled: true,
      type: "RING",
      asset: "assets/tryon/diamond_ring.svg",
      scale: 0.35,
      offsetY: 0,
      label: "Navaratna Ring (Fingers)"
    }
  }
];

// Default Bullion Rates (Shop owner can update daily in UI or here)
const DEFAULT_RATES = {
  gold22k: 13675, // Rs per gram for 22K 916
  gold24k: 14918, // Rs per gram for 24K pure fine gold (matching Visakhapatnam Groww rate)
  gold18k: 11189, // Rs per gram for 18K (750 hallmark)
  silver: 245     // Rs per gram for pure 925/999 Silver
};

// Store Information
const STORE_CONFIG = {
  name: "SRI SAI KRISHNA JEWELLERS",
  teluguName: "శ్రీ సాయి కృష్ణ జ్యువెలర్స్",
  tagline: "Heritage Craftsmanship & Timeless Purity",
  location: "Etikoppaka, Andhra Pradesh",
  phoneDisplay: "+91 9573199344",
  phoneRaw: "9573199344",
  whatsappNumber: "919573199344",
  timings: "9:00 AM - 9:00 PM (All Days Open)",
  address: "Sai Baba Gudi Center, Etikoppaka, Andhra Pradesh - 531082",
  instagramUrl: "https://www.instagram.com/sri_sai_krishna_jewellers/",
  instagramHandle: "@sri_sai_krishna_jewellers"
};

// ==========================================================================
// OFFICIAL INSTAGRAM REELS & VIDEO SHOWCASE CATALOGUE
// Account: https://www.instagram.com/sri_sai_krishna_jewellers/
// ==========================================================================
const DEFAULT_REELS_DATA = [
  {
    id: "reel-DbBpkA7NEjb",
    shortcode: "DbBpkA7NEjb",
    title: "22K Pure 916 Hallmark Bridal Showcase (@sri_sai_krishna_jewellers)",
    teluguTitle: "శ్రీ సాయి కృష్ణ జ్యువెలర్స్ ప్రత్యక్ష రీల్ (DbBpkA7NEjb) • 916 హాల్‌మార్క్ ఆభరణాలు",
    category: "bridal",
    instagramUrl: "https://www.instagram.com/reel/DbBpkA7NEjb/?stkn=MW02cGg2ZHRhajV2Mg==",
    instagramReelUrl: "https://www.instagram.com/reel/DbBpkA7NEjb/",
    instagramEmbedUrl: "https://www.instagram.com/reel/DbBpkA7NEjb/embed/",
    views: "58.4K",
    likes: "7.1K",
    isOfficialAccountReel: true,
    productId: "ssk-gld-101",
    productName: "22K Traditional Lakshmi Kasu Mala Long Haram",
    caption: "Official reel from @sri_sai_krishna_jewellers featuring 100% 22K 916 BIS hallmarked heritage bridal jewellery handcrafted by master karigars in Etikoppaka."
  }
];

function getMergedReels() {
  let custom = [];
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('ssk_custom_reels');
      if (stored) custom = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Error reading custom reels from storage', e);
  }
  const map = new Map();
  DEFAULT_REELS_DATA.forEach(r => map.set(r.shortcode || r.id, r));
  if (Array.isArray(custom)) {
    custom.forEach(r => map.set(r.shortcode || r.id, r));
  }
  return Array.from(map.values());
}

const REELS_DATA = getMergedReels();

// Helper: check if a product has an Instagram video/reel linked
function hasProductVideo(product) {
  if (!product) return false;
  return Boolean(product.instagramEmbedId || (product.instagramReelUrl && product.instagramReelUrl.includes('/reel/')));
}

// Safeguard: Ensure all catalogue products have tryOn configured with transparent vector assets
if (Array.isArray(PRODUCTS_DATA)) {
  PRODUCTS_DATA.forEach(p => {
    if (!p.tryOn && typeof autoClassifyTryOn === 'function') {
      p.tryOn = autoClassifyTryOn(p);
    }
    if (p.tryOn && p.tryOn.enabled && !p.tryOn.asset && typeof getDefaultTryOnAsset === 'function') {
      p.tryOn.asset = getDefaultTryOnAsset(p.tryOn.type);
    }
  });
}

if (typeof window !== 'undefined') {
  window.PRODUCTS_DATA = PRODUCTS_DATA;
  window.REELS_DATA = REELS_DATA;
  window.DEFAULT_REELS_DATA = DEFAULT_REELS_DATA;
  window.getMergedReels = getMergedReels;
  window.DEFAULT_RATES = DEFAULT_RATES;
  window.STORE_CONFIG = STORE_CONFIG;
  window.hasProductVideo = hasProductVideo;
}
if (typeof globalThis !== 'undefined') {
  globalThis.PRODUCTS_DATA = PRODUCTS_DATA;
  globalThis.REELS_DATA = REELS_DATA;
  globalThis.DEFAULT_REELS_DATA = DEFAULT_REELS_DATA;
  globalThis.getMergedReels = getMergedReels;
  globalThis.DEFAULT_RATES = DEFAULT_RATES;
  globalThis.STORE_CONFIG = STORE_CONFIG;
  globalThis.hasProductVideo = hasProductVideo;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRODUCTS_DATA,
    REELS_DATA,
    DEFAULT_REELS_DATA,
    getMergedReels,
    DEFAULT_RATES,
    STORE_CONFIG,
    hasProductVideo,
    autoClassifyTryOn,
    getDefaultTryOnAsset,
    getDefaultTryOnScale,
    getDefaultTryOnOffsetY
  };
}
