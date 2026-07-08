import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Trash2, 
  FileSpreadsheet, 
  Loader2, 
  X, 
  CheckCircle,
  XCircle,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import { Sale, Product } from "../../types";
import { 
  addSale, 
  updateSaleStatus, 
  addActivityLog 
} from "../../lib/firebaseService";

interface AdminSalesProps {
  sales: Sale[];
  products: Product[];
  theme: "light" | "dark";
  onRefresh: () => Promise<void>;
  username: string;
}

export default function AdminSales({
  sales,
  products,
  theme,
  onRefresh,
  username
}: AdminSalesProps) {
  const isDark = theme === "dark";

  const [activeSubTab, setActiveSubTab] = useState<"history" | "pending">("history");
  const [searchQuery, setSearchQuery] = useState("");

  const [salesModalOpen, setSalesModalOpen] = useState(false);

  // Form Fields
  const [productId, setProductId] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<Sale["paymentMethod"]>("Cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleProductChange = (id: string) => {
    setProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setSellingPrice(prod.sellingPrice || 0);
      setSize(prod.sizes[0] || "4 Liters");
    }
  };

  const handleOpenSalesModal = () => {
    const firstProd = products[0];
    setProductId(firstProd?.id || "");
    setSize(firstProd?.sizes[0] || "4 Liters");
    setQuantity(1);
    setSellingPrice(firstProd?.sellingPrice || 0);
    setPaymentMethod("Cash");
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
    setErrorMsg("");
    setSalesModalOpen(true);
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    if (!productId) {
      setErrorMsg("Please choose a paint product.");
      setSaving(false);
      return;
    }

    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct && (selectedProduct.currentStock || 0) < quantity) {
      setErrorMsg(`Insufficient stock. Current stock left is ${selectedProduct.currentStock || 0} buckets.`);
      setSaving(false);
      return;
    }

    try {
      const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const saleNumber = `SAL-${datePart}-${randomPart}`;

      const totalAmount = quantity * sellingPrice;

      await addSale({
        saleNumber,
        saleDate: new Date().toISOString().split("T")[0],
        productId,
        size,
        quantity,
        sellingPrice,
        totalAmount,
        paymentMethod,
        customerName,
        customerPhone,
        notes,
        status: "Completed"
      });

      await addActivityLog({
        activity: "Offline Sale Recorded",
        adminName: username,
        details: `Logged direct cash/mobile sale receipt ${saleNumber}. Total: TZS ${totalAmount.toLocaleString()}`
      });

      setSalesModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record sales transactions.");
    } finally {
      setSaving(false);
    }
  };

  // Status transitions for WhatsApp orders
  const handleOrderStatusUpdate = async (sale: Sale, nextStatus: "Completed" | "Cancelled") => {
    try {
      if (nextStatus === "Completed") {
        // Double check stock
        const prod = products.find(p => p.id === sale.productId);
        if (prod && (prod.currentStock || 0) < sale.quantity) {
          alert(`Insufficient stock. Cannot complete order. Total stock is ${prod.currentStock || 0}`);
          return;
        }
      }

      await updateSaleStatus(sale.id, nextStatus);
      await addActivityLog({
        activity: `Order ${nextStatus}`,
        adminName: username,
        details: `WhatsApp order ${sale.saleNumber} status adjusted to: ${nextStatus}`
      });
      await onRefresh();
    } catch (err) {
      alert("Error updating order status.");
    }
  };

  // Split history and pending WhatsApp requests
  const completedSales = sales.filter(s => s.status === "Completed" || !s.status);
  const pendingOrders = sales.filter(s => s.status === "Pending" || s.status === "Cancelled");

  return (
    <div className="space-y-6" id="sales-recorder-tab">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">Sales Desk</span>
          <h2 className="text-2xl font-black">Sales & Order Manager</h2>
        </div>
        <button 
          onClick={handleOpenSalesModal}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition"
          id="record-direct-sale-btn"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Record Offline Sale</span>
        </button>
      </div>

      {/* SUB TAB MENU */}
      <div className="flex border-b dark:border-gray-800 gap-6">
        <button 
          onClick={() => { setActiveSubTab("history"); setSearchQuery(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeSubTab === "history" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-400 hover:text-gray-600"}`}
        >
          Standard Sales Ledger
        </button>
        <button 
          onClick={() => { setActiveSubTab("pending"); setSearchQuery(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeSubTab === "pending" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-400 hover:text-gray-600"} flex items-center gap-2`}
        >
          <span>WhatsApp Orders Drawer</span>
          {sales.filter(s => s.status === "Pending").length > 0 && (
            <span className="h-4 px-1.5 text-[9px] font-bold bg-red-500 text-white rounded-full">
              {sales.filter(s => s.status === "Pending").length}
            </span>
          )}
        </button>
      </div>

      {/* FILTER SEARCH FIELD */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <Search className="w-4 h-4" />
        </span>
        <input 
          type="text" 
          placeholder={activeSubTab === "history" ? "Search receipt codes or customers..." : "Search whatsapp buyers..."} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600 bg-gray-50/45 text-sm"
        />
      </div>

      {/* VIEW PANEL 1: SALES LEDGER */}
      {activeSubTab === "history" && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className={`text-xs uppercase tracking-wider ${isDark ? "bg-gray-800/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
                <tr>
                  <th className="p-4">Receipt Number</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Product Purchased</th>
                  <th className="p-4 font-mono">Date</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {completedSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No direct offline sales tracked.
                    </td>
                  </tr>
                ) : (
                  completedSales.filter(s => s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) || s.customerName.toLowerCase().includes(searchQuery.toLowerCase())).map(s => {
                    const prodName = products.find(pr => pr.id === s.productId)?.name || "Unknown Paint";

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="p-4 font-bold font-mono text-teal-850 dark:text-teal-400">
                          {s.saleNumber}
                        </td>
                        <td className="p-4">
                          <span className="font-bold block text-gray-900 dark:text-gray-100">{s.customerName || "Walk-in Customer"}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{s.customerPhone || "No contact"}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold block">{prodName}</span>
                          <span className="text-xs text-gray-400 block">Container: {s.size}</span>
                        </td>
                        <td className="p-4 font-mono text-xs">{s.saleDate}</td>
                        <td className="p-4 text-xs font-semibold">
                          <span className={`px-2 py-0.5 rounded ${
                            s.paymentMethod === "Cash" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20"
                          }`}>
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 font-bold font-mono text-center">{s.quantity}</td>
                        <td className="p-4 font-mono">TZS {s.sellingPrice.toLocaleString()}</td>
                        <td className="p-4 font-bold font-mono text-teal-800 dark:text-teal-400">
                          TZS {s.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW PANEL 2: WHATSAPP ORDER DESK */}
      {activeSubTab === "pending" && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className={`text-xs uppercase tracking-wider ${isDark ? "bg-gray-800/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
                <tr>
                  <th className="p-4">Order Code</th>
                  <th className="p-4">WhatsApp Customer</th>
                  <th className="p-4">Product requested</th>
                  <th className="p-4 font-mono">Date</th>
                  <th className="p-4">Size / Qty</th>
                  <th className="p-4">Total Valuation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No online whatsapp order requests.
                    </td>
                  </tr>
                ) : (
                  pendingOrders.filter(s => s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) || s.customerName.toLowerCase().includes(searchQuery.toLowerCase())).map(s => {
                    const prodName = products.find(pr => pr.id === s.productId)?.name || "Unknown Paint";

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="p-4 font-bold font-mono">
                          {s.saleNumber}
                        </td>
                        <td className="p-4">
                          <span className="font-bold block text-gray-900 dark:text-gray-100">{s.customerName || "WhatsApp Contact"}</span>
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>{s.customerPhone}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold block">{prodName}</span>
                        </td>
                        <td className="p-4 font-mono text-xs">{s.saleDate}</td>
                        <td className="p-4 text-xs font-semibold">
                          <span>{s.size} ({s.quantity} items)</span>
                        </td>
                        <td className="p-4 font-bold font-mono">
                          TZS {s.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                            s.status === "Pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20" : "bg-red-50 text-red-700 dark:bg-red-950/20"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {s.status === "Pending" && (
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleOrderStatusUpdate(s, "Completed")}
                                className="p-1 px-2.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 font-bold text-xs flex items-center gap-1"
                                title="Approve & Dispatch paints"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>
                              <button 
                                onClick={() => handleOrderStatusUpdate(s, "Cancelled")}
                                className="p-1 px-2.5 rounded bg-red-600 text-white hover:bg-red-700 font-bold text-xs flex items-center gap-1"
                                title="Cancel order"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD OFFLINE SALE MODAL */}
      {salesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold">Record Offline Cash Sale</h3>
              <button onClick={() => setSalesModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSale} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Select Paint Product</label>
                <select 
                  value={productId} 
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
                >
                  <option value="">-- Choose Paint --</option>
                  {products.filter(p => p.status !== "Hidden").map(p => <option key={p.id} value={p.id}>{p.name} ({p.currentStock} left)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Selected Size</label>
                  <input 
                    type="text" 
                    value={size} 
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. 4 Liters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
                  >
                    <option value="Cash">Cash Ledger</option>
                    <option value="M-Pesa">Vodacom M-Pesa</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Bank">CRDB/NMB Bank Transfer</option>
                    <option value="Other">Other Mobile Money</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Quantity (Containers)</label>
                  <input 
                    type="number" 
                    min="1"
                    required 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Selling Rate (TZS)</label>
                  <input 
                    type="number" 
                    required 
                    value={sellingPrice} 
                    onChange={(e) => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Customer Name (Optional)</label>
                  <input 
                    type="text" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                    placeholder="e.g. Juma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Customer Phone (Optional)</label>
                  <input 
                    type="text" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                    placeholder="e.g. 0715..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sale Comments</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  placeholder="Extra requests, custom mixing codes..."
                  rows={2}
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button type="button" onClick={() => setSalesModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Record Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
