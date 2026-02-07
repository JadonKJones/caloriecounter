export const MACRO_SPLITS = {
  balanced: { name: 'Balanced (40/30/30)', p: 0.30, c: 0.40, f: 0.30 },
  highProtein: { name: 'High Protein (35/45/20)', p: 0.45, c: 0.35, f: 0.20 },
  keto: { name: 'Keto (5/25/70)', p: 0.25, c: 0.05, f: 0.70 },
  lowFat: { name: 'Low Fat (50/25/25)', p: 0.25, c: 0.50, f: 0.25 }
};

export const calculateGramsFromCals = (splitKey, calories) => {
  const s = MACRO_SPLITS[splitKey];
  return {
    protein: Math.round((calories * s.p) / 4),
    carbs: Math.round((calories * s.c) / 4),
    fat: Math.round((calories * s.f) / 9)
  };
};

export const calculateServing = (val100g, servingSize) => {
  if (!val100g) return 0;
  return Math.round((val100g * (servingSize || 100)) / 100);
};