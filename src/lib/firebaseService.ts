import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  StoreSettings, 
  SecuritySettings, 
  Category, 
  Brand, 
  Product, 
  Supplier, 
  Purchase, 
  Sale, 
  Expense, 
  Testimonial, 
  HeroSlide, 
  StockMovement, 
  ActivityLog, 
  Notification,
  ColorShade 
} from "../types";

// ------------------------------------------
// ERROR HANDLERS (As required by Firebase Skill)
// ------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isPermissionError(error: any): boolean {
  if (!error) return false;
  if (error.code === 'permission-denied') return true;
  if (error.message && error.message.toLowerCase().includes('permission')) return true;
  return false;
}

// ------------------------------------------
// SHA-256 encryption helper
// ------------------------------------------
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// ------------------------------------------
// ImgBB upload helper
// ------------------------------------------
export async function uploadImageToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  let imgbbApiKey = "";
  const cachedSettingsStr = localStorage.getItem("_cache_settings_store");
  if (cachedSettingsStr) {
    try {
      const cached = JSON.parse(cachedSettingsStr);
      if (cached && cached.imgbbApiKey) {
        imgbbApiKey = cached.imgbbApiKey.trim();
      }
    } catch (e) {
      console.error("Failed to parse cached settings:", e);
    }
  }

  if (!imgbbApiKey) {
    imgbbApiKey = (((import.meta as any).env?.VITE_IMGBB_API_KEY || "594b7f7161c7692569c6d847f39f39dd") as string).trim();
  }

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    throw new Error("Failed to upload image to ImgBB. Please verify your ImgBB API Key is valid.");
  }
  const result = await response.json();
  return result.data.url;
}

// ------------------------------------------
// Default Seed Data
// ------------------------------------------
const DEFAULT_STORE_SETTINGS: StoreSettings = {
  name: "Genuine Paint Shop",
  logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=200",
  faviconUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=32",
  address: "Mbagala, Kilwa Road, Dar es Salaam, Tanzania",
  phone: "+255 712 345 678",
  whatsapp: "+255712345678",
  email: "sales@genuinepaints.co.tz",
  openingHours: "Mon - Sat: 7:30 AM - 6:00 PM | Sun: 9:00 AM - 2:00 PM",
  about: "We are Tanzania's leading paint store, specializing in high-quality interior and exterior wall coatings, primers, varnishes, waterproof membranes, and premium application tools from trusted brands.",
  googleMaps: "https://maps.google.com/?q=-6.8973,39.2721",
  facebook: "https://facebook.com/genuinepaintstz",
  instagram: "https://instagram.com/genuinepaintstz",
  tiktok: "https://tiktok.com/@genuinepaintstz",
  footerText: "Providing dynamic color choices and premium protection for Tanzanian homes since 2018.",
  primaryColor: "#0f766e", // Teal-700
  imgbbApiKey: "594b7f7161c7692569c6d847f39f39dd",
  latitude: -6.8973,
  longitude: 39.2721
};

const DEFAULT_CATEGORIES = [
  { id: "cat_interior", name: "Interior Paint", description: "Vibrant, low-VOC paint for beautiful inside walls", icon: "Home", active: true },
  { id: "cat_exterior", name: "Exterior Paint", description: "Weather-resistant, durable paints for outdoor surfaces", icon: "Shield", active: true },
  { id: "cat_primers", name: "Primer & Undercoat", description: "Essential prep coatings for strong adhesion and finish", icon: "Layers", active: true },
  { id: "cat_waterproof", name: "Waterproofing", description: "Premium sealants and roof protectors to prevent moisture damage", icon: "Droplets", active: true },
  { id: "cat_accessories", name: "Paint Accessories", description: "Brushes, rollers, tape, and scaffolding prep items", icon: "Brush", active: true }
];

