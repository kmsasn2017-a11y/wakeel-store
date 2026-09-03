"use client";
import { useEffect, useState } from "react";
import { api, fmt, computeSouthPriceClient } from "@/lib/apiClient";
import ProductModal from "@/components/ProductModal";

function packagePrice(pkg, region, settings, categoryMargin) {
  if (region === "sanaa") return Number(pkg?.sanaaPrice) || 0;
  if (pkg?.pricingMode === "manual") return Number(pkg?.southPrice) || 0;
  return computeSouthPriceClient(pkg?.sanaaPrice, settings, categoryMargin);
}
function fromPrice(product, region, settings) {
  const pkgs = product?.packages || [];
  if (!pkgs?.length) return 0;
  const margin = product?.category?.marginPercent || 0;
  return Math.min(...pkgs?.map((pk) => packagePrice(pk, region, settings, margin)));
}

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
    Promise.all([api?.getCategories(), api?.getProducts(), api?.getPaymentMethods(), api?.getSettings()])?.then(([c, p, pm, s]) => {
        setCategories(c);
        setProducts(p);
        setPaymentMethods(pm);
        setSettings(s);
      })?.finally(() => setLoading(false));
  }, []);

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeProducts = products?.filter((p) => p?.active);
  const filtered = activeProducts?.filter((p) => {
    const matchCat = activeCat === "all" || p?.categoryId === activeCat;
    const matchQuery = !query || p?.name?.toLowerCase()?.includes(query?.toLowerCase());
    return matchCat && matchQuery;
  });
  const featured = activeProducts?.filter((p) => p?.featured);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <TopBar />

      <div className="relative overflow-hidden rounded-2xl mt-5 mb-6 p-6 sm:p-10 bg-gradient-to-br from-[#1B2440] to-[#141A2B] border border-border">
        <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-2">
          اشحن ألعابك وتطبيقاتك <span className="text-gold">بثقة وسرعة</span>
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-md mb-5">
          وكيل جوجل الرسمي في اليمن — أسعار واضحة لصنعاء والجنوب، وتسليم فوري لكل الباقات.
        </p>
        <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-2 max-w-sm">
          <input
            value={query}
            onChange={(e) => setQuery(e?.target?.value)}
            placeholder="ابحث عن لعبة أو تطبيق..."
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-[#4A5570]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-muted">عرض الأسعار حسب المنطقة</div>
        <div className="flex bg-surface border border-border rounded-full p-1">
          {[{ id: "sanaa", label: "صنعاء" }, { id: "south", label: "الجنوب" }]?.map((r) => (
            <button
              key={r?.id}
              onClick={() => setRegion(r?.id)}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition-colors ${region === r?.id ? "bg-teal text-bg" : "text-muted"}`}
            >
              {r?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        <button
          onClick={() => setActiveCat("all")}
          className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors ${activeCat === "all" ? "bg-gold text-bg border-gold" : "border-border text-muted"}`}
        >
          الكل
        </button>
        {categories?.filter((c) => c?.active)?.map((c) => (
          <button
            key={c?.id}
            onClick={() => setActiveCat(c?.id)}
            className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors ${activeCat === c?.id ? "bg-gold text-bg border-gold" : "border-border text-muted"}`}
          >
            {c?.name}
          </button>
        ))}
      </div>

      {featured?.length > 0 && activeCat === "all" && !query && (
        <Section title="الأكثر طلبًا">
          <Grid products={featured} region={region} settings={settings} onOpen={setOpenProduct} />
        </Section>
      )}

      <Section title={activeCat === "all" ? "كل المنتجات" : categories?.find((c) => c?.id === activeCat)?.name || ""}>
        {filtered?.length === 0 ? (
          <Empty text="لا توجد منتجات مطابقة" />
        ) : (
          <Grid products={filtered} region={region} settings={settings} onOpen={setOpenProduct} />
        )}
      </Section>

      {paymentMethods?.filter((p) => p?.active)?.length > 0 && (
        <Section title="وسائل الدفع المتاحة">
          <div className="flex flex-wrap gap-2">
            {paymentMethods?.filter((p) => p?.active)?.map((p) => (
              <div key={p?.id} className="bg-surface border border-border rounded-xl px-3 py-2 text-xs">
                {p?.name}
              </div>
            ))}
          </div>
        </Section>
      )}

      {openProduct && (
        <ProductModal
          product={openProduct}
          region={region}
          setRegion={setRegion}
          settings={settings}
          paymentMethods={paymentMethods}
          onClose={() => setOpenProduct(null)}
        />
      )}
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between h-14">
      <div className="flex items-center gap-2 font-extrabold text-lg">
        <span className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center text-bg text-xs">G</span>
        وكيل جوجل
      </div>
      <a href="/admin" className="text-xs text-muted hover:text-gold">لوحة التحكم</a>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-bold text-base mb-3">{title}</h2>
      {children}
    </div>
  );
}
function Empty({ text }) {
  return <div className="text-center py-14 text-[#5C6580] text-sm border border-dashed border-border rounded-xl">{text}</div>;
}
function Grid({ products, region, settings, onOpen }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {products?.map((p) => (
        <button key={p?.id} onClick={() => onOpen(p)} className="text-right bg-surface border border-border rounded-xl overflow-hidden hover:border-gold/50 transition-colors">
          <div className="aspect-square bg-bg overflow-hidden flex items-center justify-center">
            {p?.image ? (
              <img src={p?.image} alt={p?.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <span className="text-[#4A5570] text-xs">لا توجد صورة</span>
            )}
          </div>
          <div className="p-2.5">
            <div className="text-xs font-semibold line-clamp-1 mb-1">{p?.name}</div>
            <div className="text-[11px] text-muted">
              يبدأ من <span className="text-teal font-bold">{fmt(fromPrice(p, region, settings))}</span> ريال
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
