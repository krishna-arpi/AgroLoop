import { test, expect } from "@playwright/test";

test("public research and data pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
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
  await expect(page.getByText("LOT-AGL-001")).toBeVisible();
  await page.getByLabel("Grade").selectOption("A");
  await expect(page.getByText("LOT-AGL-001")).toBeVisible();
  await expect(page.getByText("LOT-AGL-007")).not.toBeVisible();
  await page.getByLabel("Product").selectOption("PYROLIGNEOUS_ACID");
  await expect(page.getByText("LOT-PA-001")).toBeVisible();
});

test("procurement, sales and inventory routes require login", async ({ page }) => {
  await page.goto("/procurement");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/sales");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/inventory");
  await expect(page).toHaveURL(/\/login$/);
});

test("demo hub login works", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("hub1@agroloop.local");
  await page.getByLabel("Password").fill("AgroLoop123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/hub$/);
});
