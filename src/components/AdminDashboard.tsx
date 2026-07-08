import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  Truck, 
  FolderTree, 
  Users, 
  LogOut, 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  DollarSign, 
  Receipt,
  History,
  FileSpreadsheet
} from "lucide-react";
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
import { 
  getNotifications, 
  markNotificationRead, 
  clearNotifications,
  getSecuritySettings,
  saveSecuritySettings
} from "../lib/firebaseService";

// Lazy-load sub-modules to prevent token issues
import AdminOverview from "./admin/AdminOverview";
import AdminInventory from "./admin/AdminInventory";
import AdminPurchases from "./admin/AdminPurchases";
import AdminSales from "./admin/AdminSales";
import AdminExpenses from "./admin/AdminExpenses";
import AdminSettings from "./admin/AdminSettings";

interface AdminDashboardProps {
  settings: StoreSettings;
  categories: Category[];
  brands: Brand[];
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  testimonials: Testimonial[];
  slides: HeroSlide[];
  movements: StockMovement[];
  logs: ActivityLog[];
  colors: ColorShade[];
  onLogout: () => void;
  onRefreshData: () => Promise<void>;
  username: string;
}

export default function AdminDashboard({
  settings,
  categories,
  brands,
  products,
  suppliers,
  purchases,
  sales,
  expenses,
  testimonials,
  slides,
  movements,
  logs,
  colors,
  onLogout,
  onRefreshData,
  username
}: AdminDashboardProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "sales" | "purchases" | "expenses" | "settings"
  >("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme support
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Auto session timeout warning
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 mins

  // Load and apply theme and notifications
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const security = await getSecuritySettings();
        if (security && security.theme) {
          setTheme(security.theme);
        }
        const notifs = await getNotifications();
        setNotifications(notifs);
      } catch (err) {
        console.error("Error loading admin configs", err);
      }
    };
    initDashboard();
  }, []);

  // Theme side effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Timer countdown for inactivity
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onLogout(); // Automatically logout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset timer on user interaction
    const resetTimer = () => {
      setTimeLeft(20 * 60);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [onLogout]);

  const toggleTheme = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      const security = await getSecuritySettings();
      await saveSecuritySettings({ ...security, theme: nextTheme });
    } catch (err) {
      console.warn("Could not persist theme preferences", err);
    }
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    const updated = await getNotifications();
    setNotifications(updated);
  };

  const handleClearAllNotifs = async () => {
    await clearNotifications();
    setNotifications([]);
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-800"} font-sans transition-colors duration-200`}>
      
      {/* HEADER BAR */}
      <header className={`sticky top-0 z-30 h-16 border-b flex items-center justify-between px-4 sm:px-6 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <div className="flex items-center gap-4">
          {/* Hamburger Menu on Mobile */}
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            id="admin-sidebar-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight uppercase">Dashboard Control</span>
            <span className="hidden sm:inline-block bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              ADMIN v1.0
            </span>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          
          {/* Timeout timer indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
            <span>Session:</span>
            <span className="font-bold">{formatTimeLeft(timeLeft)}</span>
          </div>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-xl border hover:bg-gray-100 dark:hover:bg-gray-800 transition dark:border-gray-800 border-gray-200"
            title="Switch Dashboard Theme"
            id="theme-switcher-btn"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Notifications Center */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="p-2.5 rounded-xl border hover:bg-gray-100 dark:hover:bg-gray-800 transition dark:border-gray-800 border-gray-200 relative"
              id="notif-bell-btn"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2.5 w-80 rounded-2xl border shadow-lg overflow-hidden z-40 ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-800"}`} id="notif-dropdown">
                <div className="p-3.5 border-b flex justify-between items-center dark:border-gray-800">
                  <span className="font-bold text-sm">Notifications ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button onClick={handleClearAllNotifs} className="text-xs text-red-500 hover:underline">
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y dark:divide-gray-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      No recent notifications.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 text-xs flex flex-col gap-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.read ? "bg-teal-500/5" : ""}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-gray-900 dark:text-gray-100">{n.title}</span>
                          {!n.read && (
                            <button onClick={() => handleMarkRead(n.id)} className="text-[10px] text-teal-600 font-bold hover:underline">
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 leading-normal">{n.message}</p>
                        <span className="text-[9px] text-gray-400 font-mono mt-0.5">{new Date(n.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick exit to website */}
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition"
            id="admin-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD GRID CONTAINER */}
      <div className="flex">
        
        {/* SIDEBAR NAVIGATION */}
        {/* Desktop Sidebar (Permanent left) */}
        <aside className={`hidden md:flex flex-col w-64 min-h-[calc(100vh-4rem)] border-r ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} p-4 space-y-1`}>
          <div className="pb-4 mb-4 border-b dark:border-gray-800 px-2 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-mono">Welcome Back,</span>
              <span className="font-bold text-sm block truncate max-w-[140px]">{username}</span>
            </div>
            <Sun className="w-4 h-4 text-teal-500" />
          </div>

          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "overview" ? "bg-teal-700 text-white shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview Analytics</span>
          </button>

          <button 
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "inventory" ? "bg-teal-700 text-white shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory & Products</span>
          </button>

          <button 
            onClick={() => setActiveTab("sales")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "sales" ? "bg-teal-700 text-white shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Sales Recorder</span>
          </button>

          <button 
            onClick={() => setActiveTab("purchases")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "purchases" ? "bg-teal-700 text-white shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            <Truck className="w-4 h-4" />
            <span>Receive Purchases</span>
          </button>

          <button 
            onClick={() => setActiveTab("expenses")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "expenses" ? "bg-teal-700 text-white shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            <Receipt className="w-4 h-4" />
            <span>Business Expenses</span>
          </button>

          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "settings" ? "bg-teal-700 text-white shadow-sm" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings Panel</span>
          </button>
        </aside>

        {/* Mobile Slide-out Drawer Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" id="mobile-sidebar-drawer">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            
            <aside className={`relative flex flex-col w-64 max-w-xs h-full p-4 space-y-1 shadow-xl z-10 transition-transform ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
              <div className="flex justify-between items-center pb-4 mb-4 border-b dark:border-gray-800 px-2">
                <span className="font-extrabold tracking-tight text-teal-700 dark:text-teal-400">Genuine Admin</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button 
                onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === "overview" ? "bg-teal-700 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview Analytics</span>
              </button>

              <button 
                onClick={() => { setActiveTab("inventory"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === "inventory" ? "bg-teal-700 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <Package className="w-4 h-4" />
                <span>Inventory & Products</span>
              </button>

              <button 
                onClick={() => { setActiveTab("sales"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === "sales" ? "bg-teal-700 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Sales Recorder</span>
              </button>

              <button 
                onClick={() => { setActiveTab("purchases"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === "purchases" ? "bg-teal-700 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <Truck className="w-4 h-4" />
                <span>Receive Purchases</span>
              </button>

              <button 
                onClick={() => { setActiveTab("expenses"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === "expenses" ? "bg-teal-700 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <Receipt className="w-4 h-4" />
                <span>Business Expenses</span>
              </button>

              <button 
                onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === "settings" ? "bg-teal-700 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings Panel</span>
              </button>
            </aside>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-h-[calc(100vh-4rem)] max-w-full">
          
          {/* Dynamic Module Rendering */}
          {activeTab === "overview" && (
            <AdminOverview 
              settings={settings}
              products={products}
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              movements={movements}
              logs={logs}
              theme={theme}
              onQuickNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "inventory" && (
            <AdminInventory 
              products={products}
              categories={categories}
              brands={brands}
              theme={theme}
              onRefresh={onRefreshData}
              username={username}
            />
          )}

          {activeTab === "purchases" && (
            <AdminPurchases 
              purchases={purchases}
              suppliers={suppliers}
              products={products}
              theme={theme}
              onRefresh={onRefreshData}
              username={username}
            />
          )}

          {activeTab === "sales" && (
            <AdminSales 
              sales={sales}
              products={products}
              theme={theme}
              onRefresh={onRefreshData}
              username={username}
            />
          )}

          {activeTab === "expenses" && (
            <AdminExpenses 
              expenses={expenses}
              theme={theme}
              onRefresh={onRefreshData}
              username={username}
            />
          )}

          {activeTab === "settings" && (
            <AdminSettings 
              settings={settings}
              colors={colors}
              categories={categories}
              brands={brands}
              logs={logs}
              theme={theme}
              onRefresh={onRefreshData}
              username={username}
            />
          )}

        </main>

      </div>
    </div>
  );
}
