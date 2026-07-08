import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Receipt, 
  Trash2, 
  Loader2, 
  X, 
  ShieldAlert,
  Calendar
} from "lucide-react";
import { Expense } from "../../types";
import { addExpense, deleteExpense, addActivityLog } from "../../lib/firebaseService";

interface AdminExpensesProps {
  expenses: Expense[];
  theme: "light" | "dark";
  onRefresh: () => Promise<void>;
  username: string;
}

export default function AdminExpenses({
  expenses,
  theme,
  onRefresh,
  username
}: AdminExpensesProps) {
  const isDark = theme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form Fields
  const [category, setCategory] = useState("Utilities");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Reusable confirmation state (to replace window.confirm inside iframe)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; amount: number; description: string } | null>(null);

  const handleOpenModal = () => {
    setCategory("Utilities");
    setAmount(0);
    setDescription("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    if (amount <= 0) {
      setErrorMsg("Amount must be greater than TZS 0.");
      setSaving(false);
      return;
    }

    try {
      await addExpense({
        expenseDate: new Date().toISOString().split("T")[0],
        category,
        amount,
        description
      });

      await addActivityLog({
        activity: "Expense Logged",
        adminName: username,
        details: `Logged expense of TZS ${amount.toLocaleString()} under "${category}"`
      });

      setModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log business expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = (id: string, amt: number, desc: string) => {
    setConfirmDelete({ id, amount: amt, description: desc });
  };

  const executeDeleteExpense = async (id: string, amt: number, desc: string) => {
    try {
      await deleteExpense(id);
      await addActivityLog({
        activity: "Expense Deleted",
        adminName: username,
        details: `Deleted logged expense of TZS ${amt.toLocaleString()} ("${desc}")`
      });
      await onRefresh();
    } catch (err) {
      alert("Error removing expense record.");
    }
  };

  // Calculations
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthlyExpensesTotal = expenses
    .filter(e => e.expenseDate.startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="business-expenses-tab">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">Cash Ledger</span>
          <h2 className="text-2xl font-black">Business Expenses</h2>
        </div>
        <button 
          onClick={handleOpenModal}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition"
          id="log-expense-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense Entry</span>
        </button>
      </div>

      {/* EXPENSE KPI & SEARCH BOX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI Card: Monthly Expenses */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-150"} shadow-sm flex items-center justify-between md:col-span-1`}>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">Monthly Expenses</span>
            <span className="text-2xl font-extrabold block mt-1 text-rose-600">TZS {monthlyExpensesTotal.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 mt-1 block">Expenses in {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-150"} shadow-sm flex items-center md:col-span-2`}>
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Filter expenses by category or descriptions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600 bg-gray-50/45 text-sm"
            />
          </div>
        </div>

      </div>

      {/* EXPENSES HISTORIC LIST TABLE */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`text-xs uppercase tracking-wider ${isDark ? "bg-gray-800/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
              <tr>
                <th className="p-4">Expense Category</th>
                <th className="p-4">Description Note</th>
                <th className="p-4 font-mono">Date Logged</th>
                <th className="p-4">Cash Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No logged business expenses recorded.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="p-4">
                      <span className="font-bold text-gray-950 dark:text-gray-100 block">{e.category}</span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400 max-w-sm truncate" title={e.description}>
                      {e.description || "Routine shop operations"}
                    </td>
                    <td className="p-4 font-mono text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{e.expenseDate}</span>
                      </span>
                    </td>
                    <td className="p-4 font-bold font-mono text-rose-600">
                      TZS {e.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteExpense(e.id, e.amount, e.description)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
                        title="Remove expense"
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

      {/* LOG EXPENSE MODAL DIALOG */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-gray-100 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white"}`}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold">Log Business Expense</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expense Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
                >
                  <option value="Utilities">Shop Utilities (Power, Water)</option>
                  <option value="Rent">Shop Location Rent</option>
                  <option value="Transport">Dispatch & Transport Logistics</option>
                  <option value="Salaries">Worker Salaries / Labor</option>
                  <option value="Marketing">Marketing / Social Media Ads</option>
                  <option value="Packaging">Can Tins / Custom Mixing Tapes</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Amount (TZS)</label>
                <input 
                  type="number" 
                  required 
                  value={amount} 
                  onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  placeholder="e.g. 50000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expense Note / Description</label>
                <textarea 
                  required 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-gray-800"
                  placeholder="e.g. Paid Vodacom broadband monthly bill"
                  rows={3}
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Record Expense</span>
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
              <span>Confirm Expense Deletion</span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete the logged expense record: <br />
              <span className="font-bold text-gray-900 dark:text-gray-100">"{confirmDelete.description}"</span> of <span className="font-extrabold text-teal-700">TZS {confirmDelete.amount.toLocaleString()}</span>? 
              This action is permanent and cannot be undone.
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
                  await executeDeleteExpense(item.id, item.amount, item.description);
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
