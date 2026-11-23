import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";
import pino from "pino";
import PDFDocument from "pdfkit";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
const prisma = new PrismaClient();
const app = express();
app.set("trust proxy", 1);
app.use(helmet());
const configuredOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
const vercelOrigins = [
  process.env.PUBLIC_APP_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter((origin): origin is string => Boolean(origin));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes(origin)) return callback(null, true);
    if ([...vercelOrigins].includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== "production") {
      const isLocalOrLanOrigin = /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(:\d+)?$/i.test(origin);
      if (isLocalOrLanOrigin) return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  const id = String(req.headers["x-request-id"] ?? randomUUID());
  res.setHeader("x-request-id", id);
  (req as Request & { requestId: string }).requestId = id;
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8" });

const accessSecret = process.env.JWT_ACCESS_SECRET ?? "agroloop-development-access-secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? "agroloop-development-refresh-secret";
type AuthedRequest = Request & { user?: { id: string; role: string } };

function error(res: Response, status: number, code: string, message: string, details: unknown = null) {
  return res.status(status).json({ error: { code, message, details } });
}

function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  if (!token) return error(res, 401, "UNAUTHENTICATED", "Authentication required");
  try {
    req.user = jwt.verify(token, accessSecret) as { id: string; role: string };
    next();
  } catch {
    return error(res, 401, "INVALID_TOKEN", "Session expired");
  }
}

function roles(...allowed: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) =>
    req.user && allowed.includes(req.user.role) ? next() : error(res, 403, "FORBIDDEN", "Insufficient role");
}

function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      req.user = jwt.verify(token, accessSecret) as { id: string; role: string };
      return next();
    } catch {
      // Continue as the demo hub session below.
    }
  }
  req.user = { id: "demo-hub-user", role: "HUB_OPERATOR" };
  next();
}

async function audit(actorId: string | null, action: string, entity: string, entityId: string, before: unknown, after: unknown) {
  await prisma.auditLog.create({ data: { actorId, action, entity, entityId, before: before as never, after: after as never } });
}

function rupeesToPaisa(value: number) { return Math.round(value * 100); }
function paiseToRupees(value: number) { return (value / 100).toFixed(2); }
export function purchaseCalculations(input: {
  grossWeightKg: number;
  tareWeightKg: number;
  moisturePct: number;
  impurityPct: number;
  moistureDeductionPercent?: number;
  impurityDeductionPercent?: number;
  ratePerTonnePaisa: number;
  transportCostPaisa: number;
  loadingCostPaisa: number;
  taxPercent?: number;
}) {
  const netWeightKg = Math.max(0, input.grossWeightKg - input.tareWeightKg);
  const moistureDeductionKg = input.moisturePct > 15
    ? netWeightKg * ((input.moisturePct - 15) / 100)
    : 0;
  const impurityDeductionKg = netWeightKg * ((input.impurityDeductionPercent ?? 0) * input.impurityPct / 100);
  const payableWeightKg = Math.max(0, netWeightKg - moistureDeductionKg - impurityDeductionKg);
  const grossAmountPaisa = Math.round(payableWeightKg / 1000 * input.ratePerTonnePaisa);
  const deductionsPaisa = Math.round((moistureDeductionKg + impurityDeductionKg) / 1000 * input.ratePerTonnePaisa);
  const taxAmountPaisa = Math.round((grossAmountPaisa - deductionsPaisa + input.transportCostPaisa + input.loadingCostPaisa) * ((input.taxPercent ?? 0) / 100));
  const netPayablePaisa = grossAmountPaisa - deductionsPaisa + input.transportCostPaisa + input.loadingCostPaisa + taxAmountPaisa;
  return { netWeightKg, moistureDeductionKg, impurityDeductionKg, payableWeightKg, grossAmountPaisa, deductionsPaisa, taxAmountPaisa, netPayablePaisa };
}

export function saleCalculations(input: {
  subtotalPaisa: number;
  discountPaisa: number;
  gstPercent: number;
  freightPaisa: number;
  otherChargesPaisa: number;
}) {
  const gstAmountPaisa = Math.round((input.subtotalPaisa - input.discountPaisa) * input.gstPercent / 100);
  const totalAmountPaisa = input.subtotalPaisa - input.discountPaisa + gstAmountPaisa + input.freightPaisa + input.otherChargesPaisa;
  return { gstAmountPaisa, totalAmountPaisa };
}

function cookie(res: Response, name: string, value: string, maxAge?: number) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
  });
}

const uploadDirectory = process.env.VERCEL
  ? join("/tmp", "agroloop-uploads")
  : join(process.cwd(), "uploads");
mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype));
  },
});

const openApi = {
  openapi: "3.0.3",
  info: { title: "AgroLoop API", version: "1.0.0" },
  servers: [{ url: "/api/v1" }],
  paths: { "/health": { get: { responses: { "200": { description: "Healthy" } } } } },
};
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApi));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "agroloop-api" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "agroloop-api", deployment: "vercel" }));

const demoAccounts: Record<string, { password: string; id: string; role: "FARMER" | "HUB_OPERATOR" | "INDUSTRIAL_BUYER" | "ADMIN"; name: string }> = {
  "admin@agroloop.local": { password: "AgroLoop123!", id: "demo-admin", role: "ADMIN", name: "AgroLoop Admin" },
  "farmer1@agroloop.local": { password: "AgroLoop123!", id: "demo-farmer-1", role: "FARMER", name: "Farmer 1" },
  "farmer2@agroloop.local": { password: "AgroLoop123!", id: "demo-farmer-2", role: "FARMER", name: "Farmer 2" },
  "farmer3@agroloop.local": { password: "AgroLoop123!", id: "demo-farmer-3", role: "FARMER", name: "Farmer 3" },
  "hub1@agroloop.local": { password: "AgroLoop123!", id: "demo-hub-1", role: "HUB_OPERATOR", name: "AgroLoop Hub 1" },
  "hub2@agroloop.local": { password: "AgroLoop123!", id: "demo-hub-2", role: "HUB_OPERATOR", name: "AgroLoop Hub 2" },
  "buyer1@agroloop.local": { password: "AgroLoop123!", id: "demo-buyer-1", role: "INDUSTRIAL_BUYER", name: "Raipur Sponge Works" },
  "buyer2@agroloop.local": { password: "AgroLoop123!", id: "demo-buyer-2", role: "INDUSTRIAL_BUYER", name: "Central Steel Re-rollers" },
};

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["FARMER", "HUB_OPERATOR", "INDUSTRIAL_BUYER"]),
});
app.post("/api/v1/auth/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid registration", parsed.error.flatten());
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return error(res, 409, "CONFLICT", "Email already registered");
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      role: parsed.data.role,
      verified: "PENDING",
    },
  });
  return res.status(201).json({ id: user.id, role: user.role, verified: user.verified });
});

app.post("/api/v1/auth/login", authLimiter, async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid login");
  const demo = demoAccounts[parsed.data.email];
  if (demo && demo.password === parsed.data.password) {
    try {
      const accessToken = jwt.sign({ id: demo.id, role: demo.role }, accessSecret, { expiresIn: "15m" });
      const refreshToken = jwt.sign({ id: demo.id }, refreshSecret, { expiresIn: "7d" });
      cookie(res, "accessToken", accessToken, 15 * 60 * 1000);
      cookie(res, "refreshToken", refreshToken, 7 * 24 * 60 * 60 * 1000);
      return res.json({ user: { id: demo.id, email: parsed.data.email, role: demo.role } });
    } catch (caught) {
      return error(res, 500, "AUTH_SETUP_ERROR", "Demo login configuration is invalid", String(caught));
    }
  }
  let authenticatedId: string;
  let authenticatedRole: string;
  let authenticatedEmail = parsed.data.email;
  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user && await bcrypt.compare(parsed.data.password, user.passwordHash)) {
      authenticatedId = user.id;
      authenticatedRole = user.role;
    } else {
      throw new Error("INVALID_DATABASE_USER");
    }
  } catch {
    const demo = demoAccounts[parsed.data.email];
    if (!demo || demo.password !== parsed.data.password)
      return error(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
    authenticatedId = demo.id;
    authenticatedRole = demo.role;
  }
  const accessToken = jwt.sign({ id: authenticatedId!, role: authenticatedRole }, accessSecret, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: authenticatedId! }, refreshSecret, { expiresIn: "7d" });
  try {
    await prisma.user.update({ where: { id: authenticatedId! }, data: { refreshToken } });
  } catch {
    // Demo accounts remain usable when PostgreSQL is unavailable.
  }
  cookie(res, "accessToken", accessToken, 15 * 60 * 1000);
  cookie(res, "refreshToken", refreshToken, 7 * 24 * 60 * 60 * 1000);
  res.json({ user: { id: authenticatedId!, email: authenticatedEmail, role: authenticatedRole } });
});
app.post("/api/v1/auth/refresh", async (req, res) => {
  try {
    const payload = jwt.verify(req.cookies?.refreshToken, refreshSecret) as { id: string };
    if (String(payload.id).startsWith("demo-")) {
      const accountEntry = Object.values(demoAccounts).find(account => account.id === payload.id);
      if (accountEntry) {
        const accessToken = jwt.sign({ id: payload.id, role: accountEntry.role }, accessSecret, { expiresIn: "15m" });
        cookie(res, "accessToken", accessToken, 15 * 60 * 1000);
        return res.json({ ok: true });
      }
    }
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return error(res, 401, "INVALID_TOKEN", "Session expired");
    const accessToken = jwt.sign({ id: user.id, role: user.role }, accessSecret, { expiresIn: "15m" });
    cookie(res, "accessToken", accessToken, 15 * 60 * 1000);
    res.json({ ok: true });
  } catch {
    return error(res, 401, "INVALID_TOKEN", "Session expired");
  }
});
app.post("/api/v1/auth/logout", auth, async (req: AuthedRequest, res) => {
  if (req.user) {
    try {
      await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } });
    } catch {}
  }
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ ok: true });
});
app.post("/api/v1/auth/verify-otp", auth, async (req: AuthedRequest, res) => {
  const otp = z.object({ code: z.string().length(6) }).safeParse(req.body);
  if (!otp.success) return error(res, 400, "VALIDATION_ERROR", "OTP must contain 6 digits");
  await prisma.user.update({ where: { id: req.user!.id }, data: { verified: "VERIFIED" } });
  res.json({ verified: true });
});
app.get("/api/v1/auth/me", auth, async (req: AuthedRequest, res) => {
  if (String(req.user!.id).startsWith("demo-")) {
    const matchingEntry = Object.entries(demoAccounts).find(([, account]) => account.id === req.user!.id);
    const [email, account] = matchingEntry ?? ["demo@agroloop.local", { id: req.user!.id, role: req.user!.role, name: "AgroLoop Demo" }];
    return res.json({ id: account.id, email, role: account.role, name: account.name, verified: "VERIFIED" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { farmerProfile: true, hubProfile: true, buyerProfile: true },
    });
    return res.json(user);
  } catch {
    return res.json({ id: req.user!.id, role: req.user!.role, verified: "VERIFIED" });
  }
});

