import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Truck, 
  Trash2, 
  UserPlus, 
  FileText, 
  Loader2, 
  X, 
  CheckCircle,
  Clock,
  ShieldAlert
} from "lucide-react";
import { Purchase, Supplier, Product } from "../../types";
import { 
  addPurchase, 
  addSupplier, 
  addActivityLog 
} from "../../lib/firebaseService";

interface AdminPurchasesProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  theme: "light" | "dark";
  onRefresh: () => Promise<void>;
  username: string;
}

export default function AdminPurchases({
  purchases,
  suppliers,
  products,
  theme,
  onRefresh,
  username
}: AdminPurchasesProps) {
  const isDark = theme === "dark";

  // Active view tab: "history" or "suppliers"
  const [activeSubTab, setActiveSubTab] = useState<"history" | "suppliers">("history");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);

  // Purchase Form fields
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [buyingPrice, setBuyingPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Supplier Form fields
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supBiz, setSupBiz] = useState("");
  const [supLoc, setSupLoc] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supNotes, setSupNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto set prices on product select
  const handleProductChange = (id: string) => {
    setProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setBuyingPrice(prod.buyingPrice || 0);
      setSellingPrice(prod.sellingPrice || 0);
      setSize(prod.sizes[0] || "4 Liters");
    }
  };

  const handleOpenPurchaseModal = () => {
    const firstProd = products[0];
    setProductId(firstProd?.id || "");
    setSupplierId(suppliers[0]?.id || "");
    setInvoiceNumber("");
    setSize(firstProd?.sizes[0] || "4 Liters");
    setQuantity(1);
    setBuyingPrice(firstProd?.buyingPrice || 0);
    setSellingPrice(firstProd?.sellingPrice || 0);
    setNotes("");
    setErrorMsg("");
    setPurchaseModalOpen(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    if (!productId || !supplierId) {
      setErrorMsg("Please select a valid product and supplier.");
      setSaving(false);
      return;
    }

    try {
      // Create random unique purchase number: PUR-YYYYMMDD-XXXX
      const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const purchaseNumber = `PUR-${datePart}-${randomPart}`;

      const totalValue = quantity * buyingPrice;

      await addPurchase({
        purchaseNumber,
        supplierId,
        purchaseDate: new Date().toISOString().split("T")[0],
        invoiceNumber,
        productId,
        size,
        quantity,
        buyingPrice,
        sellingPrice,
        notes,
        totalValue
      });

      await addActivityLog({
        activity: "Stock Purchase Recorded",
        adminName: username,
        details: `Recorded purchase receipt ${purchaseNumber} for ${quantity} buckets. Total: TZS ${totalValue.toLocaleString()}`
      });

      setPurchaseModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record purchase stock.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSupplierModal = () => {
    setSupName("");
    setSupContact("");
    setSupPhone("");
    setSupBiz("");
    setSupLoc("");
    setSupAddress("");
    setSupNotes("");
    setErrorMsg("");
    setSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      await addSupplier({
        name: supName,
        contactPerson: supContact,
        phone: supPhone,
        businessName: supBiz,
        location: supLoc,
        address: supAddress,
        notes: supNotes,
        active: true
      });

      await addActivityLog({
        activity: "Supplier Registered",
        adminName: username,
        details: `Registered new distributor supplier: "${supName}" (${supBiz})`
      });

      setSupplierModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register supplier.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="receive-purchases-tab">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">Supply Ledger</span>
          <h2 className="text-2xl font-black">Purchases & Suppliers</h2>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleOpenSupplierModal}
            className="px-3 py-2 border rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold flex items-center gap-1.5 transition"
            id="register-supplier-btn"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Supplier</span>
          </button>
          <button 
            onClick={handleOpenPurchaseModal}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition"
            id="receive-stock-btn"
          >
            <Truck className="w-4 h-4" />
            <span>Receive Stock (Purchase)</span>
          </button>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex border-b dark:border-gray-800 gap-6">
        <button 
          onClick={() => { setActiveSubTab("history"); setSearchQuery(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeSubTab === "history" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-400 hover:text-gray-600"}`}
        >
          Purchase Stock History
        </button>
        <button 
          onClick={() => { setActiveSubTab("suppliers"); setSearchQuery(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeSubTab === "suppliers" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-400 hover:text-gray-600"}`}
        >
          Suppliers Database
        </button>
      </div>

      {/* FILTER SEARCH FIELD */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <Search className="w-4 h-4" />
        </span>
        <input 
          type="text" 
          placeholder={activeSubTab === "history" ? "Search invoice or purchase numbers..." : "Search supplier names or location..."} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600 bg-gray-50/45 text-sm"
        />
      </div>

      {/* VIEW PANEL 1: PURCHASES STOCK RECEIPTS */}
      {activeSubTab === "history" && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className={`text-xs uppercase tracking-wider ${isDark ? "bg-gray-800/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
                <tr>
                  <th className="p-4">Purchase Receipt No.</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Product / Size</th>
                  <th className="p-4 font-mono">Date</th>
                  <th className="p-4">Invoice / Note</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Buying Price</th>
                  <th className="p-4">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      No stock purchase invoices found.
                    </td>
                  </tr>
                ) : (
                  purchases.filter(p => p.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => {
                    const prodName = products.find(pr => pr.id === p.productId)?.name || "Unknown Paint";
                    const supplierName = suppliers.find(s => s.id === p.supplierId)?.name || "Direct Supplier";

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="p-4 font-bold font-mono text-teal-850 dark:text-teal-400">
                          {p.purchaseNumber}
                        </td>
                        <td className="p-4">
                          <span className="font-bold block text-gray-900 dark:text-gray-100">{supplierName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {p.supplierId.slice(0,6)}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold block">{prodName}</span>
                          <span className="text-xs text-gray-400 block">Container: {p.size}</span>
                        </td>
                        <td className="p-4 font-mono text-xs">{p.purchaseDate}</td>
                        <td className="p-4 text-xs max-w-xs truncate">
                          <span className="font-bold text-gray-700 dark:text-gray-300 block">Inv: {p.invoiceNumber || "N/A"}</span>
                          <span className="text-gray-400 block">{p.notes || "None"}</span>
                        </td>
                        <td className="p-4 font-bold font-mono text-center">{p.quantity}</td>
                        <td className="p-4 font-mono">TZS {p.buyingPrice.toLocaleString()}</td>
                        <td className="p-4 font-bold font-mono text-teal-800 dark:text-teal-400">
                          TZS {p.totalValue.toLocaleString()}
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

      {/* VIEW PANEL 2: SUPPLIERS DIRECTORY */}
      {activeSubTab === "suppliers" && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className={`text-xs uppercase tracking-wider ${isDark ? "bg-gray-800/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
                <tr>
                  <th className="p-4">Supplier Name</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Business / Company</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No registered paint distributors configured yet.
                    </td>
                  </tr>
                ) : (
                  suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.location.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="p-4 font-bold text-gray-950 dark:text-gray-100">
                        {s.name}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block">{s.contactPerson}</span>
                        <span className="text-xs text-gray-400 block font-mono">{s.phone}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block">{s.businessName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Address: {s.address || "N/A"}</span>
                      </td>
                      <td className="p-4 text-xs">{s.location}</td>
                      <td className="p-4 text-xs text-gray-400 truncate max-w-xs">{s.notes || "No extra specs"}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 text-xs font-bold px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STOCK PURCHASE (RECEIVE INVENTORY) */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold">Receive Paint Stock</h3>
              <button onClick={() => setPurchaseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Select Paint Product</label>
                <select 
                  value={productId} 
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
                >
                  <option value="">-- Choose Paint --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Select Distributor Supplier</label>
                <select 
                  value={supplierId} 
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.businessName})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Invoice Number</label>
                  <input 
                    type="text" 
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. INV-10293"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Container Size</label>
                  <input 
                    type="text" 
                    value={size} 
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. 20 Liters"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Qty (Buckets)</label>
                  <input 
                    type="number" 
                    min="1"
                    required 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buy Price (TZS)</label>
                  <input 
                    type="number" 
                    required 
                    value={buyingPrice} 
                    onChange={(e) => setBuyingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sell Price (TZS)</label>
                  <input 
                    type="number" 
                    required 
                    value={sellingPrice} 
                    onChange={(e) => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Transaction Notes</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  placeholder="Payment receipt terms, packaging damage if any..."
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
                <button type="button" onClick={() => setPurchaseModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER SUPPLIER */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold">Register Paint Supplier</h3>
              <button onClick={() => setSupplierModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Supplier Name</label>
                  <input 
                    type="text" 
                    required 
                    value={supName} 
                    onChange={(e) => setSupName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. Abubakar Salim"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Company / Brand</label>
                  <input 
                    type="text" 
                    required 
                    value={supBiz} 
                    onChange={(e) => setSupBiz(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. Coral Paints TZ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Contact Person</label>
                  <input 
                    type="text" 
                    required 
                    value={supContact} 
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. Sales Director"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    required 
                    value={supPhone} 
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. +255 783..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">City / Region</label>
                  <input 
                    type="text" 
                    required 
                    value={supLoc} 
                    onChange={(e) => setSupLoc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. Dar es Salaam"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Office Address</label>
                  <input 
                    type="text" 
                    value={supAddress} 
                    onChange={(e) => setSupAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. Kilwa Road plot 2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Extra Details / Notes</label>
                <textarea 
                  value={supNotes} 
                  onChange={(e) => setSupNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  placeholder="Terms of supply, credit limits..."
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
                <button type="button" onClick={() => setSupplierModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
