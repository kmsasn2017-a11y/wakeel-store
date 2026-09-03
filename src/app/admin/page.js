"use client";
import { useEffect, useState } from "react";
import { api, fmt, setAdminKey, clearAdminKey, hasAdminKey, computeSouthPriceClient } from "@/lib/apiClient";

const STATUS_LABELS = { new: "جديد", reviewing: "قيد المراجعة", paid: "تم الدفع", processing: "قيد التنفيذ", completed: "مكتمل", cancelled: "ملغي" };

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAuthed(hasAdminKey());
    setChecked(true);
  }, []);

  if (!checked) return null;
  return authed ? <AdminApp onLogout={() => { clearAdminKey(); setAuthed(false); }} /> : <Login onSuccess={() => setAuthed(true)} />;
}

function Login({ onSuccess }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr(false);
    setAdminKey(pass);
    try {
      // نتحقق من صحة المفتاح بمحاولة تعديل بسيطة على الإعدادات (GET لا يتطلب مفتاحًا، لذلك نستخدم نداءً محميًا)
      await api.updateSettings(await api.getSettings());
      onSuccess();
    } catch (e) {
      clearAdminKey();
      setErr(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <h2 className="font-bold text-lg mb-1">دخول لوحة التحكم</h2>
      <p className="text-xs text-muted mb-5">أدخل كلمة مرور الأدمن المحددة في متغيرات البيئة (ADMIN_PASSWORD)</p>
      <input type="password" placeholder="كلمة المرور" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-center mb-3 outline-none focus:border-gold" />
      {err && <p className="text-xs text-danger mb-3">كلمة المرور غير صحيحة</p>}
      <button disabled={busy} onClick={submit} className="w-full bg-gold text-bg font-medium px-3.5 py-2 rounded-lg text-sm disabled:opacity-50">
        {busy ? "..." : "دخول"}
      </button>
    </div>
  );
}

function AdminApp({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const reloadAll = () => {
    setLoading(true);
    Promise.all([api.getCategories(), api.getProducts(), api.getPaymentMethods(), api.getOrders(), api.getSettings()])
      .then(([c, p, pm, o, s]) => { setCategories(c); setProducts(p); setPaymentMethods(pm); setOrders(o); setSettings(s); })
      .finally(() => setLoading(false));
  };
  useEffect(reloadAll, []);

  const tabs = [
    { id: "dashboard", label: "الرئيسية" },
    { id: "products", label: "المنتجات" },
    { id: "categories", label: "التصنيفات" },
    { id: "pricing", label: "إعدادات الأسعار" },
    { id: "orders", label: "الطلبات" },
    { id: "payments", label: "وسائل الدفع" },
  ];

  if (loading || !settings) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row gap-5">
      <div className="sm:w-48 shrink-0">
        <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 text-xs font-medium px-3 py-2 rounded-lg text-right transition-colors ${tab === t.id ? "bg-gold text-bg" : "text-muted hover:bg-surface"}`}>
              {t.label}
            </button>
          ))}
          <button onClick={onLogout} className="shrink-0 text-xs font-medium px-3 py-2 rounded-lg text-danger hover:bg-surface">خروج</button>
          <a href="/" className="shrink-0 text-xs font-medium px-3 py-2 rounded-lg text-muted hover:bg-surface">عرض المتجر</a>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {tab === "dashboard" && <Dashboard products={products} orders={orders} />}
        {tab === "products" && <Products products={products} categories={categories} settings={settings} reload={reloadAll} />}
        {tab === "categories" && <Categories categories={categories} products={products} reload={reloadAll} />}
        {tab === "pricing" && <Pricing settings={settings} products={products} reload={reloadAll} />}
        {tab === "orders" && <Orders orders={orders} reload={reloadAll} />}
        {tab === "payments" && <Payments paymentMethods={paymentMethods} reload={reloadAll} />}
      </div>
    </div>
  );
}

function SaveBadge({ status }) {
  if (!status) return null;
  const map = { saving: ["جاري الحفظ...", "#D4A64A"], saved: ["تم الحفظ بنجاح", "#3EC6B0"], error: ["فشل الحفظ", "#E15A5A"] };
  const [text, color] = map[status] || [];
  if (!text) return null;
  return <span className="text-xs px-2.5 py-1 rounded-full" style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}40` }}>{text}</span>;
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-xl font-extrabold" style={{ color: color || "#EDEEF2" }}>{value}</div>
    </div>
  );
}

