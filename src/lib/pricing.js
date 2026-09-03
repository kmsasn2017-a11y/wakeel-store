// نفس معادلة التسعير المتفق عليها:
// southPrice = sanaaPrice * southMultiplier
// ثم يُطبَّق هامش الجنوب العام، ثم هامش التصنيف (مثال: تطبيقات = 20%)، ثم التقريب.

export function roundToStep(value, step) {
  if (!step) return Math.round(value);
  return Math.round(value / step) * step;
}

export function computeSouthPrice(sanaaPrice, settings, categoryMarginPercent = 0) {
  const base = Number(sanaaPrice) || 0;
  const raw = base * (Number(settings.southMultiplier) || 1);
  // عمولة إضافية ثابتة لكل 1,000 ريال من سعر صنعاء (قابلة للتعديل من لوحة التحكم)
  const commission = (base / 1000) * (Number(settings.southCommissionPer1000) || 0);
  const withCommission = raw + commission;
  const withGlobalMargin = withCommission * (1 + (Number(settings.southMargin) || 0) / 100);
  const withCategoryMargin = withGlobalMargin * (1 + (Number(categoryMarginPercent) || 0) / 100);
  return roundToStep(withCategoryMargin, Number(settings.roundStep) || 50);
}

export function computeSanaaPrice(sanaaPrice, settings, categoryMarginPercent = 0) {
  const base = Number(sanaaPrice) || 0;
  const withGlobalMargin = base * (1 + (Number(settings.sanaaMargin) || 0) / 100);
  const withCategoryMargin = withGlobalMargin * (1 + (Number(categoryMarginPercent) || 0) / 100);
  return roundToStep(withCategoryMargin, Number(settings.roundStep) || 50);
}