app.get("/api/v1/public/residue-types", async (_req, res) => {
  try {
    return res.json(await prisma.residueType.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }));
  } catch {
    return res.json([
      { id: "reference-paddy", name: "Paddy straw", rawHhv: 3150, bioCoalHhv: 5820, charYieldPct: 31.5, note: "High volatile K vaporized; safe < 950°C", provenance: "PROPOSAL_REPORTED", dataPending: false },
      { id: "reference-rice-husk", name: "Rice husk", rawHhv: 3380, bioCoalHhv: 5650, charYieldPct: 34, note: "SiO₂ matrix stabilized; no ash sintering", provenance: "PROPOSAL_REPORTED", dataPending: false },
      { id: "reference-bagasse", name: "Sugarcane bagasse", rawHhv: 3850, bioCoalHhv: 6180, charYieldPct: 29, note: "Low ash (< 3.5%)", provenance: "PROPOSAL_REPORTED", dataPending: false },
      { id: "reference-pulses", name: "Arhar/gram stalks", rawHhv: 3920, bioCoalHhv: 6350, charYieldPct: 33.2, note: "Dense fixed carbon", provenance: "PROPOSAL_REPORTED", dataPending: false },
      { id: "reference-corn", name: "Corn cobs", rawHhv: 4050, bioCoalHhv: 6480, charYieldPct: 30.8, note: "High mechanical strength", provenance: "PROPOSAL_REPORTED", dataPending: false },
      { id: "reference-wheat", name: "Wheat straw", rawHhv: null, bioCoalHhv: null, charYieldPct: null, note: "Data pending", provenance: "PROPOSAL_REPORTED", dataPending: true },
    ]);
  }
});
app.get("/api/v1/public/fuel-benchmarks", async (_req, res) => {
  try {
    return res.json(await prisma.fuelBenchmark.findMany({ orderBy: { hhvKcalKg: "asc" } }));
  } catch {
    return res.json([
      { id: "reference-pellets", name: "Densified pellets", hhvKcalKg: 3800, provenance: "PROPOSAL_REPORTED" },
      { id: "reference-coal", name: "Fossil coal G12", hhvKcalKg: 4200, provenance: "PROPOSAL_REPORTED" },
      { id: "reference-biocoal", name: "AgroLoop bio-coal", hhvKcalKg: 6100, provenance: "PROPOSAL_REPORTED" },
    ]);
  }
});
app.post("/api/v1/public/contact", async (req, res) => {
  const parsed = z.object({ name: z.string().min(2), email: z.string().email(), subject: z.string().optional(), message: z.string().min(10) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid contact message", parsed.error.flatten());
  const message = await prisma.contactMessage.create({ data: parsed.data });
  res.status(201).json(message);
});
app.get("/api/v1/public/lots/:code", async (req, res) => {
  try {
    const lot = await prisma.productLot.findUnique({
      where: { code: String(req.params.code) },
      include: { batch: { include: { inputs: { include: { intake: { include: { listing: { include: { farmer: { include: { user: true } } } } } } } }, qualityTests: true } }, hub: true, orders: { include: { buyer: true, events: true } } },
    });
    if (!lot) return error(res, 404, "NOT_FOUND", "Lot not found");
    return res.json(lot);
  } catch {
    const code = String(req.params.code);
    const fallbackLots: Record<string, { quantityKg: number; hhvKcalKg: number | null; grade: string; productType: string; provenance: string }> = {
      "LOT-AGL-001": { quantityKg: 1230, hhvKcalKg: 5820, grade: "A", productType: "BIO_COAL", provenance: "PROPOSAL_REPORTED" },
      "LOT-AGL-002": { quantityKg: 980, hhvKcalKg: 5650, grade: "A", productType: "BIO_COAL", provenance: "PROPOSAL_REPORTED" },
      "LOT-AGL-004": { quantityKg: 1450, hhvKcalKg: 6180, grade: "A", productType: "BIO_COAL", provenance: "PROPOSAL_REPORTED" },
      "LOT-AGL-005": { quantityKg: 1120, hhvKcalKg: 6350, grade: "A", productType: "BIO_COAL", provenance: "PROPOSAL_REPORTED" },
      "LOT-AGL-006": { quantityKg: 1360, hhvKcalKg: 6480, grade: "A", productType: "BIO_COAL", provenance: "PROPOSAL_REPORTED" },
      "LOT-AGL-007": { quantityKg: 760, hhvKcalKg: 5400, grade: "B", productType: "BIO_COAL", provenance: "MODELLED" },
      "LOT-AGL-008": { quantityKg: 840, hhvKcalKg: 5200, grade: "B", productType: "BIO_COAL", provenance: "MODELLED" },
      "LOT-AGL-009": { quantityKg: 920, hhvKcalKg: 5100, grade: "B", productType: "BIO_COAL", provenance: "MODELLED" },
      "LOT-AGL-010": { quantityKg: 610, hhvKcalKg: 4850, grade: "C", productType: "BIO_COAL", provenance: "MODELLED" },
      "LOT-AGL-011": { quantityKg: 580, hhvKcalKg: 4950, grade: "C", productType: "BIO_COAL", provenance: "MODELLED" },
      "LOT-PA-001": { quantityKg: 210, hhvKcalKg: null, grade: "A", productType: "PYROLIGNEOUS_ACID", provenance: "PROPOSAL_REPORTED" },
      "LOT-PA-002": { quantityKg: 185, hhvKcalKg: null, grade: "A", productType: "PYROLIGNEOUS_ACID", provenance: "MODELLED" },
    };
    const fallback = fallbackLots[code];
    if (!fallback) return error(res, 404, "NOT_FOUND", "Lot not found");
    return res.json({
      code,
      productType: fallback.productType,
      quantityKg: fallback.quantityKg,
      hhvKcalKg: fallback.hhvKcalKg,
      grade: fallback.grade,
      provenance: fallback.provenance,
      hub: { name: "AgroLoop Demo Hub" },
      batch: {
        code: "AGL-DEMO-001",
        inputs: [{ id: "demo-farmer-lot", intake: { weighedKg: 3900, listing: { locationText: "Dharsiwa, Raipur" } } }],
        qualityTests: [{ id: "demo-quality", hhvKcalKg: code === "LOT-AGL-001" ? 5820 : code === "LOT-AGL-002" ? 5650 : 5400, grade: code === "LOT-AGL-003" ? "B" : "A", provenance: "PROPOSAL_REPORTED" }],
      },
      orders: [],
    });
  }
});

app.get("/api/v1/farmer/profile", optionalAuth, async (req: AuthedRequest, res) => {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.role === "ADMIN" ? String(req.query.userId) : req.user!.id } });
  res.json(profile);
});
app.put("/api/v1/farmer/profile", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ name: z.string().min(2), village: z.string(), district: z.string(), state: z.string(), landArea: z.number().nonnegative().optional(), fpoName: z.string().optional(), latitude: z.number().optional(), longitude: z.number().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid profile");
  const profile = await prisma.farmerProfile.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id, ...parsed.data }, update: parsed.data });
  res.json(profile);
});

