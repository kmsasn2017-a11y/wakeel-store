import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { packages: { orderBy: { sortOrder: "asc" } }, category: true },
    orderBy: { sortOrder: "asc" },
  });
  return Response.json(products);
}

export async function POST(req) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description || "",
      image: body.image || "",
      categoryId: body.categoryId || null,
      active: body.active ?? true,
      featured: body.featured ?? false,
      isNew: body.isNew ?? false,
      sortOrder: body.sortOrder ?? 0,
      packages: {
        create: (body.packages || []).map((p, i) => ({
          name: p.name,
          sanaaPrice: Number(p.sanaaPrice) || 0,
          southPrice: Number(p.southPrice) || 0,
          pricingMode: p.pricingMode || "auto",
          sortOrder: i,
        })),
      },
    },
    include: { packages: true },
  });
  await prisma.changeLog.create({ data: { action: `إضافة منتج: ${product.name}` } });
  return Response.json(product);
}
