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
      </head>
      <body style={{ fontFamily: "Cairo, sans-serif" }}>{children}</body>
    </html>
  );
}
