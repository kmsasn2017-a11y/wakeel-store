// حماية بسيطة لواجهات الأدمن عبر مفتاح مُرسَل بترويسة الطلب.
// ⚠️ هذا حل أولي للتجربة فقط — قبل الإطلاق الفعلي استبدله بنظام تسجيل دخول
// حقيقي (NextAuth أو مشابه) مع جلسات وصلاحيات مستخدمين.
export function isAdminRequest(req) {
  const key = req?.headers?.get("x-admin-key");
  return key && key === (process.env.ADMIN_PASSWORD || "admin123");
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "غير مصرح" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