const DEFAULT_BRANDS = [
  { id: "brand_coral", name: "Coral Paints", logoUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=120", active: true },
  { id: "brand_sadolin", name: "Sadolin", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120", active: true },
  { id: "brand_plascon", name: "Plascon", logoUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=120", active: true },
  { id: "brand_colors", name: "Colors Brand", logoUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=120", active: true }
];

const DEFAULT_PRODUCTS = [
  {
    id: "prod_1",
    name: "Coral Silk Luxury Wall Finish",
    brandId: "brand_coral",
    categoryId: "cat_interior",
    description: "Premium silk finish wall paint with high washability, durability and vibrant coverage. Perfect for living rooms and bedrooms.",
    buyingPrice: 65000,
    sellingPrice: 85000,
    minimumStock: 10,
    currentStock: 25,
    coverage: "12-14 sq m per liter",
    dryingTime: "2 hours touch dry",
    recommendedSurface: "Interior plaster, concrete, gypsum",
    status: "In Stock" as const,
    featured: true,
    sizes: ["4 Liters", "20 Liters"],
    images: ["https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600"]
  },
  {
    id: "prod_2",
    name: "Sadolin Weatherguard Protection",
    brandId: "brand_sadolin",
    categoryId: "cat_exterior",
    description: "Maximum weather shield outdoor coating designed to withstand heavy rains, direct sunlight and humidity. Formulated with anti-fungal tech.",
    buyingPrice: 110000,
    sellingPrice: 145000,
    minimumStock: 8,
    currentStock: 12,
    coverage: "10-12 sq m per liter",
    dryingTime: "4 hours full dry",
    recommendedSurface: "Exterior masonry, exterior brick walls",
    status: "In Stock" as const,
    featured: true,
    sizes: ["20 Liters"],
    images: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"]
  },
  {
    id: "prod_3",
    name: "Plascon Plaster Primer Undercoat",
    brandId: "brand_plascon",
    categoryId: "cat_primers",
    description: "Water-based alkali-resistant plaster primer designed to seal highly porous walls, providing a stable foundation for topcoats.",
    buyingPrice: 48000,
    sellingPrice: 68000,
    minimumStock: 15,
    currentStock: 6,
    coverage: "8-10 sq m per liter",
    dryingTime: "3 hours touch dry",
    recommendedSurface: "Fresh cement plaster, fiber-cement",
    status: "Low Stock" as const,
    featured: false,
    sizes: ["4 Liters", "20 Liters"],
    images: ["https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600"]
  },
  {
    id: "prod_4",
    name: "Genuine Premium Paint Roller 9 Inch",
    brandId: "brand_colors",
    categoryId: "cat_accessories",
    description: "Anti-splatter micro-fiber 9-inch heavy-duty paint roller for professional walls painting with premium steel frame handle.",
    buyingPrice: 8000,
    sellingPrice: 15000,
    minimumStock: 20,
    currentStock: 45,
    coverage: "N/A",
    dryingTime: "N/A",
    recommendedSurface: "Walls, ceilings, smooth surfaces",
    status: "In Stock" as const,
    featured: true,
    sizes: ["Standard Size"],
    images: ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600"]
  }
];

const DEFAULT_TESTIMONIALS = [
  { id: "test_1", name: "Abubakar Juma", comment: "Genuine Paint Shop has the best customer support! The Coral Silk paint they recommended completely transformed my living room. Fast WhatsApp support!", rating: 5, date: "2026-06-15", active: true },
  { id: "test_2", name: "Mariam Salim", comment: "Excellent price transparency and prompt replies. Their wall coverage calculator estimated the buckets perfectly with no waste. Highly recommend!", rating: 5, date: "2026-06-28", active: true },
  { id: "test_3", name: "David Massawe", comment: "As a painter in Dar, this is my go-to shop. Genuine sadolin, fast service, and supplier stock consistency is top notch.", rating: 4, date: "2026-07-01", active: true }
];

const DEFAULT_HERO_SLIDES = [
  {
    id: "slide_1",
    imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=1200",
    heading: "Vibrant Premium Interior Finishes",
    subtitle: "STYLISH & DURABLE INDOOR COATINGS",
    description: "Elevate your indoor spaces with low-VOC, ultra-washable premium silk and gloss paint selections in over 10,000 custom tones.",
    buttonText: "Browse Interior Paints",
    buttonLink: "#products",
    displayOrder: 1,
    active: true
  },
  {
    id: "slide_2",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    heading: "Weather Shield Exterior Armor",
    subtitle: "DURABLE SUN & RAIN PROTECTION",
    description: "Guard your exterior walls against Dar es Salaam's heat, tropical rainstorms, and humidity with advanced anti-fungal tech.",
    buttonText: "Explore Exterior Protection",
    buttonLink: "#products",
    displayOrder: 2,
    active: true
  },
  {
    id: "slide_3",
    imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=1200",
    heading: "All Essential Painting Accessories",
    subtitle: "PROFESSIONAL PREP & APPLICATION",
    description: "Make painting seamless with our high-grade brushes, micro-fiber rollers, masking tape, and primers.",
    buttonText: "Shop Painting Tools",
    buttonLink: "#products",
    displayOrder: 3,
    active: true
  }
];

// ------------------------------------------
// ------------------------------------------
// ROBUST GENERIC PERSISTENCE AND CACHING HELPERS
// ------------------------------------------
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function safelyFetchDoc<T>(
  docRef: any,
  cacheKey: string,
  defaultValue: T,
  operationType: OperationType = OperationType.GET
): Promise<T> {
  const cached = localStorage.getItem(cacheKey);
  const hasCache = cached !== null;
  const timeoutMs = hasCache ? 200 : 1500;

  try {
    const sDoc = await withTimeout(getDoc(docRef), timeoutMs);
    if (sDoc.exists()) {
      const data = sDoc.data() as T;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } else {
      localStorage.setItem(cacheKey, JSON.stringify(defaultValue));
      return defaultValue;
    }
  } catch (error: any) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, operationType, docRef.path);
    }
    console.warn(`Firestore read failed or timed out for ${cacheKey}, trying local storage cache:`, error);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch (e) {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

async function safelyFetchDocs<T>(
  colRefOrQuery: any,
  cacheKey: string,
  defaultValues: T[],
  operationType: OperationType = OperationType.LIST
): Promise<T[]> {
  const cached = localStorage.getItem(cacheKey);
  const hasCache = cached !== null;
  const timeoutMs = hasCache ? 250 : 2000;

  try {
    const snapshot = await withTimeout(getDocs(colRefOrQuery), timeoutMs);
    const data = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as unknown as T));
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (error: any) {
    if (isPermissionError(error)) {
      const path = colRefOrQuery.path || (colRefOrQuery.ref && colRefOrQuery.ref.path) || "collection";
      handleFirestoreError(error, operationType, path);
    }
    console.warn(`Firestore collection read failed or timed out for ${cacheKey}, trying local storage cache:`, error);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T[];
      } catch (e) {
        return defaultValues;
      }
    }
    return defaultValues;
  }
}

async function safelyWrite<T>(
  writeFn: () => Promise<T>,
  cacheUpdateFn: () => void,
  path: string,
  operationType: OperationType
): Promise<T | null> {
  try {
    cacheUpdateFn();
  } catch (cacheErr) {
    console.error("Cache pre-update failed:", cacheErr);
  }

  try {
    return await withTimeout(writeFn(), 1200);
  } catch (error: any) {
    if (error.message === "Timeout") {
      console.warn(`Firestore write timed out for ${path}, continuing in background.`);
      return null;
    }
    if (isPermissionError(error)) {
      handleFirestoreError(error, operationType, path);
    }
    console.warn(`Firestore write warning for ${path} (handled offline):`, error);
    return null;
  }
}

function updateListCacheItem<T extends { id: string }>(
  cacheKey: string,
  item: T,
  action: 'add' | 'update' | 'delete'
) {
  const cached = localStorage.getItem(cacheKey);
  let list: T[] = [];
  if (cached !== null) {
    try {
      list = JSON.parse(cached);
    } catch (e) {
      list = [];
    }
  }
  
  if (action === 'add') {
    const idx = list.findIndex(x => x.id === item.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push(item);
    }
  } else if (action === 'update') {
    const idx = list.findIndex(x => x.id === item.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...item };
    }
  } else if (action === 'delete') {
    list = list.filter(x => x.id !== item.id);
  }
  
  localStorage.setItem(cacheKey, JSON.stringify(list));
}