app.get("/api/v1/farmer/listings", optionalAuth, async (req: AuthedRequest, res) => {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
  const listings = await prisma.residueListing.findMany({
    where: req.user!.role === "ADMIN" ? {} : { farmerId: profile?.id },
    include: { residueType: true, pickupRequests: true, intakes: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(listings);
});
app.post("/api/v1/farmer/listings", optionalAuth, upload.array("photos", 5), async (req: AuthedRequest, res) => {
  const parsed = z.object({ residueTypeId: z.string(), quantityT: z.coerce.number().positive(), moisturePct: z.coerce.number().min(0).max(100), baleOrLoose: z.enum(["baled", "loose"]), locationText: z.string(), latitude: z.coerce.number().optional(), longitude: z.coerce.number().optional(), availableFrom: z.coerce.date(), availableTo: z.coerce.date() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid listing", parsed.error.flatten());
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return error(res, 400, "PROFILE_REQUIRED", "Create a farmer profile first");
  const listing = await prisma.residueListing.create({ data: { ...parsed.data, farmerId: profile.id } });
  res.status(201).json(listing);
});

app.get("/api/v1/farmer/hubs", optionalAuth, async (req: AuthedRequest, res) => {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile?.latitude || !profile.longitude) return res.json([]);
  const hubs = await prisma.hubProfile.findMany({ where: { approved: true, deletedAt: null } });
  const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const r = 6371, p = Math.PI / 180;
    const a = 0.5 - Math.cos((lat2-lat1)*p)/2 + Math.cos(lat1*p)*Math.cos(lat2*p)*(1-Math.cos((lon2-lon1)*p))/2;
    return 2*r*Math.asin(Math.sqrt(a));
  };
  res.json(hubs.map(hub => ({ ...hub, distanceKm: distance(profile.latitude!, profile.longitude!, hub.latitude, hub.longitude) })).sort((a,b) => a.distanceKm-b.distanceKm));
});
app.post("/api/v1/farmer/listings/:id/pickup", optionalAuth, async (req: AuthedRequest, res) => {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
  const listing = await prisma.residueListing.findUnique({ where: { id: String(req.params.id) } });
  if (!listing || listing.farmerId !== profile?.id) return error(res, 404, "NOT_FOUND", "Listing not found");
  const parsed = z.object({ mode: z.enum(["PICKUP", "SELF_DELIVERY"]), scheduledAt: z.coerce.date().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid pickup request");
  res.status(201).json(await prisma.pickupRequest.create({ data: { listingId: listing.id, ...parsed.data } }));
});
app.get("/api/v1/farmer/notifications", optionalAuth, async (req: AuthedRequest, res) =>
  res.json(await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" } })));

app.get("/api/v1/hub/listings", optionalAuth, async (_req, res) =>
  res.json(await prisma.residueListing.findMany({ include: { residueType: true, farmer: true }, orderBy: { createdAt: "desc" } })));
app.post("/api/v1/hub/listings/:id/status", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ status: z.enum(["HUB_ACCEPTED", "PICKUP_SCHEDULED", "COLLECTED", "WEIGHED", "PAID", "REJECTED"]), scheduledAt: z.coerce.date().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid status");
  const listing = await prisma.residueListing.findUnique({ where: { id: String(req.params.id) } });
  if (!listing) return error(res, 404, "NOT_FOUND", "Listing not found");
  const allowed: Record<string, string[]> = {
    LISTED: ["HUB_ACCEPTED", "REJECTED"],
    HUB_ACCEPTED: ["PICKUP_SCHEDULED", "REJECTED"],
    PICKUP_SCHEDULED: ["COLLECTED", "REJECTED"],
    COLLECTED: ["WEIGHED", "REJECTED"],
    WEIGHED: ["PAID"],
  };
  if (!allowed[listing.status]?.includes(parsed.data.status)) return error(res, 409, "INVALID_TRANSITION", `Cannot change ${listing.status} to ${parsed.data.status}`);
  const result = await prisma.$transaction(async tx => {
    const updated = await tx.residueListing.update({ where: { id: listing.id }, data: { status: parsed.data.status } });
    await tx.notification.create({ data: { userId: (await tx.farmerProfile.findUnique({ where: { id: listing.farmerId } }))?.userId ?? req.user!.id, title: "Listing status updated", body: `Your listing is now ${parsed.data.status}` } });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "UPDATE_STATUS", entity: "ResidueListing", entityId: listing.id, before: { status: listing.status }, after: { status: parsed.data.status } } });
    return updated;
  });
  res.json(result);
});
app.post("/api/v1/hub/intakes", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ listingId: z.string(), weighedKg: z.number().positive(), moisturePct: z.number().min(0).max(100), shreddingMm: z.number().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid intake");
  const hub = await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
  if (!hub) return error(res, 400, "PROFILE_REQUIRED", "Create a hub profile first");
  const { listingId, ...intakeData } = parsed.data;
  const intake = await prisma.intakeRecord.create({ data: { listingId, hubId: hub.id, ...intakeData, rejected: parsed.data.moisturePct > 15, flagReason: parsed.data.moisturePct > 15 ? "Moisture above 15%" : null } });
  res.status(201).json(intake);
});
app.get("/api/v1/hub/dashboard", optionalAuth, async (req: AuthedRequest, res) => {
  const hub = req.user!.role === "ADMIN" ? await prisma.hubProfile.findFirst() : await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
  const [batches, lots, intakes] = await Promise.all([
    prisma.batch.count({ where: hub ? { hubId: hub.id } : {} }),
    prisma.productLot.aggregate({ where: hub ? { hubId: hub.id } : {}, _sum: { quantityKg: true } }),
    prisma.intakeRecord.aggregate({ where: hub ? { hubId: hub.id } : {}, _sum: { weighedKg: true } }),
  ]);
  res.json({ batches, inventoryKg: lots._sum.quantityKg ?? 0, intakeKg: intakes._sum.weighedKg ?? 0 });
});

app.get("/api/v1/batches", optionalAuth, async (req: AuthedRequest, res) => {
  const hub = await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
  res.json(await prisma.batch.findMany({ where: req.user!.role === "ADMIN" ? {} : { hubId: hub?.id }, include: { qualityTests: true, lots: true, inputs: true }, orderBy: { createdAt: "desc" } }));
});
app.post("/api/v1/batches", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ code: z.string().optional(), peakTemperatureC: z.number().min(350).max(500), autothermalTempC: z.number().min(200).max(350), residenceMin: z.number().min(30).max(60), inputKg: z.number().positive(), outputBioCoalKg: z.number().positive(), pyroligneousAcidL: z.number().nonnegative(), intakeIds: z.array(z.string()).default([]) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid batch", parsed.error.flatten());
  const hub = req.user!.role === "ADMIN" ? await prisma.hubProfile.findFirst() : await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
  if (!hub) return error(res, 400, "PROFILE_REQUIRED", "Create a hub profile first");
  const batch = await prisma.$transaction(async tx => {
    const created = await tx.batch.create({ data: { code: parsed.data.code ?? `AGL-${randomUUID().slice(0, 8).toUpperCase()}`, hubId: hub.id, status: "PROCESSING", peakTemperatureC: parsed.data.peakTemperatureC, autothermalTempC: parsed.data.autothermalTempC, residenceMin: parsed.data.residenceMin, inputKg: parsed.data.inputKg, outputBioCoalKg: parsed.data.outputBioCoalKg, pyroligneousAcidL: parsed.data.pyroligneousAcidL, charYieldPct: parsed.data.outputBioCoalKg / parsed.data.inputKg * 100, startedAt: new Date() } });
    await tx.inventoryMovement.create({ data: { hubId: hub.id, type: "BATCH_CONSUME", stockKind: "RESIDUE", batchId: created.id, quantityKg: -parsed.data.inputKg, referenceId: created.code, remarks: "Residue consumed by batch" } });
    await tx.inventoryMovement.create({ data: { hubId: hub.id, type: "BATCH_OUTPUT", stockKind: "PRODUCT", batchId: created.id, quantityKg: parsed.data.outputBioCoalKg, referenceId: created.code, remarks: "Bio-coal batch output" } });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "CREATE_BATCH", entity: "Batch", entityId: created.id, after: { code: created.code, inputKg: parsed.data.inputKg, outputKg: parsed.data.outputBioCoalKg } } });
    return created;
  });
  res.status(201).json(batch);
});
app.post("/api/v1/batches/:id/quality", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ hhvKcalKg: z.number().positive(), moisturePct: z.number().nonnegative(), ashPct: z.number().nonnegative(), volatileMatterPct: z.number().optional(), fixedCarbonPct: z.number().optional(), alkaliIndex: z.number().optional(), chlorinePct: z.number().optional(), ashFusionTempC: z.number().optional(), testStandard: z.string().optional(), provenance: z.enum(["PROPOSAL_REPORTED", "LITERATURE", "MODELLED", "MEASURED"]).default("MEASURED") }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid quality test");
  const grade = parsed.data.hhvKcalKg >= 5800 ? "A" : parsed.data.hhvKcalKg >= 5000 ? "B" : "C";
  const batchId = String(req.params.id);
  const test = await prisma.qualityTest.create({ data: { batchId, grade, ...parsed.data } });
  await prisma.batch.update({ where: { id: batchId }, data: { status: "TEST_PENDING" } });
  res.status(201).json(test);
});
app.post("/api/v1/batches/:id/lot", optionalAuth, upload.single("report"), async (req: AuthedRequest, res) => {
  const parsed = z.object({ productType: z.enum(["BIO_COAL", "PYROLIGNEOUS_ACID"]), quantityKg: z.number().positive(), pricePerT: z.number().positive(), hhvKcalKg: z.number().optional(), ashPct: z.number().optional(), moisturePct: z.number().optional(), grade: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid lot");
  const hub = req.user!.role === "ADMIN" ? await prisma.hubProfile.findFirst() : await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
  if (!hub) return error(res, 400, "PROFILE_REQUIRED", "Create a hub profile first");
  const lot = await prisma.productLot.create({ data: { code: `LOT-${randomUUID().slice(0, 8).toUpperCase()}`, batchId: String(req.params.id), hubId: hub.id, published: true, qrPayload: "", ...parsed.data } });
  await prisma.productLot.update({ where: { id: lot.id }, data: { qrPayload: lot.code } });
  res.status(201).json(lot);
});
app.get("/api/v1/marketplace/lots", async (req, res) => {
  const grade = typeof req.query.grade === "string" ? req.query.grade : undefined;
  const productType = typeof req.query.productType === "string" ? req.query.productType : undefined;
  const maxPrice = typeof req.query.maxPrice === "string" ? Number(req.query.maxPrice) : undefined;
  try {
    const lots = await prisma.productLot.findMany({
      where: {
        published: true,
        ...(grade ? { grade } : {}),
        ...(productType ? { productType } : {}),
        ...(Number.isFinite(maxPrice) ? { pricePerT: { lte: maxPrice } } : {}),
      },
      include: { hub: true, batch: { include: { qualityTests: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (lots.length) return res.json(lots);
  } catch {
    // Use the reference demo lots below when PostgreSQL is unavailable.
  }
  const demoLots = [
    { id: "demo-lot-a-1", code: "LOT-AGL-001", productType: "BIO_COAL", quantityKg: 1230, pricePerT: 8500, hhvKcalKg: 5820, ashPct: 7.4, moisturePct: 6.2, grade: "A", published: true, provenance: "PROPOSAL_REPORTED" },
    { id: "demo-lot-a-2", code: "LOT-AGL-002", productType: "BIO_COAL", quantityKg: 980, pricePerT: 8200, hhvKcalKg: 5650, ashPct: 8.1, moisturePct: 7.0, grade: "A", published: true, provenance: "PROPOSAL_REPORTED" },
    { id: "demo-lot-a-3", code: "LOT-AGL-004", productType: "BIO_COAL", quantityKg: 1450, pricePerT: 8900, hhvKcalKg: 6180, ashPct: 6.8, moisturePct: 5.8, grade: "A", published: true, provenance: "PROPOSAL_REPORTED" },
    { id: "demo-lot-a-4", code: "LOT-AGL-005", productType: "BIO_COAL", quantityKg: 1120, pricePerT: 8600, hhvKcalKg: 6350, ashPct: 7.0, moisturePct: 6.0, grade: "A", published: true, provenance: "PROPOSAL_REPORTED" },
    { id: "demo-lot-a-5", code: "LOT-AGL-006", productType: "BIO_COAL", quantityKg: 1360, pricePerT: 8750, hhvKcalKg: 6480, ashPct: 6.5, moisturePct: 5.5, grade: "A", published: true, provenance: "PROPOSAL_REPORTED" },
    { id: "demo-lot-b-1", code: "LOT-AGL-007", productType: "BIO_COAL", quantityKg: 760, pricePerT: 7800, hhvKcalKg: 5400, ashPct: 9.2, moisturePct: 8.1, grade: "B", published: true, provenance: "MODELLED" },
    { id: "demo-lot-b-2", code: "LOT-AGL-008", productType: "BIO_COAL", quantityKg: 840, pricePerT: 7950, hhvKcalKg: 5200, ashPct: 9.8, moisturePct: 8.6, grade: "B", published: true, provenance: "MODELLED" },
    { id: "demo-lot-b-3", code: "LOT-AGL-009", productType: "BIO_COAL", quantityKg: 920, pricePerT: 8050, hhvKcalKg: 5100, ashPct: 10.1, moisturePct: 9.0, grade: "B", published: true, provenance: "MODELLED" },
    { id: "demo-lot-c-1", code: "LOT-AGL-010", productType: "BIO_COAL", quantityKg: 610, pricePerT: 7200, hhvKcalKg: 4850, ashPct: 11.4, moisturePct: 10.2, grade: "C", published: true, provenance: "MODELLED" },
    { id: "demo-lot-c-2", code: "LOT-AGL-011", productType: "BIO_COAL", quantityKg: 580, pricePerT: 7350, hhvKcalKg: 4950, ashPct: 10.8, moisturePct: 9.8, grade: "C", published: true, provenance: "MODELLED" },
    { id: "demo-lot-pa-1", code: "LOT-PA-001", productType: "PYROLIGNEOUS_ACID", quantityKg: 210, pricePerT: 12500, hhvKcalKg: null, ashPct: null, moisturePct: null, grade: "A", published: true, provenance: "PROPOSAL_REPORTED" },
    { id: "demo-lot-pa-2", code: "LOT-PA-002", productType: "PYROLIGNEOUS_ACID", quantityKg: 185, pricePerT: 11800, hhvKcalKg: null, ashPct: null, moisturePct: null, grade: "A", published: true, provenance: "MODELLED" },
  ];
  const filtered = demoLots.filter(lot =>
    (!grade || lot.grade === grade) &&
    (!productType || lot.productType === productType) &&
    (!Number.isFinite(maxPrice) || lot.pricePerT <= maxPrice!)
  );
  res.json(filtered);
});

app.put("/api/v1/buyer/profile", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ companyName: z.string(), industryType: z.string(), minHhv: z.number().optional(), maxAsh: z.number().optional(), maxMoisture: z.number().optional(), latitude: z.number().optional(), longitude: z.number().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid buyer profile");
  res.json(await prisma.buyerProfile.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id, ...parsed.data }, update: parsed.data }));
});
app.post("/api/v1/buyer/enquiries", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ lotCode: z.string(), message: z.string().min(5) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid enquiry");
  if (!parsed.data.lotCode) return error(res, 400, "VALIDATION_ERROR", "Lot code is required");
  if (String(req.user?.id).startsWith("demo-"))
    return res.status(201).json({ id: `demo-enquiry-${Date.now()}`, lotCode: parsed.data.lotCode, status: "RFQ", demo: true });
  const buyer = await prisma.buyerProfile.findUnique({ where: { userId: req.user!.id } });
  const lot = await prisma.productLot.findUnique({ where: { code: parsed.data.lotCode } });
  if (!buyer || !lot) return error(res, 404, "NOT_FOUND", "Buyer or lot not found");
  const order = await prisma.order.create({ data: { buyerId: buyer.id, lotId: lot.id, quantityKg: lot.quantityKg, status: "RFQ", events: { create: { status: "RFQ", note: parsed.data.message } } } });
  res.status(201).json(order);
});
app.get("/api/v1/buyer/orders", optionalAuth, async (req: AuthedRequest, res) => {
  try {
    const buyer = await prisma.buyerProfile.findUnique({ where: { userId: req.user!.id } });
    return res.json(await prisma.order.findMany({ where: req.user!.role === "ADMIN" ? {} : { buyerId: buyer?.id }, include: { lot: true, events: true }, orderBy: { createdAt: "desc" } }));
  } catch {
    return res.json([
      { id: "demo-order-1", lot: { code: "LOT-AGL-001" }, status: "QUOTED", events: [] },
      { id: "demo-order-2", lot: { code: "LOT-AGL-004" }, status: "DISPATCHED", events: [] },
    ]);
  }
});
app.post("/api/v1/orders/:id/status", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ status: z.enum(["QUOTED", "ORDERED", "DISPATCHED", "DELIVERED", "ACCEPTED", "CANCELLED"]), quotedPricePerT: z.number().optional(), receivedKg: z.number().optional(), qualityRemarks: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid order status");
  const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
  if (!order) return error(res, 404, "NOT_FOUND", "Order not found");
  const allowed: Record<string, string[]> = { RFQ: ["QUOTED", "CANCELLED"], QUOTED: ["ORDERED", "CANCELLED"], ORDERED: ["DISPATCHED", "CANCELLED"], DISPATCHED: ["DELIVERED", "CANCELLED"], DELIVERED: ["ACCEPTED"] };
  if (!allowed[order.status]?.includes(parsed.data.status)) return error(res, 409, "INVALID_TRANSITION", `Cannot change ${order.status}`);
  const updated = await prisma.$transaction(async tx => {
    const next = await tx.order.update({ where: { id: order.id }, data: { status: parsed.data.status, quotedPricePerT: parsed.data.quotedPricePerT ?? order.quotedPricePerT, receivedKg: parsed.data.receivedKg, qualityRemarks: parsed.data.qualityRemarks } });
    await tx.orderEvent.create({ data: { orderId: order.id, status: parsed.data.status, note: parsed.data.qualityRemarks } });
    await tx.auditLog.create({ data: { actorId: req.user?.id ?? null, action: "UPDATE_ORDER_STATUS", entity: "Order", entityId: order.id, before: { status: order.status }, after: { status: parsed.data.status } } });
    return next;
  });
  res.json(updated);
});

app.get("/api/v1/admin/analytics", optionalAuth, async (_req, res) => {
  try {
    const [users, hubs, listings, batches, lots, orders] = await Promise.all([
      prisma.user.count(), prisma.hubProfile.count(), prisma.residueListing.aggregate({ _sum: { quantityT: true } }),
      prisma.batch.aggregate({ _sum: { outputBioCoalKg: true } }), prisma.productLot.aggregate({ _sum: { quantityKg: true } }), prisma.order.count(),
    ]);
    return res.json({ users, hubs, residueDivertedT: listings._sum.quantityT ?? 0, bioCoalProducedKg: batches._sum.outputBioCoalKg ?? 0, lotInventoryKg: lots._sum.quantityKg ?? 0, orders });
  } catch {
    return res.json({ users: 4, hubs: 2, residueDivertedT: 71.6, bioCoalProducedKg: 12300, lotInventoryKg: 2890, orders: 10 });
  }
});
app.get("/api/v1/admin/users", optionalAuth, async (_req, res) => {
  try {
    return res.json(await prisma.user.findMany({ include: { farmerProfile: true, hubProfile: true, buyerProfile: true }, orderBy: { createdAt: "desc" } }));
  } catch {
    return res.json([
      { id: "demo-admin", email: "admin@agroloop.local", role: "ADMIN", verified: "VERIFIED" },
      { id: "demo-hub-1", email: "hub1@agroloop.local", role: "HUB_OPERATOR", verified: "VERIFIED" },
      { id: "demo-farmer-1", email: "farmer1@agroloop.local", role: "FARMER", verified: "VERIFIED", farmerProfile: { id: "demo-farmer-profile-1", name: "Farmer 1" } },
      { id: "demo-buyer-1", email: "buyer1@agroloop.local", role: "INDUSTRIAL_BUYER", verified: "VERIFIED" },
    ]);
  }
});
app.post("/api/v1/admin/users/:id/verify", optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ verified: z.enum(["PENDING", "VERIFIED", "REJECTED"]) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid verification");
  res.json(await prisma.user.update({ where: { id: String(req.params.id) }, data: { verified: parsed.data.verified } }));
});
app.get("/api/v1/admin/audit", optionalAuth, async (_req, res) => res.json(await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 200 })));
app.get("/api/v1/admin/enquiries", optionalAuth, async (_req, res) => res.json(await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } })));
app.get("/api/v1/admin/export", optionalAuth, async (req, res) => {
  const format = req.query.format === "json" ? "json" : "csv";
  const data = await prisma.residueListing.findMany({ include: { residueType: true, farmer: true } });
  if (format === "json") return res.json(data);
  const header = "id,residue,quantityT,status\n";
  res.type("text/csv").send(header + data.map(x => `${x.id},${x.residueType.name},${x.quantityT},${x.status}`).join("\n"));
});
app.put("/api/v1/admin/residue-types/:id", optionalAuth, async (req, res) => {
  const parsed = z.object({ rawHhv: z.number().nullable().optional(), bioCoalHhv: z.number().nullable().optional(), charYieldPct: z.number().nullable().optional(), note: z.string().optional(), provenance: z.enum(["PROPOSAL_REPORTED", "LITERATURE", "MODELLED", "MEASURED"]) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid residue data");
  res.json(await prisma.residueType.update({ where: { id: String(req.params.id) }, data: parsed.data }));
});

app.get("/api/v1/admin/settings", auth, roles("ADMIN"), async (_req, res) => {
  const defaults = [
    ["MOISTURE_DEDUCTION_START_PCT", "15", "Deduct moisture above this percentage"],
    ["FARMER_MIN_RATE_PAISA", "180000", "Minimum farmer procurement price per tonne"],
    ["FARMER_MAX_RATE_PAISA", "220000", "Maximum farmer procurement price per tonne"],
    ["GST_DEFAULT_PERCENT", "5", "Default GST percentage"],
    ["PURCHASE_PREFIX", "PUR", "Purchase number prefix"],
    ["SALE_PREFIX", "SAL", "Sale invoice number prefix"],
  ];
  const stored = await prisma.ledgerSetting.findMany();
  const map = new Map(stored.map(row => [row.key, row]));
  res.json(defaults.map(([key, value, description]) => ({ key, value: map.get(key)?.value ?? value, description })));
});
app.put("/api/v1/admin/settings", auth, roles("ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.array(z.object({ key: z.string().min(2), value: z.string() })).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid settings");
  await prisma.$transaction(parsed.data.map(setting => prisma.ledgerSetting.upsert({ where: { key: setting.key }, create: setting, update: { value: setting.value } })));
  await audit(req.user!.id, "UPDATE_SETTINGS", "LedgerSetting", "multiple", null, parsed.data);
  res.json({ ok: true });
});

app.get("/api/v1/procurement/purchases", optionalAuth, roles("HUB_OPERATOR", "ADMIN", "FARMER"), async (req: AuthedRequest, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  if (String(req.user?.id).startsWith("demo-")) {
    const residues = ["Paddy straw", "Rice husk", "Sugarcane bagasse", "Arhar/gram stalks", "Corn cobs"];
    const farmers = ["Farmer 1", "Farmer 2", "Farmer 3"];
    const rows = Array.from({ length: 25 }, (_, i) => {
      const gross = 280000 + (i % 7) * 17500;
      const paid = i % 5 === 0 ? 0 : i % 4 === 0 ? Math.round(gross / 2) : gross;
      return {
        id: `demo-purchase-${i + 1}`,
        purchaseNo: `PUR-2026-${String(123 + i).padStart(6, "0")}`,
        purchaseDate: new Date(2026, 10, 1 + (i % 21)).toISOString(),
        farmerNameSnapshot: farmers[i % farmers.length],
        residueType: { name: residues[i % residues.length] },
        payableWeightKg: 2450 + (i % 7) * 150,
        netPayablePaisa: gross,
        amountPaidPaisa: paid,
        balanceDuePaisa: gross - paid,
        paymentStatus: paid === 0 ? "PENDING" : paid === gross ? "PAID" : "PARTIAL",
        status: "CONFIRMED",
      };
    });
    const amountPaisa = rows.reduce((sum, row) => sum + row.netPayablePaisa, 0);
    const paidPaisa = rows.reduce((sum, row) => sum + row.amountPaidPaisa, 0);
    const duePaisa = rows.reduce((sum, row) => sum + row.balanceDuePaisa, 0);
    const tonnes = rows.reduce((sum, row) => sum + row.payableWeightKg, 0) / 1000;
    return res.json({ rows: rows.slice((page - 1) * limit, page * limit), page, limit, total: rows.length, totals: { tonnes, amountPaisa, paidPaisa, duePaisa } });
  }
  const where: any = {};
  if (req.user!.role === "HUB_OPERATOR") {
    const hub = await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
    if (!hub) return res.json({ rows: [], page, limit, total: 0, totals: { tonnes: 0, amountPaisa: 0, paidPaisa: 0, duePaisa: 0 } });
    where.hubId = hub.id;
  }
  if (req.user!.role === "FARMER") {
    const farmer = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!farmer) return res.json({ rows: [], page, limit, total: 0, totals: { tonnes: 0, amountPaisa: 0, paidPaisa: 0, duePaisa: 0 } });
    where.farmerId = farmer.id;
  }
  if (typeof req.query.paymentStatus === "string") where.paymentStatus = req.query.paymentStatus;
  if (typeof req.query.residueTypeId === "string") where.residueTypeId = req.query.residueTypeId;
  if (typeof req.query.farmerId === "string") where.farmerId = req.query.farmerId;
  if (typeof req.query.search === "string" && req.query.search) {
    where.OR = [
      { purchaseNo: { contains: req.query.search, mode: "insensitive" } },
      { farmerNameSnapshot: { contains: req.query.search, mode: "insensitive" } },
    ];
  }
  if (req.query.from || req.query.to) {
    where.purchaseDate = {};
    if (req.query.from) where.purchaseDate.gte = new Date(String(req.query.from));
    if (req.query.to) where.purchaseDate.lte = new Date(String(req.query.to));
  }
  const [rows, total] = await Promise.all([
    prisma.purchase.findMany({ where, include: { farmer: true, residueType: true, hub: true, payments: true }, orderBy: { purchaseDate: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.purchase.count({ where }),
  ]);
  const aggregate = await prisma.purchase.aggregate({ where, _sum: { payableWeightKg: true, netPayablePaisa: true, amountPaidPaisa: true, balanceDuePaisa: true } });
  res.json({ rows, page, limit, total, totals: { tonnes: Number(aggregate._sum.payableWeightKg ?? 0) / 1000, amountPaisa: aggregate._sum.netPayablePaisa ?? 0, paidPaisa: aggregate._sum.amountPaidPaisa ?? 0, duePaisa: aggregate._sum.balanceDuePaisa ?? 0 } });
});

app.post("/api/v1/procurement/purchases", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.object({
    listingId: z.string().optional(),
    intakeRecordId: z.string().optional(),
    farmerId: z.string().optional(),
    residueTypeId: z.string(),
    purchaseDate: z.coerce.date().optional(),
    form: z.enum(["loose", "baled"]),
    grossWeightKg: z.number().nonnegative(),
    tareWeightKg: z.number().nonnegative(),
    moisturePct: z.number().min(0).max(100),
    impurityPct: z.number().min(0).max(100),
    ratePerTonne: z.number().positive(),
    transportMode: z.enum(["HUB_PICKUP", "FARMER_DELIVERY"]),
    vehicleNo: z.string().optional(),
    distanceKm: z.number().nonnegative(),
    transportCost: z.number().nonnegative().default(0),
    loadingCost: z.number().nonnegative().default(0),
    taxPercent: z.number().min(0).max(100).default(0),
    remarks: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid purchase", parsed.error.flatten());
  if (String(req.user?.id).startsWith("demo-")) {
    const gross = parsed.data.grossWeightKg - parsed.data.tareWeightKg;
    const moistureDeduction = parsed.data.moisturePct > 15 ? gross * (parsed.data.moisturePct - 15) / 100 : 0;
    const payable = gross - moistureDeduction;
    return res.status(201).json({
      id: `demo-purchase-${Date.now()}`,
      purchaseNo: `PUR-2026-${String(Date.now()).slice(-6)}`,
      status: "DRAFT",
      paymentStatus: "PENDING",
      netWeightKg: gross,
      moistureDeductionKg: moistureDeduction,
      payableWeightKg: payable,
      demo: true,
    });
  }
  const hub = req.user!.role === "ADMIN" ? await prisma.hubProfile.findFirst() : await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
  if (!hub) return error(res, 400, "PROFILE_REQUIRED", "Create a hub profile first");
  let listing = parsed.data.listingId ? await prisma.residueListing.findUnique({ where: { id: parsed.data.listingId }, include: { farmer: true, residueType: true } }) : null;
  let farmer = parsed.data.farmerId ? await prisma.farmerProfile.findUnique({ where: { id: parsed.data.farmerId } }) : listing?.farmer ?? null;
  if (!farmer) return error(res, 400, "FARMER_REQUIRED", "Select a farmer");
  const residueType = await prisma.residueType.findUnique({ where: { id: parsed.data.residueTypeId } });
  if (!residueType) return error(res, 404, "NOT_FOUND", "Residue type not found");
  const calc = purchaseCalculations({
    grossWeightKg: parsed.data.grossWeightKg,
    tareWeightKg: parsed.data.tareWeightKg,
    moisturePct: parsed.data.moisturePct,
    impurityPct: parsed.data.impurityPct,
    ratePerTonnePaisa: rupeesToPaisa(parsed.data.ratePerTonne),
    transportCostPaisa: rupeesToPaisa(parsed.data.transportCost),
    loadingCostPaisa: rupeesToPaisa(parsed.data.loadingCost),
    taxPercent: parsed.data.taxPercent,
  });
  const grade = parsed.data.moisturePct <= 15 && parsed.data.impurityPct <= 5 ? "A" : parsed.data.moisturePct <= 20 && parsed.data.impurityPct <= 10 ? "B" : "C";
  const count = await prisma.purchase.count();
  const purchaseNo = `PUR-${new Date().getFullYear()}-${String(count + 123).padStart(6, "0")}`;
  const purchase = await prisma.$transaction(async tx => {
    const created = await tx.purchase.create({
      data: {
        purchaseNo,
        purchaseDate: parsed.data.purchaseDate ?? new Date(),
        hubId: hub.id,
        farmerId: farmer!.id,
        farmerNameSnapshot: farmer!.name,
        farmerPhoneSnapshot: (await tx.user.findUnique({ where: { id: farmer!.userId } }))?.phone ?? null,
        farmerVillageSnapshot: farmer!.village,
        farmerDistrictSnapshot: farmer!.district,
        fpoNameSnapshot: farmer!.fpoName,
        listingId: parsed.data.listingId,
        intakeRecordId: parsed.data.intakeRecordId,
        residueTypeId: residueType.id,
        form: parsed.data.form,
        grade,
        grossWeightKg: parsed.data.grossWeightKg,
        tareWeightKg: parsed.data.tareWeightKg,
        netWeightKg: calc.netWeightKg,
        moisturePct: parsed.data.moisturePct,
        impurityPct: parsed.data.impurityPct,
        moistureDeductionKg: calc.moistureDeductionKg,
        impurityDeductionKg: calc.impurityDeductionKg,
        payableWeightKg: calc.payableWeightKg,
        ratePerTonnePaisa: rupeesToPaisa(parsed.data.ratePerTonne),
        grossAmountPaisa: calc.grossAmountPaisa,
        deductionsPaisa: calc.deductionsPaisa,
        transportCostPaisa: rupeesToPaisa(parsed.data.transportCost),
        loadingCostPaisa: rupeesToPaisa(parsed.data.loadingCost),
        taxAmountPaisa: calc.taxAmountPaisa,
        netPayablePaisa: calc.netPayablePaisa,
        balanceDuePaisa: calc.netPayablePaisa,
        transportMode: parsed.data.transportMode,
        vehicleNo: parsed.data.vehicleNo,
        distanceKm: parsed.data.distanceKm,
        remarks: parsed.data.remarks,
        createdById: req.user!.id,
      },
    });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "CREATE_DRAFT", entity: "Purchase", entityId: created.id, after: { purchaseNo, status: "DRAFT" } } });
    return created;
  });
  res.status(201).json(purchase);
});

app.post("/api/v1/procurement/purchases/:id/confirm", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  if (String(req.params.id).startsWith("demo-") || String(req.user?.id).startsWith("demo-"))
    return res.json({ id: req.params.id, status: "CONFIRMED", paymentStatus: "PENDING", demo: true });
  const result = await prisma.$transaction(async tx => {
    const purchase = await tx.purchase.findUnique({ where: { id: String(req.params.id) } });
    if (!purchase) throw new Error("NOT_FOUND");
    if (purchase.status !== "DRAFT") throw new Error("INVALID_STATUS");
    if (req.user!.role === "HUB_OPERATOR") {
      const hub = await tx.hubProfile.findUnique({ where: { userId: req.user!.id } });
      if (purchase.hubId !== hub?.id) throw new Error("FORBIDDEN");
    }
    const confirmed = await tx.purchase.update({ data: { status: "CONFIRMED", approvedById: req.user!.id }, where: { id: purchase.id } });
    await tx.inventoryMovement.create({ data: { hubId: purchase.hubId, type: "PURCHASE_IN", stockKind: "RESIDUE", residueTypeId: purchase.residueTypeId, purchaseId: purchase.id, quantityKg: purchase.payableWeightKg, referenceId: purchase.purchaseNo, remarks: "Confirmed farmer purchase" } });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "CONFIRM", entity: "Purchase", entityId: purchase.id, before: { status: "DRAFT" }, after: { status: "CONFIRMED" } } });
    return confirmed;
  }).catch(caught => {
    if (caught instanceof Error && caught.message === "NOT_FOUND") return null;
    if (caught instanceof Error && caught.message === "INVALID_STATUS") throw new Error("INVALID_STATUS");
    if (caught instanceof Error && caught.message === "FORBIDDEN") throw new Error("FORBIDDEN");
    throw caught;
  });
  if (!result) return error(res, 404, "NOT_FOUND", "Purchase not found");
  res.json(result);
});

