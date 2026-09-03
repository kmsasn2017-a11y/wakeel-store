import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

// GET: للأدمن فقط (قائمة كل الطلبات)
export async function GET(req) {
  if (!isAdminRequest(req)) return unauthorized();
  const orders = await prisma?.order?.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(orders);
}

// POST: عام — العميل ينشئ طلبًا من واجهة المتجر
export async function POST(req) {
  const body = await req?.json();

  // اسم العميل لم يعد إلزاميًا — الهاتف + المعرّف المناسب كافيان
  if (!body?.phone || !body?.productName || !body?.packageName || !body?.price) {
    return new Response(JSON.stringify({ error: "بيانات الطلب غير مكتملة" }), { status: 400 });
  }

  const identifierType = body?.identifierType || "player_id";
  if (identifierType === "player_id" && !body?.playerId) {
    return new Response(JSON.stringify({ error: "معرّف اللاعب (ID) مطلوب لهذا المنتج" }), { status: 400 });
  }
  if (identifierType === "email_password" && (!body?.accountEmail || !body?.accountPassword)) {
    return new Response(
      JSON.stringify({ error: "البريد الإلكتروني وكلمة المرور مطلوبان لهذا المنتج" }),
      { status: 400 }
    );
  }

  let paymentMethodName = null;
  if (body?.paymentMethodId) {
    const method = await prisma?.paymentMethod?.findUnique({ where: { id: body?.paymentMethodId } });
    if (!method) return new Response(JSON.stringify({ error: "وسيلة الدفع غير موجودة" }), { status: 400 });
    if (method?.requiresReference && !body?.transferReference) {
      return new Response(
        JSON.stringify({ error: "رقم الحوالة مطلوب لوسيلة الدفع المختارة" }),
        { status: 400 }
      );
    }
    paymentMethodName = method?.name;
  }

  const order = await prisma?.order?.create({
    data: {
      customerName: body?.customerName || "",
      phone: body?.phone,
      playerId: body?.playerId || "",
      accountEmail: body?.accountEmail || "",
      accountPassword: body?.accountPassword || "",
      productName: body?.productName,
      productImage: body?.productImage || "",
      packageName: body?.packageName,
      region: body?.region,
      price: Number(body?.price) || 0,
      paymentMethodId: body?.paymentMethodId || null,
      paymentMethodName,
      transferReference: body?.transferReference || "",
      status: "new",
    },
  });
  return Response.json(order);
}