// ------------------------------------------
// DATABASE SEEDING / INITIALIZATION
// ------------------------------------------
export async function initializeDatabase() {
  try {
    let storeDoc;
    try {
      storeDoc = await withTimeout(getDoc(doc(db, "settings", "store")), 1000);
    } catch (error: any) {
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.GET, "settings/store");
      }
      console.warn("Firestore offline during initializeDatabase, checking/seeding local storage cache instead:", error);
      
      // Fallback: Seed local storage cache directly if it is empty so the client isn't blocked
      if (!localStorage.getItem("_cache_settings_store")) {
        console.log("Seeding local storage cache with defaults...");
        localStorage.setItem("_cache_settings_store", JSON.stringify(DEFAULT_STORE_SETTINGS));
        localStorage.setItem("_cache_categories", JSON.stringify(DEFAULT_CATEGORIES));
        localStorage.setItem("_cache_brands", JSON.stringify(DEFAULT_BRANDS));
        localStorage.setItem("_cache_products", JSON.stringify(DEFAULT_PRODUCTS));
        localStorage.setItem("_cache_testimonials", JSON.stringify(DEFAULT_TESTIMONIALS));
        localStorage.setItem("_cache_hero_slides", JSON.stringify(DEFAULT_HERO_SLIDES));
        
        const accessKeyHash = await sha256("genuine123");
        const passwordHash = await sha256("genuine");
        const securitySettings: SecuritySettings = {
          accessKeyHash,
          username: "genuine",
          passwordHash,
          theme: "light",
          sessionTimeout: 20
        };
        localStorage.setItem("_cache_settings_security", JSON.stringify(securitySettings));
      }
      return;
    }

    if (storeDoc && storeDoc.exists()) {
      // Document already exists on server, populate local cache for robustness
      const storeSettings = storeDoc.data() as StoreSettings;
      localStorage.setItem("_cache_settings_store", JSON.stringify(storeSettings));
      return;
    }

    console.log("Database empty. Seeding initial Color Selling Business data...");

    // Store settings
    await setDoc(doc(db, "settings", "store"), DEFAULT_STORE_SETTINGS);
    localStorage.setItem("_cache_settings_store", JSON.stringify(DEFAULT_STORE_SETTINGS));

    // Default Security Settings
    const accessKeyHash = await sha256("genuine123");
    const passwordHash = await sha256("genuine");
    const securitySettings: SecuritySettings = {
      accessKeyHash,
      username: "genuine",
      passwordHash,
      theme: "light",
      sessionTimeout: 20
    };
    await setDoc(doc(db, "settings", "security"), securitySettings);
    localStorage.setItem("_cache_settings_security", JSON.stringify(securitySettings));

    // Seed categories
    for (const cat of DEFAULT_CATEGORIES) {
      await setDoc(doc(db, "categories", cat.id), cat);
    }
    localStorage.setItem("_cache_categories", JSON.stringify(DEFAULT_CATEGORIES));

    // Seed brands
    for (const brand of DEFAULT_BRANDS) {
      await setDoc(doc(db, "brands", brand.id), brand);
    }
    localStorage.setItem("_cache_brands", JSON.stringify(DEFAULT_BRANDS));

    // Seed products
    for (const prod of DEFAULT_PRODUCTS) {
      await setDoc(doc(db, "products", prod.id), prod);
    }
    localStorage.setItem("_cache_products", JSON.stringify(DEFAULT_PRODUCTS));

    // Seed testimonials
    for (const test of DEFAULT_TESTIMONIALS) {
      await setDoc(doc(db, "testimonials", test.id), test);
    }
    localStorage.setItem("_cache_testimonials", JSON.stringify(DEFAULT_TESTIMONIALS));

    // Seed hero slides
    for (const slide of DEFAULT_HERO_SLIDES) {
      await setDoc(doc(db, "hero_slides", slide.id), slide);
    }
    localStorage.setItem("_cache_hero_slides", JSON.stringify(DEFAULT_HERO_SLIDES));

    // Seed activity log
    const activityLog = {
      timestamp: new Date().toISOString(),
      activity: "System Initialization",
      adminName: "System",
      details: "Default catalog, slides, testimonials, and security settings seeded successfully."
    };
    await addDoc(collection(db, "activity_logs"), activityLog);
    updateListCacheItem("_cache_activity_logs", { id: "init_log", ...activityLog }, "add");

    console.log("Database seeded successfully!");
  } catch (error: any) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.WRITE, "initialization");
    }
    console.error("Database seeding warning (handled offline):", error);
  }
}

