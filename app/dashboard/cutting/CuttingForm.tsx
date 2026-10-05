'use client'

import { useState } from 'react'
import { createCuttingOrder } from '@/lib/actions/cutting'

export type RecipeWithComponents = {
    id: string;
    recipe_code: string;
    name: string;
    std_fabric_yards: number;
    wastage_cap: number;
    recipe_components: {
        component_name: string;
        pieces_per_garment: number;
    }[];
}

export function CuttingForm({ recipes }: { recipes: RecipeWithComponents[] }) {
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('')
    const [targetQty, setTargetQty] = useState<number>(0)
    const [fabricRollId, setFabricRollId] = useState<string>('')
    const [actualFabricYds, setActualFabricYds] = useState<number | ''>('')

    const [loading, setLoading] = useState(false)
    const [globalError, setGlobalError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
    const [successOrder, setSuccessOrder] = useState<string | null>(null)

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setGlobalError(null)
        setFieldErrors({})
        setSuccessOrder(null)

        const formData = new FormData(e.currentTarget)
        const result = await createCuttingOrder(formData)

        setLoading(false)

        if (result?.error) {
            setGlobalError(result.error)
            if (result.details) {
                setFieldErrors(result.details)
            }
        } else if (result?.success) {
            setSuccessOrder(result.order_no!)
            // Reset form strictly through React state to avoid currentTarget.reset null errors
            setSelectedRecipeId('')
            setTargetQty(0)
            setFabricRollId('')
            setActualFabricYds('')
        }
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm premium-shadow border border-slate-100 relative overflow-hidden group">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>

            <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                Initialize Batch
            </h2>

            {globalError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium animate-fade-in flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                    {globalError}
                </div>
            )}

            {successOrder && (
                <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-800 rounded-xl shadow-sm animate-fade-in relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/40 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none"></div>
                    <div className="relative">
                        <p className="font-bold flex items-center gap-2 text-emerald-900">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Batch Created Successfully
                        </p>
                        <p className="text-sm mt-3 font-medium text-emerald-800">Job Reference: <span className="font-mono text-emerald-900 bg-emerald-200/50 px-2 py-1 rounded-md shadow-sm border border-emerald-200 ml-1">{successOrder}</span></p>
                        <p className="text-xs font-semibold text-emerald-600 mt-2 tracking-wide uppercase">Stage: Verification Pending</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blueprint Recipe</label>
                    <select
                        name="recipe_id"
                        value={selectedRecipeId}
                        onChange={(e) => setSelectedRecipeId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl shadow-sm px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-800 outline-none"
                        required
                    >
                        <option value="" disabled>Select Blueprint...</option>
                        {recipes.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.recipe_code} — {r.name}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.recipe_id && <p className="text-red-500 text-xs font-medium mt-1.5 pl-1">{fieldErrors.recipe_id.join(', ')}</p>}
                </div>

                {selectedRecipe && (
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-xl text-sm text-blue-900 shadow-sm animate-fade-in relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10 blur-xl w-32 h-32 bg-blue-600 rounded-full"></div>
                        <div className="relative z-10 w-full space-y-4">
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                <div className="flex flex-col"><span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">SKU Code</span><span className="font-bold text-slate-800">{selectedRecipe.recipe_code}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Garment</span><span className="font-semibold text-slate-700">{selectedRecipe.name}</span></div>
                                <div className="flex flex-col"><span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Allocation</span><span className="font-mono bg-white/70 px-2 py-0.5 rounded border border-blue-200 self-start">{selectedRecipe.std_fabric_yards} yds</span></div>
                                <div className="flex flex-col"><span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Wastage Cap</span><span className="font-mono bg-white/70 px-2 py-0.5 rounded border border-blue-200 self-start">{selectedRecipe.wastage_cap}%</span></div>
                            </div>
                            <div className="pt-3 border-t border-blue-200/50">
                                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block mb-2">Verification Matrix</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRecipe.recipe_components.map((c, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-blue-200 shadow-sm text-xs font-semibold text-slate-700">
                                            {c.component_name} <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px]">x{c.pieces_per_garment}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target Qty</label>
                        <input
                            type="number"
                            name="target_qty"
                            min="1"
                            step="1"
                            value={targetQty || ''}
                            onChange={(e) => setTargetQty(parseInt(e.target.value) || 0)}
                            required
                            placeholder="Units..."
                            className="w-full border border-slate-200 rounded-xl shadow-sm px-4 py-3 bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono outline-none"
                        />
                        {fieldErrors.target_qty && <p className="text-red-500 text-xs font-medium mt-1.5 pl-1">{fieldErrors.target_qty.join(', ')}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fabric Roll ID</label>
                        <input
                            type="text"
                            name="fabric_roll_id"
                            value={fabricRollId}
                            onChange={(e) => setFabricRollId(e.target.value)}
                            required
                            placeholder="e.g. ROLL-901"
                            className="w-full border border-slate-200 rounded-xl shadow-sm px-4 py-3 bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase outline-none"
                        />
                        {fieldErrors.fabric_roll_id && <p className="text-red-500 text-xs font-medium mt-1.5 pl-1">{fieldErrors.fabric_roll_id.join(', ')}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Actual Fabric Distributed (yards)</label>
                    <input
                        type="number"
                        name="actual_fabric_yds"
                        step="0.01"
                        min="0"
                        value={actualFabricYds}
                        onChange={(e) => setActualFabricYds(e.target.value ? parseFloat(e.target.value) : '')}
                        required
                        placeholder="0.00"
                        className="w-full border border-slate-200 rounded-xl shadow-sm px-4 py-3 bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono outline-none"
                    />
                    {fieldErrors.actual_fabric_yds && <p className="text-red-500 text-xs font-medium mt-1.5 pl-1">{fieldErrors.actual_fabric_yds.join(', ')}</p>}
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading || !selectedRecipeId}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading ? 'Initializing Batch...' : 'Push to Floor Queue'}
                    </button>
                    <p className="text-center text-xs text-slate-400 font-medium mt-3">Action permanently binds constraints uniquely in PostgreSQL</p>
                </div>
            </form>
        </div>
    )
}