function Dashboard({ products, orders }) {
  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const totalSales = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.price, 0);
  return (
    <div>
      <h2 className="font-bold text-lg mb-4">نظرة عامة</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="إجمالي الطلبات" value={orders.length} />
        <StatCard label="طلبات اليوم" value={ordersToday.length} color="#3EC6B0" />
        <StatCard label="قيد التنفيذ" value={orders.filter((o) => o.status === "processing").length} color="#B383F0" />
        <StatCard label="مكتملة" value={orders.filter((o) => o.status === "completed").length} color="#4CC97C" />
        <StatCard label="إجمالي المنتجات" value={products.length} />
        <StatCard label="إجمالي المبيعات" value={fmt(totalSales) + " ريال"} color="#D4A64A" />
      </div>
    </div>
  );
}

/* ---- Products ---- */
function emptyProduct(categories) {
  return { name: "", description: "", image: "", categoryId: categories[0]?.id || "", active: true, featured: false, isNew: false, packages: [] };
}
function emptyPackage() {
  return { id: "new_" + Math.random().toString(36).slice(2), isNewRow: true, name: "", sanaaPrice: 0, southPrice: 0, pricingMode: "auto" };
}

function Products({ products, categories, settings, reload }) {
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [query, setQuery] = useState("");

  const filtered = products.filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase()));

  const save = async (p) => {
    setStatus("saving");
    try {
      if (p.id) await api.updateProduct(p.id, p);
      else await api.createProduct(p);
      setStatus("saved");
      setEditing(null);
      reload();
      setTimeout(() => setStatus(null), 1800);
    } catch (e) {
      setStatus("error");
    }
  };
  const remove = async (p) => {
    await api.deleteProduct(p.id);
    setConfirmDelete(null);
    reload();
  };
  const duplicate = async (p) => {
    await api.createProduct({
      ...p,
      name: p.name + " (نسخة)",
      categoryId: p.categoryId,
      packages: p.packages.map((pk) => ({ ...pk, isNewRow: true })),
    });
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="font-bold text-lg">المنتجات</h2>
        <SaveBadge status={status} />
        <button onClick={() => setEditing(emptyProduct(categories))} className="bg-gold text-bg text-sm font-medium px-3.5 py-2 rounded-lg">+ إضافة منتج</button>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث..." className="bg-surface border border-border rounded-lg px-3 py-2 text-sm mb-4 max-w-sm w-full outline-none focus:border-gold" />

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{p.name} {!p.active && <span className="text-[10px] text-danger">(معطل)</span>}</div>
              <div className="text-[11px] text-muted">{p.packages?.length || 0} باقة · {p.category?.name || "بدون تصنيف"}</div>
            </div>
            <button onClick={() => setEditing(p)} className="text-xs text-muted hover:text-gold">تعديل</button>
            <button onClick={() => duplicate(p)} className="text-xs text-muted hover:text-teal">نسخ</button>
            <button onClick={() => setConfirmDelete(p)} className="text-xs text-muted hover:text-danger">حذف</button>
          </div>
        ))}
      </div>

      {editing && <ProductEditor product={editing} categories={categories} settings={settings} onSave={save} onClose={() => setEditing(null)} />}
      {confirmDelete && (
        <Confirm title="حذف المنتج" body={`هل تريد حذف "${confirmDelete.name}"؟`} onConfirm={() => remove(confirmDelete)} onCancel={() => setConfirmDelete(null)} danger />
      )}
    </div>
  );
}