// ------------------------------------------
// SETTINGS
// ------------------------------------------
export async function getStoreSettings(): Promise<StoreSettings> {
  const settings = await safelyFetchDoc<StoreSettings>(doc(db, "settings", "store"), "_cache_settings_store", DEFAULT_STORE_SETTINGS);
  if (settings && !settings.imgbbApiKey) {
    settings.imgbbApiKey = "594b7f7161c7692569c6d847f39f39dd";
    // Persist this update to Firestore
    saveStoreSettings(settings).catch(err => console.warn("Failed to auto-upgrade settings with imgbbApiKey:", err));
  }
  return settings;
}

export async function saveStoreSettings(settings: StoreSettings) {
  await safelyWrite(
    async () => {
      await setDoc(doc(db, "settings", "store"), settings);
    },
    () => {
      localStorage.setItem("_cache_settings_store", JSON.stringify(settings));
    },
    "settings/store",
    OperationType.UPDATE
  );
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const accessKeyHash = await sha256("genuine123");
  const passwordHash = await sha256("genuine");
  const defaultSec: SecuritySettings = {
    accessKeyHash,
    username: "genuine",
    passwordHash,
    theme: "light",
    sessionTimeout: 20
  };
  return safelyFetchDoc<SecuritySettings>(doc(db, "settings", "security"), "_cache_settings_security", defaultSec);
}

export async function saveSecuritySettings(settings: SecuritySettings) {
  await safelyWrite(
    async () => {
      await setDoc(doc(db, "settings", "security"), settings);
    },
    () => {
      localStorage.setItem("_cache_settings_security", JSON.stringify(settings));
    },
    "settings/security",
    OperationType.UPDATE
  );
}

// ------------------------------------------
// CATEGORIES
// ------------------------------------------
export async function getCategories(): Promise<Category[]> {
  return safelyFetchDocs<Category>(collection(db, "categories"), "_cache_categories", DEFAULT_CATEGORIES, OperationType.LIST);
}

export async function addCategory(category: Omit<Category, "id">): Promise<string> {
  const newDocRef = doc(collection(db, "categories"));
  const newId = newDocRef.id;
  const fullItem = { id: newId, ...category };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, category);
    },
    () => {
      updateListCacheItem<Category>("_cache_categories", fullItem, "add");
    },
    `categories/${newId}`,
    OperationType.CREATE
  );

  return newId;
}

export async function updateCategory(id: string, category: Partial<Category>) {
  await safelyWrite(
    async () => {
      await updateDoc(doc(db, "categories", id), category);
    },
    () => {
      const fullItem = { id, ...category } as Category;
      updateListCacheItem<Category>("_cache_categories", fullItem, "update");
    },
    `categories/${id}`,
    OperationType.UPDATE
  );
}

export async function deleteCategory(id: string) {
  await safelyWrite(
    async () => {
      await deleteDoc(doc(db, "categories", id));
    },
    () => {
      updateListCacheItem<Category>("_cache_categories", { id } as Category, "delete");
    },
    `categories/${id}`,
    OperationType.DELETE
  );
}

// ------------------------------------------
// BRANDS
// ------------------------------------------
export async function getBrands(): Promise<Brand[]> {
  return safelyFetchDocs<Brand>(collection(db, "brands"), "_cache_brands", DEFAULT_BRANDS, OperationType.LIST);
}

export async function addBrand(brand: Omit<Brand, "id">): Promise<string> {
  const newDocRef = doc(collection(db, "brands"));
  const newId = newDocRef.id;
  const fullItem = { id: newId, ...brand };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, brand);
    },
    () => {
      updateListCacheItem<Brand>("_cache_brands", fullItem, "add");
    },
    `brands/${newId}`,
    OperationType.CREATE
  );

  return newId;
}

export async function updateBrand(id: string, brand: Partial<Brand>) {
  await safelyWrite(
    async () => {
      await updateDoc(doc(db, "brands", id), brand);
    },
    () => {
      const fullItem = { id, ...brand } as Brand;
      updateListCacheItem<Brand>("_cache_brands", fullItem, "update");
    },
    `brands/${id}`,
    OperationType.UPDATE
  );
}

export async function deleteBrand(id: string) {
  await safelyWrite(
    async () => {
      await deleteDoc(doc(db, "brands", id));
    },
    () => {
      updateListCacheItem<Brand>("_cache_brands", { id } as Brand, "delete");
    },
    `brands/${id}`,
    OperationType.DELETE
  );
}

// ------------------------------------------
// PRODUCTS
// ------------------------------------------
export async function getProducts(): Promise<Product[]> {
  return safelyFetchDocs<Product>(collection(db, "products"), "_cache_products", DEFAULT_PRODUCTS, OperationType.LIST);
}

export async function addProduct(product: Omit<Product, "id">): Promise<string> {
  const newDocRef = doc(collection(db, "products"));
  const newId = newDocRef.id;
  const fullItem = {
    id: newId,
    ...product,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    },
    () => {
      updateListCacheItem<Product>("_cache_products", fullItem, "add");
    },
    `products/${newId}`,
    OperationType.CREATE
  );

  return newId;
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const updatedAt = new Date().toISOString();
  await safelyWrite(
    async () => {
      await updateDoc(doc(db, "products", id), {
        ...product,
        updatedAt
      });
    },
    () => {
      const fullItem = { id, ...product, updatedAt } as Product;
      updateListCacheItem<Product>("_cache_products", fullItem, "update");
    },
    `products/${id}`,
    OperationType.UPDATE
  );
}

