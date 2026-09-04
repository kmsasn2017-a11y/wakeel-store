import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

export async function GET(req, { params }) {
  const product = await prisma?.product?.findUnique({
    where: { id: params?.id },
    include: { packages: true, category: true },
  });
  if (!product) return new Response("Not found", { status: 404 });
  return Response.json(product);
}

// تعديل منتج + مزامنة كاملة لباقاته (حذف/تحديث/إضافة) داخل عملية واحدة
export async function PUT(req, { params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req?.json();

  const existing = await prisma?.package?.findMany({ where: { productId: params?.id } });
  const incomingIds = new Set((body.packages || []).filter((p) => !p.isNewRow).map((p) => p.id));
  const toDelete = existing?.filter((p) => !incomingIds?.has(p?.id))?.map((p) => p?.id);

  const [product] = await prisma?.$transaction([
    prisma?.product?.update({
      where: { id: params?.id },
      data: {
        name: body?.name,
        description: body?.description || "",
        image: body?.image || "",
        categoryId: body?.categoryId || null,
        active: body?.active ?? true,
        featured: body?.featured ?? false,
        isNew: body?.isNew ?? false,
        sortOrder: body?.sortOrder ?? 0,
      },
    }),
    ...(toDelete?.length ? [prisma?.package?.deleteMany({ where: { id: { in: toDelete } } })] : []),
    ...(body?.packages || [])?.map((p, i) =>
      p?.isNewRow
        ? prisma?.package?.create({
            data: {
              productId: params?.id,
              name: p?.name,
              sanaaPrice: Number(p?.sanaaPrice) || 0,
              southPrice: Number(p?.southPrice) || 0,
              pricingMode: p?.pricingMode || "auto",
              sortOrder: i,
            },
          })
        : prisma?.package?.update({
            where: { id: p?.id },
            data: {
              name: p?.name,
              sanaaPrice: Number(p?.sanaaPrice) || 0,
              southPrice: Number(p?.southPrice) || 0,
              pricingMode: p?.pricingMode || "auto",
              sortOrder: i,
            },
          })
    ),
  ]);

  await prisma?.changeLog?.create({ data: { action: `تعديل منتج: ${product?.name}` } });
  const full = await prisma?.product?.findUnique({ where: { id: params?.id }, include: { packages: true } });
  return Response.json(full);
}

export async function DELETE(req, { params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const product = await prisma?.product?.findUnique({ where: { id: params?.id } });
  await prisma?.product?.delete({ where: { id: params?.id } });
  await prisma?.changeLog?.create({ data: { action: `حذف منتج: ${product?.name || params?.id}` } });
  return Response.json({ ok: true });
}
