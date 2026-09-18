export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://ssk-jewellers-api.onrender.com').replace(/\/$/, '');
export const assetUrl = path => path.startsWith('http') ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
export const money = value => `₹${Number(value).toLocaleString('en-IN')}`;
export const whatsappUrl = message => `https://wa.me/919573199344?text=${encodeURIComponent(message)}`;
