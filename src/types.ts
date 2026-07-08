export interface StoreSettings {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  about: string;
  googleMaps: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  footerText: string;
  primaryColor: string; // Dynamic branding color
  storeName?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  defaultAddress?: string;
  taxRate?: number;
  imgbbApiKey?: string;
  latitude?: number;
  longitude?: number;
}

export interface ColorShade {
  id: string;
  code: string;
  name: string;
  hex: string;
  priceAdjustment: number;
  active: boolean;
}

export interface SecuritySettings {
  accessKeyHash: string; // SHA-256 string
  username: string;
  passwordHash: string; // SHA-256 string
  theme: "light" | "dark";
  sessionTimeout: number; // in minutes
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  description: string;
  buyingPrice: number;
  sellingPrice: number;
  minimumStock: number;
  currentStock: number;
  coverage: string; // e.g. "10-12 sq m per liter"
  dryingTime: string; // e.g. "2-4 hours"
  recommendedSurface: string; // e.g. "Interior walls, concrete"
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Hidden";
  featured: boolean;
  sizes: string[]; // e.g. ["1L", "4L", "10L", "20L"]
  images: string[]; // URLs from ImgBB
  createdAt?: any;
  updatedAt?: any;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  businessName: string;
  location: string;
  address: string;
  notes: string;
  active: boolean;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  purchaseDate: string;
  invoiceNumber: string;
  productId: string;
  size: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  notes: string;
  totalValue: number;
  createdAt: any;
}

export interface Sale {
  id: string;
  saleNumber: string;
  saleDate: string;
  productId: string;
  size: string;
  quantity: number;
  sellingPrice: number;
  totalAmount: number;
  paymentMethod: "Cash" | "M-Pesa" | "Airtel Money" | "Bank" | "Other";
  customerName: string;
  customerPhone: string;
  notes: string;
  status?: "Pending" | "Completed" | "Cancelled"; // for WhatsApp orders
  createdAt: any;
}

export interface Expense {
  id: string;
  expenseDate: string;
  category: string; // Transport, Rent, Internet, etc.
  amount: number;
  description: string;
  createdAt: any;
}

export interface Testimonial {
  id: string;
  name: string;
  comment: string;
  rating: number; // 1-5
  date: string;
  active: boolean;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  heading: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  active: boolean;
}

export interface StockMovement {
  id: string;
  date: string;
  time: string;
  productId: string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  type: "Purchase" | "Sale" | "Stock Adjustment" | "Damage" | "Return" | "Manual Correction";
  reason: string;
  adminName: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  activity: string; // Login, Logout, Product CRUD, etc.
  adminName: string;
  details: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  read: boolean;
  type: "low_stock" | "out_of_stock" | "sale" | "purchase" | "security";
}