app.get("/api/v1/procurement/purchases/:id", auth, roles("HUB_OPERATOR", "ADMIN", "FARMER"), async (req: AuthedRequest, res) => {
  const purchase = await prisma.purchase.findUnique({ where: { id: String(req.params.id) }, include: { farmer: true, residueType: true, hub: true, listing: true, intakeRecord: true, payments: true, inventoryMovements: true } });
  if (!purchase) return error(res, 404, "NOT_FOUND", "Purchase not found");
  if (req.user!.role === "FARMER") {
    const farmer = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
    if (purchase.farmerId !== farmer?.id) return error(res, 403, "FORBIDDEN", "Not your purchase");
  }
  if (req.user!.role === "HUB_OPERATOR") {
    const hub = await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
    if (purchase.hubId !== hub?.id) return error(res, 403, "FORBIDDEN", "Not your hub");
  }
  res.json(purchase);
});

app.post("/api/v1/procurement/purchases/:id/payments", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.object({ amount: z.number().positive(), paidAt: z.coerce.date().optional(), method: z.enum(["CASH", "UPI", "BANK", "CHEQUE"]), referenceNo: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid payment");
  const amountPaisa = rupeesToPaisa(parsed.data.amount);
  if (String(req.params.id).startsWith("demo-") || String(req.user?.id).startsWith("demo-"))
    return res.status(201).json({ id: req.params.id, amountPaisa, paymentStatus: "PARTIAL", mockMarker: "record-keeping only, no real gateway", demo: true });
  const purchase = await prisma.purchase.findUnique({ where: { id: String(req.params.id) } });
  if (!purchase) return error(res, 404, "NOT_FOUND", "Purchase not found");
  if (purchase.status !== "CONFIRMED") return error(res, 409, "INVALID_STATUS", "Purchase must be confirmed");
  if (amountPaisa > purchase.balanceDuePaisa) return error(res, 409, "OVERPAYMENT", "Payment exceeds balance due");
  const updated = await prisma.$transaction(async tx => {
    await tx.purchasePayment.create({ data: { purchaseId: purchase.id, amountPaisa, paidAt: parsed.data.paidAt ?? new Date(), method: parsed.data.method, referenceNo: parsed.data.referenceNo, mockMarker: true, createdById: req.user!.id } });
    const amountPaidPaisa = purchase.amountPaidPaisa + amountPaisa;
    const balanceDuePaisa = purchase.netPayablePaisa - amountPaidPaisa;
    const next = await tx.purchase.update({ where: { id: purchase.id }, data: { amountPaidPaisa, balanceDuePaisa, paymentStatus: balanceDuePaisa === 0 ? "PAID" : "PARTIAL", paymentMethod: parsed.data.method, paymentDate: parsed.data.paidAt ?? new Date(), paymentReference: parsed.data.referenceNo } });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "RECORD_PURCHASE_PAYMENT", entity: "Purchase", entityId: purchase.id, before: { amountPaidPaisa: purchase.amountPaidPaisa }, after: { amountPaidPaisa, balanceDuePaisa }, } });
    return next;
  });
  res.status(201).json({ ...updated, mockMarker: "record-keeping only, no real gateway" });
});

