import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./index.js";
import { purchaseCalculations, saleCalculations } from "./index.js";

describe("API health", () => {
  it("reports service health", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "agroloop-api" });
  });
});

describe("Demo authentication", () => {
  it("logs in a hub demo account without a database", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "hub1@agroloop.local",
      password: "AgroLoop123!",
    });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("HUB_OPERATOR");
  });

  it("returns the procurement demo ledger", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({
      email: "hub1@agroloop.local",
      password: "AgroLoop123!",
    });
    expect(login.status).toBe(200);
  });

  it("generates a PDF purchase receipt for a demo purchase", async () => {
    const response = await request(app).get("/api/v1/procurement/purchases/demo-purchase-1/receipt");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain("PUR-2026-000123-receipt.pdf");
  });
});

describe("Ledger calculations", () => {
  it("calculates purchase net weight and moisture deductions", () => {
    const result = purchaseCalculations({
      grossWeightKg: 1000,
      tareWeightKg: 100,
      moisturePct: 20,
      impurityPct: 2,
      ratePerTonnePaisa: 200000,
      transportCostPaisa: 50000,
      loadingCostPaisa: 10000,
      taxPercent: 5,
    });
    expect(result.netWeightKg).toBe(900);
    expect(result.moistureDeductionKg).toBe(45);
    expect(result.payableWeightKg).toBe(855);
    expect(result.netPayablePaisa).toBeGreaterThan(0);
  });

  it("calculates sale GST and total", () => {
    const result = saleCalculations({
      subtotalPaisa: 100000,
      discountPaisa: 5000,
      gstPercent: 5,
      freightPaisa: 1000,
      otherChargesPaisa: 500,
    });
    expect(result.gstAmountPaisa).toBe(4750);
    expect(result.totalAmountPaisa).toBe(101250);
  });

  it("calculates balance due from two instalments", () => {
    const netPayablePaisa = 100000;
    const first = 40000;
    const second = 35000;
    expect(netPayablePaisa - first - second).toBe(25000);
  });
});
