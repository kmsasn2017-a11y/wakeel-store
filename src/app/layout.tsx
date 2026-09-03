import "./globals.css";

export const metadata = {
  title: "وكيل جوجل | شحن ألعاب وتطبيقات وأدوات رقمية",
  description: "وكيل جوجل الرسمي في اليمن — شحن فوري لكل الألعاب والتطبيقات بأسعار واضحة لصنعاء والجنوب.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
        />

        <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fwakeelsto7403back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.20" />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.3" /></head>
      <body style={{ fontFamily: "Cairo, sans-serif" }}>{children}</body>
    </html>
  );
}