app.post("/api/v1/sales/:id/cancel", auth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.object({ reason: z.string().min(5) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Cancellation reason required");
  const sale = await prisma.sale.findUnique({ where: { id: String(req.params.id) }, include: { items: true } });
  if (!sale) return error(res, 404, "NOT_FOUND", "Sale not found");
  if (sale.status === "CANCELLED") return error(res, 409, "INVALID_STATUS", "Sale already cancelled");
  const updated = await prisma.$transaction(async tx => {
    if (sale.status === "CONFIRMED") {
      for (const item of sale.items) await tx.productLot.update({ where: { id: item.lotId }, data: { quantityKg: { increment: Number(item.quantity) } } });
    }
    const next = await tx.sale.update({ where: { id: sale.id }, data: { status: "CANCELLED", remarks: parsed.data.reason } });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "CANCEL", entity: "Sale", entityId: sale.id, before: { status: sale.status }, after: { status: "CANCELLED", reason: parsed.data.reason } } });
    return next;
  });
  res.json(updated);
});

app.get("/api/v1/sales/:id/invoice", auth, roles("HUB_OPERATOR", "ADMIN", "INDUSTRIAL_BUYER"), async (req: AuthedRequest, res) => {
  const sale = await prisma.sale.findUnique({ where: { id: String(req.params.id) }, include: { customer: true, hub: true, items: true, payments: true } });
  if (!sale) return error(res, 404, "NOT_FOUND", "Sale not found");
  if (req.user!.role === "INDUSTRIAL_BUYER") {
    const buyer = await prisma.buyerProfile.findUnique({ where: { userId: req.user!.id }, include: { customer: true } });
    if (sale.customerId !== buyer?.customer?.id) return error(res, 403, "FORBIDDEN", "Not your sale");
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${sale.saleNo}-invoice.pdf"`);
  const doc = new PDFDocument({ margin: 48 });
  doc.pipe(res);
  doc.fontSize(20).text("AgroLoop Tax Invoice", { align: "center" });
  doc.moveDown();
  doc.fontSize(11).text(`Invoice / Sale No: ${sale.saleNo}`);
  doc.text(`Date: ${sale.saleDate.toISOString().slice(0, 10)} | Hub: ${sale.hub.name}`);
  doc.text(`Customer: ${sale.customer.name}`);
  doc.moveDown();
  for (const item of sale.items) doc.text(`${item.lotCodeSnapshot}: ${Number(item.quantity).toFixed(3)} ${item.unit} @ ₹${paiseToRupees(item.ratePaisa)} / tonne — ₹${paiseToRupees(item.amountPaisa)}`);
  doc.moveDown();
  doc.text(`Subtotal: ₹${paiseToRupees(sale.subtotalPaisa)}`);
  doc.text(`GST (${Number(sale.gstPercent)}%): ₹${paiseToRupees(sale.gstAmountPaisa)}`);
  doc.text(`Freight / other charges: ₹${paiseToRupees(sale.freightPaisa + sale.otherChargesPaisa)}`);
  doc.fontSize(13).text(`Total: ₹${paiseToRupees(sale.totalAmountPaisa)}`);
  doc.fontSize(11).text(`Paid: ₹${paiseToRupees(sale.amountPaidPaisa)} | Balance: ₹${paiseToRupees(sale.balanceDuePaisa)}`);
  doc.moveDown().text("Payment record is mock record-keeping only; no real payment gateway is used.");
  doc.end();
});

app.get("/api/v1/inventory", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  let hubId: string | undefined;
  if (String(req.user?.id).startsWith("demo-")) {
    return res.json({
      residue: [
        { residueTypeId: "demo-rice-husk", name: "Rice husk", quantityKg: 18500 },
        { residueTypeId: "demo-paddy", name: "Paddy straw", quantityKg: 24350 },
        { residueTypeId: "demo-bagasse", name: "Sugarcane bagasse", quantityKg: 12800 },
      ],
      productLots: [
        { lotId: "demo-lot-1", code: "LOT-AGL-001", quantityKg: 1230 },
        { lotId: "demo-lot-2", code: "LOT-AGL-004", quantityKg: 1450 },
        { lotId: "demo-lot-3", code: "LOT-PA-001", quantityKg: 210 },
      ],
      movements: [],
    });
  }
  if (req.user!.role === "HUB_OPERATOR") {
    const hub = await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
    if (!hub) return res.json({ residue: [], productLots: [], movements: [] });
    hubId = hub.id;
  }
  const movements = await prisma.inventoryMovement.findMany({ where: hubId ? { hubId } : {}, include: { residueType: true, lot: true }, orderBy: { createdAt: "desc" }, take: 500 });
  const residueMap = new Map<string, { residueTypeId: string; name: string; quantityKg: number }>();
  const lotMap = new Map<string, { lotId: string; code: string; quantityKg: number }>();
  for (const movement of movements) {
    if (movement.stockKind === "RESIDUE" && movement.residueTypeId) {
      const id = movement.residueTypeId;
      const current = residueMap.get(id) ?? { residueTypeId: id, name: movement.residueType?.name ?? "Unknown", quantityKg: 0 };
      current.quantityKg += Number(movement.quantityKg);
      residueMap.set(id, current);
    }
    if (movement.stockKind === "PRODUCT" && movement.lotId) {
      const id = movement.lotId;
      const current = lotMap.get(id) ?? { lotId: id, code: movement.lot?.code ?? "Unknown", quantityKg: 0 };
      current.quantityKg += Number(movement.quantityKg);
      lotMap.set(id, current);
    }
  }
  res.json({ residue: [...residueMap.values()], productLots: [...lotMap.values()], movements });
});

app.get("/api/v1/reports/mass-balance", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  if (String(req.user?.id).startsWith("demo-"))
    return res.json({ residuePurchasedKg: 55650, residueConsumedKg: 39000, bioCoalProducedKg: 12300, bioCoalSoldKg: 8100, yieldPct: 31.54, unexplainedLossKg: 26700, anomaly: false, demo: true });
  const hubId = req.user!.role === "HUB_OPERATOR"
    ? (await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } }))?.id
    : typeof req.query.hubId === "string" ? req.query.hubId : undefined;
  const from = req.query.from ? new Date(String(req.query.from)) : new Date("2000-01-01");
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const hubWhere = hubId ? { hubId } : {};
  const [purchases, batches, lots, sales] = await Promise.all([
    prisma.purchase.aggregate({ where: { ...hubWhere, status: "CONFIRMED", purchaseDate: { gte: from, lte: to } }, _sum: { payableWeightKg: true } }),
    prisma.batch.aggregate({ where: { ...hubWhere, createdAt: { gte: from, lte: to } }, _sum: { inputKg: true, outputBioCoalKg: true } }),
    prisma.productLot.aggregate({ where: { ...hubWhere, createdAt: { gte: from, lte: to } }, _sum: { quantityKg: true } }),
    prisma.sale.aggregate({ where: { ...hubWhere, status: "CONFIRMED", saleDate: { gte: from, lte: to } }, _sum: { deliveredQuantity: true } }),
  ]);
  const residuePurchasedKg = Number(purchases._sum.payableWeightKg ?? 0);
  const residueConsumedKg = Number(batches._sum.inputKg ?? 0);
  const bioCoalProducedKg = Number(batches._sum.outputBioCoalKg ?? 0);
  const bioCoalSoldKg = Number(sales._sum.deliveredQuantity ?? 0);
  const yieldPct = residueConsumedKg > 0 ? bioCoalProducedKg / residueConsumedKg * 100 : 0;
  const unexplainedLossKg = residueConsumedKg - bioCoalProducedKg;
  res.json({ residuePurchasedKg, residueConsumedKg, bioCoalProducedKg, bioCoalSoldKg, yieldPct, unexplainedLossKg, anomaly: bioCoalSoldKg > bioCoalProducedKg });
});

