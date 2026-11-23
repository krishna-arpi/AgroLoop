import { test, expect } from "@playwright/test";

test("public research and data pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Turning residue into industrial value" })).toBeVisible();
  await page.goto("/research");
  await expect(page.getByRole("heading", { name: "A circular platform for residue valorization" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "From residue collection to industrial lot" })).toBeVisible();
  await page.goto("/data");
  await expect(page.getByRole("heading", { name: "Residue data and benchmarks" })).toBeVisible();
  await expect(page.getByLabel("Residue")).toBeVisible();
  await expect(page.getByLabel("Residue").locator("option").first()).toBeAttached();
  await expect(page.getByRole("heading", { name: "Hub economics calculator" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Paddy straw/ })).toBeVisible();
});

test("public lot lookup page renders", async ({ page }) => {
  await page.goto("/lot/NOT-A-REAL-LOT");
  await expect(page.getByRole("heading", { name: "Public lot lookup" })).toBeVisible();
});

test("marketplace grade filter shows published lots", async ({ page }) => {
  await page.goto("/marketplace");
  await expect(page.getByRole("heading", { name: "Marketplace" })).toBeVisible();
  await expect(page.getByText("LOT-AGL-001", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Grade").selectOption("A");
  await expect(page.getByText("LOT-AGL-001", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("LOT-AGL-007")).not.toBeVisible();
  await page.getByLabel("Product").selectOption("PYROLIGNEOUS_ACID");
  await expect(page.getByText("LOT-PA-001")).toBeVisible();
});

test("procurement, sales and inventory routes are accessible", async ({ page }) => {
  await page.goto("/procurement");
  await expect(page.getByRole("heading", { name: "Farmer purchases" })).toBeVisible();
  await page.goto("/sales");
  await expect(page.getByRole("heading", { name: "Customer sales" })).toBeVisible();
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "Inventory and reports" })).toBeVisible();
});

test("farmer and buyer features are accessible", async ({ page }) => {
  await page.goto("/farmer");
  await expect(page.getByRole("heading", { name: "Farmer residue offer" })).toBeVisible();
  await page.goto("/buyer");
  await expect(page.getByRole("heading", { name: "Industrial buyer portal" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "LOT-AGL-001" }).first()).toBeVisible();
});
