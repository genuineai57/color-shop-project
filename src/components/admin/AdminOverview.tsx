import React from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ShoppingBag, 
  History, 
  Plus, 
  FileSpreadsheet, 
  RefreshCw,
  TrendingDown
} from "lucide-react";
import { 
  StoreSettings, 
  Product, 
  Purchase, 
  Sale, 
  Expense, 
  StockMovement, 
  ActivityLog 
} from "../../types";

interface AdminOverviewProps {
  settings: StoreSettings;
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  movements: StockMovement[];
  logs: ActivityLog[];
  theme: "light" | "dark";
  onQuickNavigate: (tab: "overview" | "inventory" | "sales" | "purchases" | "expenses" | "settings") => void;
}

export default function AdminOverview({
  settings,
  products,
  purchases,
  sales,
  expenses,
  movements,
  logs,
  theme,
  onQuickNavigate
}: AdminOverviewProps) {
  const isDark = theme === "dark";

  // Date constants
  const todayStr = new Date().toISOString().split("T")[0];

  // Calculations
  // Today's Sales
  const todaySales = sales
    .filter(s => s.saleDate === todayStr && s.status !== "Cancelled")
    .reduce((sum, s) => sum + s.totalAmount, 0);

  // Today's Expenses
  const todayExpenses = expenses
    .filter(e => e.expenseDate === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Calculations for gross and net profits
  // Product margins (Selling Price - Buying Price)
  const getSaleProfit = (sale: Sale) => {
    const prod = products.find(p => p.id === sale.productId);
    if (!prod) return 0;
    const buyingRate = prod.buyingPrice || 0;
    const margin = sale.sellingPrice - buyingRate;
    return margin * sale.quantity;
  };

  const todayProfit = sales
    .filter(s => s.saleDate === todayStr && s.status !== "Cancelled")
    .reduce((sum, s) => sum + getSaleProfit(s), 0);

  const netProfitToday = todayProfit - todayExpenses;

  // Monthly Sales/Revenue
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthlySales = sales
    .filter(s => s.saleDate.startsWith(currentMonthPrefix) && s.status !== "Cancelled")
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const monthlyProfit = sales
    .filter(s => s.saleDate.startsWith(currentMonthPrefix) && s.status !== "Cancelled")
    .reduce((sum, s) => sum + getSaleProfit(s), 0);

  // Total inventory value (Stock * Buying Price)
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.buyingPrice || 0)), 0);

  // Low stock products count
  const lowStockCount = products.filter(p => p.status === "Low Stock" || p.status === "Out of Stock").length;

  // Pending WhatsApp Orders count
  const pendingOrdersCount = sales.filter(s => s.status === "Pending").length;

  // Let's create mock weekly sales trend for a premium SVG Chart
  // We'll calculate sales for the last 7 days dynamically
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = last7Days.map(date => {
    const dailyRev = sales
      .filter(s => s.saleDate === date && s.status !== "Cancelled")
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const dailyProf = sales
      .filter(s => s.saleDate === date && s.status !== "Cancelled")
      .reduce((sum, s) => sum + getSaleProfit(s), 0);
    return {
      date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      revenue: dailyRev,
      profit: dailyProf
    };
  });

  // Find max value in chart data to scale SVG correctly
  const maxVal = Math.max(...chartData.map(d => d.revenue), 100000);

  // Top Products calculations
  const productSalesCount: { [id: string]: number } = {};
  sales.forEach(s => {
    if (s.status !== "Cancelled") {
      productSalesCount[s.productId] = (productSalesCount[s.productId] || 0) + s.quantity;
    }
  });

  const topSellingProducts = Object.entries(productSalesCount)
    .map(([id, qty]) => {
      const prod = products.find(p => p.id === id);
      return {
        name: prod?.name || "Unknown Paint",
        qty,
        revenue: qty * (prod?.sellingPrice || 0)
      };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-8" id="overview-analytics-tab">
      
      {/* Welcome banner */}
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-100"} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block">Operational Dashboard</span>
          <h2 className="text-2xl font-black tracking-tight mt-1">Genuine Paints Business Intelligence</h2>
          <p className="text-xs text-gray-500 mt-1">Real-time valuation, sales trends, and inventory health metrics.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => onQuickNavigate("sales")} 
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Sale</span>
          </button>
          <button 
            onClick={() => onQuickNavigate("purchases")} 
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Receive Stock</span>
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: Today's Revenue */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-150"} shadow-sm flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">Today's Revenue</span>
            <span className="text-xl font-extrabold block mt-1">TZS {todaySales.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 mt-0.5 block">Recorded Offline</span>
          </div>
          <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2: Today's Gross Profit */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-150"} shadow-sm flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase font-sans">Today's Profit</span>
            <span className={`text-xl font-extrabold block mt-1 ${netProfitToday >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              TZS {netProfitToday.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5 block">Net margin (Profit-Exp)</span>
          </div>
          <div className={`p-3 rounded-2xl ${netProfitToday >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3: Monthly Sales */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-150"} shadow-sm flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">This Month Sales</span>
            <span className="text-xl font-extrabold block mt-1">TZS {monthlySales.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 mt-0.5 block">Profit: TZS {monthlyProfit.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 4: Inventory Valuation */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-150"} shadow-sm flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">Stock Valuation</span>
            <span className="text-xl font-extrabold block mt-1">TZS {totalInventoryValue.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 mt-0.5 block">{products.length} Products configured</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
            <Package className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SECONDARY STATS ROW (Low stock & WhatsApp orders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Low Stock count alert banner */}
        <div 
          onClick={() => onQuickNavigate("inventory")}
          className={`p-5 rounded-2xl border cursor-pointer transition hover:-translate-y-0.5 duration-200 flex items-center gap-4 ${lowStockCount > 0 ? "bg-amber-50/70 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/40" : "bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800"}`}
        >
          <div className={`p-3.5 rounded-xl ${lowStockCount > 0 ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold block uppercase tracking-wider text-gray-400">Low & Out-Of-Stock Alerts</span>
            <span className="text-xl font-black mt-0.5 block">
              {lowStockCount} Products Need Restock
            </span>
            <p className="text-xs text-gray-500 mt-0.5">Click here to receive stock or review items.</p>
          </div>
        </div>

        {/* Pending Orders card */}
        <div 
          onClick={() => onQuickNavigate("sales")}
          className={`p-5 rounded-2xl border cursor-pointer transition hover:-translate-y-0.5 duration-200 flex items-center gap-4 ${pendingOrdersCount > 0 ? "bg-teal-50/70 border-teal-200/50 dark:bg-teal-950/10 dark:border-teal-900/40" : "bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800"}`}
        >
          <div className={`p-3.5 rounded-xl ${pendingOrdersCount > 0 ? "bg-teal-700 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}>
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold block uppercase tracking-wider text-gray-400">Pending WhatsApp Orders</span>
            <span className="text-xl font-black mt-0.5 block">
              {pendingOrdersCount} Active Requests
            </span>
            <p className="text-xs text-gray-500 mt-0.5">Manually update status after dispatching paints.</p>
          </div>
        </div>

      </div>

      {/* CHARTS GRID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column 1: Weekly Revenue Trend (SVG GRAPH) */}
        <div className={`p-6 rounded-2xl border lg:col-span-2 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Weekly Revenue Analytics</h3>
              <p className="text-xs text-gray-400">Trend representing sales of the last 7 calendar days.</p>
            </div>
            <span className="text-xs font-bold text-teal-600 font-mono">Real-time</span>
          </div>

          {/* Canvas SVG Chart */}
          <div className="h-64 relative mt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke={isDark ? "#1f2937" : "#f1f5f9"} strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke={isDark ? "#1f2937" : "#f1f5f9"} strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke={isDark ? "#1f2937" : "#f1f5f9"} strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke={isDark ? "#374151" : "#e2e8f0"} strokeWidth="1" />

              {/* Data bar rendering */}
              {chartData.map((d, idx) => {
                const xPos = 60 + idx * 60;
                // Scale height based on maxVal
                const barHeight = d.revenue > 0 ? (d.revenue / maxVal) * 130 : 5;
                const profitHeight = d.profit > 0 ? (d.profit / maxVal) * 130 : 2;
                const yPosBar = 170 - barHeight;
                const yPosProfit = 170 - profitHeight;

                return (
                  <g key={idx}>
                    {/* Revenue Bar */}
                    <rect 
                      x={xPos} 
                      y={yPosBar} 
                      width="16" 
                      height={barHeight} 
                      fill="#0f766e" 
                      rx="3" 
                      className="transition-all duration-500 hover:fill-teal-800 cursor-pointer"
                    />
                    {/* Profit Bar (inside or adjacent) */}
                    <rect 
                      x={xPos + 18} 
                      y={yPosProfit} 
                      width="10" 
                      height={profitHeight} 
                      fill="#10b981" 
                      rx="2" 
                      className="transition-all duration-500 hover:fill-emerald-600 cursor-pointer"
                    />
                    {/* X-axis Label */}
                    <text 
                      x={xPos + 12} 
                      y="190" 
                      textAnchor="middle" 
                      fill={isDark ? "#9ca3af" : "#64748b"} 
                      fontSize="9" 
                      fontWeight="bold"
                    >
                      {d.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Chart Legend */}
          <div className="flex gap-4 justify-center mt-3 text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-3.5 bg-teal-700 rounded" />
              <span>Revenue (TZS)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded" />
              <span>Gross Profit (TZS)</span>
            </div>
          </div>
        </div>

        {/* Chart Column 2: Top Selling Products */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Top 5 Best Selling</h3>
            <p className="text-xs text-gray-400">Product performance ranked by quantities sold.</p>
          </div>

          <div className="space-y-4 mt-6">
            {topSellingProducts.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                No offline sales registered yet.
              </div>
            ) : (
              topSellingProducts.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="truncate max-w-[160px]">{p.name}</span>
                    <span className="font-mono">{p.qty} Buckets</span>
                  </div>
                  {/* Styled loading indicator bar representation */}
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-700 rounded-full" 
                      style={{ width: `${Math.min(100, (p.qty / 50) * 100)}%` }} 
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 block text-right">TZS {p.revenue.toLocaleString()} Rev</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* RECENT ACTIVITY & SYSTEM LOGS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Stock Movements History log */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>Stock Movement Logs</span>
            </h3>
            <button onClick={() => onQuickNavigate("inventory")} className="text-xs text-teal-600 hover:underline">
              View Inventory
            </button>
          </div>

          <div className="divide-y dark:divide-gray-800 max-h-72 overflow-y-auto">
            {movements.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                No movements recorded.
              </div>
            ) : (
              movements.slice(0, 5).map(m => (
                <div key={m.id} className="py-2.5 text-xs flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        m.type === "Purchase" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" : 
                        m.type === "Sale" ? "bg-teal-50 text-teal-700 dark:bg-teal-950/20" : "bg-red-50 text-red-700 dark:bg-red-950/20"
                      }`}>
                        {m.type}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {products.find(p => p.id === m.productId)?.name || "Paint"}
                      </span>
                    </div>
                    <span className="text-gray-400 text-[10px] mt-0.5 block">{m.reason}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono">
                      {m.type === "Sale" || m.type === "Damage" ? "-" : "+"}{m.quantity}
                    </span>
                    <span className="text-gray-400 text-[10px] block font-mono">{m.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Security & Admin Audit trail */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              <span>Admin Activity Logs</span>
            </h3>
            <button onClick={() => onQuickNavigate("settings")} className="text-xs text-teal-600 hover:underline">
              System Settings
            </button>
          </div>

          <div className="divide-y dark:divide-gray-800 max-h-72 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                No activity logs available.
              </div>
            ) : (
              logs.slice(0, 5).map(log => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{log.activity}</span>
                    <span className="text-gray-400 font-mono text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5 leading-normal">{log.details}</p>
                  <span className="text-[10px] font-semibold text-gray-400 block mt-0.5">By: {log.adminName}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
