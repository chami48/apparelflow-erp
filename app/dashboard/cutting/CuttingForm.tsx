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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Create Cutting Order</h2>

            {globalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {globalError}
                </div>
            )}

            {successOrder && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md">
                    <p className="font-bold">Order Created Successfully!</p>
                    <p className="text-sm mt-1">Order Number: <span className="font-mono text-green-900 bg-green-100 px-1 py-0.5 rounded">{successOrder}</span></p>
                    <p className="text-sm">Status: PENDING_VERIFICATION</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipe</label>
                    <select
                        name="recipe_id"
                        value={selectedRecipeId}
                        onChange={(e) => setSelectedRecipeId(e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"
                        required
                    >
                        <option value="" disabled>Select a Recipe</option>
                        {recipes.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.recipe_code} - {r.name}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.recipe_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.recipe_id.join(', ')}</p>}
                </div>

                {selectedRecipe && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900">
                        <div className="grid grid-cols-2 gap-4">
                            <div><strong>Code:</strong> {selectedRecipe.recipe_code}</div>
                            <div><strong>Name:</strong> {selectedRecipe.name}</div>
                            <div><strong>Std Fabric:</strong> {selectedRecipe.std_fabric_yards} yards</div>
                            <div><strong>Wastage Cap:</strong> {selectedRecipe.wastage_cap}%</div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <strong>Required Components:</strong>
                            <ul className="list-disc ml-5 mt-1">
                                {selectedRecipe.recipe_components.map((c, i) => (
                                    <li key={i}>{c.component_name} ({c.pieces_per_garment} pcs/garment)</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Batch Quantity</label>
                    <input
                        type="number"
                        name="target_qty"
                        min="1"
                        step="1"
                        value={targetQty || ''}
                        onChange={(e) => setTargetQty(parseInt(e.target.value) || 0)}
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    {fieldErrors.target_qty && <p className="text-red-500 text-xs mt-1">{fieldErrors.target_qty.join(', ')}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Roll ID</label>
                    <input
                        type="text"
                        name="fabric_roll_id"
                        value={fabricRollId}
                        onChange={(e) => setFabricRollId(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    {fieldErrors.fabric_roll_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.fabric_roll_id.join(', ')}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Fabric Used (yards)</label>
                    <input
                        type="number"
                        name="actual_fabric_yds"
                        step="0.01"
                        min="0"
                        value={actualFabricYds}
                        onChange={(e) => setActualFabricYds(e.target.value ? parseFloat(e.target.value) : '')}
                        required
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    {fieldErrors.actual_fabric_yds && <p className="text-red-500 text-xs mt-1">{fieldErrors.actual_fabric_yds.join(', ')}</p>}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading || !selectedRecipeId}
                        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Create Order'}
                    </button>
                </div>
            </form>
        </div>
    )
}
