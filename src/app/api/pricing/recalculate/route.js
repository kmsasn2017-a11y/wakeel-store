import { prisma } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { computeSouthPrice } from "@/lib/pricing";

// إعادة حساب أسعار الجنوب لكل الباقات ذات التسعير التلقائي، مع نسخة احتياطية قبل التنفيذ
export async function POST(req) {
  if (!isAdminRequest(req)) return unauthorized();

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const products = await prisma.product.findMany({ include: { packages: true, category: true } });

  const autoPackages = products.flatMap((p) =>
    p.packages
      .filter((pk) => pk.pricingMode !== "manual")
      .map((pk) => ({ pkg: pk, categoryMargin: p.category?.marginPercent || 0 }))
  );

  // نسخة احتياطية فعلية قبل التحديث الجماعي (يمكن الاسترجاع منها لاحقًا)
  const backupSnapshot = products.map((p) => ({
    id: p.id,
    packages: p.packages.map((pk) => ({ id: pk.id, southPrice: pk.southPrice })),
  }));
  await prisma.priceBackup.create({ data: { data: backupSnapshot } });

  await prisma.$transaction(
    autoPackages.map(({ pkg, categoryMargin }) =>
      prisma.package.update({
        where: { id: pkg.id },
        data: { southPrice: computeSouthPrice(pkg.sanaaPrice, settings, categoryMargin) },
      })
    )
  );

  await prisma.changeLog.create({
    data: {
      action: `إعادة حساب أسعار الجنوب (${autoPackages.length} باقة) — المعامل: ${settings.southMultiplier}`,
    },
  });

  return Response.json({ ok: true, updatedCount: autoPackages.length, multiplier: settings.southMultiplier });
}