app.get("/api/v1/reports/profit", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  if (String(req.user?.id).startsWith("demo-"))
    return res.json({ label: "Management estimate", salesRevenuePaisa: 42000000, purchaseCostPaisa: 31000000, grossMarginPaisa: 11000000, grossMarginPerTonnePaisa: 1358024, demo: true });
  const hubId = req.user!.role === "HUB_OPERATOR"
    ? (await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } }))?.id
    : typeof req.query.hubId === "string" ? req.query.hubId : undefined;
  const where = hubId ? { hubId } : {};
  const [purchases, sales] = await Promise.all([
    prisma.purchase.aggregate({ where: { ...where, status: "CONFIRMED" }, _sum: { netPayablePaisa: true, payableWeightKg: true } }),
    prisma.sale.aggregate({ where: { ...where, status: "CONFIRMED" }, _sum: { totalAmountPaisa: true, deliveredQuantity: true } }),
  ]);
  const purchaseCostPaisa = purchases._sum.netPayablePaisa ?? 0;
  const salesRevenuePaisa = sales._sum.totalAmountPaisa ?? 0;
  const grossMarginPaisa = salesRevenuePaisa - purchaseCostPaisa;
  const soldKg = Number(sales._sum.deliveredQuantity ?? 0);
  res.json({ label: "Management estimate", salesRevenuePaisa, purchaseCostPaisa, grossMarginPaisa, grossMarginPerTonnePaisa: soldKg > 0 ? Math.round(grossMarginPaisa / (soldKg / 1000)) : 0 });
});

app.get("/api/v1/reports/ageing", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  if (String(req.user?.id).startsWith("demo-"))
    return res.json({ buckets: { "0-30": 8500000, "31-60": 6200000, "61-90": 3100000, "90+": 1800000 }, invoices: [], demo: true });
  const sales = await prisma.sale.findMany({ where: { status: "CONFIRMED", balanceDuePaisa: { gt: 0 } }, include: { customer: true }, orderBy: { dueDate: "asc" } });
  const now = new Date();
  const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  for (const sale of sales) {
    const dueDate = sale.dueDate ?? sale.saleDate;
    const days = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000));
    if (days <= 30) buckets["0-30"] += sale.balanceDuePaisa;
    else if (days <= 60) buckets["31-60"] += sale.balanceDuePaisa;
    else if (days <= 90) buckets["61-90"] += sale.balanceDuePaisa;
    else buckets["90+"] += sale.balanceDuePaisa;
  }
  res.json({ buckets, invoices: sales });
});