export async function deleteProduct(id: string) {
  await safelyWrite(
    async () => {
      await deleteDoc(doc(db, "products", id));
    },
    () => {
      updateListCacheItem<Product>("_cache_products", { id } as Product, "delete");
    },
    `products/${id}`,
    OperationType.DELETE
  );
}

// ------------------------------------------
// SUPPLIERS
// ------------------------------------------
export async function getSuppliers(): Promise<Supplier[]> {
  return safelyFetchDocs<Supplier>(collection(db, "suppliers"), "_cache_suppliers", [], OperationType.LIST);
}

export async function addSupplier(supplier: Omit<Supplier, "id">): Promise<string> {
  const newDocRef = doc(collection(db, "suppliers"));
  const newId = newDocRef.id;
  const fullItem = { id: newId, ...supplier };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, supplier);
    },
    () => {
      updateListCacheItem<Supplier>("_cache_suppliers", fullItem, "add");
    },
    `suppliers/${newId}`,
    OperationType.CREATE
  );

  return newId;
}

export async function updateSupplier(id: string, supplier: Partial<Supplier>) {
  await safelyWrite(
    async () => {
      await updateDoc(doc(db, "suppliers", id), supplier);
    },
    () => {
      const fullItem = { id, ...supplier } as Supplier;
      updateListCacheItem<Supplier>("_cache_suppliers", fullItem, "update");
    },
    `suppliers/${id}`,
    OperationType.UPDATE
  );
}

export async function deleteSupplier(id: string) {
  await safelyWrite(
    async () => {
      await deleteDoc(doc(db, "suppliers", id));
    },
    () => {
      updateListCacheItem<Supplier>("_cache_suppliers", { id } as Supplier, "delete");
    },
    `suppliers/${id}`,
    OperationType.DELETE
  );
}

// ------------------------------------------
// PURCHASES (Stock Received)
// ------------------------------------------
export async function getPurchases(): Promise<Purchase[]> {
  return safelyFetchDocs<Purchase>(query(collection(db, "purchases"), orderBy("purchaseDate", "desc")), "_cache_purchases", [], OperationType.LIST);
}

export async function addPurchase(purchase: Omit<Purchase, "id" | "createdAt">): Promise<string> {
  const purchaseDocRef = doc(collection(db, "purchases"));
  const purchaseId = purchaseDocRef.id;
  const purchaseCreatedAt = new Date().toISOString();
  const fullPurchase = { id: purchaseId, ...purchase, createdAt: purchaseCreatedAt };

  const cacheUpdate = () => {
    updateListCacheItem<Purchase>("_cache_purchases", fullPurchase, "add");

    const cachedProducts = localStorage.getItem("_cache_products");
    if (cachedProducts) {
      try {
        const productsList: Product[] = JSON.parse(cachedProducts);
        const pIdx = productsList.findIndex(p => p.id === purchase.productId);
        if (pIdx !== -1) {
          const productData = productsList[pIdx];
          const newStock = (productData.currentStock || 0) + purchase.quantity;
          let status: "In Stock" | "Low Stock" | "Out of Stock" | "Hidden" = "In Stock";
          if (newStock <= 0) status = "Out of Stock";
          else if (newStock <= (productData.minimumStock || 5)) status = "Low Stock";

          productsList[pIdx] = {
            ...productData,
            currentStock: newStock,
            buyingPrice: purchase.buyingPrice,
            sellingPrice: purchase.sellingPrice,
            status
          };
          localStorage.setItem("_cache_products", JSON.stringify(productsList));
        }
      } catch (e) {
        console.error("Failed to update product cache for purchase:", e);
      }
    }

    const movementId = "mov_" + purchaseId;
    const movement = {
      id: movementId,
      date: purchase.purchaseDate,
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      productId: purchase.productId,
      quantity: purchase.quantity,
      beforeQuantity: 0,
      afterQuantity: purchase.quantity,
      type: "Purchase" as const,
      reason: `Stock received from supplier (Invoice: ${purchase.invoiceNumber || "N/A"})`,
      adminName: "Admin"
    };
    updateListCacheItem<StockMovement>("_cache_stock_movements", movement, "add");

    const notifId = "notif_" + purchaseId;
    const notification = {
      id: notifId,
      timestamp: new Date().toISOString(),
      title: "Stock Received",
      message: `Received ${purchase.quantity} units.`,
      read: false,
      type: "purchase" as const
    };
    updateListCacheItem<Notification>("_cache_notifications", notification, "add");
  };

  await safelyWrite(
    async () => {
      await setDoc(purchaseDocRef, {
        ...purchase,
        createdAt: purchaseCreatedAt
      });

      const productDocRef = doc(db, "products", purchase.productId);
      const pDoc = await getDoc(productDocRef);
      if (pDoc.exists()) {
        const productData = pDoc.data() as Product;
        const newStock = (productData.currentStock || 0) + purchase.quantity;
        
        let status: "In Stock" | "Low Stock" | "Out of Stock" | "Hidden" = "In Stock";
        if (newStock <= 0) status = "Out of Stock";
        else if (newStock <= (productData.minimumStock || 5)) status = "Low Stock";

        await updateDoc(productDocRef, {
          currentStock: newStock,
          buyingPrice: purchase.buyingPrice,
          sellingPrice: purchase.sellingPrice,
          status
        });

        const mDocRef = doc(collection(db, "stock_movements"));
        await setDoc(mDocRef, {
          date: purchase.purchaseDate,
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          productId: purchase.productId,
          quantity: purchase.quantity,
          beforeQuantity: productData.currentStock || 0,
          afterQuantity: newStock,
          type: "Purchase",
          reason: `Stock received from supplier (Invoice: ${purchase.invoiceNumber || "N/A"})`,
          adminName: "Admin"
        });

        const nDocRef = doc(collection(db, "notifications"));
        await setDoc(nDocRef, {
          timestamp: new Date().toISOString(),
          title: "Stock Received",
          message: `Received ${purchase.quantity} units for ${productData.name}. Current Stock: ${newStock}`,
          read: false,
          type: "purchase"
        });
      }
    },
    cacheUpdate,
    `purchases/${purchaseId}`,
    OperationType.CREATE
  );

  return purchaseId;
}

