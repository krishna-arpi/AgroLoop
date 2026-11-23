import { PrismaClient, UserRole, Provenance, ListingStatus, BatchStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("AgroLoop123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@agroloop.local" },
    update: {},
    create: { email: "admin@agroloop.local", passwordHash, role: UserRole.ADMIN, verified: "VERIFIED" },
  });

  const residueData = [
    ["Paddy straw", 3150, 5820, 31.5, "High volatile K vaporized; safe < 950°C", false],
    ["Rice husk", 3380, 5650, 34.0, "SiO₂ matrix stabilized; no ash sintering", false],
    ["Sugarcane bagasse", 3850, 6180, 29.0, "Low ash (< 3.5%)", false],
    ["Arhar/gram stalks", 3920, 6350, 33.2, "Dense fixed carbon", false],
    ["Corn cobs", 4050, 6480, 30.8, "High mechanical strength", false],
    ["Wheat straw", null, null, null, "Data pending", true],
  ] as const;

  for (const [name, rawHhv, bioCoalHhv, charYieldPct, note, dataPending] of residueData) {
    await prisma.residueType.upsert({
      where: { name },
      update: {},
      create: {
        name,
        rawHhv,
        bioCoalHhv,
        charYieldPct,
        note,
        dataPending,
        provenance: Provenance.PROPOSAL_REPORTED,
      },
    });
  }

  const benchmarks = [
    ["Densified pellets", 3800],
    ["Fossil coal G12", 4200],
    ["AgroLoop bio-coal", 6100],
  ] as const;
  for (const [name, hhvKcalKg] of benchmarks) {
    await prisma.fuelBenchmark.upsert({
      where: { name },
      update: {},
      create: { name, hhvKcalKg, provenance: Provenance.PROPOSAL_REPORTED, source: "Reference build specification" },
    });
  }

  await prisma.emissionFactor.upsert({
    where: { key: "OPEN_BURNING_CO2E_PER_T" },
    update: {},
    create: {
      key: "OPEN_BURNING_CO2E_PER_T",
      name: "Open-burning CO2e factor",
      value: 1.4,
      unit: "tCO2e/t residue",
      provenance: Provenance.MODELLED,
      source: "Editable proposal assumption; validate before reporting",
    },
  });

  const farmerUsers = [];
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.upsert({
      where: { email: `farmer${i}@agroloop.local` },
      update: {},
      create: {
        email: `farmer${i}@agroloop.local`,
        passwordHash,
        role: UserRole.FARMER,
        verified: "VERIFIED",
        farmerProfile: {
          create: {
            name: `Farmer ${i}`,
            village: i === 1 ? "Dharsiwa" : i === 2 ? "Abhanpur" : "Kharora",
            district: "Raipur",
            state: "Chhattisgarh",
            landArea: 2.5 + i,
            latitude: 21.25 + i * 0.01,
            longitude: 81.63 + i * 0.01,
          },
        },
      },
      include: { farmerProfile: true },
    });
    farmerUsers.push(user);
  }

  const hubs = [];
  for (let i = 1; i <= 2; i++) {
    const hub = await prisma.user.upsert({
      where: { email: `hub${i}@agroloop.local` },
      update: {},
      create: {
        email: `hub${i}@agroloop.local`,
        passwordHash,
        role: UserRole.HUB_OPERATOR,
        verified: "VERIFIED",
        hubProfile: {
          create: {
            name: `AgroLoop Hub ${i}`,
            village: i === 1 ? "Dharsiwa" : "Abhanpur",
            district: "Raipur",
            state: "Chhattisgarh",
            latitude: 21.26 + i * 0.02,
            longitude: 81.64 + i * 0.02,
            capacityTpd: 5,
            retortUnits: i,
            serviceRadiusKm: 25,
            approved: true,
          },
        },
      },
      include: { hubProfile: true },
    });
    hubs.push(hub);
  }

  for (let i = 1; i <= 2; i++) {
    await prisma.user.upsert({
      where: { email: `buyer${i}@agroloop.local` },
      update: {},
      create: {
        email: `buyer${i}@agroloop.local`,
        passwordHash,
        role: UserRole.INDUSTRIAL_BUYER,
        verified: "VERIFIED",
        buyerProfile: {
          create: {
            companyName: i === 1 ? "Raipur Sponge Works" : "Central Steel Re-rollers",
            industryType: i === 1 ? "sponge iron" : "steel re-rolling",
            minHhv: 5800,
            maxAsh: 8,
            maxMoisture: 12,
          },
        },
      },
    });
  }

  const paddy = await prisma.residueType.findUniqueOrThrow({ where: { name: "Paddy straw" } });
  const firstFarmer = await prisma.farmerProfile.findFirstOrThrow();
  const listing = await prisma.residueListing.upsert({
    where: { id: "demo-listing-1" },
    update: {},
    create: {
      id: "demo-listing-1",
      farmerId: firstFarmer.id,
      residueTypeId: paddy.id,
      quantityT: 4,
      moisturePct: 12,
      baleOrLoose: "baled",
      locationText: "Dharsiwa, Raipur",
      availableFrom: new Date(),
      availableTo: new Date(Date.now() + 14 * 86400000),
      status: ListingStatus.WEIGHED,
    },
  });

  const hubProfile = await prisma.hubProfile.findFirstOrThrow();
  await prisma.intakeRecord.upsert({
    where: { id: "demo-intake-1" },
    update: {},
    create: { id: "demo-intake-1", listingId: listing.id, hubId: hubProfile.id, weighedKg: 3900, moisturePct: 12 },
  });

  const batch = await prisma.batch.upsert({
    where: { code: "AGL-DEMO-001" },
    update: {},
    create: {
      code: "AGL-DEMO-001",
      hubId: hubProfile.id,
      status: BatchStatus.VERIFIED,
      peakTemperatureC: 430,
      autothermalTempC: 280,
      residenceMin: 45,
      inputKg: 3900,
      outputBioCoalKg: 1230,
      pyroligneousAcidL: 82,
      charYieldPct: 31.54,
    },
  });

  await prisma.qualityTest.upsert({
    where: { id: "demo-quality-1" },
    update: {},
    create: {
      id: "demo-quality-1",
      batchId: batch.id,
      hhvKcalKg: 5820,
      moisturePct: 6.2,
      ashPct: 7.4,
      volatileMatterPct: 18,
      fixedCarbonPct: 68,
      alkaliIndex: 1.8,
      chlorinePct: 0.12,
      provenance: Provenance.PROPOSAL_REPORTED,
      grade: "A",
      testStandard: "Pending accredited lab verification",
    },
  });

  await prisma.productLot.upsert({
    where: { code: "LOT-AGL-001" },
    update: {},
    create: {
      code: "LOT-AGL-001",
      batchId: batch.id,
      hubId: hubProfile.id,
      productType: "BIO_COAL",
      quantityKg: 1230,
      pricePerT: 8500,
      hhvKcalKg: 5820,
      ashPct: 7.4,
      moisturePct: 6.2,
      grade: "A",
      published: true,
      qrPayload: "LOT-AGL-001",
    },
  });

  await prisma.contentBlock.upsert({
    where: { key: "public-home-en" },
    update: {},
    create: {
      key: "public-home-en",
      locale: "en",
      title: "AgroLoop",
      body: "Connecting residue producers, village processing hubs and industrial fuel buyers.",
    },
  });

  const ledgerFarmers = await prisma.farmerProfile.findMany();
  const ledgerResidues = await prisma.residueType.findMany({ where: { dataPending: false } });
  const ledgerHubs = await prisma.hubProfile.findMany();
  for (let i = 0; i < 25; i++) {
    const farmer = ledgerFarmers[i % ledgerFarmers.length];
    const hub = ledgerHubs[i % ledgerHubs.length];
    const residue = ledgerResidues[i % ledgerResidues.length];
    const grossWeight = 2800 + (i % 7) * 175;
    const tareWeight = 300 + (i % 3) * 25;
    const netWeight = grossWeight - tareWeight;
    const moisture = 12 + (i % 9);
    const moistureDeduction = moisture > 15 ? netWeight * (moisture - 15) / 100 : 0;
    const payableWeight = netWeight - moistureDeduction;
    const tareWeightKg = tareWeight;
    const payableWeightKg = payableWeight;
    const ratePaisa = (1800 + (i % 5) * 100) * 100;
    const grossAmountPaisa = Math.round(payableWeight / 1000 * ratePaisa);
    const transportCostPaisa = (i % 4) * 50000;
    const loadingCostPaisa = 30000;
    const netPayablePaisa = grossAmountPaisa + transportCostPaisa + loadingCostPaisa;
    const paidPaisa = i % 5 === 0 ? 0 : i % 4 === 0 ? Math.round(netPayablePaisa / 2) : netPayablePaisa;
    const purchaseNo = `PUR-2026-${String(123 + i).padStart(6, "0")}`;
    const purchase = await prisma.purchase.upsert({
      where: { purchaseNo },
      update: {},
      create: {
        purchaseNo,
        purchaseDate: new Date(2026, 10, 1 + (i % 21)),
        hubId: hub.id,
        farmerId: farmer.id,
        farmerNameSnapshot: farmer.name,
        farmerPhoneSnapshot: `98${String(i).padStart(8, "0")}`,
        farmerVillageSnapshot: farmer.village,
        farmerDistrictSnapshot: farmer.district,
        fpoNameSnapshot: farmer.fpoName,
        residueTypeId: residue.id,
        form: i % 3 === 0 ? "loose" : "baled",
        grade: moisture <= 15 ? "A" : moisture <= 20 ? "B" : "C",
        grossWeightKg: grossWeight,
        tareWeightKg,
        netWeightKg: netWeight,
        moisturePct: moisture,
        impurityPct: 2 + (i % 5),
        moistureDeductionKg: moistureDeduction,
        impurityDeductionKg: 0,
        payableWeightKg,
        ratePerTonnePaisa: ratePaisa,
        grossAmountPaisa,
        deductionsPaisa: 0,
        transportCostPaisa,
        loadingCostPaisa,
        taxAmountPaisa: 0,
        netPayablePaisa,
        amountPaidPaisa: paidPaisa,
        balanceDuePaisa: netPayablePaisa - paidPaisa,
        transportMode: i % 2 === 0 ? "HUB_PICKUP" : "FARMER_DELIVERY",
        vehicleNo: i % 2 === 0 ? `CG04-${1000 + i}` : null,
        distanceKm: 8 + (i % 18),
        paymentStatus: paidPaisa === 0 ? "PENDING" : paidPaisa === netPayablePaisa ? "PAID" : "PARTIAL",
        status: "CONFIRMED",
        createdById: admin.id,
      },
    });
    await prisma.inventoryMovement.upsert({
      where: { id: `seed-purchase-in-${i}` },
      update: {},
      create: { id: `seed-purchase-in-${i}`, hubId: hub.id, type: "PURCHASE_IN", stockKind: "RESIDUE", residueTypeId: residue.id, purchaseId: purchase.id, quantityKg: payableWeight, referenceId: purchaseNo, remarks: "Seed purchase inventory" },
    });
  }

  const customerSpecs = [
    ["Raipur Sponge Works", "sponge iron", "buyer1@agroloop.local"],
    ["Central Steel Re-rollers", "steel re-rolling", "buyer2@agroloop.local"],
    ["Naya Cement Works", "cement", "accounts@nayacement.local"],
    ["Chhattisgarh Captive Power", "captive power", "accounts@cgpower.local"],
  ];
  const ledgerCustomers = [];
  for (let i = 0; i < customerSpecs.length; i++) {
    const [name, industryType, email] = customerSpecs[i];
    const customer = await prisma.customer.upsert({
      where: { id: `seed-customer-${i + 1}` },
      update: {},
      create: { id: `seed-customer-${i + 1}`, name, industryType, email, gstin: `22ABCDE${String(i + 1).padStart(4, "0")}A1Z5`, pan: `ABCDE${String(i + 1).padStart(4, "0")}A`, state: "Chhattisgarh", creditTermsDays: i % 2 ? 45 : 30, creditLimitPaisa: 100000000, status: "ACTIVE" },
    });
    ledgerCustomers.push(customer);
  }

  const ledgerLots = await prisma.productLot.findMany({ take: 10 });
  const fallbackBatch = await prisma.batch.findFirst();
  const fallbackHub = await prisma.hubProfile.findFirst();
  if (fallbackBatch && fallbackHub) {
    for (let i = 0; i < 10; i++) {
      const lot = ledgerLots[i % Math.max(ledgerLots.length, 1)] ?? await prisma.productLot.upsert({
        where: { code: `LOT-SEED-${i + 1}` },
        update: {},
        create: { code: `LOT-SEED-${i + 1}`, batchId: fallbackBatch.id, hubId: fallbackHub.id, productType: i === 9 ? "PYROLIGNEOUS_ACID" : "BIO_COAL", quantityKg: 1500 - i * 50, pricePerT: 8000 + i * 100, hhvKcalKg: i === 9 ? null : 5800 + i * 25, grade: i % 4 === 0 ? "B" : "A", published: true, qrPayload: `LOT-SEED-${i + 1}` },
      });
      const customer = ledgerCustomers[i % ledgerCustomers.length];
      const qty = i === 9 ? 120 : 400 + i * 75;
      const ratePaisa = (8000 + i * 100) * 100;
      const subtotalPaisa = Math.round(qty / 1000 * ratePaisa);
      const gstAmountPaisa = Math.round(subtotalPaisa * 0.05);
      const totalPaisa = subtotalPaisa + gstAmountPaisa;
      const paidPaisa = i === 3 ? 0 : i === 7 ? Math.round(totalPaisa / 2) : i === 8 ? 0 : totalPaisa;
      const overdue = i === 3 || i === 7 || i === 8;
      const saleNo = `SAL-2026-${String(45 + i).padStart(6, "0")}`;
      await prisma.sale.upsert({
        where: { saleNo },
        update: {},
        create: {
          saleNo,
          saleDate: new Date(2026, 9, 1 + i * 2),
          hubId: fallbackHub.id,
          customerId: customer.id,
          subtotalPaisa,
          gstPercent: 5,
          gstAmountPaisa,
          totalAmountPaisa: totalPaisa,
          amountPaidPaisa: paidPaisa,
          balanceDuePaisa: totalPaisa - paidPaisa,
          dueDate: new Date(2026, 10, 5 + i * 3),
          deliveredQuantity: qty,
          acceptedQuantity: i === 6 ? qty - 20 : qty,
          rejectedQuantity: i === 6 ? 20 : 0,
          rejectionReason: i === 6 ? "Moisture variance at delivery" : null,
          deliveryStatus: i === 6 ? "DISPUTED" : i < 5 ? "ACCEPTED" : "DELIVERED",
          paymentStatus: paidPaisa === 0 ? "UNPAID" : paidPaisa === totalPaisa ? "PAID" : "PARTIAL",
          status: "CONFIRMED",
          createdById: admin.id,
          items: { create: { lotId: lot.id, lotCodeSnapshot: lot.code, quantity: qty, unit: i === 9 ? "L" : "kg", ratePaisa, gradeSnapshot: lot.grade ?? "A", hhvSnapshot: lot.hhvKcalKg, ashSnapshot: lot.ashPct, amountPaisa: subtotalPaisa } },
        },
      });
    }
  }

  await prisma.ledgerSetting.upsert({ where: { key: "MOISTURE_DEDUCTION_START_PCT" }, update: {}, create: { key: "MOISTURE_DEDUCTION_START_PCT", value: "15", description: "Deduct moisture above this percentage" } });
  await prisma.ledgerSetting.upsert({ where: { key: "GST_DEFAULT_PERCENT" }, update: {}, create: { key: "GST_DEFAULT_PERCENT", value: "5", description: "Default GST percentage" } });

  console.log(`Seeded AgroLoop demo data. Admin: ${admin.email}`);
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => prisma.$disconnect());
