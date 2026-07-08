import React, { useState } from "react";
import { 
  Settings, 
  Palette, 
  History, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  X, 
  ShieldAlert,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Tag,
  Building,
  Upload,
  MapPin
} from "lucide-react";
import { StoreSettings, ColorShade, Category, Brand, ActivityLog } from "../../types";
import { 
  saveStoreSettings, 
  addColorShade, 
  deleteColorShade, 
  addCategory, 
  addBrand, 
  addActivityLog,
  clearActivityLogs,
  deleteCategory,
  deleteBrand,
  uploadImageToImgBB
} from "../../lib/firebaseService";

interface AdminSettingsProps {
  settings: StoreSettings;
  colors: ColorShade[];
  categories: Category[];
  brands: Brand[];
  logs: ActivityLog[];
  theme: "light" | "dark";
  onRefresh: () => Promise<void>;
  username: string;
}

export default function AdminSettings({
  settings,
  colors,
  categories,
  brands,
  logs,
  theme,
  onRefresh,
  username
}: AdminSettingsProps) {
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"general" | "colors" | "categories" | "logs">("general");

  // General Settings Form states
  const [storeName, setStoreName] = useState(settings.storeName || "");
  const [phone, setPhone] = useState(settings.contactPhone || "");
  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber || "");
  const [address, setAddress] = useState(settings.defaultAddress || "Msimbazi Street, Dar es Salaam");
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate || 0);
  const [imgbbApiKey, setImgbbApiKey] = useState(settings.imgbbApiKey || "");
  const [latitude, setLatitude] = useState(settings.latitude !== undefined ? String(settings.latitude) : "");
  const [longitude, setLongitude] = useState(settings.longitude !== undefined ? String(settings.longitude) : "");

  // Sync state if settings prop updates
  React.useEffect(() => {
    setStoreName(settings.storeName || "");
    setPhone(settings.contactPhone || "");
    setWhatsapp(settings.whatsappNumber || "");
    setAddress(settings.defaultAddress || "Msimbazi Street, Dar es Salaam");
    setTaxRate(settings.taxRate || 0);
    setImgbbApiKey(settings.imgbbApiKey || "");
    setLatitude(settings.latitude !== undefined ? String(settings.latitude) : "");
    setLongitude(settings.longitude !== undefined ? String(settings.longitude) : "");
  }, [settings]);

  // New Color shade form states
  const [colorCode, setColorCode] = useState("");
  const [colorName, setColorName] = useState("");
  const [hexCode, setHexCode] = useState("#4f46e5");
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);

  // Category and Brand form states
  const [newCatName, setNewCatName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Reusable confirmation state (to replace window.confirm inside iframe)
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
    type: "color" | "category" | "brand" | "clear_logs";
  } | null>(null);

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const parsedLat = latitude.trim() !== "" ? parseFloat(latitude) : undefined;
      const parsedLng = longitude.trim() !== "" ? parseFloat(longitude) : undefined;

      // Automatically construct or keep the googleMaps search query link based on coordinates
      let finalGoogleMapsUrl = settings.googleMaps || "";
      if (parsedLat !== undefined && parsedLng !== undefined && !isNaN(parsedLat) && !isNaN(parsedLng)) {
        finalGoogleMapsUrl = `https://maps.google.com/?q=${parsedLat},${parsedLng}`;
      }

      await saveStoreSettings({
        ...settings,
        name: storeName,
        phone,
        whatsapp,
        address,
        taxRate,
        storeName,
        contactPhone: phone,
        whatsappNumber: whatsapp,
        defaultAddress: address,
        imgbbApiKey,
        latitude: parsedLat,
        longitude: parsedLng,
        googleMaps: finalGoogleMapsUrl
      });

      await addActivityLog({
        activity: "Settings Updated",
        adminName: username,
        details: `Updated enterprise store settings and metadata.`
      });

      setSuccessMsg("General settings updated successfully.");
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddColorShade = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await addColorShade({
        code: colorCode,
        name: colorName,
        hex: hexCode,
        priceAdjustment,
        active: true
      });

      await addActivityLog({
        activity: "Color Shade Added",
        adminName: username,
        details: `Added new paint tint: "${colorName}" (${colorCode}) with adjustment of TZS ${priceAdjustment}`
      });

      setSuccessMsg("Color shade configured successfully.");
      setColorCode("");
      setColorName("");
      setHexCode("#4f46e5");
      setPriceAdjustment(0);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add shade.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColorShade = (id: string, name: string) => {
    setConfirmDelete({ id, name, type: "color" });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setConfirmDelete({ id, name, type: "category" });
  };

  const handleDeleteBrand = (id: string, name: string) => {
    setConfirmDelete({ id, name, type: "brand" });
  };

  const executeDelete = async (item: { id: string; name: string; type: "color" | "category" | "brand" | "clear_logs" }) => {
    try {
      setSaving(true);
      setSuccessMsg("");
      setErrorMsg("");
      if (item.type === "color") {
        await deleteColorShade(item.id);
        await addActivityLog({
          activity: "Color Shade Deleted",
          adminName: username,
          details: `Deleted paint tint shade "${item.name}"`
        });
        setSuccessMsg(`Deleted color shade "${item.name}" successfully.`);
      } else if (item.type === "category") {
        await deleteCategory(item.id);
        await addActivityLog({
          activity: "Category Deleted",
          adminName: username,
          details: `Deleted product category "${item.name}"`
        });
        setSuccessMsg(`Deleted category "${item.name}" successfully.`);
      } else if (item.type === "brand") {
        await deleteBrand(item.id);
        await addActivityLog({
          activity: "Brand Deleted",
          adminName: username,
          details: `Deleted paint brand "${item.name}"`
        });
        setSuccessMsg(`Deleted brand "${item.name}" successfully.`);
      } else if (item.type === "clear_logs") {
        await clearActivityLogs();
        await addActivityLog({
          activity: "Logs Cleared",
          adminName: username,
          details: "Cleaned system activity database manually."
        });
        setSuccessMsg("System audit logs cleared successfully.");
      }
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to delete ${item.type}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await addCategory({ 
        name: newCatName.trim(), 
        description: "Premium paint products and application accessories.",
        icon: "FolderTree",
        active: true
      });
      await addActivityLog({
        activity: "Category Created",
        adminName: username,
        details: `Created product category: "${newCatName.trim()}"`
      });
      setSuccessMsg("Category created successfully.");
      setNewCatName("");
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add category.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    setUploadingBrandLogo(true);

    try {
      let finalLogoUrl = brandLogoUrl.trim();

      // Upload file to ImgBB if selected
      if (brandLogoFile) {
        try {
          finalLogoUrl = await uploadImageToImgBB(brandLogoFile);
        } catch (uploadErr: any) {
          console.error("ImgBB upload failed, falling back or throwing error:", uploadErr);
          if (!finalLogoUrl) {
            throw new Error(`Logo Upload failed: ${uploadErr.message || "Please check your ImgBB key or use a direct URL."}`);
          }
        }
      }

      // Default fallback
      if (!finalLogoUrl) {
        finalLogoUrl = "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120";
      }

      await addBrand({ 
        name: newBrandName.trim(), 
        logoUrl: finalLogoUrl,
        active: true 
      });
      await addActivityLog({
        activity: "Brand Created",
        adminName: username,
        details: `Configured new partner paint manufacturer: "${newBrandName.trim()}"`
      });
      setSuccessMsg(`Brand "${newBrandName.trim()}" created successfully.`);
      setNewBrandName("");
      setBrandLogoFile(null);
      setBrandLogoUrl("");
      
      const fileInput = document.getElementById("brand-logo-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add brand.");
    } finally {
      setSaving(false);
      setUploadingBrandLogo(false);
    }
  };

  // Export Audit Logs to CSV file
  const handleExportLogs = () => {
    try {
      const headers = "Timestamp,Admin Name,Activity,Details\n";
      const rows = logs.map(l => 
        `"${l.timestamp}","${l.adminName}","${l.activity}","${l.details.replace(/"/g, '""')}"`
      ).join("\n");

      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Color_Selling_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } catch (err) {
      alert("Failed to export security logs.");
    }
  };

  const handleClearLogs = () => {
    setConfirmDelete({ id: "all", name: "all system audit logs", type: "clear_logs" });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="system-settings-tab">
      
      {/* Header Panel */}
      <div>
        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">Enterprise Control</span>
        <h2 className="text-2xl font-black">System Preferences</h2>
      </div>

      {/* HORIZONTAL NAVIGATION */}
      <div className="flex border-b dark:border-gray-800 gap-6 overflow-x-auto">
        <button 
          onClick={() => { setActiveTab("general"); setSuccessMsg(""); setErrorMsg(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition shrink-0 ${activeTab === "general" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-400"}`}
        >
          <span className="flex items-center gap-1.5">
            <Settings className="w-4 h-4" />
            <span>General Shop Profile</span>
          </span>
        </button>
        <button 
          onClick={() => { setActiveTab("colors"); setSuccessMsg(""); setErrorMsg(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition shrink-0 ${activeTab === "colors" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-400"}`}
        >
          <span className="flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            <span>Tinting Swatches</span>
          </span>
        </button>
        <button 
          onClick={() => { setActiveTab("categories"); setSuccessMsg(""); setErrorMsg(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition shrink-0 ${activeTab === "categories" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-400"}`}
        >
          <span className="flex items-center gap-1.5">
            <Tag className="w-4 h-4" />
            <span>Brands & Categories</span>
          </span>
        </button>
        <button 
          onClick={() => { setActiveTab("logs"); setSuccessMsg(""); setErrorMsg(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition shrink-0 ${activeTab === "logs" ? "border-teal-700 text-teal-700 dark:text-teal-400" : "border-transparent text-gray-400"}`}
        >
          <span className="flex items-center gap-1.5">
            <History className="w-4 h-4" />
            <span>Security Logs Audit</span>
          </span>
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB VIEW 1: GENERAL SHOP CONFIGURATION */}
      {activeTab === "general" && (
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm max-w-xl`}>
          <h3 className="text-base font-bold mb-4">Enterprise Shop Coordinates</h3>
          
          <form onSubmit={handleSaveStoreSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Company / Store Name</label>
              <input 
                type="text" 
                required 
                value={storeName} 
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-gray-50/50 dark:bg-gray-800 dark:border-gray-700 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Public Contact Phone</label>
                <input 
                  type="text" 
                  required 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50/50 dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">WhatsApp Orders Number</label>
                <input 
                  type="text" 
                  required 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50/50 dark:bg-gray-800 text-sm"
                  placeholder="e.g. +255..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Store Address / Location</label>
              <input 
                type="text" 
                required 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-gray-50/50 dark:bg-gray-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Latitude Coordinates</span>
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={latitude} 
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50/50 dark:bg-gray-800 text-sm font-mono"
                  placeholder="e.g. -6.8973"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Decimal degrees for precise map placement.</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Longitude Coordinates</span>
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={longitude} 
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50/50 dark:bg-gray-800 text-sm font-mono"
                  placeholder="e.g. 39.2721"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Decimal degrees for precise map placement.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Standard Sales VAT Tax Rate (%)</label>
              <input 
                type="number" 
                value={taxRate} 
                onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 border rounded-xl bg-gray-50/50 dark:bg-gray-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">ImgBB API Key (For Image Uploads)</label>
              <input 
                type="text" 
                value={imgbbApiKey} 
                onChange={(e) => setImgbbApiKey(e.target.value)}
                placeholder="Enter your ImgBB API Key"
                className="w-full px-3 py-2 border rounded-xl bg-gray-50/50 dark:bg-gray-800 text-sm font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">If empty, the default shared ImgBB key will be used for product and brand image uploads.</p>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-200 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save System Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB VIEW 2: TINTING COLOR SWATCHES */}
      {activeTab === "colors" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Configure/Create Shade */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm lg:col-span-1 h-fit`}>
            <h3 className="text-base font-bold mb-4">Configure Color Shade</h3>
            <form onSubmit={handleAddColorShade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Tint Code / Formulation No.</label>
                <input 
                  type="text" 
                  required 
                  value={colorCode} 
                  onChange={(e) => setColorCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700"
                  placeholder="e.g. C-102 or RAL 3000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Color Shade Name</label>
                <input 
                  type="text" 
                  required 
                  value={colorName} 
                  onChange={(e) => setColorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  placeholder="e.g. Ocean Sky Blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Hex Swatch Preview</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={hexCode} 
                      onChange={(e) => setHexCode(e.target.value)}
                      className="w-10 h-10 border rounded-lg cursor-pointer shrink-0"
                    />
                    <input 
                      type="text" 
                      required 
                      value={hexCode} 
                      onChange={(e) => setHexCode(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Price Adjust (TZS)</label>
                  <input 
                    type="number" 
                    required 
                    value={priceAdjustment} 
                    onChange={(e) => setPriceAdjustment(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-200 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Add Tint Swatch</span>
              </button>
            </form>
          </div>

          {/* List of active Swatches */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm lg:col-span-2`}>
            <h3 className="text-base font-bold mb-4">Configured Paint Formulation Tints</h3>
            
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="uppercase tracking-wider text-gray-400 border-b dark:border-gray-800">
                  <tr>
                    <th className="pb-3">Visual Swatch</th>
                    <th className="pb-3">Code / Name</th>
                    <th className="pb-3">Markup Adjustment</th>
                    <th className="pb-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {colors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No color tints loaded. Add one to activate.
                      </td>
                    </tr>
                  ) : (
                    colors.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full border border-gray-100 shadow-sm block" style={{ backgroundColor: c.hex }} />
                            <span className="font-mono">{c.hex}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-gray-900 dark:text-gray-100 block">{c.name}</span>
                          <span className="text-gray-400 text-[10px] font-mono tracking-wider">{c.code}</span>
                        </td>
                        <td className="py-3 font-semibold font-mono">
                          {c.priceAdjustment > 0 ? `+ TZS ${c.priceAdjustment.toLocaleString()}` : "No Adjustment"}
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => handleDeleteColorShade(c.id, c.name)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB VIEW 3: BRANDS & CATEGORIES */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Categories setup */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-teal-700" />
              <span>Paints Categories</span>
            </h3>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input 
                type="text" 
                required 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Gloss Finish"
                className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none"
              />
              <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shrink-0">
                Add
              </button>
            </form>

            <div className="divide-y dark:divide-gray-800 max-h-64 overflow-y-auto">
              {categories.map(c => (
                <div key={c.id} className="py-2 text-sm font-semibold flex justify-between items-center text-gray-700 dark:text-gray-300">
                  <div className="flex flex-col">
                    <span>{c.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {c.id.slice(0,6)}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Brands setup */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-teal-700" />
              <span>Paints Brands</span>
            </h3>

            <form onSubmit={handleAddBrand} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Brand Name</label>
                <input 
                  type="text" 
                  required 
                  value={newBrandName} 
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Sadolin Paints"
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Brand Logo Image</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* File Upload Selector */}
                  <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-800/50">
                    <input 
                      type="file" 
                      id="brand-logo-file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setBrandLogoFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="brand-logo-file" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-teal-700 font-bold hover:underline">Click to Upload Logo</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {brandLogoFile ? brandLogoFile.name : "PNG, JPG or WEBP"}
                      </span>
                    </label>
                  </div>

                  {/* Manual URL Input */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">OR Paste Logo URL</span>
                      <input 
                        type="url" 
                        value={brandLogoUrl}
                        onChange={(e) => setBrandLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-3 py-2 border rounded-xl text-xs dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
                      />
                    </div>
                    {brandLogoUrl && (
                      <div className="mt-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl border dark:border-gray-700">
                        <img 
                          src={brandLogoUrl} 
                          alt="Brand Logo Preview" 
                          className="h-8 w-12 object-contain rounded"
                          onError={(e) => { (e.target as HTMLElement).style.display = "none" }}
                        />
                        <span className="text-[10px] text-gray-400 truncate">URL Preview active</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving || uploadingBrandLogo} 
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                {(saving || uploadingBrandLogo) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{(saving || uploadingBrandLogo) ? "Adding Brand..." : "Create Partner Brand"}</span>
              </button>
            </form>

            <div className="divide-y dark:divide-gray-800 max-h-64 overflow-y-auto">
              {brands.map(b => (
                <div key={b.id} className="py-2.5 text-sm font-semibold flex justify-between items-center text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 flex-shrink-0">
                      <img 
                        src={b.logoUrl || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120"} 
                        alt={b.name} 
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100">{b.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {b.id.slice(0,6)}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeleteBrand(b.id, b.name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
                    title="Delete Brand"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB VIEW 4: ACTIVITY LOGS & AUDIT SECURITY */}
      {activeTab === "logs" && (
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold">System Compliance & Audit Trail</h3>
              <p className="text-xs text-gray-400">Log entries reflecting configuration shifts, direct sales, and operational security.</p>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleExportLogs}
                className="px-3 py-2 border rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export Audit CSV</span>
              </button>
              <button 
                onClick={handleClearLogs}
                className="px-3 py-2 bg-red-50 text-red-700 dark:bg-red-950/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-red-100 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Logs Database</span>
              </button>
            </div>
          </div>

          <div className="border dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className={`text-[10px] uppercase tracking-wider ${isDark ? "bg-gray-800" : "bg-gray-50 text-gray-400"}`}>
                  <tr>
                    <th className="p-3">Audit Timestamp</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Action Event</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">
                        No activity trails logged.
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">{log.adminName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[9px]">
                            {log.activity}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400 max-w-sm truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Overlay Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>Confirm Dangerous Action</span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you absolutely sure you want to delete <span className="font-bold text-gray-900 dark:text-gray-100">"{confirmDelete.name}"</span>? 
              This action is permanent and cannot be undone. Any products or settings relying on this item might be affected.
            </p>
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const item = confirmDelete;
                  setConfirmDelete(null);
                  await executeDelete(item);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-md shadow-red-200 dark:shadow-none"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
