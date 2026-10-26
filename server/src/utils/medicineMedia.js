const CATEGORY_COLORS = {
  'Pain Relief': '0369a1',
  Antibiotic: '7c3aed',
  Gastro: '059669',
  Allergy: 'd97706',
  Diabetes: 'dc2626',
  Cardiac: 'be123c',
  Nutrition: '0891b2',
  Hydration: '0284c7',
  Respiratory: '4f46e5',
  General: '475569',
};

function shortLabel(name) {
  const words = String(name || 'Med')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'Med';
  if (words.length === 1) return words[0].slice(0, 8);
  return (words[0].slice(0, 4) + words[1].slice(0, 4)).slice(0, 10);
}

function resolveMedicineImageUrl(medicine) {
  const stored = medicine?.imageUrl && String(medicine.imageUrl).trim();
  if (stored) return stored;

  const category = medicine?.category || 'General';
  const bg = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
  const text = encodeURIComponent(shortLabel(medicine?.name));
  return `https://placehold.co/160x160/${bg}/ffffff/png?text=${text}&font=roboto`;
}

module.exports = { resolveMedicineImageUrl, shortLabel };
