// عميل بسيط للتواصل مع API الداخلي. يضيف مفتاح الأدمن تلقائيًا للطلبات المحمية
// عند توفره في localStorage (يُخزَّن بعد تسجيل دخول الأدمن).

function adminHeaders() {
  if (typeof window === "undefined") return {};
  const key = window.localStorage?.getItem("adminKey");
  return key ? { "x-admin-key": key } : {};
}

async function handle(res) {
  if (!res?.ok) {
    let msg = "حدث خطأ";
    try {
      const j = await res?.json();
      msg = j?.error || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  return res?.json();
}

export const api = {
  getCategories: () => fetch("/api/categories")?.then(handle),
  createCategory: (data) =>
    fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(data) })?.then(handle),
  updateCategory: (id, data) =>
    fetch(`/api/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(data) })?.then(handle),
  deleteCategory: (id) =>
    fetch(`/api/categories/${id}`, { method: "DELETE", headers: adminHeaders() })?.then(handle),

  getProducts: () => fetch("/api/products")?.then(handle),
  createProduct: (data) =>
    fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(data) })?.then(handle),
  updateProduct: (id, data) =>
    fetch(`/api/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(data) })?.then(handle),
  deleteProduct: (id) =>
    fetch(`/api/products/${id}`, { method: "DELETE", headers: adminHeaders() })?.then(handle),

  getPaymentMethods: () => fetch("/api/payment-methods")?.then(handle),
  createPaymentMethod: (data) =>
    fetch("/api/payment-methods", { method: "POST", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(data) })?.then(handle),
  updatePaymentMethod: (id, data) =>
    fetch(`/api/payment-methods/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(data) })?.then(handle),
  deletePaymentMethod: (id) =>
    fetch(`/api/payment-methods/${id}`, { method: "DELETE", headers: adminHeaders() })?.then(handle),

  getOrders: () => fetch("/api/orders", { headers: adminHeaders() })?.then(handle),
  createOrder: (data) =>
    fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })?.then(handle),
  updateOrderStatus: (id, status) =>
    fetch(`/api/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify({ status }) })?.then(handle),

  getSettings: () => fetch("/api/settings")?.then(handle),
  updateSettings: (data) =>
    fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json", ...adminHeaders() }, body: JSON.stringify(data) })?.then(handle),

  recalculatePricing: () =>
    fetch("/api/pricing/recalculate", { method: "POST", headers: adminHeaders() })?.then(handle),
};

export function setAdminKey(key) {
  window.localStorage?.setItem("adminKey", key);
}
export function clearAdminKey() {
  window.localStorage?.removeItem("adminKey");
}
export function hasAdminKey() {
  if (typeof window === "undefined") return false;
  return !!window.localStorage?.getItem("adminKey");
}

export function computeSouthPriceClient(sanaaPrice, settings, categoryMarginPercent = 0) {
  const base = Number(sanaaPrice) || 0;
  const raw = base * (Number(settings?.southMultiplier) || 1);
  const commission = (base / 1000) * (Number(settings?.southCommissionPer1000) || 0);
  const withCommission = raw + commission;
  const withGlobalMargin = withCommission * (1 + (Number(settings?.southMargin) || 0) / 100);
  const withCategoryMargin = withGlobalMargin * (1 + (Number(categoryMarginPercent) || 0) / 100);
  const step = Number(settings?.roundStep) || 50;
  return Math.round(withCategoryMargin / step) * step;
}

export function fmt(n) {
  return new Intl.NumberFormat("ar-YE")?.format(Math.round(Number(n) || 0));
}
