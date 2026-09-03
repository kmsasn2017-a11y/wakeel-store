const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, southMultiplier: 3.0, southCommissionPer1000: 250, sanaaMargin: 0, southMargin: 0, roundStep: 50, autoPricingEnabled: true, whatsappNumber: "772764659" },
  });

  const catTiktok = await prisma.category.upsert({ where: { id: "cat_tiktok" }, update: {}, create: { id: "cat_tiktok", name: "تيك توك", sortOrder: 1 } });
  const catEfootball = await prisma.category.upsert({ where: { id: "cat_efootball" }, update: {}, create: { id: "cat_efootball", name: "إي فوتبول eFootball", sortOrder: 2 } });
  const catPubg = await prisma.category.upsert({ where: { id: "cat_pubg" }, update: {}, create: { id: "cat_pubg", name: "ببجي موبايل", sortOrder: 3 } });
  // تصنيف التطبيقات بهامش ربح 20% كما طلب المالك
  await prisma.category.upsert({ where: { id: "cat_apps" }, update: { marginPercent: 20 }, create: { id: "cat_apps", name: "تطبيقات وخدمات", sortOrder: 4, marginPercent: 20 } });

  const products = [
    {
      id: "prod_tiktok_coins", name: "شحن عملات تيك توك TikTok", categoryId: catTiktok.id, featured: true,
      description: "شحن عملات تيك توك مباشر وآمن — أسعار صنعاء والجنوب.",
      packages: [
        ["500 عملة", 3450, 10600], ["700 عملة", 4800, 14450], ["1,000 عملة", 6750, 19900],
        ["1,400 عملة", 9500, 27450], ["2,000 عملة", 13550, 38800], ["3,500 عملة", 23700, 67150],
        ["5,000 عملة", 33850, 95450], ["7,000 عملة", 47400, 133250], ["10,000 عملة", 67700, 189900],
        ["17,500 عملة", 118500, 331550],
      ],
    },
    {
      id: "prod_efootball_coins", name: "شحن عملات eFootball Coins", categoryId: catEfootball.id, featured: true,
      description: "شحن عملات ليجندات eFootball — أسعار صنعاء وعدن.",
      packages: [
        ["باقة لويس سواريز (50 عملة)", 700, 2050], ["مجموعة البداية - إيكر كاسياس", 2000, 5860],
        ["300 عملة", 1815, 5045], ["550 عملة", 3420, 9515], ["1,040 عملة", 6275, 17460],
        ["2,130 عملة", 12845, 35740], ["3,250 عملة", 19275, 53620], ["5,700 عملة", 31410, 87390],
        ["12,800 عملة", 67115, 186720],
      ],
    },
    {
      id: "prod_efootball_bundle", name: "عرض كاسياس + سواريز (عرض محدود)", categoryId: catEfootball.id, featured: true, isNew: true,
      description: "عرض خاص محدود يجمع كاسياس ومجموعته مع سواريز ومجموعته.",
      packages: [["كاسياس + مجموعته", 2000, 7000], ["سواريز + مجموعته", 700, 2200]],
    },
    {
      id: "prod_pubg_uc", name: "شحن شدات ببجي موبايل PUBG UC", categoryId: catPubg.id, featured: true,
      description: "شحن شدات ببجي موبايل مباشر وسريع.",
      packages: [
        ["60 شدة", 500, 1500], ["325 شدة", 2450, 7500], ["660 شدة", 4900, 14500],
        ["720 شدة", 5400, 16000], ["1,800 شدة", 12000, 36000], ["3,850 شدة", 23500, 73000],
        ["8,100 شدة", 47000, 142000],
      ],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id, name: p.name, description: p.description, categoryId: p.categoryId,
        featured: !!p.featured, isNew: !!p.isNew, active: true,
        packages: { create: p.packages.map(([name, sanaa, south], i) => ({ name, sanaaPrice: sanaa, southPrice: south, pricingMode: "manual", sortOrder: i })) },
      },
    });
  }

  const methods = [
    { id: "pm_bank_yer_sanaa", name: "حساب بنكي - ريال يمني (صنعاء)", type: "بنك", accountNumber: "3005416476", region: "sanaa", sortOrder: 1 },
    { id: "pm_bank_sar_sanaa", name: "حساب بنكي - ريال سعودي (صنعاء)", type: "بنك", accountNumber: "3023124482", region: "sanaa", sortOrder: 2 },
    { id: "pm_bank_yer_aden", name: "حساب بنكي - ريال يمني (عدن)", type: "بنك", accountNumber: "3092256412", region: "south", sortOrder: 3 },
    { id: "pm_bank_sar_aden", name: "حساب بنكي - ريال سعودي (عدن)", type: "بنك", accountNumber: "3099551711", region: "south", sortOrder: 4 },
    { id: "pm_jaib", name: "محفظة جيب", type: "محفظة إلكترونية", accountNumber: "772764659", region: "both", sortOrder: 5 },
    { id: "pm_onecash", name: "محفظة OneCash (وان كاش)", type: "محفظة إلكترونية", accountNumber: "772764659", region: "both", sortOrder: 6 },
  ];
  for (const m of methods) {
    await prisma.paymentMethod.upsert({ where: { id: m.id }, update: {}, create: { ...m, active: true, requiresReference: true } });
  }

  console.log("✅ تم زرع البيانات الأولية بنجاح");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
