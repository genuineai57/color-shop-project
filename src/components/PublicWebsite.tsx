import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ArrowUpRight, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  CheckCircle, 
  Menu, 
  X, 
  ChevronUp, 
  MessageSquare,
  Home,
  Shield,
  Layers,
  Droplets,
  Brush,
  Filter,
  Check
} from "lucide-react";
import { 
  StoreSettings, 
  Category, 
  Brand, 
  Product, 
  Testimonial, 
  HeroSlide 
} from "../types";
import PaintCalculator from "./PaintCalculator";

interface PublicWebsiteProps {
  settings: StoreSettings;
  categories: Category[];
  brands: Brand[];
  products: Product[];
  testimonials: Testimonial[];
  slides: HeroSlide[];
  onOpenAdminLogin: () => void;
  logoTaps: number;
  handleLogoClick: () => void;
  loading: boolean;
}

export default function PublicWebsite({
  settings,
  categories,
  brands,
  products,
  testimonials,
  slides,
  onOpenAdminLogin,
  logoTaps,
  handleLogoClick,
  loading
}: PublicWebsiteProps) {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<"home" | "products" | "calculator" | "about" | "contact">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Hero Slider States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);

  // Product Catalog Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number>(300000); // Max price limit
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "featured">("featured");

  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductSize, setSelectedProductSize] = useState<string>("");

  // Memoized slides combining database seeded slides and dynamic slides for new/featured products
  const combinedSlides = React.useMemo(() => {
    const base = slides.filter(s => s.active);
    
    // Convert newly added/featured products to slides so the hero slider dynamically works for them!
    const dynamicProds = [...products]
      .filter(p => p.status !== "Hidden" && p.images && p.images.length > 0)
      .slice(-3) // take the last 3 added products
      .map((p, index) => ({
        id: `dynamic_prod_${p.id}`,
        imageUrl: p.images[0],
        heading: p.name,
        subtitle: `NEW ARRIVAL - ${brands.find(b => b.id === p.brandId)?.name || "GENUINE"}`,
        description: p.description || `Explore our high-quality paint products. Perfectly formulated for Tanzanian walls.`,
        buttonText: "Order/View Now",
        buttonLink: "#products-section",
        displayOrder: 100 + index,
        active: true,
        productId: p.id
      }));

    return [...base, ...dynamicProds];
  }, [slides, products, brands]);

  // Auto Slider effect
  useEffect(() => {
    if (combinedSlides.length <= 1 || sliderPaused || activeTab !== "home") return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % combinedSlides.length);
    }, 6000); // 6s rotation
    return () => clearInterval(interval);
  }, [combinedSlides, sliderPaused, activeTab]);

  // Scroll Top indicator
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string, tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Format Whatsapp Order link
  const getWhatsappOrderLink = (product: Product, size: string) => {
    const message = `Hello,

I would like to order the following product.

Product:
${product.name}

Brand:
${brands.find(b => b.id === product.brandId)?.name || "N/A"}

Container Size:
${size || product.sizes[0] || "Standard"}

Price:
TZS ${product.sellingPrice.toLocaleString()}

Please provide availability and delivery options.

Thank you.`;

    const cleanPhone = settings.whatsapp.replace(/[^a-zA-Z0-9+]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    if (p.status === "Hidden") return false;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesBrand = selectedBrand === "all" || p.brandId === selectedBrand;
    const matchesStock = selectedStockStatus === "all" || 
                         (selectedStockStatus === "in_stock" && p.status === "In Stock") ||
                         (selectedStockStatus === "low_stock" && p.status === "Low Stock") ||
                         (selectedStockStatus === "out_of_stock" && p.status === "Out of Stock");
    const matchesPrice = p.sellingPrice <= priceRange;

    return matchesSearch && matchesCategory && matchesBrand && matchesStock && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_asc") return a.sellingPrice - b.sellingPrice;
    if (sortBy === "price_desc") return b.sellingPrice - a.sellingPrice;
    if (sortBy === "newest") return b.id.localeCompare(a.id); // fallback for newest
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); // Featured sorting
  });

  // Category Icon Resolver
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Home": return <Home className="w-6 h-6 text-teal-700" />;
      case "Shield": return <Shield className="w-6 h-6 text-teal-700" />;
      case "Layers": return <Layers className="w-6 h-6 text-teal-700" />;
      case "Droplets": return <Droplets className="w-6 h-6 text-teal-700" />;
      case "Brush": return <Brush className="w-6 h-6 text-teal-700" />;
      default: return <Brush className="w-6 h-6 text-teal-700" />;
    }
  };

  return (
    <div className="bg-white min-h-screen text-gray-800 font-sans selection:bg-teal-100 selection:text-teal-900" style={{ "--primary-color": settings.primaryColor } as React.CSSProperties}>
      
      {/* Dynamic Brand Color Bar */}
      <div className="h-1 w-full bg-teal-700" style={{ backgroundColor: settings.primaryColor }} />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Business Logo & Name */}
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
              <div className={`p-2 bg-teal-50 rounded-xl transition duration-300 ${logoTaps > 0 ? "scale-95 border border-teal-200 bg-teal-100" : ""}`} id="logo-container">
                <img 
                  src={settings.logoUrl || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=200"} 
                  alt="Store Logo" 
                  className="h-8 w-8 object-contain rounded-md"
                  referrerPolicy="no-referrer"
                  id="header-logo-img"
                />
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 block" id="header-store-name">
                  {settings.name || "Genuine Paints"}
                </span>
                <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase block -mt-1">Tanzania</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1" id="desktop-nav">
              <button 
                onClick={() => scrollToSection("hero-section", "home")} 
                className={`px-3 py-2 rounded-lg font-medium text-sm transition ${activeTab === "home" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                id="nav-home-btn"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection("products-section", "products")} 
                className={`px-3 py-2 rounded-lg font-medium text-sm transition ${activeTab === "products" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                id="nav-products-btn"
              >
                Products
              </button>
              <button 
                onClick={() => scrollToSection("calculator-section", "calculator")} 
                className={`px-3 py-2 rounded-lg font-medium text-sm transition ${activeTab === "calculator" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                id="nav-calc-btn"
              >
                Calculator
              </button>
              <button 
                onClick={() => scrollToSection("about-section", "about")} 
                className={`px-3 py-2 rounded-lg font-medium text-sm transition ${activeTab === "about" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                id="nav-about-btn"
              >
                About Us
              </button>
              <button 
                onClick={() => scrollToSection("contact-section", "contact")} 
                className={`px-3 py-2 rounded-lg font-medium text-sm transition ${activeTab === "contact" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                id="nav-contact-btn"
              >
                Contact
              </button>
            </nav>

            {/* Desktop WhatsApp Action Button */}
            <div className="hidden md:block">
              <a 
                href={`https://wa.me/${settings.whatsapp.replace(/[^a-zA-Z0-9+]/g, "")}?text=Hello%21%20I%20have%20an%20inquiry%20regarding%20paints.`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-teal-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-teal-800 shadow-sm transition duration-300 flex items-center gap-2"
                style={{ backgroundColor: settings.primaryColor }}
                id="desktop-header-wa-btn"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Order</span>
              </a>
            </div>

            {/* Mobile Hamburger Menu Trigger */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg"
                id="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100" id="mobile-nav">
            <div className="px-2 pt-2 pb-4 space-y-1">
              <button 
                onClick={() => scrollToSection("hero-section", "home")} 
                className={`block w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm ${activeTab === "home" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection("products-section", "products")} 
                className={`block w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm ${activeTab === "products" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Products
              </button>
              <button 
                onClick={() => scrollToSection("calculator-section", "calculator")} 
                className={`block w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm ${activeTab === "calculator" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Paint Calculator
              </button>
              <button 
                onClick={() => scrollToSection("about-section", "about")} 
                className={`block w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm ${activeTab === "about" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50"}`}
              >
                About Us
              </button>
              <button 
                onClick={() => scrollToSection("contact-section", "contact")} 
                className={`block w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm ${activeTab === "contact" ? "bg-teal-50 text-teal-800" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Contact
              </button>
              <div className="pt-2 px-4">
                <a 
                  href={`https://wa.me/${settings.whatsapp.replace(/[^a-zA-Z0-9+]/g, "")}?text=Hello%21%20I%20have%20an%20inquiry.`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center bg-teal-700 text-white font-semibold text-sm py-2.5 rounded-xl"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  WhatsApp Support
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* SKELETON LOADER STATE */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-12" id="public-skeleton-loader">
          <div className="h-[400px] w-full bg-gray-100 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-gray-50 border border-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-8 w-48 bg-gray-100 rounded-md animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-gray-50 border border-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* MAIN BENTO GRID DASHBOARD */}
          <section className="py-8 bg-slate-50 border-b border-slate-200/60" id="hero-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Responsive 12-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* 1. HERO SLIDER CARD (Bento Big - col-span-8) */}
                <div 
                  className="md:col-span-8 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 relative min-h-[440px] md:min-h-[500px] flex flex-col justify-end group"
                  onMouseEnter={() => setSliderPaused(true)} 
                  onMouseLeave={() => setSliderPaused(false)}
                >
                  <div className="absolute inset-0">
                    {combinedSlides.map((slide, index) => (
                      <div 
                        key={slide.id} 
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                      >
                        {/* Slow zoom background image */}
                        <img 
                          src={slide.imageUrl} 
                          alt={slide.heading} 
                          className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${index === currentSlide ? "scale-105" : "scale-100"}`}
                          referrerPolicy="no-referrer"
                        />
                        {/* Elegant dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/50 to-transparent z-10" />
                        
                        {/* Slide Content */}
                        <div className="absolute inset-0 flex items-center z-20">
                          <div className="p-8 md:p-12 w-full text-white">
                            <div className="max-w-lg space-y-4">
                              {slide.subtitle && (
                                <span 
                                  className="inline-block text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm"
                                  style={{ backgroundColor: settings.primaryColor }}
                                >
                                  {slide.subtitle}
                                </span>
                              )}
                              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                                {slide.heading}
                              </h1>
                              <p className="text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed">
                                {slide.description}
                              </p>
                              <div className="pt-4 flex flex-wrap gap-3">
                                <button 
                                  onClick={() => {
                                    if ((slide as any).productId) {
                                      const prod = products.find(p => p.id === (slide as any).productId);
                                      if (prod) {
                                        setSelectedProduct(prod);
                                        return;
                                      }
                                    }
                                    scrollToSection("products-section", "products");
                                  }}
                                  className="text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                  style={{ backgroundColor: settings.primaryColor }}
                                >
                                  {slide.buttonText || "Shop Now"}
                                </button>
                                <button 
                                  onClick={() => scrollToSection("calculator-section", "calculator")}
                                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-extrabold text-xs px-6 py-3 rounded-xl border border-white/25 transition duration-300"
                                >
                                  Calculate Paint
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Slider navigation dots */}
                  {combinedSlides.length > 1 && (
                    <div className="absolute bottom-6 left-12 z-30 flex gap-2">
                      {combinedSlides.map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setCurrentSlide(i)}
                          className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8" : "w-2 bg-white/40 hover:bg-white"}`}
                          style={i === currentSlide ? { backgroundColor: settings.primaryColor } : {}}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. CATEGORY FOCUS CARD (Bento Small - col-span-4) */}
                <div className="md:col-span-4 bg-indigo-50/50 border border-indigo-100/60 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[240px] shadow-sm hover:shadow-md transition duration-300">
                  {(() => {
                    const featuredCat = categories.find(c => c.active) || categories[0];
                    if (!featuredCat) return (
                      <div className="flex flex-col justify-center h-full text-center">
                        <span className="text-sm font-semibold text-slate-400">Premium Finishes</span>
                      </div>
                    );
                    return (
                      <>
                        <div>
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-5 shadow-md shadow-indigo-100"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            {renderCategoryIcon(featuredCat.icon)}
                          </div>
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Premium Choice</span>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">{featuredCat.name}</h3>
                          <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                            {featuredCat.description || "Premium paint solutions carefully engineered for beautiful local surfaces."}
                          </p>
                        </div>
                        <div 
                          onClick={() => {
                            setSelectedCategory(featuredCat.id);
                            scrollToSection("products-section", "products");
                          }}
                          className="flex justify-between items-center text-xs font-bold cursor-pointer hover:underline pt-4 border-t border-indigo-100/40"
                          style={{ color: settings.primaryColor }}
                        >
                          <span>{products.filter(p => p.categoryId === featuredCat.id && p.status !== "Hidden").length} Products Available</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* 3. PAINT CALCULATOR CARD (Bento Small - col-span-4) */}
                <div className="md:col-span-4 bg-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between min-h-[240px] shadow-md hover:shadow-lg transition duration-300">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Interactive Tool</span>
                    <h3 className="text-lg font-black tracking-tight text-white mb-4">Coverage Calculator</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        <span>Standard Wall Area</span>
                        <span>Paint Est.</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-mono text-indigo-400 font-bold">120</span>
                        <span className="text-slate-400 text-xs pb-1">sq meters</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: settings.primaryColor }} />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                        Requires approx. <span className="text-white font-bold">45 Liters</span> of premium emulsion paint for standard 2-coat coverage.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => scrollToSection("calculator-section", "calculator")}
                    className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 rounded-xl transition duration-300 text-center flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Full Calculator</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4. PARTNER BRANDS CARD (Bento Small - col-span-4) */}
                <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[240px] shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Partner Brands</span>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Official Suppliers</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {brands.filter(b => b.active).slice(0, 4).map(b => (
                        <div 
                          key={b.id} 
                          onClick={() => {
                            setSelectedBrand(b.id);
                            scrollToSection("products-section", "products");
                          }}
                          className="h-14 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition text-center"
                          title={`View ${b.name}`}
                        >
                          <span className="text-xs font-black text-slate-700 block uppercase truncate w-full px-1">{b.name}</span>
                          <span className="text-[8px] text-slate-400 uppercase font-bold">Genuine</span>
                        </div>
                      ))}
                      {brands.filter(b => b.active).length === 0 && (
                        ["SADOLIN", "CORAL", "PLASCON", "ASIAN"].map(bName => (
                          <div key={bName} className="h-14 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 tracking-wider text-xs">
                            {bName}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 text-center block pt-2">Direct warranty from global manufacturers.</span>
                </div>

                {/* 5. FEATURED PRODUCT CARD (Bento Small - col-span-4) */}
                {(() => {
                  const featuredProduct = products.find(p => p.featured && p.status !== "Hidden") || products[0];
                  if (!featuredProduct) return null;
                  return (
                    <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between min-h-[240px] shadow-sm hover:shadow-md transition duration-300 group">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider">Featured</span>
                          <span className="text-xs font-mono text-slate-400">{featuredProduct.sizes[0] || "Standard"}</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                            <img 
                              src={featuredProduct.images[0] || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=200"} 
                              alt={featuredProduct.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">
                              {brands.find(b => b.id === featuredProduct.brandId)?.name || "Genuine"}
                            </span>
                            <h4 
                              onClick={() => setSelectedProduct(featuredProduct)}
                              className="font-extrabold text-slate-800 text-sm hover:underline cursor-pointer line-clamp-1"
                            >
                              {featuredProduct.name}
                            </h4>
                            <span className="text-xs font-black text-slate-900 mt-1 block">TZS {featuredProduct.sellingPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-3 line-clamp-2 leading-relaxed">
                          {featuredProduct.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4 flex gap-2">
                        <button 
                          onClick={() => setSelectedProduct(featuredProduct)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] py-2.5 rounded-xl transition duration-300"
                        >
                          View Details
                        </button>
                        <a 
                          href={getWhatsappOrderLink(featuredProduct, featuredProduct.sizes[0] || "Standard")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-white font-extrabold text-[11px] py-2.5 rounded-xl transition duration-300 text-center flex items-center justify-center gap-1 shadow-sm"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Order Now</span>
                        </a>
                      </div>
                    </div>
                  );
                })()}

                {/* 6. STATISTICS CARD (Bento Small - col-span-4) */}
                <div 
                  className="md:col-span-12 lg:col-span-12 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden shadow-lg shadow-teal-900/10 min-h-[140px]"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <div className="relative z-10 space-y-1 mb-4 md:mb-0 text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">Enterprise Ledger</h3>
                    <p className="text-white/80 text-xs md:text-sm font-medium">Real-time dynamic data synchronised directly with Cloud Firestore.</p>
                  </div>
                  
                  {/* Stats columns */}
                  <div className="grid grid-cols-3 gap-6 md:gap-12 relative z-10 text-center">
                    <div>
                      <span className="text-2xl md:text-4xl font-extrabold text-white block tracking-tight">{products.filter(p => p.status !== "Hidden").length}+</span>
                      <span className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Premium Paints</span>
                    </div>
                    <div>
                      <span className="text-2xl md:text-4xl font-extrabold text-white block tracking-tight">{brands.filter(b => b.active).length}+</span>
                      <span className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Partner Brands</span>
                    </div>
                    <div>
                      <span className="text-2xl md:text-4xl font-extrabold text-white block tracking-tight">{categories.filter(c => c.active).length}+</span>
                      <span className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Categories</span>
                    </div>
                  </div>

                  {/* Decorative mesh background SVG */}
                  <div className="absolute -right-12 -bottom-12 opacity-15 pointer-events-none">
                    <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* SECTION 2: FEATURED COLLECTIONS */}
          <section className="py-16 bg-white border-b border-slate-100" id="featured-products">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: settings.primaryColor }}>Our Top Choices</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Featured Collections</h2>
                </div>
                <button 
                  onClick={() => {
                    setSortBy("featured");
                    scrollToSection("products-section", "products");
                  }} 
                  className="font-extrabold text-sm flex items-center gap-1 hover:underline transition"
                  style={{ color: settings.primaryColor }}
                >
                  <span>See all products</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.filter(p => p.featured && p.status !== "Hidden").slice(0, 4).map(product => (
                  <div key={product.id} className="bg-white border border-slate-200/60 rounded-3xl p-4 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 mb-4 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        <img 
                          src={product.images[0] || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=200"} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <span 
                          className="absolute top-2.5 left-2.5 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm" 
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          Featured
                        </span>
                        {product.status === "Low Stock" && (
                          <span className="absolute bottom-2.5 right-2.5 bg-amber-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                            Low Stock
                          </span>
                        )}
                        {product.status === "Out of Stock" && (
                          <span className="absolute bottom-2.5 right-2.5 bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                          {brands.find(b => b.id === product.brandId)?.name || "Genuine"}
                        </span>
                        <h3 
                          className="font-bold text-slate-800 text-base line-clamp-1 hover:underline cursor-pointer transition"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.name}
                        </h3>
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between px-1">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Price</span>
                        <span className="font-extrabold text-slate-900 text-base">TZS {product.sellingPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => setSelectedProduct(product)}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition border border-slate-100"
                          title="View Details"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <a 
                          href={getWhatsappOrderLink(product, product.sizes[0] || "Standard")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition shadow-sm"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Order</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: PRODUCT CATEGORIES */}
          <section className="py-16 bg-slate-50 border-b border-slate-200/60" id="categories-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <span className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: settings.primaryColor }}>Catalog Filters</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2">Browse Paint Categories</h2>
              <p className="text-sm text-slate-500 max-w-xl mx-auto mb-10">We stock tailored painting solutions for diverse conditions and premium surfaces.</p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {categories.filter(c => c.active).map(cat => (
                  <div 
                    key={cat.id} 
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      scrollToSection("products-section", "products");
                    }}
                    className={`p-6 rounded-3xl border text-left cursor-pointer transition-all duration-300 hover:shadow-md ${selectedCategory === cat.id ? "bg-white border-slate-300 shadow-sm ring-2" : "bg-white border-slate-200 hover:border-slate-300"}`}
                    style={selectedCategory === cat.id ? { ringColor: settings.primaryColor } as any : {}}
                  >
                    <div 
                      className="p-3 rounded-2xl inline-block mb-4 border shadow-sm text-white"
                      style={{ backgroundColor: settings.primaryColor, borderColor: settings.primaryColor }}
                    >
                      {renderCategoryIcon(cat.icon)}
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm mb-1">{cat.name}</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {products.filter(p => p.categoryId === cat.id && p.status !== "Hidden").length} Items
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 4 & 5: SEARCH, FILTERS & MAIN CATALOG */}
          <section className="py-16 bg-white" id="products-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="mb-8 text-center md:text-left">
                <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: settings.primaryColor }}>Our Product Catalog</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Search & Browse Paints</h2>
              </div>


              {/* Filtering Controls Row */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 space-y-4">
                
                {/* Search Bar & Primary Sorters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Search paints by name or key specs..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm bg-gray-50/40"
                    />
                  </div>

                  <div>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-sm"
                    >
                      <option value="featured">Featured First</option>
                      <option value="newest">Newest Arrivals</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedCategory("all");
                        setSelectedBrand("all");
                        setSelectedStockStatus("all");
                        setSearchQuery("");
                        setPriceRange(300000);
                      }}
                      className="flex-1 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-center"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Secondary filters (Category, Brand, Stock Status) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                  
                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-100 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Brand Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Brand</label>
                    <select 
                      value={selectedBrand} 
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-100 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    >
                      <option value="all">All Brands</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>

                  {/* Stock Availability */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Availability</label>
                    <select 
                      value={selectedStockStatus} 
                      onChange={(e) => setSelectedStockStatus(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-100 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    >
                      <option value="all">Any Status</option>
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>

                  {/* Max Price Range Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Max Price</label>
                      <span className="text-xs font-semibold text-teal-800">TZS {priceRange.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1000" 
                      max="300000" 
                      step="5000"
                      value={priceRange}
                      onChange={(e) => setPriceRange(parseInt(e.target.value))}
                      className="w-full accent-teal-700 cursor-pointer h-1 bg-gray-100 rounded-lg"
                    />
                  </div>

                </div>
              </div>

              {/* Products Display Grid */}
              {sortedProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md mx-auto" id="no-products-view">
                  <div className="text-teal-700 bg-teal-50 p-4 rounded-full inline-block mb-3">
                    <Filter className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No matching products</h3>
                  <p className="text-sm text-gray-500 mt-1">We couldn't find any products matching your specific query. Try relaxing your filters or check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="product-catalog-grid">
                  {sortedProducts.map(product => (
                    <div key={product.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden p-4 hover:shadow-md transition flex flex-col justify-between shadow-sm">
                      <div>
                        {/* Image wrapper */}
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 cursor-pointer group mb-4" onClick={() => setSelectedProduct(product)}>
                          <img 
                            src={product.images[0] || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=200"} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2.5 left-2.5 bg-gray-900/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
                            {categories.find(c => c.id === product.categoryId)?.name || "Paint"}
                          </span>

                          {product.status === "In Stock" && (
                            <span className="absolute top-2.5 right-2.5 bg-teal-600 text-white text-[9px] font-semibold px-2 py-1 rounded shadow-sm">
                              In Stock
                            </span>
                          )}
                          {product.status === "Low Stock" && (
                            <span className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[9px] font-semibold px-2 py-1 rounded shadow-sm">
                              Low Stock
                            </span>
                          )}
                          {product.status === "Out of Stock" && (
                            <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[9px] font-semibold px-2 py-1 rounded shadow-sm">
                              Out of Stock
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-teal-800 tracking-wider uppercase block">
                            {brands.find(b => b.id === product.brandId)?.name || "Generic"}
                          </span>
                          <h3 
                            className="font-bold text-gray-900 text-base line-clamp-1 hover:text-teal-800 cursor-pointer transition"
                            onClick={() => setSelectedProduct(product)}
                          >
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* Specs snippet */}
                      <div className="grid grid-cols-2 gap-2 mt-3 bg-gray-50 p-2.5 rounded-lg text-[11px] text-gray-600 font-medium">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase">Drying Time:</span>
                          <span className="truncate block">{product.dryingTime || "2h"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase">Sizes:</span>
                          <span className="truncate block">{product.sizes.join(", ") || "N/A"}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 block">Selling Price:</span>
                          <span className="font-extrabold text-teal-900 text-base">TZS {product.sellingPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                          <a 
                            href={getWhatsappOrderLink(product, product.sizes[0] || "Standard")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Order</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 6: INTERACTIVE PAINT CALCULATOR */}
          <section className="py-16 bg-white border-t border-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block mb-1">Coverage Helper</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Paint Requirement Calculator</h2>
                <p className="text-sm text-gray-500 mt-1">Estimate total wall area, liters of paint, and ideal packaging combos to prevent waste.</p>
              </div>
              <PaintCalculator products={products.filter(p => p.status !== "Hidden")} />
            </div>
          </section>

          {/* SECTION 7: TRUSTED BRANDS SHOWCASE */}
          <section className="py-16 bg-slate-50 border-t border-slate-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block mb-1">Our Partners</span>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dynamic Trusted Brands</h2>
            </div>

            {/* Infinite Marquee Container */}
            <div className="relative w-full overflow-hidden py-4 bg-white/40 border-y border-slate-100 backdrop-blur-sm">
              {/* Fade gradient masks on left/right for smooth appearance */}
              <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

              <div className="flex w-max">
                <div className="flex gap-8 px-4 animate-marquee whitespace-nowrap">
                  {/* We construct a list of brands and duplicate it to fill space */}
                  {(() => {
                    const activeBrands = brands.filter(b => b.active);
                    if (activeBrands.length === 0) {
                      // Fallback brands if none are in Firestore
                      const defaultBrands = [
                        { id: "def_1", name: "SADOLIN PAINT", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120" },
                        { id: "def_2", name: "CORAL PAINT", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120" },
                        { id: "def_3", name: "PLASCON PAINT", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120" },
                        { id: "def_4", name: "ASIAN PAINTS", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120" },
                      ];
                      // Repeat default brands to ensure a long continuous flow
                      const list = [...defaultBrands, ...defaultBrands, ...defaultBrands, ...defaultBrands];
                      return list.map((brand, idx) => (
                        <div 
                          key={`${brand.id}-${idx}`} 
                          onClick={() => {
                            setSelectedBrand("all");
                            scrollToSection("products-section", "products");
                          }}
                          className="inline-flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm w-36 md:w-44 transition hover:scale-105 duration-300 cursor-pointer flex-shrink-0"
                        >
                          <span className="text-sm font-black text-slate-700 block uppercase tracking-wider">{brand.name}</span>
                          <span className="text-[9px] text-teal-700 font-bold uppercase mt-1">Genuine Paints</span>
                        </div>
                      ));
                    }

                    // Otherwise repeat active brands to make the loop infinite
                    const repeats = activeBrands.length < 5 ? 6 : (activeBrands.length < 10 ? 4 : 2);
                    const repeatedList = Array(repeats).fill(activeBrands).flat();
                    
                    return repeatedList.map((brand, idx) => (
                      <div 
                        key={`${brand.id}-${idx}`} 
                        onClick={() => {
                          setSelectedBrand(brand.id);
                          scrollToSection("products-section", "products");
                        }}
                        className="inline-flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm w-36 md:w-44 transition hover:scale-105 duration-300 cursor-pointer flex-shrink-0"
                      >
                        <img 
                          src={brand.logoUrl || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120"} 
                          alt={brand.name} 
                          className="h-12 w-24 object-contain mb-2 rounded"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wide truncate w-full text-center">{brand.name}</span>
                      </div>
                    ));
                  })()}
                </div>

                {/* Second matching list for seamless infinite marquee loop */}
                <div className="flex gap-8 px-4 animate-marquee whitespace-nowrap" aria-hidden="true">
                  {(() => {
                    const activeBrands = brands.filter(b => b.active);
                    if (activeBrands.length === 0) {
                      const defaultBrands = [
                        { id: "def_1", name: "SADOLIN PAINT", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120" },
                        { id: "def_2", name: "CORAL PAINT", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120" },
                        { id: "def_3", name: "PLASCON PAINT", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120" },
                        { id: "def_4", name: "ASIAN PAINTS", logoUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120" },
                      ];
                      const list = [...defaultBrands, ...defaultBrands, ...defaultBrands, ...defaultBrands];
                      return list.map((brand, idx) => (
                        <div 
                          key={`clone-${brand.id}-${idx}`} 
                          onClick={() => {
                            setSelectedBrand("all");
                            scrollToSection("products-section", "products");
                          }}
                          className="inline-flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm w-36 md:w-44 transition hover:scale-105 duration-300 cursor-pointer flex-shrink-0"
                        >
                          <span className="text-sm font-black text-slate-700 block uppercase tracking-wider">{brand.name}</span>
                          <span className="text-[9px] text-teal-700 font-bold uppercase mt-1">Genuine Paints</span>
                        </div>
                      ));
                    }

                    const repeats = activeBrands.length < 5 ? 6 : (activeBrands.length < 10 ? 4 : 2);
                    const repeatedList = Array(repeats).fill(activeBrands).flat();
                    
                    return repeatedList.map((brand, idx) => (
                      <div 
                        key={`clone-${brand.id}-${idx}`} 
                        onClick={() => {
                          setSelectedBrand(brand.id);
                          scrollToSection("products-section", "products");
                        }}
                        className="inline-flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm w-36 md:w-44 transition hover:scale-105 duration-300 cursor-pointer flex-shrink-0"
                      >
                        <img 
                          src={brand.logoUrl || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=120"} 
                          alt={brand.name} 
                          className="h-12 w-24 object-contain mb-2 rounded"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wide truncate w-full text-center">{brand.name}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 8: WHY CHOOSE US (Our Commitment) */}
          <section className="py-16 bg-slate-50 border-t border-slate-200/60" id="about-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: settings.primaryColor }}>Our Commitment</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Why Choose {settings.name || "Genuine Paints"}?</h2>
              </div>

              {/* Bento Grid of USPs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3 p-8 bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition duration-300">
                  <div className="p-3 rounded-2xl inline-block text-white" style={{ backgroundColor: settings.primaryColor }}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg">100% Genuine Paint Brands</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    We buy directly from top licensed manufacturers such as Sadolin, Coral, and Plascon to guarantee structural consistency and authentic durability.
                  </p>
                </div>

                <div className="space-y-3 p-8 bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition duration-300">
                  <div className="p-3 rounded-2xl inline-block text-white" style={{ backgroundColor: settings.primaryColor }}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Instant Expert Advice</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Our team calculates your surface prep, dry time window, and prime coatings dynamically to ensure your renovation is completely worry-free.
                  </p>
                </div>

                <div className="space-y-3 p-8 bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition duration-300">
                  <div className="p-3 rounded-2xl inline-block text-white" style={{ backgroundColor: settings.primaryColor }}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Fast Doorstep Delivery</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Order via our responsive WhatsApp interface and receive reliable dispatch across Dar es Salaam within the same working day.
                  </p>
                </div>
              </div>

              {/* Dynamic About Details Bento Block */}
              <div className="mt-8 bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-sm">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-800">About Our Company</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {settings.about || "We provide high quality paint solutions in Tanzania."}
                  </p>
                </div>
                <div className="rounded-2xl overflow-hidden h-48 md:h-64 shadow-inner border border-slate-100">
                  <img 
                    src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600" 
                    alt="Paints display" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 9: TESTIMONIALS */}
          <section className="py-16 bg-white border-t border-slate-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: settings.primaryColor }}>Satisfied Clients</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Customer Testimonials</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.filter(t => t.active).slice(0, 3).map(review => (
                  <div key={review.id} className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
                    <div>
                      <div className="flex gap-1 text-amber-400 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 fill-current ${i < review.rating ? "text-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <p className="text-slate-600 text-sm italic leading-relaxed mb-4">
                        "{review.comment}"
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-200/40">
                      <span className="font-extrabold text-slate-800 text-sm block">{review.name}</span>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mt-0.5">{review.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 10: CONTACT & MAP */}
          <section className="py-16 bg-slate-50 border-t border-slate-200/60" id="contact-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* Contact Information */}
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: settings.primaryColor }}>Find Us Here</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Get in Touch</h2>
                    <p className="text-sm text-slate-500 mt-2">Have a painting project or custom color request? Reach out directly through any of our channels.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                      <div className="p-2.5 rounded-xl text-white" style={{ backgroundColor: settings.primaryColor }}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">Shop Location</span>
                        <span className="text-sm text-slate-500">{settings.address}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                      <div className="p-2.5 rounded-xl text-white" style={{ backgroundColor: settings.primaryColor }}>
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">Call Support</span>
                        <span className="text-sm text-slate-500">{settings.phone}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                      <div className="p-2.5 rounded-xl text-white" style={{ backgroundColor: settings.primaryColor }}>
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">Email Inquiry</span>
                        <span className="text-sm text-slate-500">{settings.email}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                      <div className="p-2.5 rounded-xl text-white" style={{ backgroundColor: settings.primaryColor }}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">Working Hours</span>
                        <span className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">{settings.openingHours}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Map Card */}
                <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden h-72 md:h-auto min-h-[350px] relative shadow-sm flex flex-col">
                  {settings.latitude !== undefined && settings.longitude !== undefined ? (
                    <div className="w-full h-full min-h-[350px] relative group flex-1">
                      <iframe
                        title="Shop Location Map"
                        width="100%"
                        height="100%"
                        className="w-full h-full border-0 min-h-[350px]"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                        src={`https://maps.google.com/maps?q=${settings.latitude},${settings.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      />
                      {/* Floating Open in Google Maps action */}
                      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 z-10">
                        <a 
                          href={settings.googleMaps || `https://www.google.com/maps/search/?api=1&query=${settings.latitude},${settings.longitude}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full md:w-auto text-white text-xs font-extrabold px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition hover:scale-105 duration-300"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          <span>Open in Google Maps</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between relative p-6 text-center">
                      <div className="absolute inset-0 bg-slate-50/20 flex flex-col items-center justify-center p-6 text-center z-10">
                        <MapPin className="w-12 h-12 mb-2 animate-bounce" style={{ color: settings.primaryColor }} />
                        <h3 className="font-black text-slate-800">Map Location</h3>
                        <p className="text-xs text-slate-500 max-w-xs mt-1">{settings.address}</p>
                        <a 
                          href={settings.googleMaps} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-4 text-white text-xs font-extrabold px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md transition hover:scale-105 duration-300"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          <span>Open in Google Maps</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                      {/* Styled grid network background pattern */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />
                    </div>
                  )}
                </div>

              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800/50">
                <div className="space-y-3">
                  <h3 className="text-white font-black text-lg tracking-tight uppercase">{settings.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {settings.footerText}
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Quick Navigation</h4>
                  <ul className="space-y-2 text-xs font-semibold">
                    <li><button onClick={() => scrollToSection("hero-section", "home")} className="hover:text-white transition">Home Page</button></li>
                    <li><button onClick={() => scrollToSection("products-section", "products")} className="hover:text-white transition">Product Catalog</button></li>
                    <li><button onClick={() => scrollToSection("calculator-section", "calculator")} className="hover:text-white transition">Wall Calculator</button></li>
                    <li><button onClick={() => scrollToSection("about-section", "about")} className="hover:text-white transition">About Our Store</button></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Top Brands</h4>
                  <ul className="space-y-2 text-xs font-semibold">
                    {brands.filter(b => b.active).slice(0, 4).map(b => (
                      <li key={b.id}>
                        <button 
                          onClick={() => {
                            setSelectedBrand(b.id);
                            scrollToSection("products-section", "products");
                          }}
                          className="hover:text-white transition"
                        >
                          {b.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Shop Inquiries</h4>
                  <ul className="space-y-2 text-xs font-semibold">
                    <li className="flex gap-2 items-center">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{settings.phone}</span>
                    </li>
                    <li className="flex gap-2 items-center">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="break-all">{settings.email}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                <p>© {new Date().getFullYear()} {settings.name}. All Rights Reserved.</p>
                <div className="flex gap-4 font-bold">
                  {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Facebook</a>}
                  {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Instagram</a>}
                  {settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">TikTok</a>}
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="detail-modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto" id="detail-modal-content">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-50 bg-gray-50/50">
              <div>
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest block">
                  {brands.find(b => b.id === selectedProduct.brandId)?.name || "Genuine"}
                </span>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">{selectedProduct.name}</h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedProductSize("");
                }} 
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
                id="close-detail-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Product Gallery & Zoom */}
              <div className="space-y-4">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 shadow-inner border border-gray-100 group">
                  <img 
                    src={selectedProduct.images[0] || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=200"} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {selectedProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedProduct.images.map((imgUrl, i) => (
                      <button key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200/50 bg-gray-50 flex-shrink-0">
                        <img src={imgUrl} alt="gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Specifications & Order controls */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase">Product Description</span>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">{selectedProduct.description}</p>
                  </div>

                  {/* Specifications Grid */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-400">Approx. Coverage:</span>
                      <span className="font-semibold text-gray-800">{selectedProduct.coverage}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-400">Drying Time Window:</span>
                      <span className="font-semibold text-gray-800">{selectedProduct.dryingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ideal Surface:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[160px]" title={selectedProduct.recommendedSurface}>
                        {selectedProduct.recommendedSurface}
                      </span>
                    </div>
                  </div>

                  {/* Select size */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase block mb-1.5">Available Sizes</span>
                      <div className="flex gap-2 flex-wrap">
                        {selectedProduct.sizes.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedProductSize(size)}
                            className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition ${selectedProductSize === size ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">Selling Price:</span>
                      <span className="text-2xl font-black text-teal-950">TZS {selectedProduct.sellingPrice.toLocaleString()}</span>
                    </div>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${selectedProduct.status === "In Stock" ? "bg-teal-50 text-teal-700" : selectedProduct.status === "Low Stock" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                      {selectedProduct.status}
                    </span>
                  </div>

                  <a
                    href={getWhatsappOrderLink(selectedProduct, selectedProductSize || selectedProduct.sizes[0] || "Standard")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-teal-700 text-white font-bold text-center py-3 rounded-xl hover:bg-teal-800 transition shadow-sm flex items-center justify-center gap-2 text-sm"
                    style={{ backgroundColor: settings.primaryColor }}
                    id="modal-wa-order-btn"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Order via WhatsApp</span>
                  </a>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* FLOATING WHATSAPP BUTTON */}
      <a 
        href={`https://wa.me/${settings.whatsapp.replace(/[^a-zA-Z0-9+]/g, "")}?text=Hello%21%20I%20have%20an%20inquiry%20regarding%20paints.`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 hover:scale-105 transition-all duration-300 flex items-center justify-center group"
        title="Chat on WhatsApp"
        id="floating-wa-btn"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 ease-in-out text-xs font-bold whitespace-nowrap">
          Chat With Us
        </span>
      </a>

      {/* BACK TO TOP BUTTON */}
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} 
          className="fixed bottom-24 right-6 z-30 bg-white border border-gray-100 text-gray-600 p-3 rounded-full shadow-md hover:bg-gray-50 hover:text-gray-900 hover:scale-105 transition"
          title="Scroll to Top"
          id="scroll-to-top-btn"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

    </div>
  );
}
