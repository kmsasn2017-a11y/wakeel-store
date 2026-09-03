import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return Response.json(categories);
}

export async function POST(req) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json();
  const cat = await prisma.category.create({
    data: {
      name: body.name,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
      marginPercent: body.marginPercent ?? 0,
    },
  });
  await prisma.changeLog.create({ data: { action: `إضافة تصنيف: ${cat.name}` } });
  return Response.json(cat);
}