// ------------------------------------------
// SALES
// ------------------------------------------
export async function getSales(): Promise<Sale[]> {
  return safelyFetchDocs<Sale>(query(collection(db, "sales"), orderBy("saleDate", "desc")), "_cache_sales", [], OperationType.LIST);
}

export async function addSale(sale: Omit<Sale, "id" | "createdAt">): Promise<string> {
  const saleDocRef = doc(collection(db, "sales"));
  const saleId = saleDocRef.id;
  const createdAt = new Date().toISOString();
  const fullSale = { id: saleId, ...sale, createdAt };

  const cacheUpdate = () => {
    updateListCacheItem<Sale>("_cache_sales", fullSale, "add");

    const cachedProducts = localStorage.getItem("_cache_products");
    if (cachedProducts) {
      try {
        const productsList: Product[] = JSON.parse(cachedProducts);
        const pIdx = productsList.findIndex(p => p.id === sale.productId);
        if (pIdx !== -1) {
          const productData = productsList[pIdx];
          const newStock = Math.max(0, (productData.currentStock || 0) - sale.quantity);
          let status: "In Stock" | "Low Stock" | "Out of Stock" | "Hidden" = "In Stock";
          if (newStock <= 0) status = "Out of Stock";
          else if (newStock <= (productData.minimumStock || 5)) status = "Low Stock";

          productsList[pIdx] = {
            ...productData,
            currentStock: newStock,
            status
          };
          localStorage.setItem("_cache_products", JSON.stringify(productsList));
        }
      } catch (e) {
        console.error("Failed to update product cache for sale:", e);
      }
    }

    const movementId = "mov_" + saleId;
    const movement = {
      id: movementId,
      date: sale.saleDate,
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      productId: sale.productId,
      quantity: sale.quantity,
      beforeQuantity: 0,
      afterQuantity: 0,
      type: "Sale" as const,
      reason: `Offline Sale Recorded (${sale.paymentMethod})`,
      adminName: "Admin"
    };
    updateListCacheItem<StockMovement>("_cache_stock_movements", movement, "add");
  };

  await safelyWrite(
    async () => {
      await setDoc(saleDocRef, {
        ...sale,
        createdAt
      });

      const productDocRef = doc(db, "products", sale.productId);
      const pDoc = await getDoc(productDocRef);
      if (pDoc.exists()) {
        const productData = pDoc.data() as Product;
        const newStock = Math.max(0, (productData.currentStock || 0) - sale.quantity);
        
        let status: "In Stock" | "Low Stock" | "Out of Stock" | "Hidden" = "In Stock";
        if (newStock <= 0) status = "Out of Stock";
        else if (newStock <= (productData.minimumStock || 5)) status = "Low Stock";

        await updateDoc(productDocRef, {
          currentStock: newStock,
          status
        });

        const mDocRef = doc(collection(db, "stock_movements"));
        await setDoc(mDocRef, {
          date: sale.saleDate,
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          productId: sale.productId,
          quantity: sale.quantity,
          beforeQuantity: productData.currentStock || 0,
          afterQuantity: newStock,
          type: "Sale",
          reason: `Offline Sale Recorded (${sale.paymentMethod})`,
          adminName: "Admin"
        });

        if (status === "Low Stock" || status === "Out of Stock") {
          const nDocRef = doc(collection(db, "notifications"));
          await setDoc(nDocRef, {
            timestamp: new Date().toISOString(),
            title: status === "Out of Stock" ? "Product Out of Stock" : "Low Stock Alert",
            message: `${productData.name} is now ${status.toLowerCase()} (${newStock} items left).`,
            read: false,
            type: status === "Out of Stock" ? "out_of_stock" : "low_stock"
          });
        }
      }
    },
    cacheUpdate,
    `sales/${saleId}`,
    OperationType.CREATE
  );

  return saleId;
}

export async function updateSaleStatus(id: string, status: "Pending" | "Completed" | "Cancelled") {
  await safelyWrite(
    async () => {
      await updateDoc(doc(db, "sales", id), { status });
    },
    () => {
      const fullItem = { id, status } as Sale;
      updateListCacheItem<Sale>("_cache_sales", fullItem, "update");
    },
    `sales/${id}`,
    OperationType.UPDATE
  );
}

// ------------------------------------------
// EXPENSES
// ------------------------------------------
export async function getExpenses(): Promise<Expense[]> {
  return safelyFetchDocs<Expense>(query(collection(db, "expenses"), orderBy("expenseDate", "desc")), "_cache_expenses", [], OperationType.LIST);
}

