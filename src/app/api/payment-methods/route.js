import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

export async function GET() {
  const methods = await prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } });
  return Response.json(methods);
}

export async function POST(req) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json();
  const method = await prisma.paymentMethod.create({
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
  await prisma.changeLog.create({ data: { action: `إضافة وسيلة دفع: ${method.name}` } });
  return Response.json(method);
}
