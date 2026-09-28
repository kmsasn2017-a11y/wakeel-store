"use client";
import { useEffect, useState } from "react";
import { api, computeSouthPriceClient } from "@/lib/apiClient";


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
              <div key={p.id} className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-muted">
                {p.name}
              </div>
            ))}
          </div>
        </Section>
      )}

      {openProduct && (
        <ProductModal
          product={openProduct}
          region={region}
          settings={settings}
          onClose={() => setOpenProduct(null)}
        />
      )}
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="font-bold text-lg text-gold">متجر الباقات</span>
    </div>
  );
}

function CategoryIcon({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 text-xs font-medium transition-colors border ${active ? "bg-gold text-bg border-gold" : "bg-surface border-border text-muted"}`}
    >
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ products, region, settings, onOpen }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} region={region} settings={settings} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ProductCard({ product, region, settings, onOpen }) {
  const margin = product.category?.marginPercent || 0;
  const price = fromPrice(product, region, settings);
  return (
    <div
      onClick={() => onOpen(product)}
      className="cursor-pointer bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2 hover:border-gold transition-colors"
    >
      {product.image && (
        <img src={product.image} alt={product.name} className="w-full h-24 object-contain rounded-xl mb-1" />
      )}
      <div className="font-bold text-sm">{product.name}</div>
      <div className="text-gold text-xs font-semibold">
        يبدأ من {price} ر.ي
      </div>
    </div>
  );
}

function ProductModal({ product, region, settings, onClose }) {
  const margin = product.category?.marginPercent || 0;
  const pkgs = product.packages || [];
  const msg = `مرحباً، أريد شراء باقة من منتج: ${product.name}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 left-3 text-muted hover:text-white text-xl">✕</button>
        <div className="font-extrabold text-lg mb-4">{product.name}</div>
        {pkgs.length === 0 ? (
          <Empty text="لا توجد باقات متاحة" />
        ) : (
          <div className="flex flex-col gap-3 mb-5">
            {pkgs.map((pkg) => {
              const price = packagePrice(pkg, region, settings, margin);
              return (
                <div key={pkg.id} className="flex items-center justify-between bg-bg border border-border rounded-xl px-4 py-3">
                  <span className="text-sm font-medium">{pkg.name}</span>
                  <span className="text-gold font-bold text-sm">{price} ر.ي</span>
                </div>
              );
            })}
          </div>
        )}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center bg-teal text-bg font-bold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity"
        >
          اطلب عبر واتساب
        </a>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-center text-muted py-8 text-sm">{text}</div>;
}