function ProductEditor({ product, categories, settings, onSave, onClose }) {
  const [p, setP] = useState({ ...product, packages: product.packages || [] });
  const set = (patch) => setP({ ...p, ...patch });
  const setPkg = (id, patch) => set({ packages: p.packages.map((pk) => (pk.id === id ? { ...pk, ...patch } : pk)) });
  const addPkg = () => set({ packages: [...p.packages, emptyPackage()] });
  const removePkg = (id) => set({ packages: p.packages.filter((pk) => pk.id !== id) });
  const category = categories.find((c) => c.id === p.categoryId);
  const categoryMargin = category?.marginPercent || 0;

  const pkgErrors = p.packages.filter((pk) => !pk.name?.trim() || Number(pk.sanaaPrice) <= 0 || (pk.pricingMode === "manual" && Number(pk.southPrice) <= 0));
  const canSave = p.name?.trim() && p.packages.length > 0 && pkgErrors.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
          <h3 className="font-semibold">{product.id ? "تعديل منتج" : "إضافة منتج"}</h3>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="اسم المنتج" value={p.name} onChange={(e) => set({ name: e.target.value })} className="bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
            <select value={p.categoryId || ""} onChange={(e) => set({ categoryId: e.target.value })} className="bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
              <option value="">اختر تصنيف</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.marginPercent ? ` (+${c.marginPercent}%)` : ""}</option>)}
            </select>
          </div>
          <textarea placeholder="الوصف" rows={2} value={p.description} onChange={(e) => set({ description: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
          <input placeholder="رابط الصورة (URL)" value={p.image} onChange={(e) => set({ image: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={p.active} onChange={(e) => set({ active: e.target.checked })} /> نشط</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={p.featured} onChange={(e) => set({ featured: e.target.checked })} /> مميز</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={p.isNew} onChange={(e) => set({ isNew: e.target.checked })} /> جديد</label>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">الباقات</h4>
              <button onClick={addPkg} className="text-xs bg-surface2 px-3 py-1.5 rounded-lg">+ باقة</button>
            </div>
            <div className="space-y-2">
              {p.packages.map((pk) => (
                <div key={pk.id} className="bg-bg border border-border rounded-lg p-3">
                  <div className="flex gap-2 mb-2">
                    <input placeholder="اسم الباقة" value={pk.name} onChange={(e) => setPkg(pk.id, { name: e.target.value })} className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                    <button onClick={() => removePkg(pk.id)} className="text-danger text-xs px-2">حذف</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-muted mb-1">سعر صنعاء</label>
                      <input type="number" value={pk.sanaaPrice} onChange={(e) => setPkg(pk.id, { sanaaPrice: e.target.value })} className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">النوع</label>
                      <select value={pk.pricingMode} onChange={(e) => setPkg(pk.id, { pricingMode: e.target.value })} className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gold">
                        <option value="auto">تلقائي</option>
                        <option value="manual">يدوي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">سعر الجنوب</label>
                      {pk.pricingMode === "manual" ? (
                        <input type="number" value={pk.southPrice} onChange={(e) => setPkg(pk.id, { southPrice: e.target.value })} className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gold" />
                      ) : (
                        <div className="px-2 py-1.5 rounded-lg bg-surface2 text-sm text-teal font-semibold">{fmt(computeSouthPriceClient(pk.sanaaPrice, settings, categoryMargin))}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {pkgErrors.length > 0 && <p className="text-xs text-danger">تأكد أن لكل باقة اسمًا وسعر صنعاء أكبر من صفر</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="text-sm px-3.5 py-2 rounded-lg border border-border text-muted">إلغاء</button>
            <button disabled={!canSave} onClick={() => onSave(p)} className="text-sm px-3.5 py-2 rounded-lg bg-gold text-bg disabled:opacity-50">حفظ</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Categories ---- */
function Categories({ categories, products, reload }) {
  const [draft, setDraft] = useState("");
  const [draftMargin, setDraftMargin] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const add = async () => {
    if (!draft.trim()) return;
    await api.createCategory({ name: draft.trim(), active: true, sortOrder: categories.length + 1, marginPercent: Number(draftMargin) || 0 });
    setDraft(""); setDraftMargin(0);
    reload();
  };
  const update = async (c, patch) => { await api.updateCategory(c.id, { ...c, ...patch }); reload(); };
  const remove = async (c) => { await api.deleteCategory(c.id); setConfirmDelete(null); reload(); };
  const inUse = (c) => products.some((p) => p.categoryId === c.id);

  return (
    <div>
      <h2 className="font-bold text-lg mb-4">التصنيفات</h2>
      <p className="text-xs text-muted mb-3">هامش الربح الخاص بالتصنيف يُضاف فوق هامش الجنوب العام (مثال: تطبيقات = 20%)</p>
      <div className="flex gap-2 mb-4 max-w-lg">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="اسم تصنيف جديد" className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
        <input type="number" value={draftMargin} onChange={(e) => setDraftMargin(e.target.value)} placeholder="هامش %" className="w-24 bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
        <button onClick={add} className="bg-gold text-bg text-sm font-medium px-3.5 py-2 rounded-lg">إضافة</button>
      </div>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3">
            <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && update(c, { name: e.target.value })} className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
            <div className="flex items-center gap-1 text-xs text-muted">
              <input type="number" defaultValue={c.marginPercent} onBlur={(e) => Number(e.target.value) !== c.marginPercent && update(c, { marginPercent: Number(e.target.value) })} className="w-16 bg-bg border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-gold" />
              %
            </div>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={c.active} onChange={(e) => update(c, { active: e.target.checked })} /> نشط</label>
            <button onClick={() => setConfirmDelete(c)} className="text-danger text-xs">حذف</button>
          </div>
        ))}
      </div>
      {confirmDelete && (
        <Confirm
          title="حذف التصنيف"
          body={inUse(confirmDelete) ? `تحذير: توجد منتجات مرتبطة بـ"${confirmDelete.name}". حذفه سيجعلها بدون تصنيف. متابعة؟` : `هل تريد حذف "${confirmDelete.name}"؟`}
          onConfirm={() => remove(confirmDelete)} onCancel={() => setConfirmDelete(null)} danger
        />
      )}
    </div>
  );
}

/* ---- Pricing ---- */
function Pricing({ settings, products, reload }) {
  const [s, setS] = useState(settings);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [confirmRecalc, setConfirmRecalc] = useState(false);
  const [recalcResult, setRecalcResult] = useState(null);

  const autoCount = products.reduce((n, p) => n + (p.packages || []).filter((pk) => pk.pricingMode !== "manual").length, 0);

  const save = async () => {
    setStatus("saving"); setError("");
    try {
      const updated = await api.updateSettings(s);
      setS(updated);
      setStatus("saved");
      setTimeout(() => setStatus(null), 1800);
    } catch (e) {
      setStatus("error");
      setError(e.message);
    }
  };
  const recalc = async () => {
    const r = await api.recalculatePricing();
    setConfirmRecalc(false);
    setRecalcResult(r);
    reload();
    setTimeout(() => setRecalcResult(null), 6000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">إعدادات الأسعار</h2>
        <SaveBadge status={status} />
      </div>
      {recalcResult && (
        <div className="text-sm bg-teal/10 border border-teal/40 text-teal rounded-lg px-3 py-2.5 mb-3 max-w-lg">
          تم تحديث أسعار الجنوب بنجاح — تم تحديث {recalcResult.updatedCount} باقة، المعامل المستخدم: {recalcResult.multiplier}
        </div>
      )}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-4 max-w-lg">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.autoPricingEnabled} onChange={(e) => setS({ ...s, autoPricingEnabled: e.target.checked })} /> تفعيل التسعير التلقائي لأسعار الجنوب</label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="معامل الجنوب" hint="سعر الجنوب = سعر صنعاء × المعامل">
            <input type="number" step="0.01" value={s.southMultiplier} onChange={(e) => setS({ ...s, southMultiplier: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
          </Field>
          <Field label="عمولة إضافية (ريال لكل 1,000 من صنعاء)" hint="تُضاف بعد الضرب بالمعامل — مثال: 1,000×3 + 250 = 3,250">
            <input type="number" value={s.southCommissionPer1000} onChange={(e) => setS({ ...s, southCommissionPer1000: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
          </Field>
          <Field label="التقريب إلى">
            <select value={s.roundStep} onChange={(e) => setS({ ...s, roundStep: Number(e.target.value) })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
              {[50, 100, 500, 1000].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="هامش ربح صنعاء %">
            <input type="number" value={s.sanaaMargin} onChange={(e) => setS({ ...s, sanaaMargin: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
          </Field>
          <Field label="هامش ربح الجنوب %">
            <input type="number" value={s.southMargin} onChange={(e) => setS({ ...s, southMargin: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
          </Field>
          <Field label="رقم واتساب الطلبات">
            <input value={s.whatsappNumber} onChange={(e) => setS({ ...s, whatsappNumber: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
          </Field>
        </div>
        <div className="text-xs text-muted bg-bg border border-border rounded-lg px-3 py-2">
          مثال: سعر صنعاء 1,500 × معامل {s.southMultiplier} = <span className="text-teal font-semibold">{fmt(computeSouthPriceClient(1500, s))}</span> ريال (بعد الهامش والتقريب)
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={save} className="bg-gold text-bg text-sm font-medium px-3.5 py-2 rounded-lg">حفظ الإعدادات</button>
          <button onClick={() => setConfirmRecalc(true)} className="bg-surface2 text-sm font-medium px-3.5 py-2 rounded-lg">إعادة حساب أسعار الجنوب</button>
        </div>
      </div>
      {confirmRecalc && (
        <Confirm
          title="إعادة حساب أسعار الجنوب"
          body={`سيتم تحديث أسعار الجنوب لكل الباقات التلقائية (${autoCount} باقة) بالمعامل الحالي (${s.southMultiplier}). سيتم أخذ نسخة احتياطية تلقائيًا قبل التنفيذ. الباقات اليدوية لن تتغير. متابعة؟`}
          onConfirm={recalc} onCancel={() => setConfirmRecalc(false)}
        />
      )}
    </div>
  );
}
function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-[#5C6580] mt-1">{hint}</span>}
    </label>
  );
}

/* ---- Orders ---- */
function Orders({ orders, reload }) {
  const setStatus = async (o, status) => { await api.updateOrderStatus(o.id, status); reload(); };
  return (
    <div>
      <h2 className="font-bold text-lg mb-4">الطلبات</h2>
      {orders.length === 0 ? <Empty text="لا توجد طلبات بعد" /> : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="bg-surface border border-border rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="text-sm font-semibold">{o.productName} — {o.packageName}</div>
                <select value={o.status} onChange={(e) => setStatus(o, e.target.value)} className="bg-bg border border-border rounded-lg px-2 py-1 text-xs outline-none">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-muted">
                <span>العميل: {o.customerName}</span>
                <span>الهاتف: {o.phone}</span>
                <span>المنطقة: {o.region}</span>
                <span>الدفع: {o.paymentMethodName || "—"}</span>
                {o.transferReference && <span>رقم الحوالة: {o.transferReference}</span>}
                <span className="text-teal font-semibold">{fmt(o.price)} ريال</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Payments ---- */
function emptyMethod() { return { name: "", type: "بنك", accountNumber: "", accountHolder: "", region: "both", active: true, requiresReference: true }; }
function Payments({ paymentMethods, reload }) {
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const save = async (m) => { if (m.id) await api.updatePaymentMethod(m.id, m); else await api.createPaymentMethod(m); setEditing(null); reload(); };
  const remove = async (m) => { await api.deletePaymentMethod(m.id); setConfirmDelete(null); reload(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">وسائل الدفع</h2>
        <button onClick={() => setEditing(emptyMethod())} className="bg-gold text-bg text-sm font-medium px-3.5 py-2 rounded-lg">+ إضافة وسيلة</button>
      </div>
      <div className="space-y-2">
        {paymentMethods.map((m) => (
          <div key={m.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{m.name} <span className="text-[11px] text-muted">({m.type})</span></div>
              <div className="text-[11px] text-muted">{m.accountHolder} · {m.accountNumber}</div>
            </div>
            <button onClick={() => setEditing(m)} className="text-xs text-muted hover:text-gold">تعديل</button>
            <button onClick={() => setConfirmDelete(m)} className="text-xs text-muted hover:text-danger">حذف</button>
          </div>
        ))}
      </div>
      {editing && <PaymentForm method={editing} onSave={save} onCancel={() => setEditing(null)} />}
      {confirmDelete && <Confirm title="حذف وسيلة الدفع" body={`هل تريد حذف "${confirmDelete.name}"؟`} onConfirm={() => remove(confirmDelete)} onCancel={() => setConfirmDelete(null)} danger />}
    </div>
  );
}
function PaymentForm({ method, onSave, onCancel }) {
  const [m, setM] = useState(method);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 space-y-3">
        <h3 className="font-semibold mb-2">{method.id ? "تعديل وسيلة دفع" : "إضافة وسيلة دفع"}</h3>
        <input placeholder="اسم الوسيلة" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
        <select value={m.type} onChange={(e) => setM({ ...m, type: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
          <option>بنك</option><option>محفظة إلكترونية</option><option>تحويل</option>
        </select>
        <input placeholder="اسم صاحب الحساب" value={m.accountHolder} onChange={(e) => setM({ ...m, accountHolder: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
        <input placeholder="رقم الحساب" value={m.accountNumber} onChange={(e) => setM({ ...m, accountNumber: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
        <select value={m.region} onChange={(e) => setM({ ...m, region: e.target.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
          <option value="both">الكل</option><option value="sanaa">صنعاء</option><option value="south">الجنوب</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={m.active} onChange={(e) => setM({ ...m, active: e.target.checked })} /> نشط</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={m.requiresReference} onChange={(e) => setM({ ...m, requiresReference: e.target.checked })} /> يتطلب رقم حوالة عند الطلب</label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="text-sm px-3.5 py-2 rounded-lg border border-border text-muted">إلغاء</button>
          <button disabled={!m.name} onClick={() => onSave(m)} className="text-sm px-3.5 py-2 rounded-lg bg-gold text-bg disabled:opacity-50">حفظ</button>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }) { return <div className="text-center py-14 text-[#5C6580] text-sm border border-dashed border-border rounded-xl">{text}</div>; }
function Confirm({ title, body, onConfirm, onCancel, danger }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-5">
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted mb-5">{body}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="text-sm px-3.5 py-2 rounded-lg border border-border text-muted">إلغاء</button>
          <button onClick={onConfirm} className={`text-sm px-3.5 py-2 rounded-lg ${danger ? "bg-danger/10 text-danger border border-danger/40" : "bg-gold text-bg"}`}>تأكيد</button>
        </div>
      </div>
    </div>
  );
}
