import React, { useState } from "react";
import { Product } from "../types";

interface PaintCalculatorProps {
  products: Product[];
  selectedProductId?: string;
  onClose?: () => void;
}

export default function PaintCalculator({ products, selectedProductId, onClose }: PaintCalculatorProps) {
  const [width, setWidth] = useState<number>(4); // meters
  const [height, setHeight] = useState<number>(3); // meters
  const [walls, setWalls] = useState<number>(4);
  const [coats, setCoats] = useState<number>(2);
  const [productId, setProductId] = useState<string>(selectedProductId || (products[0]?.id || ""));

  const selectedProduct = products.find(p => p.id === productId);

  // Parse coverage. e.g. "12-14 sq m per liter" -> average is 13
  const getAverageCoverage = (covStr: string | undefined): number => {
    if (!covStr || covStr === "N/A") return 12; // default
    const matches = covStr.match(/\d+/g);
    if (matches && matches.length >= 2) {
      return (parseFloat(matches[0]) + parseFloat(matches[1])) / 2;
    } else if (matches && matches.length === 1) {
      return parseFloat(matches[0]);
    }
    return 12; // default 12 sq meters per liter
  };

  const coveragePerLiter = getAverageCoverage(selectedProduct?.coverage);
  const totalArea = width * height * walls;
  const totalNeededLiters = Math.ceil(((totalArea * coats) / coveragePerLiter) * 10) / 10;

  // Recommended Container Combinations: 20L, 4L, 1L
  let litersRemaining = totalNeededLiters;
  const cans20L = Math.floor(litersRemaining / 20);
  litersRemaining %= 20;
  const cans4L = Math.floor(litersRemaining / 4);
  litersRemaining %= 4;
  const cans1L = Math.ceil(litersRemaining);

  // Price estimate (based on selling price. 20L is normally 5x 4L price or derived.
  // We'll calculate proportional price relative to sellingPrice per size, or simple proportional rate).
  const unitPrice = selectedProduct?.sellingPrice || 85000;
  // If the product has multiple sizes, let's look for size multipliers or fallback.
  const estimatedCost = Math.ceil(totalNeededLiters * (unitPrice / 4)); // Proportional to a 4L bucket rate

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100" id="calculator-section">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Paint Quantity Calculator</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition" id="close-calc-btn">
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              id="calc-product-select"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.coverage})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wall Width (meters)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={width}
                onChange={(e) => setWidth(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                id="calc-width-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wall Height (meters)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={height}
                onChange={(e) => setHeight(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                id="calc-height-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Walls</label>
              <input
                type="number"
                min="1"
                max="20"
                value={walls}
                onChange={(e) => setWalls(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                id="calc-walls-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Coats</label>
              <input
                type="number"
                min="1"
                max="5"
                value={coats}
                onChange={(e) => setCoats(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                id="calc-coats-input"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-teal-900 uppercase tracking-wider mb-4">Calculation Output</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-teal-100 pb-2">
                <span className="text-gray-600 text-sm">Total Surface Area:</span>
                <span className="font-semibold text-gray-900">{totalArea} m²</span>
              </div>
              <div className="flex justify-between border-b border-teal-100 pb-2">
                <span className="text-gray-600 text-sm">Avg. Paint Coverage:</span>
                <span className="font-semibold text-gray-900">{coveragePerLiter} m²/Liter</span>
              </div>
              <div className="flex justify-between border-b border-teal-100 pb-2">
                <span className="text-gray-600 text-sm font-medium text-teal-800">Required Paint:</span>
                <span className="font-bold text-teal-900 text-lg">{totalNeededLiters} Liters</span>
              </div>
            </div>

            <div className="mt-5">
              <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block mb-2">Recommended Packaging Combination:</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-teal-100">
                  <span className="block font-bold text-teal-900 text-base">{cans20L}</span>
                  <span className="text-gray-500 text-[10px]">20L Buckets</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-teal-100">
                  <span className="block font-bold text-teal-900 text-base">{cans4L}</span>
                  <span className="text-gray-500 text-[10px]">4L Buckets</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-teal-100">
                  <span className="block font-bold text-teal-900 text-base">{cans1L}</span>
                  <span className="text-gray-500 text-[10px]">1L Cans</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-teal-100 flex items-center justify-between">
            <div>
              <span className="text-gray-500 text-xs block">Estimated Price:</span>
              <span className="text-2xl font-bold text-teal-900">TZS {estimatedCost.toLocaleString()}</span>
            </div>
            <a
              href={`https://wa.me/${selectedProduct ? "+255712345678" : ""}?text=${encodeURIComponent(
                `Hello, I calculated my paint requirement using the Paint Calculator.\n\nProduct: ${selectedProduct?.name}\nTotal Area: ${totalArea} m²\nEstimated Paint: ${totalNeededLiters} Liters (${cans20L}x 20L, ${cans4L}x 4L, ${cans1L}x 1L)\nEstimated Cost: TZS ${estimatedCost.toLocaleString()}\n\nPlease verify availability and provide a final quote. Thank you.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-teal-700 text-white px-4 py-2.5 rounded-xl hover:bg-teal-800 transition shadow-sm font-medium text-sm flex items-center gap-2"
              id="calc-whatsapp-btn"
            >
              Order via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
