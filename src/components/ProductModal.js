"use client";
import { useState } from "react";
import { api, fmt, computeSouthPriceClient } from "@/lib/apiClient";

function packagePrice(pkg, region, settings, categoryMargin) {
  if (region === "sanaa") return Number(pkg?.sanaaPrice) || 0;
  if (pkg?.pricingMode === "manual") return Number(pkg?.southPrice) || 0;
  return computeSouthPriceClient(pkg?.sanaaPrice, settings, categoryMargin);
}

export default function ProductModal({ product, region, setRegion, settings, paymentMethods, onClose }) {
  const categoryMargin = product?.category?.marginPercent || 0;
  const [pkgId, setPkgId] = useState(product?.packages?.[0]?.id || null);
  const [form, setForm] = useState({ customerName: "", phone: "", playerId: "" });
  const [methodId, setMethodId] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(null);

  const pkg = product?.packages?.find((p) => p?.id === pkgId);
  const price = pkg ? packagePrice(pkg, region, settings, categoryMargin) : 0;
  const availableMethods = paymentMethods?.filter((m) => m?.active && (m?.region === "both" || m?.region === region));
  const selectedMethod = availableMethods?.find((m) => m?.id === methodId);

  const canSubmit =
    form?.customerName && form?.phone && pkg && methodId && (!selectedMethod?.requiresReference || transferRef);

  const submit = async () => {
    setErr("");
    setSubmitting(true);
    try {
      const order = await api?.createOrder({
        customerName: form?.customerName,
        phone: form?.phone,
        playerId: form?.playerId,
        productName: product?.name,
        productImage: product?.image || "",
        packageName: pkg?.name,
        region: region === "sanaa" ? "صنعاء" : "الجنوب",
        price,
        paymentMethodId: methodId,
        transferReference: transferRef,
      });
      const wa = settings?.whatsappNumber || "772764659";
      const msg = `🛒 طلب جديد%0A%0A🎮 المنتج: ${product?.name}%0A📦 الباقة: ${pkg?.name}%0A💰 السعر: ${fmt(price)} ريال%0A📍 المنطقة: ${order?.region}%0A💳 وسيلة الدفع: ${selectedMethod?.name || ""}${transferRef ? `%0A🧾 رقم الحوالة: ${transferRef}` : ""}%0A👤 اسم العميل: ${form?.customerName}%0A📱 رقم العميل: ${form?.phone}%0A🆔 ID اللاعب: ${form?.playerId || "—"}`;
      setPlaced(`https://wa.me/${wa}?text=${msg}`);
    } catch (e) {
      setErr(e?.message || "تعذر إنشاء الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
          <h3 className="font-semibold">{product?.name}</h3>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>
        <div className="p-5">
          {placed ? (
            <div className="text-center py-6">
              <p className="font-semibold mb-1">تم إنشاء طلبك بنجاح</p>
              <p className="text-xs text-muted mb-5">أكمل التأكيد عبر واتساب</p>
              <a href={placed} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-[#0B2C1A] font-semibold px-5 py-2.5 rounded-lg text-sm">
                إرسال عبر واتساب
              </a>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <div className="w-full aspect-square rounded-xl border border-border mb-3 bg-bg flex items-center justify-center overflow-hidden">
                  {product?.image ? <img src={product?.image} className="w-full h-full object-cover" /> : <span className="text-[#4A5570] text-xs">لا توجد صورة</span>}
                </div>
                {product?.description && <p className="text-xs text-muted leading-relaxed">{product?.description}</p>}
              </div>
              <div>
                <div className="flex bg-bg border border-border rounded-full p-1 mb-3 w-fit">
                  {[{ id: "sanaa", label: "صنعاء" }, { id: "south", label: "الجنوب" }]?.map((r) => (
                    <button key={r?.id} onClick={() => setRegion(r?.id)} className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${region === r?.id ? "bg-teal text-bg" : "text-muted"}`}>
                      {r?.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5 mb-4 max-h-36 overflow-y-auto">
                  {(product?.packages || [])?.map((pk) => (
                    <button key={pk?.id} onClick={() => setPkgId(pk?.id)} className={`w-full flex items-center justify-between text-right px-3 py-2 rounded-lg border text-sm transition-colors ${pkgId === pk?.id ? "border-gold bg-gold/10" : "border-border bg-bg"}`}>
                      <span>{pk?.name}</span>
                      <span className="text-teal font-bold">{fmt(packagePrice(pk, region, settings, categoryMargin))} ريال</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <input placeholder="اسم العميل" value={form?.customerName} onChange={(e) => setForm({ ...form, customerName: e?.target?.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                  <input placeholder="رقم الهاتف" value={form?.phone} onChange={(e) => setForm({ ...form, phone: e?.target?.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                  <input placeholder="معرّف اللاعب (اختياري)" value={form?.playerId} onChange={(e) => setForm({ ...form, playerId: e?.target?.value })} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />

                  <select value={methodId} onChange={(e) => setMethodId(e?.target?.value)} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
                    <option value="">اختر وسيلة الدفع</option>
                    {availableMethods?.map((m) => <option key={m?.id} value={m?.id}>{m?.name} — {m?.accountNumber}</option>)}
                  </select>

                  {selectedMethod?.requiresReference && (
                    <input placeholder="رقم الحوالة بعد التحويل" value={transferRef} onChange={(e) => setTransferRef(e?.target?.value)} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
                  )}

                  {err && <p className="text-xs text-danger">{err}</p>}
                  <button disabled={!canSubmit || submitting} onClick={submit} className="w-full bg-gold text-bg font-medium px-3.5 py-2.5 rounded-lg text-sm disabled:opacity-50">
                    {submitting ? "جاري إنشاء الطلب..." : `اطلب الآن — ${fmt(price)} ريال`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
