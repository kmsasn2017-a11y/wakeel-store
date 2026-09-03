import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

export async function PUT(req, { params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json();
  const method = await prisma.paymentMethod.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      accountNumber: body.accountNumber,
      accountHolder: body.accountHolder || "",
      region: body.region || "both",
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
      requiresReference: body.requiresReference ?? true,
    },
  });
  await prisma.changeLog.create({ data: { action: `تعديل وسيلة دفع: ${method.name}` } });
  return Response.json(method);
}

export async function DELETE(req, { params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const method = await prisma.paymentMethod.findUnique({ where: { id: params.id } });
  await prisma.paymentMethod.delete({ where: { id: params.id } });
  await prisma.changeLog.create({ data: { action: `حذف وسيلة دفع: ${method?.name || params.id}` } });
  return Response.json({ ok: true });
}
