import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";

async function getOrCreateSettings() {
  let s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) s = await prisma.settings.create({ data: { id: 1 } });
  return s;
}

export async function GET() {
  const s = await getOrCreateSettings();
  return Response.json(s);
}

export async function PUT(req) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json();

  if (!(Number(body.southMultiplier) > 0)) {
    return new Response(JSON.stringify({ error: "معامل الجنوب يجب أن يكون أكبر من صفر" }), { status: 400 });
  }
  if (Number(body.sanaaMargin) < 0 || Number(body.southMargin) < 0) {
    return new Response(JSON.stringify({ error: "هامش الربح لا يمكن أن يكون سالبًا" }), { status: 400 });
  }
  if (!(Number(body.roundStep) > 0)) {
    return new Response(JSON.stringify({ error: "قيمة التقريب يجب أن تكون أكبر من صفر" }), { status: 400 });
  }

  await getOrCreateSettings();
  const s = await prisma.settings.update({
    where: { id: 1 },
    data: {
      southMultiplier: Number(body.southMultiplier),
      southCommissionPer1000: Number(body.southCommissionPer1000) || 0,
      sanaaMargin: Number(body.sanaaMargin),
      southMargin: Number(body.southMargin),
      roundStep: Number(body.roundStep),
      autoPricingEnabled: !!body.autoPricingEnabled,
      whatsappNumber: body.whatsappNumber || "772764659",
    },
  });
  await prisma.changeLog.create({
    data: { action: `تعديل إعدادات التسعير (المعامل: ${s.southMultiplier})` },
  });
  return Response.json(s);
}