export async function addExpense(expense: Omit<Expense, "id" | "createdAt">): Promise<string> {
  const newDocRef = doc(collection(db, "expenses"));
  const newId = newDocRef.id;
  const createdAt = new Date().toISOString();
  const fullItem = { id: newId, ...expense, createdAt };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, {
        ...expense,
        createdAt
      });
    },
    () => {
      updateListCacheItem<Expense>("_cache_expenses", fullItem, "add");
    },
    `expenses/${newId}`,
    OperationType.CREATE
  );

  return newId;
}

export async function deleteExpense(id: string) {
  await safelyWrite(
    async () => {
      await deleteDoc(doc(db, "expenses", id));
    },
    () => {
      updateListCacheItem<Expense>("_cache_expenses", { id } as Expense, "delete");
    },
    `expenses/${id}`,
    OperationType.DELETE
  );
}

// ------------------------------------------
// TESTIMONIALS
// ------------------------------------------
export async function getTestimonials(): Promise<Testimonial[]> {
  return safelyFetchDocs<Testimonial>(collection(db, "testimonials"), "_cache_testimonials", DEFAULT_TESTIMONIALS, OperationType.LIST);
}

export async function addTestimonial(testimonial: Omit<Testimonial, "id">): Promise<string> {
  const newDocRef = doc(collection(db, "testimonials"));
  const newId = newDocRef.id;
  const fullItem = { id: newId, ...testimonial };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, testimonial);
    },
    () => {
      updateListCacheItem<Testimonial>("_cache_testimonials", fullItem, "add");
    },
    `testimonials/${newId}`,
    OperationType.CREATE
  );

  return newId;
}

export async function updateTestimonial(id: string, testimonial: Partial<Testimonial>) {
  await safelyWrite(
    async () => {
      await updateDoc(doc(db, "testimonials", id), testimonial);
    },
    () => {
      const fullItem = { id, ...testimonial } as Testimonial;
      updateListCacheItem<Testimonial>("_cache_testimonials", fullItem, "update");
    },
    `testimonials/${id}`,
    OperationType.UPDATE
  );
}

export async function deleteTestimonial(id: string) {
  await safelyWrite(
    async () => {
      await deleteDoc(doc(db, "testimonials", id));
    },
    () => {
      updateListCacheItem<Testimonial>("_cache_testimonials", { id } as Testimonial, "delete");
    },
    `testimonials/${id}`,
    OperationType.DELETE
  );
}

// ------------------------------------------
// HERO SLIDES
// ------------------------------------------
export async function getHeroSlides(): Promise<HeroSlide[]> {
  return safelyFetchDocs<HeroSlide>(collection(db, "hero_slides"), "_cache_hero_slides", DEFAULT_HERO_SLIDES, OperationType.LIST);
}

export async function addHeroSlide(slide: Omit<HeroSlide, "id">): Promise<string> {
  const newDocRef = doc(collection(db, "hero_slides"));
  const newId = newDocRef.id;
  const fullItem = { id: newId, ...slide };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, slide);
    },
    () => {
      updateListCacheItem<HeroSlide>("_cache_hero_slides", fullItem, "add");
    },
    `hero_slides/${newId}`,
    OperationType.CREATE
  );

  return newId;
}

export async function updateHeroSlide(id: string, slide: Partial<HeroSlide>) {
  await safelyWrite(
    async () => {
      await updateDoc(doc(db, "hero_slides", id), slide);
    },
    () => {
      const fullItem = { id, ...slide } as HeroSlide;
      updateListCacheItem<HeroSlide>("_cache_hero_slides", fullItem, "update");
    },
    `hero_slides/${id}`,
    OperationType.UPDATE
  );
}

export async function deleteHeroSlide(id: string) {
  await safelyWrite(
    async () => {
      await deleteDoc(doc(db, "hero_slides", id));
    },
    () => {
      updateListCacheItem<HeroSlide>("_cache_hero_slides", { id } as HeroSlide, "delete");
    },
    `hero_slides/${id}`,
    OperationType.DELETE
  );
}

// ------------------------------------------
// STOCK MOVEMENTS
// ------------------------------------------
export async function getStockMovements(): Promise<StockMovement[]> {
  return safelyFetchDocs<StockMovement>(query(collection(db, "stock_movements"), orderBy("date", "desc"), limit(100)), "_cache_stock_movements", [], OperationType.LIST);
}

