import React, { useState, useEffect } from "react";
import { 
  getStoreSettings, 
  getSecuritySettings, 
  getCategories, 
  getBrands, 
  getProducts, 
  getSuppliers, 
  getPurchases, 
  getSales, 
  getExpenses, 
  getTestimonials, 
  getHeroSlides, 
  getStockMovements, 
  getActivityLogs, 
  getColorShades,
  initializeDatabase 
} from "./lib/firebaseService";
import { 
  StoreSettings, 
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
  ColorShade
} from "./types";
import PublicWebsite from "./components/PublicWebsite";
import AdminDashboard from "./components/AdminDashboard";
import LoginModal from "./components/LoginModal";
import { Loader2 } from "lucide-react";

export default function App() {
  // Navigation State
  const [isAdminView, setIsAdminView] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");

  // DB States
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [colorShades, setColorShades] = useState<ColorShade[]>([]);

  // Hidden admin access logo click counter
  const [logoTaps, setLogoTaps] = useState(0);

  // Load all databases from Firestore
  const loadAllData = async () => {
    try {
      const [
        settingsData,
        categoriesData,
        brandsData,
        productsData,
        suppliersData,
        purchasesData,
        salesData,
        expensesData,
        testimonialsData,
        slidesData,
        movementsData,
        logsData,
        colorShadesData
      ] = await Promise.all([
        getStoreSettings(),
        getCategories(),
        getBrands(),
        getProducts(),
        getSuppliers(),
        getPurchases(),
        getSales(),
        getExpenses(),
        getTestimonials(),
        getHeroSlides(),
        getStockMovements(),
        getActivityLogs(),
        getColorShades()
      ]);

      setStoreSettings(settingsData);
      setCategories(categoriesData);
      setBrands(brandsData);
      setProducts(productsData);
      setSuppliers(suppliersData);
      setPurchases(purchasesData);
      setSales(salesData);
      setExpenses(expensesData);
      setTestimonials(testimonialsData);
      setHeroSlides(slidesData);
      setStockMovements(movementsData);
      setActivityLogs(logsData);
      setColorShades(colorShadesData);
    } catch (error) {
      console.error("Error loading enterprise datasets:", error);
    }
  };

  // Run initialization on mount
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        // Seeding database with defaults if empty
        await initializeDatabase();
        await loadAllData();
      } catch (err) {
        console.error("Critical error bootstrapping applet:", err);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const handleLogoClick = () => {
    const newTaps = logoTaps + 1;
    setLogoTaps(newTaps);
    if (newTaps >= 5) {
      setIsLoginModalOpen(true);
      setLogoTaps(0);
    }
  };

  const handleLoginSuccess = (username: string) => {
    setAdminUsername(username);
    setIsLoginModalOpen(false);
    setIsAdminView(true);
  };

  const handleLogout = () => {
    setAdminUsername("");
    setIsAdminView(false);
  };

  if (loading || !storeSettings) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-gray-800">
        <Loader2 className="w-12 h-12 animate-spin text-teal-700" />
        <h2 className="text-lg font-extrabold mt-4 tracking-tight">Initializing Color Selling Ledger...</h2>
        <p className="text-xs text-gray-500 mt-1">Connecting securely to firestore and caching asset catalog.</p>
      </div>
    );
  }

  return (
    <>
      {isAdminView ? (
        <AdminDashboard
          settings={storeSettings}
          categories={categories}
          brands={brands}
          products={products}
          suppliers={suppliers}
          purchases={purchases}
          sales={sales}
          expenses={expenses}
          testimonials={testimonials}
          slides={heroSlides}
          movements={stockMovements}
          logs={activityLogs}
          colors={colorShades}
          onLogout={handleLogout}
          onRefreshData={loadAllData}
          username={adminUsername || "Admin User"}
        />
      ) : (
        <PublicWebsite
          settings={storeSettings}
          categories={categories}
          brands={brands}
          products={products}
          testimonials={testimonials}
          slides={heroSlides}
          onOpenAdminLogin={() => setIsLoginModalOpen(true)}
          logoTaps={logoTaps}
          handleLogoClick={handleLogoClick}
          loading={loading}
        />
      )}

      {/* SECURE ADMIN LOGIN MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => { setIsLoginModalOpen(false); setLogoTaps(0); }}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
