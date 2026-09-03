import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

export async function PUT(req, { params }) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req?.json();
  const order = await prisma?.order?.update({
    where: { id: params?.id },
    data: { status: body?.status },
  });
  await prisma?.changeLog?.create({
    data: { action: `تغيير حالة الطلب #${order?.id?.slice(-6)} إلى: ${body?.status}` },
  });
  return Response.json(order);
}