export async function adjustStock(productId: string, quantity: number, type: StockMovement["type"], reason: string, adminName: string) {
  const cacheUpdate = () => {
    const cachedProducts = localStorage.getItem("_cache_products");
    if (cachedProducts) {
      try {
        const productsList: Product[] = JSON.parse(cachedProducts);
        const pIdx = productsList.findIndex(p => p.id === productId);
        if (pIdx !== -1) {
          const productData = productsList[pIdx];
          let newStock = productData.currentStock || 0;
          
          if (type === "Stock Adjustment" || type === "Manual Correction" || type === "Return") {
            newStock = quantity;
          } else if (type === "Damage") {
            newStock = Math.max(0, newStock - quantity);
          }

          let status: "In Stock" | "Low Stock" | "Out of Stock" | "Hidden" = "In Stock";
          if (newStock <= 0) status = "Out of Stock";
          else if (newStock <= (productData.minimumStock || 5)) status = "Low Stock";

          productsList[pIdx] = {
            ...productData,
            currentStock: newStock,
            status
          };
          localStorage.setItem("_cache_products", JSON.stringify(productsList));
        }
      } catch (e) {
        console.error("Failed to update product cache for adjustStock:", e);
      }
    }

    const movementId = "mov_adj_" + Date.now();
    const movement = {
      id: movementId,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      productId,
      quantity,
      beforeQuantity: 0,
      afterQuantity: quantity,
      type,
      reason,
      adminName
    };
    updateListCacheItem<StockMovement>("_cache_stock_movements", movement, "add");
  };

  await safelyWrite(
    async () => {
      const productDocRef = doc(db, "products", productId);
      const pDoc = await getDoc(productDocRef);
      if (pDoc.exists()) {
        const productData = pDoc.data() as Product;
        let newStock = productData.currentStock || 0;
        
        if (type === "Stock Adjustment" || type === "Manual Correction" || type === "Return") {
          newStock = quantity;
        } else if (type === "Damage") {
          newStock = Math.max(0, newStock - quantity);
        }

        let status: "In Stock" | "Low Stock" | "Out of Stock" | "Hidden" = "In Stock";
        if (newStock <= 0) status = "Out of Stock";
        else if (newStock <= (productData.minimumStock || 5)) status = "Low Stock";

        await updateDoc(productDocRef, {
          currentStock: newStock,
          status
        });

        const mDocRef = doc(collection(db, "stock_movements"));
        await setDoc(mDocRef, {
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          productId,
          quantity: type === "Damage" ? quantity : Math.abs(newStock - (productData.currentStock || 0)),
          beforeQuantity: productData.currentStock || 0,
          afterQuantity: newStock,
          type,
          reason,
          adminName
        });

        if (status === "Low Stock" || status === "Out of Stock") {
          const nDocRef = doc(collection(db, "notifications"));
          await setDoc(nDocRef, {
            timestamp: new Date().toISOString(),
            title: status === "Out of Stock" ? "Out of Stock Alert" : "Low Stock Alert",
            message: `${productData.name} is now ${status.toLowerCase()} after ${type.toLowerCase()}.`,
            read: false,
            type: "low_stock"
          });
        }
      }
    },
    cacheUpdate,
    `products/${productId}/adjust`,
    OperationType.UPDATE
  );
}

// ------------------------------------------
// ACTIVITY LOGS
// ------------------------------------------
export async function getActivityLogs(): Promise<ActivityLog[]> {
  return safelyFetchDocs<ActivityLog>(query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(100)), "_cache_activity_logs", [], OperationType.LIST);
}

export async function addActivityLog(log: Omit<ActivityLog, "id" | "timestamp">) {
  const newDocRef = doc(collection(db, "activity_logs"));
  const newId = newDocRef.id;
  const timestamp = new Date().toISOString();
  const fullItem = { id: newId, ...log, timestamp };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, {
        ...log,
        timestamp
      });
    },
    () => {
      updateListCacheItem<ActivityLog>("_cache_activity_logs", fullItem, "add");
    },
    `activity_logs/${newId}`,
    OperationType.CREATE
  );
}

export async function clearActivityLogs() {
  await safelyWrite(
    async () => {
      const snapshot = await getDocs(collection(db, "activity_logs"));
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, "activity_logs", d.id));
      }
    },
    () => {
      localStorage.setItem("_cache_activity_logs", JSON.stringify([]));
    },
    "activity_logs/clear",
    OperationType.DELETE
  );
}

// ------------------------------------------
// NOTIFICATIONS
// ------------------------------------------
export async function getNotifications(): Promise<Notification[]> {
  return safelyFetchDocs<Notification>(query(collection(db, "notifications"), orderBy("timestamp", "desc"), limit(50)), "_cache_notifications", [], OperationType.LIST);
}

export async function markNotificationRead(id: string) {
  await safelyWrite(
    async () => {
      await updateDoc(doc(db, "notifications", id), { read: true });
    },
    () => {
      const fullItem = { id, read: true } as Notification;
      updateListCacheItem<Notification>("_cache_notifications", fullItem, "update");
    },
    `notifications/${id}`,
    OperationType.UPDATE
  );
}

export async function clearNotifications() {
  await safelyWrite(
    async () => {
      const snapshot = await getDocs(collection(db, "notifications"));
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, "notifications", d.id));
      }
    },
    () => {
      localStorage.setItem("_cache_notifications", JSON.stringify([]));
    },
    "notifications/clear",
    OperationType.DELETE
  );
}

// ------------------------------------------
// COLOR SHADES
// ------------------------------------------
export async function getColorShades(): Promise<ColorShade[]> {
  return safelyFetchDocs<ColorShade>(collection(db, "color_shades"), "_cache_color_shades", [], OperationType.LIST);
}

export async function addColorShade(shade: Omit<ColorShade, "id">): Promise<string> {
  const newDocRef = doc(collection(db, "color_shades"));
  const newId = newDocRef.id;
  const fullItem = { id: newId, ...shade };

  await safelyWrite(
    async () => {
      await setDoc(newDocRef, shade);
    },
    () => {
      updateListCacheItem<ColorShade>("_cache_color_shades", fullItem, "add");
    },
    `color_shades/${newId}`,
    OperationType.CREATE
  );

  return newId;
}

export async function deleteColorShade(id: string) {
  await safelyWrite(
    async () => {
      await deleteDoc(doc(db, "color_shades", id));
    },
    () => {
      updateListCacheItem<ColorShade>("_cache_color_shades", { id } as ColorShade, "delete");
    },
    `color_shades/${id}`,
    OperationType.DELETE
  );
}
