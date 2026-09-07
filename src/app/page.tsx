"use client";
import { useEffect, useState } from "react";
import { api, fmt, computeSouthPriceClient } from "@/lib/apiClient";
import ProductModal from "@/components/ProductModal";

function packagePrice(pkg, region, settings, categoryMargin) {
  if (region === "sanaa") return Number(pkg.sanaaPrice) || 0;
  if (pkg.pricingMode === "manual") return Number(pkg.southPrice) || 0;
  return computeSouthPriceClient(pkg.sanaaPrice, settings, categoryMargin);
}
function fromPrice(product, region, settings) {
  const pkgs = product.packages || [];
  if (!pkgs.length) return 0;
  const margin = product.category?.marginPercent || 0;
  return Math.min(...pkgs.map((pk) => packagePrice(pk, region, settings, margin)));
}

const WHATSAPP_NUMBER = "967772764659";

export default function StorePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("sanaa");
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");
  const [openProduct, setOpenProduct] = useState(null);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getProducts(), api.getPaymentMethods(), api.getSettings()])
      .then(([c, p, pm, s]) => {
        setCategories(c);
        setProducts(p);
        setPaymentMethods(pm);
        setSettings(s);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.active);
  const filtered = activeProducts.filter((p) => {
    const matchCat = activeCat === "all" || p.categoryId === activeCat;
    const matchQuery = !query || p.name.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });
  const featured = activeProducts.filter((p) => p.featured);
  const activeCategories = categories.filter((c) => c.active);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <TopBar />

      <div className="relative overflow-hidden rounded-2xl mt-5 mb-6 p-6 sm:p-10 bg-gradient-to-br from-[#1B2440] via-[#182036] to-[#0F1424] border border-border">
        <span className="inline-block text-[10px] font-bold px-3 py-1 rounded-full bg-gold text-bg mb-3">
          وكيل جوجل الرسمي
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-2">
          اشحن ألعابك وتطبيقاتك <span className="text-gold">بثقة وسرعة</span>
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-md mb-5">
          أسعار واضحة لصنعاء والجنوب، وتسليم فوري لكل الباقات.
        </p>
        <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-2.5 max-w-sm">
          <span className="text-muted text-sm">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن لعبة أو تطبيق..."
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#4A5570]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-muted">عرض الأسعار حسب المنطقة</div>
        <div className="flex bg-surface border border-border rounded-full p-1">
          {[{ id: "sanaa", label: "صنعاء" }, { id: "south", label: "الجنوب" }].map((r) => (
            <button
              key={r.id}
              onClick={() => setRegion(r.id)}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition-colors ${region === r.id ? "bg-teal text-bg" : "text-muted"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
        <CategoryIcon
          label="الكل"
          active={activeCat === "all"}
          onClick={() => setActiveCat("all")}
        />
        {activeCategories.map((c) => (
          <CategoryIcon
            key={c.id}
            label={c.name}
            active={activeCat === c.id}
            onClick={() => setActiveCat(c.id)}
          />
        ))}
      </div>

      {featured.length > 0 && activeCat === "all" && !query && (
        <Section title="الأكثر طلبًا">
          <Grid products={featured} region={region} settings={settings} onOpen={setOpenProduct} />
        </Section>
      )}

      <Section title={activeCat === "all" ? "كل المنتجات" : categories.find((c) => c.id === activeCat)?.name || ""}>
        {filtered.length === 0 ? (
          <Empty text="لا توجد منتجات مطابقة" />
        ) : (
          <Grid products={filtered} region={region} settings={settings} onOpen={setOpenProduct} />
        )}
      </Section>

      {paymentMethods.filter((p) => p.active).length > 0 && (
        <Section title="وسائل الدفع المتاحة">
          <div className="flex flex-wrap gap-2">
            {paymentMethods.filter((p) => p.active).map((p) => (
              <div key={p.id} classNa