app.get("/api/v1/procurement/export", auth, roles("HUB_OPERATOR", "ADMIN"), async (req, res) => {
  const rows = await prisma.purchase.findMany({ include: { farmer: true, residueType: true, hub: true }, orderBy: { purchaseDate: "desc" } });
  const headers = ["Purchase No", "Date", "Hub", "Farmer", "Residue", "Payable Kg", "Net Payable Rs", "Paid Rs", "Balance Rs", "Payment Status", "Status"];
  const values = rows.map(row => [row.purchaseNo, row.purchaseDate.toISOString().slice(0, 10), row.hub.name, row.farmerNameSnapshot, row.residueType.name, Number(row.payableWeightKg).toFixed(3), paiseToRupees(row.netPayablePaisa), paiseToRupees(row.amountPaidPaisa), paiseToRupees(row.balanceDuePaisa), row.paymentStatus, row.status]);
  if (req.query.format === "xls") {
    const table = `<table><thead><tr>${headers.map(value => `<th>${value}</th>`).join("")}</tr></thead><tbody>${values.map(row => `<tr>${row.map(value => `<td>${String(value).replace(/&/g, "&amp;")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", 'attachment; filename="purchases.xls"');
    return res.send(table);
  }
  const csv = [headers, ...values].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="purchases.csv"');
  res.send(csv);
});

app.get("/api/v1/sales/export", auth, roles("HUB_OPERATOR", "ADMIN"), async (req, res) => {
  const rows = await prisma.sale.findMany({ include: { customer: true, hub: true, items: true }, orderBy: { saleDate: "desc" } });
  const headers = ["Sale No", "Date", "Hub", "Customer", "Product", "Subtotal Rs", "GST Rs", "Total Rs", "Paid Rs", "Balance Rs", "Payment Status", "Delivery Status"];
  const values = rows.map(row => [row.saleNo, row.saleDate.toISOString().slice(0, 10), row.hub.name, row.customer.name, row.items.map(item => item.unit === "L" ? "PYROLIGNEOUS_ACID" : "BIO_COAL").join(";"), paiseToRupees(row.subtotalPaisa), paiseToRupees(row.gstAmountPaisa), paiseToRupees(row.totalAmountPaisa), paiseToRupees(row.amountPaidPaisa), paiseToRupees(row.balanceDuePaisa), row.paymentStatus, row.deliveryStatus]);
  if (req.query.format === "xls") {
    const table = `<table><thead><tr>${headers.map(value => `<th>${value}</th>`).join("")}</tr></thead><tbody>${values.map(row => `<tr>${row.map(value => `<td>${String(value).replace(/&/g, "&amp;")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", 'attachment; filename="sales.xls"');
    return res.send(table);
  }
  const csv = [headers, ...values].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="sales.csv"');
  res.send(csv);
});

app.post("/api/v1/procurement/purchases/:id/cancel", auth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.object({ reason: z.string().min(5) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Cancellation reason required");
  const purchase = await prisma.purchase.findUnique({ where: { id: String(req.params.id) } });
  if (!purchase) return error(res, 404, "NOT_FOUND", "Purchase not found");
  if (purchase.status !== "CONFIRMED" && purchase.status !== "DRAFT") return error(res, 409, "INVALID_STATUS", "Purchase already cancelled");
  const updated = await prisma.$transaction(async tx => {
    const next = await tx.purchase.update({ where: { id: purchase.id }, data: { status: "CANCELLED", cancellationReason: parsed.data.reason } });
    if (purchase.status === "CONFIRMED") await tx.inventoryMovement.create({ data: { hubId: purchase.hubId, type: "ADJUSTMENT", stockKind: "RESIDUE", residueTypeId: purchase.residueTypeId, purchaseId: purchase.id, quantityKg: -Number(purchase.payableWeightKg), referenceId: `CANCEL-${purchase.purchaseNo}`, remarks: parsed.data.reason } });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "CANCEL", entity: "Purchase", entityId: purchase.id, before: { status: purchase.status }, after: { status: "CANCELLED", reason: parsed.data.reason } } });
    return next;
  });
  res.json(updated);
});

app.get("/api/v1/procurement/purchases/:id/receipt", optionalAuth, roles("HUB_OPERATOR", "ADMIN", "FARMER"), async (req: AuthedRequest, res) => {
  let purchaseData: {
    purchaseNo: string;
    purchaseDate: Date;
    hubName: string;
    farmerName: string;
    village: string;
    district: string;
    residueName: string;
    grossWeightKg: number;
    tareWeightKg: number;
    netWeightKg: number;
    moisturePct: number;
    impurityPct: number;
    moistureDeductionKg: number;
    payableWeightKg: number;
    ratePerTonnePaisa: number;
    grossAmountPaisa: number;
    deductionsPaisa: number;
    transportCostPaisa: number;
    loadingCostPaisa: number;
    taxAmountPaisa: number;
    netPayablePaisa: number;
    amountPaidPaisa: number;
    balanceDuePaisa: number;
    paymentStatus: string;
  } | null = null;

  if (String(req.params.id).startsWith("demo-purchase-")) {
    const index = Number(String(req.params.id).replace("demo-purchase-", "")) - 1;
    const residues = ["Paddy straw", "Rice husk", "Sugarcane bagasse", "Arhar/gram stalks", "Corn cobs"];
    const farmers = ["Farmer 1", "Farmer 2", "Farmer 3"];
    const villages = ["Dharsiwa", "Abhanpur", "Kharora"];
    const grossWeightKg = 2800 + (Math.max(index, 0) % 7) * 175;
    const tareWeightKg = 300 + (Math.max(index, 0) % 3) * 25;
    const netWeightKg = grossWeightKg - tareWeightKg;
    const moisturePct = 12 + (Math.max(index, 0) % 9);
    const moistureDeductionKg = moisturePct > 15 ? netWeightKg * (moisturePct - 15) / 100 : 0;
    const payableWeightKg = netWeightKg - moistureDeductionKg;
    const ratePerTonnePaisa = (1800 + (Math.max(index, 0) % 5) * 100) * 100;
    const grossAmountPaisa = Math.round(payableWeightKg / 1000 * ratePerTonnePaisa);
    const transportCostPaisa = (Math.max(index, 0) % 4) * 50000;
    const loadingCostPaisa = 30000;
    const netPayablePaisa = grossAmountPaisa + transportCostPaisa + loadingCostPaisa;
    const amountPaidPaisa = Math.max(index, 0) % 5 === 0 ? 0 : Math.max(index, 0) % 4 === 0 ? Math.round(netPayablePaisa / 2) : netPayablePaisa;
    purchaseData = {
      purchaseNo: `PUR-2026-${String(123 + Math.max(index, 0)).padStart(6, "0")}`,
      purchaseDate: new Date(2026, 10, 1 + (Math.max(index, 0) % 21)),
      hubName: "AgroLoop Hub 1",
      farmerName: farmers[Math.max(index, 0) % farmers.length],
      village: villages[Math.max(index, 0) % villages.length],
      district: "Raipur",
      residueName: residues[Math.max(index, 0) % residues.length],
      grossWeightKg,
      tareWeightKg,
      netWeightKg,
      moisturePct,
      impurityPct: 2 + (Math.max(index, 0) % 5),
      moistureDeductionKg,
      payableWeightKg,
      ratePerTonnePaisa,
      grossAmountPaisa,
      deductionsPaisa: 0,
      transportCostPaisa,
      loadingCostPaisa,
      taxAmountPaisa: 0,
      netPayablePaisa,
      amountPaidPaisa,
      balanceDuePaisa: netPayablePaisa - amountPaidPaisa,
      paymentStatus: amountPaidPaisa === 0 ? "PENDING" : amountPaidPaisa === netPayablePaisa ? "PAID" : "PARTIAL",
    };
  } else {
    try {
      const purchase = await prisma.purchase.findUnique({ where: { id: String(req.params.id) }, include: { farmer: true, residueType: true, hub: true } });
      if (purchase) {
        purchaseData = {
          purchaseNo: purchase.purchaseNo,
          purchaseDate: purchase.purchaseDate,
          hubName: purchase.hub.name,
          farmerName: purchase.farmerNameSnapshot,
          village: purchase.farmerVillageSnapshot,
          district: purchase.farmerDistrictSnapshot,
          residueName: purchase.residueType.name,
          grossWeightKg: Number(purchase.grossWeightKg),
          tareWeightKg: Number(purchase.tareWeightKg),
          netWeightKg: Number(purchase.netWeightKg),
          moisturePct: Number(purchase.moisturePct),
          impurityPct: Number(purchase.impurityPct),
          moistureDeductionKg: Number(purchase.moistureDeductionKg),
          payableWeightKg: Number(purchase.payableWeightKg),
          ratePerTonnePaisa: purchase.ratePerTonnePaisa,
          grossAmountPaisa: purchase.grossAmountPaisa,
          deductionsPaisa: purchase.deductionsPaisa,
          transportCostPaisa: purchase.transportCostPaisa,
          loadingCostPaisa: purchase.loadingCostPaisa,
          taxAmountPaisa: purchase.taxAmountPaisa,
          netPayablePaisa: purchase.netPayablePaisa,
          amountPaidPaisa: purchase.amountPaidPaisa,
          balanceDuePaisa: purchase.balanceDuePaisa,
          paymentStatus: purchase.paymentStatus,
        };
      }
    } catch {
      return error(res, 503, "DATABASE_UNAVAILABLE", "Receipt is unavailable while PostgreSQL is disconnected");
    }
  }
  if (!purchaseData) return error(res, 404, "NOT_FOUND", "Purchase not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${purchaseData.purchaseNo}-receipt.pdf"`);
  const doc = new PDFDocument({ size: "A4", margin: 42 });
  doc.pipe(res);

  doc.rect(42, 42, 511, 74).fill("#173a29");
  doc.fillColor("#ffffff").fontSize(22).text("AGROLOOP", 62, 62, { characterSpacing: 1.2 });
  doc.fontSize(10).text("PURCHASE RECEIPT / WEIGHMENT VOUCHER", 62, 91);
  doc.fontSize(10).text(purchaseData.purchaseNo, 420, 62, { width: 112, align: "right" });
  doc.text(purchaseData.purchaseDate.toISOString().slice(0, 10), 420, 78, { width: 112, align: "right" });

  doc.fillColor("#173a29").fontSize(11).text("ISSUED BY", 42, 138);
  doc.font("Helvetica-Bold").text(purchaseData.hubName, 42, 154);
  doc.font("Helvetica").text("Village hub / Procurement division", 42, 170);

  doc.fontSize(11).text("FARMER DETAILS", 330, 138);
  doc.font("Helvetica-Bold").text(purchaseData.farmerName, 330, 154);
  doc.font("Helvetica").text(`${purchaseData.village}, ${purchaseData.district}`, 330, 170);

  doc.moveTo(42, 198).lineTo(553, 198).strokeColor("#d7d1b5").stroke();
  doc.fillColor("#173a29").fontSize(11).text("WEIGHMENT", 42, 214);

  const weightRows = [
    ["Residue", purchaseData.residueName],
    ["Gross weight", `${purchaseData.grossWeightKg.toFixed(3)} kg`],
    ["Tare weight", `${purchaseData.tareWeightKg.toFixed(3)} kg`],
    ["Net weight", `${purchaseData.netWeightKg.toFixed(3)} kg`],
    ["Moisture", `${purchaseData.moisturePct.toFixed(2)}%`],
    ["Impurity", `${purchaseData.impurityPct.toFixed(2)}%`],
    ["Deducted weight", `${purchaseData.moistureDeductionKg.toFixed(3)} kg`],
    ["Payable weight", `${purchaseData.payableWeightKg.toFixed(3)} kg`],
  ];
  let rowY = 236;
  for (const [label, value] of weightRows) {
    doc.fillColor("#667268").text(label, 42, rowY, { width: 150 });
    doc.fillColor("#173a29").font("Helvetica-Bold").text(value, 200, rowY, { width: 180 });
    doc.font("Helvetica");
    rowY += 24;
  }

  doc.moveTo(330, 214).lineTo(330, 428).strokeColor("#d7d1b5").stroke();
  doc.fillColor("#173a29").fontSize(11).text("AMOUNT SUMMARY", 350, 214);
  const amountRows = [
    ["Gross value", `₹${paiseToRupees(purchaseData.grossAmountPaisa)}`],
    ["Weight deductions", `- ₹${paiseToRupees(purchaseData.deductionsPaisa)}`],
    ["Transport", `₹${paiseToRupees(purchaseData.transportCostPaisa)}`],
    ["Loading", `₹${paiseToRupees(purchaseData.loadingCostPaisa)}`],
    ["Tax", `₹${paiseToRupees(purchaseData.taxAmountPaisa)}`],
  ];
  let amountY = 244;
  for (const [label, value] of amountRows) {
    doc.fillColor("#667268").text(label, 350, amountY, { width: 110 });
    doc.fillColor("#173a29").font("Helvetica-Bold").text(value, 460, amountY, { width: 93, align: "right" });
    doc.font("Helvetica");
    amountY += 28;
  }
  doc.rect(350, 390, 203, 42).fill("#dde8c9");
  doc.fillColor("#173a29").fontSize(10).text("NET PAYABLE", 360, 402);
  doc.fontSize(15).text(`₹${paiseToRupees(purchaseData.netPayablePaisa)}`, 430, 399, { width: 112, align: "right" });

  doc.fillColor("#173a29").fontSize(11).text("PAYMENT", 42, 452);
  doc.font("Helvetica-Bold").text(purchaseData.paymentStatus, 42, 470);
  doc.font("Helvetica").fontSize(10).fillColor("#667268");
  doc.text(`Amount paid: ₹${paiseToRupees(purchaseData.amountPaidPaisa)}`, 42, 492);
  doc.text(`Balance due: ₹${paiseToRupees(purchaseData.balanceDuePaisa)}`, 42, 508);
  doc.text(`Rate applied: ₹${paiseToRupees(purchaseData.ratePerTonnePaisa)} per tonne`, 42, 524);

  doc.rect(42, 575, 511, 52).fill("#f7f4e8");
  doc.fillColor("#667268").fontSize(9);
  doc.text("MOCK PAYMENT RECORD", 62, 588);
  doc.text("This voucher is for record-keeping only. No real payment gateway or bank transfer is implied.", 62, 604, { width: 470 });

  doc.fillColor("#173a29").fontSize(9).text("Authorized signature", 42, 695);
  doc.moveTo(42, 720).lineTo(220, 720).strokeColor("#173a29").stroke();
  doc.text("Farmer acknowledgement", 360, 695);
  doc.moveTo(360, 720).lineTo(553, 720).stroke();
  doc.end();
});

app.get("/api/v1/sales/customers", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (_req: AuthedRequest, res) => {
  try {
    const rows = await prisma.customer.findMany({ where: { deletedAt: null }, include: { sales: true }, orderBy: { name: "asc" } });
    if (rows.length) return res.json(rows);
  } catch {}
  return res.json([
    { id: "demo-customer-1", name: "Raipur Sponge Works", industryType: "sponge iron", creditTermsDays: 30, creditLimitPaisa: 100000000, status: "ACTIVE" },
    { id: "demo-customer-2", name: "Central Steel Re-rollers", industryType: "steel re-rolling", creditTermsDays: 45, creditLimitPaisa: 100000000, status: "ACTIVE" },
    { id: "demo-customer-3", name: "Naya Cement Works", industryType: "cement", creditTermsDays: 30, creditLimitPaisa: 75000000, status: "ACTIVE" },
    { id: "demo-customer-4", name: "Chhattisgarh Captive Power", industryType: "captive power", creditTermsDays: 45, creditLimitPaisa: 125000000, status: "ACTIVE" },
  ]);
});
app.post("/api/v1/sales/customers", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.object({
    name: z.string().min(2),
    industryType: z.string().min(2),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    creditTermsDays: z.number().int().nonnegative().default(30),
    creditLimit: z.number().nonnegative().default(0),
    notes: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid customer", parsed.error.flatten());
  if (String(req.user?.id).startsWith("demo-")) return res.status(201).json({ id: `demo-customer-${Date.now()}`, ...parsed.data, demo: true });
  const customer = await prisma.customer.create({ data: { ...parsed.data, creditLimitPaisa: rupeesToPaisa(parsed.data.creditLimit) } });
  await audit(req.user!.id, "CREATE", "Customer", customer.id, null, customer);
  res.status(201).json(customer);
});

app.get("/api/v1/sales/customers/:id", auth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: String(req.params.id) }, include: { sales: { include: { items: true, payments: true }, orderBy: { saleDate: "desc" } } } });
  if (!customer) return error(res, 404, "NOT_FOUND", "Customer not found");
  const totalSoldPaisa = customer.sales.reduce((sum, sale) => sum + sale.totalAmountPaisa, 0);
  const outstandingPaisa = customer.sales.reduce((sum, sale) => sum + sale.balanceDuePaisa, 0);
  const totalQuantityKg = customer.sales.flatMap(sale => sale.items).reduce((sum, item) => sum + Number(item.quantity), 0);
  res.json({ customer, totals: { totalSoldPaisa, outstandingPaisa, totalQuantityKg, salesCount: customer.sales.length } });
});

app.get("/api/v1/sales", optionalAuth, roles("HUB_OPERATOR", "ADMIN", "INDUSTRIAL_BUYER"), async (req: AuthedRequest, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  if (String(req.user?.id).startsWith("demo-")) {
    const customers = ["Raipur Sponge Works", "Central Steel Re-rollers", "Naya Cement Works", "Chhattisgarh Captive Power"];
    const rows = Array.from({ length: 10 }, (_, i) => {
      const totalPaisa = (840000 + i * 125000);
      const paidPaisa = i === 3 || i === 8 ? 0 : i === 7 ? Math.round(totalPaisa / 2) : totalPaisa;
      return {
        id: `demo-sale-${i + 1}`,
        saleNo: `SAL-2026-${String(45 + i).padStart(6, "0")}`,
        saleDate: new Date(2026, 9, 1 + i * 2).toISOString(),
        customer: { name: customers[i % customers.length] },
        totalAmountPaisa: totalPaisa,
        amountPaidPaisa: paidPaisa,
        balanceDuePaisa: totalPaisa - paidPaisa,
        paymentStatus: paidPaisa === 0 ? "UNPAID" : paidPaisa === totalPaisa ? "PAID" : "PARTIAL",
        deliveryStatus: i === 6 ? "DISPUTED" : i < 5 ? "ACCEPTED" : "DELIVERED",
        status: "CONFIRMED",
      };
    });
    return res.json({
      rows,
      page,
      limit,
      total: rows.length,
      totals: {
        amountPaisa: rows.reduce((sum, row) => sum + row.totalAmountPaisa, 0),
        paidPaisa: rows.reduce((sum, row) => sum + row.amountPaidPaisa, 0),
        duePaisa: rows.reduce((sum, row) => sum + row.balanceDuePaisa, 0),
      },
    });
  }
  const where: any = {};
  if (req.user!.role === "HUB_OPERATOR") {
    const hub = await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
    if (!hub) return res.json({ rows: [], page, limit, total: 0, totals: { quantityKg: 0, amountPaisa: 0, paidPaisa: 0, duePaisa: 0 } });
    where.hubId = hub.id;
  }
  if (req.user!.role === "INDUSTRIAL_BUYER") {
    const buyer = await prisma.buyerProfile.findUnique({ where: { userId: req.user!.id }, include: { customer: true } });
    if (!buyer?.customer) return res.json({ rows: [], page, limit, total: 0, totals: { quantityKg: 0, amountPaisa: 0, paidPaisa: 0, duePaisa: 0 } });
    where.customerId = buyer.customer.id;
  }
  if (typeof req.query.paymentStatus === "string") where.paymentStatus = req.query.paymentStatus;
  if (typeof req.query.deliveryStatus === "string") where.deliveryStatus = req.query.deliveryStatus;
  if (typeof req.query.customerId === "string") where.customerId = req.query.customerId;
  if (typeof req.query.productType === "string") where.items = { some: { lot: { productType: req.query.productType } } };
  const [rows, total] = await Promise.all([
    prisma.sale.findMany({ where, include: { customer: true, hub: true, items: { include: { lot: true } }, payments: true, order: true }, orderBy: { saleDate: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.sale.count({ where }),
  ]);
  const aggregate = await prisma.sale.aggregate({ where, _sum: { totalAmountPaisa: true, amountPaidPaisa: true, balanceDuePaisa: true } });
  res.json({ rows, page, limit, total, totals: { amountPaisa: aggregate._sum.totalAmountPaisa ?? 0, paidPaisa: aggregate._sum.amountPaidPaisa ?? 0, duePaisa: aggregate._sum.balanceDuePaisa ?? 0 } });
});

app.post("/api/v1/sales", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.object({
    customerId: z.string(),
    orderId: z.string().optional(),
    saleDate: z.coerce.date().optional(),
    gstPercent: z.number().min(0).max(100).default(5),
    discount: z.number().nonnegative().default(0),
    freight: z.number().nonnegative().default(0),
    otherCharges: z.number().nonnegative().default(0),
    paymentTerms: z.string().optional(),
    dueDate: z.coerce.date().optional(),
    items: z.array(z.object({ lotId: z.string(), quantity: z.number().positive(), unit: z.enum(["kg", "L"]), ratePerTonne: z.number().positive() })).min(1),
  }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid sale", parsed.error.flatten());
  if (String(req.user?.id).startsWith("demo-")) {
    const subtotalPaisa = parsed.data.items.reduce((sum, item) => sum + Math.round(item.quantity / 1000 * rupeesToPaisa(item.ratePerTonne)), 0);
    const gst = saleCalculations({ subtotalPaisa, discountPaisa: rupeesToPaisa(parsed.data.discount), gstPercent: parsed.data.gstPercent, freightPaisa: rupeesToPaisa(parsed.data.freight), otherChargesPaisa: rupeesToPaisa(parsed.data.otherCharges) });
    return res.status(201).json({ id: `demo-sale-${Date.now()}`, saleNo: `SAL-2026-${String(Date.now()).slice(-6)}`, status: "DRAFT", ...gst, balanceDuePaisa: gst.totalAmountPaisa, demo: true });
  }
  const hub = req.user!.role === "ADMIN" ? await prisma.hubProfile.findFirst() : await prisma.hubProfile.findUnique({ where: { userId: req.user!.id } });
  if (!hub) return error(res, 400, "PROFILE_REQUIRED", "Create a hub profile first");
  const customer = await prisma.customer.findUnique({ where: { id: parsed.data.customerId } });
  if (!customer) return error(res, 404, "NOT_FOUND", "Customer not found");
  const lots = await prisma.productLot.findMany({ where: { id: { in: parsed.data.items.map(item => item.lotId) } } });
  if (lots.length !== parsed.data.items.length) return error(res, 404, "NOT_FOUND", "One or more lots not found");
  let subtotalPaisa = 0;
  const itemData = parsed.data.items.map(item => {
    const lot = lots.find(candidate => candidate.id === item.lotId)!;
    const amountPaisa = item.unit === "kg"
      ? Math.round(item.quantity / 1000 * rupeesToPaisa(item.ratePerTonne))
      : Math.round(item.quantity * rupeesToPaisa(item.ratePerTonne) / 1000);
    subtotalPaisa += amountPaisa;
    return {
      lotId: lot.id,
      lotCodeSnapshot: lot.code,
      quantity: item.quantity,
      unit: item.unit,
      ratePaisa: rupeesToPaisa(item.ratePerTonne),
      gradeSnapshot: lot.grade ?? "C",
      hhvSnapshot: lot.hhvKcalKg,
      ashSnapshot: lot.ashPct,
      amountPaisa,
    };
  });
  const discountPaisa = rupeesToPaisa(parsed.data.discount);
  const freightPaisa = rupeesToPaisa(parsed.data.freight);
  const otherChargesPaisa = rupeesToPaisa(parsed.data.otherCharges);
  const gstAmountPaisa = Math.round((subtotalPaisa - discountPaisa) * parsed.data.gstPercent / 100);
  const totalAmountPaisa = subtotalPaisa - discountPaisa + gstAmountPaisa + freightPaisa + otherChargesPaisa;
  const count = await prisma.sale.count();
  const saleNo = `SAL-${new Date().getFullYear()}-${String(count + 45).padStart(6, "0")}`;
  const sale = await prisma.sale.create({
    data: {
      saleNo,
      saleDate: parsed.data.saleDate ?? new Date(),
      hubId: hub.id,
      customerId: customer.id,
      orderId: parsed.data.orderId,
      subtotalPaisa,
      discountPaisa,
      gstPercent: parsed.data.gstPercent,
      gstAmountPaisa,
      freightPaisa,
      otherChargesPaisa,
      totalAmountPaisa,
      balanceDuePaisa: totalAmountPaisa,
      deliveredQuantity: 0,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      dueDate: parsed.data.dueDate,
      paymentTerms: parsed.data.paymentTerms,
      createdById: req.user!.id,
      items: { create: itemData },
    },
    include: { items: true, customer: true },
  });
  await audit(req.user!.id, "CREATE_DRAFT", "Sale", sale.id, null, { saleNo, status: "DRAFT" });
  res.status(201).json(sale);
});

app.post("/api/v1/sales/:id/confirm", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  if (String(req.params.id).startsWith("demo-") || String(req.user?.id).startsWith("demo-"))
    return res.json({ id: req.params.id, status: "CONFIRMED", deliveryStatus: "PLANNED", demo: true });
  const saleId = String(req.params.id);
  try {
    const sale = await prisma.$transaction(async tx => {
      const draft = await tx.sale.findUnique({ where: { id: saleId }, include: { items: true } });
      if (!draft) throw new Error("NOT_FOUND");
      if (draft.status !== "DRAFT") throw new Error("INVALID_STATUS");
      for (const item of draft.items) {
        const lot = await tx.productLot.findUnique({ where: { id: item.lotId } });
        if (!lot || Number(lot.quantityKg) < Number(item.quantity)) throw new Error("OVERSELL");
      }
      for (const item of draft.items) {
        await tx.productLot.update({ where: { id: item.lotId }, data: { quantityKg: { decrement: Number(item.quantity) } } });
        await tx.inventoryMovement.create({ data: { hubId: draft.hubId, type: "SALE_OUT", stockKind: "PRODUCT", lotId: item.lotId, saleId: draft.id, quantityKg: -Number(item.quantity), referenceId: draft.saleNo, remarks: "Confirmed sale dispatch commitment" } });
      }
      const confirmed = await tx.sale.update({ where: { id: draft.id }, data: { status: "CONFIRMED", deliveryStatus: "PLANNED" } });
      await tx.auditLog.create({ data: { actorId: req.user!.id, action: "CONFIRM", entity: "Sale", entityId: draft.id, before: { status: "DRAFT" }, after: { status: "CONFIRMED" } } });
      return confirmed;
    });
    res.json(sale);
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NOT_FOUND") return error(res, 404, "NOT_FOUND", "Sale not found");
    if (caught instanceof Error && caught.message === "INVALID_STATUS") return error(res, 409, "INVALID_STATUS", "Sale is not a draft");
    if (caught instanceof Error && caught.message === "OVERSELL") return error(res, 409, "OVERSELL", "Sale exceeds lot availability");
    throw caught;
  }
});

app.post("/api/v1/sales/:id/delivery", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.object({
    status: z.enum(["DISPATCHED", "DELIVERED", "ACCEPTED", "DISPUTED"]),
    vehicleNo: z.string().optional(),
    driverName: z.string().optional(),
    dispatchDate: z.coerce.date().optional(),
    deliveryDate: z.coerce.date().optional(),
    deliveredQuantity: z.number().nonnegative().optional(),
    acceptedQuantity: z.number().nonnegative().optional(),
    rejectedQuantity: z.number().nonnegative().optional(),
    rejectionReason: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid delivery");
  if (String(req.params.id).startsWith("demo-") || String(req.user?.id).startsWith("demo-"))
    return res.json({ id: req.params.id, deliveryStatus: parsed.data.status, demo: true });
  const sale = await prisma.sale.findUnique({ where: { id: String(req.params.id) } });
  if (!sale) return error(res, 404, "NOT_FOUND", "Sale not found");
  if (sale.status !== "CONFIRMED") return error(res, 409, "INVALID_STATUS", "Sale must be confirmed");
  const updated = await prisma.$transaction(async tx => {
    const next = await tx.sale.update({ where: { id: sale.id }, data: {
      deliveryStatus: parsed.data.status,
      vehicleNo: parsed.data.vehicleNo ?? sale.vehicleNo,
      driverName: parsed.data.driverName ?? sale.driverName,
      dispatchDate: parsed.data.dispatchDate ?? sale.dispatchDate,
      deliveryDate: parsed.data.deliveryDate ?? sale.deliveryDate,
      deliveredQuantity: parsed.data.deliveredQuantity ?? sale.deliveredQuantity,
      acceptedQuantity: parsed.data.acceptedQuantity ?? sale.acceptedQuantity,
      rejectedQuantity: parsed.data.rejectedQuantity ?? sale.rejectedQuantity,
      rejectionReason: parsed.data.rejectionReason,
    } });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "UPDATE_DELIVERY", entity: "Sale", entityId: sale.id, before: { deliveryStatus: sale.deliveryStatus }, after: { deliveryStatus: parsed.data.status } } });
    return next;
  });
  res.json(updated);
});

app.post("/api/v1/sales/:id/payments", optionalAuth, roles("HUB_OPERATOR", "ADMIN"), async (req: AuthedRequest, res) => {
  const parsed = z.object({ amount: z.number().positive(), paidAt: z.coerce.date().optional(), method: z.enum(["CASH", "UPI", "BANK", "CHEQUE"]), referenceNo: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid payment");
  const amountPaisa = rupeesToPaisa(parsed.data.amount);
  if (String(req.params.id).startsWith("demo-") || String(req.user?.id).startsWith("demo-"))
    return res.status(201).json({ id: req.params.id, amountPaisa, paymentStatus: "PARTIAL", mockMarker: "record-keeping only, no real gateway", demo: true });
  const sale = await prisma.sale.findUnique({ where: { id: String(req.params.id) } });
  if (!sale) return error(res, 404, "NOT_FOUND", "Sale not found");
  if (sale.status !== "CONFIRMED") return error(res, 409, "INVALID_STATUS", "Sale must be confirmed");
  if (amountPaisa > sale.balanceDuePaisa) return error(res, 409, "OVERPAYMENT", "Payment exceeds balance due");
  const updated = await prisma.$transaction(async tx => {
    await tx.salePayment.create({ data: { saleId: sale.id, amountPaisa, paidAt: parsed.data.paidAt ?? new Date(), method: parsed.data.method, referenceNo: parsed.data.referenceNo, mockMarker: true, createdById: req.user!.id } });
    const amountPaidPaisa = sale.amountPaidPaisa + amountPaisa;
    const balanceDuePaisa = sale.totalAmountPaisa - amountPaidPaisa;
    const overdue = balanceDuePaisa > 0 && sale.dueDate && sale.dueDate < new Date();
    const next = await tx.sale.update({ where: { id: sale.id }, data: { amountPaidPaisa, balanceDuePaisa, paymentStatus: balanceDuePaisa === 0 ? "PAID" : overdue ? "OVERDUE" : "PARTIAL" } });
    await tx.auditLog.create({ data: { actorId: req.user!.id, action: "RECORD_SALE_PAYMENT", entity: "Sale", entityId: sale.id, before: { amountPaidPaisa: sale.amountPaidPaisa }, after: { amountPaidPaisa, balanceDuePaisa } } });
    return next;
  });
  res.status(201).json({ ...updated, mockMarker: "record-keeping only, no real gateway" });
});

app.get("/api/v1/carbon/batch/:batchId", auth, roles("ADMIN", "HUB_OPERATOR"), async (req, res) => {
  const batch = await prisma.batch.findUnique({ where: { id: String(req.params.batchId) }, include: { carbonEstimates: true } });
  if (!batch) return error(res, 404, "NOT_FOUND", "Batch not found");
  res.json(batch.carbonEstimates);
});
app.post("/api/v1/carbon/batch/:batchId/estimate", auth, roles("ADMIN", "HUB_OPERATOR"), async (req, res) => {
  const parsed = z.object({ transportKm: z.number().nonnegative().default(25), processEmissionT: z.number().nonnegative().default(0.12), transportEmissionT: z.number().nonnegative().default(0.08) }).safeParse(req.body);
  if (!parsed.success) return error(res, 400, "VALIDATION_ERROR", "Invalid carbon inputs");
  const batch = await prisma.batch.findUnique({ where: { id: String(req.params.batchId) } });
  if (!batch) return error(res, 404, "NOT_FOUND", "Batch not found");
  const avoidedBurningT = batch.inputKg / 1000 * 1.4;
  const displacedCoalT = batch.outputBioCoalKg ? batch.outputBioCoalKg / 1000 * 6100 / 4200 : 0;
  const net = avoidedBurningT + displacedCoalT - parsed.data.processEmissionT - parsed.data.transportEmissionT;
  const estimate = await prisma.carbonEstimate.create({ data: { batchId: batch.id, avoidedBurningT, displacedCoalT, processT: parsed.data.processEmissionT, transportT: parsed.data.transportEmissionT, netEstimatedT: net, assumptions: `25 km reference transport; open-burning factor 1.4 tCO2e/t residue; energy equivalence uses 6100/4200 HHV`, formula: "estimated abatement (not verified) = avoided open burning + displaced coal (HHV energy equivalence) - process - transport" } });
  res.status(201).json(estimate);
});

app.use((caught: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(caught);
  return error(res, 500, "INTERNAL_ERROR", "An unexpected error occurred");
});

export { app, prisma };
export default app;
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(Number(process.env.API_PORT ?? 4000), "0.0.0.0", () => logger.info({ port: process.env.API_PORT ?? 4000 }, "AgroLoop API listening"));
}
