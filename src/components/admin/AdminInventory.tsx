import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Upload, 
  Loader2, 
  ShieldAlert, 
  X,
  Filter
} from "lucide-react";
import { Product, Category, Brand } from "../../types";
import { 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  uploadImageToImgBB,
  addActivityLog 
} from "../../lib/firebaseService";

interface AdminInventoryProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  theme: "light" | "dark";
  onRefresh: () => Promise<void>;
  username: string;
}

export default function AdminInventory({
  products,
  categories,
  brands,
  theme,
  onRefresh,
  username
}: AdminInventoryProps) {
  const isDark = theme === "dark";

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  // Add/Edit Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [buyingPrice, setBuyingPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(5);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [coverage, setCoverage] = useState("");
  const [dryingTime, setDryingTime] = useState("");
  const [recommendedSurface, setRecommendedSurface] = useState("");
  const [sizesInput, setSizesInput] = useState("4 Liters, 20 Liters");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [directUrlInput, setDirectUrlInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<Product["status"]>("In Stock");

  // Upload/Saving States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Reusable confirmation state (to replace window.confirm inside iframe)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName("");
    setBrandId(brands[0]?.id || "");
    setCategoryId(categories[0]?.id || "");
    setDescription("");
    setBuyingPrice(0);
    setSellingPrice(0);
    setMinimumStock(5);
    setCurrentStock(0);
    setCoverage("12-14 sq m per liter");
    setDryingTime("2 hours touch dry");
    setRecommendedSurface("Interior masonry plaster");
    setSizesInput("4 Liters, 20 Liters");
    setImageFiles([]);
    setExistingImages([]);
    setDirectUrlInput("");
    setIsFeatured(false);
    setStatus("In Stock");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setBrandId(p.brandId);
    setCategoryId(p.categoryId);
    setDescription(p.description);
    setBuyingPrice(p.buyingPrice || 0);
    setSellingPrice(p.sellingPrice);
    setMinimumStock(p.minimumStock || 5);
    setCurrentStock(p.currentStock || 0);
    setCoverage(p.coverage || "");
    setDryingTime(p.dryingTime || "");
    setRecommendedSurface(p.recommendedSurface || "");
    setSizesInput(p.sizes.join(", "));
    setImageFiles([]);
    setExistingImages(p.images || []);
    setDirectUrlInput("");
    setIsFeatured(p.featured || false);
    setStatus(p.status || "In Stock");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    setErrorMsg("");

    try {
      let imageUrls = [...existingImages];

      // 1. Upload new image files if any
      if (imageFiles.length > 0) {
        setUploadingImage(true);
        for (const file of imageFiles) {
          // Validate max size 5MB
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`File ${file.name} is too large. Max allowed size is 5MB.`);
          }
          const url = await uploadImageToImgBB(file);
          imageUrls.push(url);
        }
        setUploadingImage(false);
      }

      if (directUrlInput.trim()) {
        const directUrls = directUrlInput
          .split(/[,\n]/)
          .map(url => url.trim())
          .filter(url => url.startsWith("http://") || url.startsWith("https://"));
        imageUrls.push(...directUrls);
      }

      // Default placeholder image if none exists
      if (imageUrls.length === 0) {
        imageUrls.push("https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600");
      }

      // 2. Parse product sizes array
      const parsedSizes = sizesInput.split(",").map(s => s.trim()).filter(s => s.length > 0);

      // Determine Stock Status automatically based on stock values
      let stockStatus: Product["status"] = status;
      if (currentStock <= 0) {
        stockStatus = "Out of Stock";
      } else if (currentStock <= minimumStock) {
        stockStatus = "Low Stock";
      } else if (status !== "Hidden") {
        stockStatus = "In Stock";
      }

      const productPayload: Omit<Product, "id"> = {
        name,
        brandId,
        categoryId,
        description,
        buyingPrice,
        sellingPrice,
        minimumStock,
        currentStock,
        coverage,
        dryingTime,
        recommendedSurface,
        status: stockStatus,
        featured: isFeatured,
        sizes: parsedSizes,
        images: imageUrls
      };

      if (editingId) {
        await updateProduct(editingId, productPayload);
        await addActivityLog({
          activity: "Product Edited",
          adminName: username,
          details: `Modified product metadata for "${name}". Stock: ${currentStock}`
        });
      } else {
        await addProduct(productPayload);
        await addActivityLog({
          activity: "Product Added",
          adminName: username,
          details: `Configured new paint "${name}" with initial stock of ${currentStock}`
        });
      }

      setModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save product.");
    } finally {
      setSavingProduct(false);
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setConfirmDelete({ id, name });
  };

  const executeDeleteProduct = async (id: string, name: string) => {
    try {
      await deleteProduct(id);
      await addActivityLog({
        activity: "Product Deleted",
        adminName: username,
        details: `Deleted product "${name}" from the catalogue.`
      });
      await onRefresh();
    } catch (err) {
      alert("Error deleting product.");
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesBrand = selectedBrand === "all" || p.brandId === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="space-y-6" id="inventory-products-tab">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">Inventory Ledger</span>
          <h2 className="text-2xl font-black">Stock Management</h2>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition"
          id="add-new-product-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Configure Product</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS CARD */}
      <div className={`p-4 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4`}>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search stock catalog..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600 bg-gray-50/45 text-sm"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none bg-white dark:bg-gray-900 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none bg-white dark:bg-gray-900 text-sm"
          >
            <option value="all">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* INVENTORY TABLE LEDGER */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`text-xs uppercase tracking-wider ${isDark ? "bg-gray-800/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
              <tr>
                <th className="p-4">Paint Details</th>
                <th className="p-4">Brand / Category</th>
                <th className="p-4">Containers Stock</th>
                <th className="p-4">Pricing</th>
                <th className="p-4">Valuation</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No products matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const bName = brands.find(b => b.id === p.brandId)?.name || "N/A";
                  const cName = categories.find(c => c.id === p.categoryId)?.name || "N/A";
                  const valuation = (p.currentStock || 0) * (p.buyingPrice || 0);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.images[0] || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=200"} 
                            alt={p.name} 
                            className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-gray-950 dark:text-gray-100 block">{p.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono tracking-wider">{p.sizes.join(", ")}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block">{bName}</span>
                        <span className="text-xs text-gray-400 block">{cName}</span>
                      </td>
                      <td className="p-4 font-bold font-mono">
                        {p.currentStock} <span className="text-xs font-normal text-gray-400">Buckets</span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs">
                          <span className="text-gray-400 block">Buy: <b className="font-mono text-gray-700 dark:text-gray-300">TZS {p.buyingPrice?.toLocaleString() || 0}</b></span>
                          <span className="text-teal-700 font-semibold block">Sell: <b className="font-mono">TZS {p.sellingPrice.toLocaleString()}</b></span>
                        </div>
                      </td>
                      <td className="p-4 font-bold font-mono text-teal-800 dark:text-teal-400">
                        TZS {valuation.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.status === "In Stock" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" : 
                          p.status === "Low Stock" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20" : 
                          "bg-red-50 text-red-700 dark:bg-red-950/20"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleOpenEditModal(p)} 
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                            title="Edit metadata"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id, p.name)} 
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
                            title="Remove paint"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIGURE PRODUCT SLIDE-OVER/MODAL FORM */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="prod-modal-overlay">
          <div className={`rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto ${isDark ? "bg-gray-900 border-gray-800" : "bg-white"}`} id="prod-modal">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold">{editingId ? "Update Paint Configuration" : "Configure New Paint Product"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4" id="prod-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Product Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 bg-gray-50/50 text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. Silk Luxury Finish"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sizes (comma separated)</label>
                  <input 
                    type="text" 
                    required 
                    value={sizesInput} 
                    onChange={(e) => setSizesInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 bg-gray-50/50 text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g. 1L, 4L, 20L"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Category</label>
                  <select 
                    value={categoryId} 
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Brand</label>
                  <select 
                    value={brandId} 
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
                  >
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Product Description</label>
                <textarea 
                  required 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-gray-50/50 text-sm dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  placeholder="Provide precise wall coverage details..."
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buying Price (TZS)</label>
                  <input 
                    type="number" 
                    required 
                    value={buyingPrice} 
                    onChange={(e) => setBuyingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Selling Price (TZS)</label>
                  <input 
                    type="number" 
                    required 
                    value={sellingPrice} 
                    onChange={(e) => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Stock (Buckets)</label>
                  <input 
                    type="number" 
                    required 
                    value={currentStock} 
                    onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Min Stock Level</label>
                  <input 
                    type="number" 
                    required 
                    value={minimumStock} 
                    onChange={(e) => setMinimumStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-800/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                <div>
                  <label className="block font-bold text-gray-400 mb-1">Coverage Ratio</label>
                  <input type="text" value={coverage} onChange={(e) => setCoverage(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 mb-1">Drying Time</label>
                  <input type="text" value={dryingTime} onChange={(e) => setDryingTime(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 mb-1">Recommended Surface</label>
                  <input type="text" value={recommendedSurface} onChange={(e) => setRecommendedSurface(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-gray-800" />
                </div>
              </div>

              {/* Image upload with ImgBB */}
              <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-teal-600 mb-2" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Select Product Image</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Uploaded directly to ImgBB (JPEG, PNG, WEBP, up to 5MB)</span>
                </div>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setImageFiles(Array.from(e.target.files));
                    }
                  }}
                  className="text-xs block w-full max-w-xs text-gray-500 mx-auto"
                  id="image-file-input"
                />

                {imageFiles.length > 0 && (
                  <div className="text-xs font-semibold text-teal-700">
                    Selected {imageFiles.length} file(s) for upload
                  </div>
                )}

                <div className="w-full border-t border-gray-100 dark:border-gray-800 pt-3">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase text-left mb-1">Or Paste Direct Web Image URL(s)</label>
                  <input 
                    type="text"
                    value={directUrlInput}
                    onChange={(e) => setDirectUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... (Separate multiple with commas)"
                    className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400"
                  />
                  <p className="text-[9px] text-gray-400 text-left mt-1">If the ImgBB upload fails or gets slow, paste direct image URLs here as a fallback.</p>
                </div>

                {existingImages.length > 0 && (
                  <div className="pt-2 w-full text-left">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Active Product Images:</span>
                    <div className="flex gap-2 flex-wrap">
                      {existingImages.map((imgUrl, i) => (
                        <div key={i} className="relative w-12 h-12 rounded border">
                          <img src={imgUrl} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                          <button 
                            type="button" 
                            onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full text-[9px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles (Featured) */}
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input 
                    type="checkbox" 
                    checked={isFeatured} 
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded accent-teal-700"
                  />
                  <span>Mark as Featured Product</span>
                </label>

                <div>
                  <label className="mr-2 font-semibold">Base Status:</label>
                  <select 
                    value={status} 
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="px-2 py-1 border rounded bg-white dark:bg-gray-800"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm"
                  id="cancel-save-product-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingProduct}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-200 text-white rounded-xl text-sm font-bold flex items-center gap-1.5"
                  id="confirm-save-product-btn"
                >
                  {savingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{savingProduct ? "Uploading & Saving..." : "Save Configuration"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Overlay Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>Confirm Product Deletion</span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you absolutely sure you want to delete <span className="font-bold text-gray-900 dark:text-gray-100">"{confirmDelete.name}"</span> from the database? 
              This action is permanent and cannot be undone. All stock levels, specifications, and images linked to this product will be removed.
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
                  await executeDeleteProduct(item.id, item.name);
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
