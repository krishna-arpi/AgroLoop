CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "PurchasePaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');
CREATE TYPE "PurchasePaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK', 'CHEQUE');
CREATE TYPE "LedgerTransportMode" AS ENUM ('HUB_PICKUP', 'FARMER_DELIVERY');
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "DeliveryStatus" AS ENUM ('PLANNED', 'DISPATCHED', 'DELIVERED', 'ACCEPTED', 'DISPUTED');
CREATE TYPE "SalePaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE');
CREATE TYPE "SalePaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK', 'CHEQUE');
CREATE TYPE "InventoryMovementType" AS ENUM ('PURCHASE_IN', 'BATCH_CONSUME', 'BATCH_OUTPUT', 'SALE_OUT', 'ADJUSTMENT');

CREATE TABLE "Purchase" (
  "id" TEXT PRIMARY KEY,
  "purchaseNo" TEXT NOT NULL UNIQUE,
  "purchaseDate" TIMESTAMP(3) NOT NULL,
  "hubId" TEXT NOT NULL,
  "farmerId" TEXT NOT NULL,
  "farmerNameSnapshot" TEXT NOT NULL,
  "farmerPhoneSnapshot" TEXT,
  "farmerVillageSnapshot" TEXT NOT NULL,
  "farmerDistrictSnapshot" TEXT NOT NULL,
  "fpoNameSnapshot" TEXT,
  "listingId" TEXT,
  "intakeRecordId" TEXT,
  "residueTypeId" TEXT NOT NULL,
  "form" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "grossWeightKg" DECIMAL(14,3) NOT NULL,
  "tareWeightKg" DECIMAL(14,3) NOT NULL,
  "netWeightKg" DECIMAL(14,3) NOT NULL,
  "moisturePct" DECIMAL(6,2) NOT NULL,
  "impurityPct" DECIMAL(6,2) NOT NULL,
  "moistureDeductionKg" DECIMAL(14,3) NOT NULL,
  "impurityDeductionKg" DECIMAL(14,3) NOT NULL,
  "payableWeightKg" DECIMAL(14,3) NOT NULL,
  "ratePerTonnePaisa" INTEGER NOT NULL,
  "grossAmountPaisa" INTEGER NOT NULL,
  "deductionsPaisa" INTEGER NOT NULL,
  "transportCostPaisa" INTEGER NOT NULL,
  "loadingCostPaisa" INTEGER NOT NULL,
  "taxAmountPaisa" INTEGER NOT NULL,
  "netPayablePaisa" INTEGER NOT NULL,
  "amountPaidPaisa" INTEGER NOT NULL DEFAULT 0,
  "balanceDuePaisa" INTEGER NOT NULL DEFAULT 0,
  "transportMode" "LedgerTransportMode" NOT NULL,
  "vehicleNo" TEXT,
  "distanceKm" DECIMAL(8,2) NOT NULL,
  "paymentStatus" "PurchasePaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" "PurchasePaymentMethod",
  "paymentDate" TIMESTAMP(3),
  "paymentReference" TEXT,
  "receiptUrl" TEXT,
  "remarks" TEXT,
  "cancellationReason" TEXT,
  "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
  "deletedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PurchasePayment" (
  "id" TEXT PRIMARY KEY,
  "purchaseId" TEXT NOT NULL,
  "amountPaisa" INTEGER NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "method" "PurchasePaymentMethod" NOT NULL,
  "referenceNo" TEXT,
  "mockMarker" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY,
  "buyerProfileId" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "industryType" TEXT NOT NULL,
  "gstin" TEXT,
  "pan" TEXT,
  "address" TEXT,
  "state" TEXT,
  "contactPerson" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "creditTermsDays" INTEGER NOT NULL DEFAULT 30,
  "creditLimitPaisa" INTEGER NOT NULL DEFAULT 0,
  "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Sale" (
  "id" TEXT PRIMARY KEY,
  "saleNo" TEXT NOT NULL UNIQUE,
  "saleDate" TIMESTAMP(3) NOT NULL,
  "hubId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "orderId" TEXT UNIQUE,
  "subtotalPaisa" INTEGER NOT NULL,
  "discountPaisa" INTEGER NOT NULL DEFAULT 0,
  "gstPercent" DECIMAL(5,2) NOT NULL,
  "gstAmountPaisa" INTEGER NOT NULL,
  "freightPaisa" INTEGER NOT NULL DEFAULT 0,
  "otherChargesPaisa" INTEGER NOT NULL DEFAULT 0,
  "totalAmountPaisa" INTEGER NOT NULL,
  "amountPaidPaisa" INTEGER NOT NULL DEFAULT 0,
  "balanceDuePaisa" INTEGER NOT NULL,
  "vehicleNo" TEXT,
  "driverName" TEXT,
  "dispatchDate" TIMESTAMP(3),
  "deliveryDate" TIMESTAMP(3),
  "deliveredQuantity" DECIMAL(14,3) NOT NULL,
  "acceptedQuantity" DECIMAL(14,3) NOT NULL,
  "rejectedQuantity" DECIMAL(14,3) NOT NULL,
  "rejectionReason" TEXT,
  "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PLANNED',
  "paymentStatus" "SalePaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "paymentTerms" TEXT,
  "dueDate" TIMESTAMP(3),
  "invoiceUrl" TEXT,
  "challanUrl" TEXT,
  "carbonEstimateId" TEXT,
  "status" "SaleStatus" NOT NULL DEFAULT 'DRAFT',
  "deletedAt" TIMESTAMP(3),
  "remarks" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SaleItem" (
  "id" TEXT PRIMARY KEY,
  "saleId" TEXT NOT NULL,
  "lotId" TEXT NOT NULL,
  "lotCodeSnapshot" TEXT NOT NULL,
  "quantity" DECIMAL(14,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "ratePaisa" INTEGER NOT NULL,
  "gradeSnapshot" TEXT NOT NULL,
  "hhvSnapshot" DECIMAL(10,2),
  "ashSnapshot" DECIMAL(10,2),
  "amountPaisa" INTEGER NOT NULL
);

CREATE TABLE "SalePayment" (
  "id" TEXT PRIMARY KEY,
  "saleId" TEXT NOT NULL,
  "amountPaisa" INTEGER NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "method" "SalePaymentMethod" NOT NULL,
  "referenceNo" TEXT,
  "mockMarker" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "InventoryMovement" (
  "id" TEXT PRIMARY KEY,
  "hubId" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "stockKind" TEXT NOT NULL,
  "residueTypeId" TEXT,
  "lotId" TEXT,
  "purchaseId" TEXT,
  "saleId" TEXT,
  "batchId" TEXT,
  "quantityKg" DECIMAL(14,3) NOT NULL,
  "referenceId" TEXT NOT NULL,
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LedgerSetting" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Purchase_purchaseDate_idx" ON "Purchase"("purchaseDate");
CREATE INDEX "Purchase_hubId_status_idx" ON "Purchase"("hubId", "status");
CREATE INDEX "Purchase_farmerId_purchaseDate_idx" ON "Purchase"("farmerId", "purchaseDate");
CREATE INDEX "Purchase_paymentStatus_idx" ON "Purchase"("paymentStatus");
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");
CREATE INDEX "Sale_hubId_status_idx" ON "Sale"("hubId", "status");
CREATE INDEX "Sale_customerId_saleDate_idx" ON "Sale"("customerId", "saleDate");
CREATE INDEX "Sale_paymentStatus_idx" ON "Sale"("paymentStatus");
CREATE INDEX "Sale_deliveryStatus_idx" ON "Sale"("deliveryStatus");
CREATE INDEX "InventoryMovement_hubId_stockKind_createdAt_idx" ON "InventoryMovement"("hubId", "stockKind", "createdAt");
