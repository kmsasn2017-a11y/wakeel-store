import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

export async function PUT(req, { params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req?.json();
  const cat = await prisma?.category?.update({
    where: { id: params?.id },
    data: {
      name: body?.name,
      active: body?.active,
      sortOrder: body?.sortOrder,
      marginPercent: body?.marginPercent,
    },
  });
  await prisma?.changeLog?.create({ data: { action: `تعديل تصنيف: ${cat?.name}` } });
  return Response.json(cat);
}

export async function DELETE(req, { params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const inUse = await prisma?.product?.count({ where: { categoryId: params?.id } });
  const cat = await prisma?.category?.findUnique({ where: { id: params?.id } });
  await prisma?.category?.delete({ where: { id: params?.id } });
  await prisma?.changeLog?.create({
    data: { action: `حذف تصنيف: ${cat?.name || params?.id}${inUse ? ` (كان يحتوي ${inUse} منتج)` : ""}` },
  });
  return Response.json({ ok: true, wasInUseByCount: inUse });
}
