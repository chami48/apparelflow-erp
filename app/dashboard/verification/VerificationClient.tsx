'use client'

import { useState } from 'react'
import { approveBatch, rejectBatch } from '@/lib/actions/verification'

type ComponentItem = {
    component_id: string
    component_name: string
    pieces_per_garment: number
    expected_qty: number
}

export type OrderData = {
    id: string
    order_no: string
    recipe_name: string
    target_qty: number
    fabric_roll_id: string
    actual_fabric_yds: number
    created_at: string
    components: ComponentItem[]
}

export function VerificationClient({ orders }: { orders: OrderData[] }) {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [actualCounts, setActualCounts] = useState<Record<string, string>>({})
    const [rejectionReason, setRejectionReason] = useState<string>('')
    const [globalError, setGlobalError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const selectedOrder = orders.find(o => o.id === selectedOrderId)

    const handleActualChange = (compId: string, value: string) => {
        setActualCounts(prev => ({ ...prev, [compId]: value }))
    }

    const selectOrder = (id: string) => {
        setSelectedOrderId(id)
        setActualCounts({})
        setRejectionReason('')
        setGlobalError(null)
        setSuccessMsg(null)
    }

    const buildPayload = () => {
        return Object.entries(actualCounts).map(([component_id, act_qty_str]) => ({
            component_id,
            actual_qty: act_qty_str === '' ? undefined : parseInt(act_qty_str, 10)
        })).filter(c => c.actual_qty !== undefined && !isNaN(c.actual_qty))
    }

    const handleApprove = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setGlobalError(null)
        setSuccessMsg(null)

        if (!selectedOrder) return

        // Disable Approve while ANY is blank:
        const missingAny = selectedOrder.components.some(c => !actualCounts[c.component_id])
        if (missingAny) {
            setGlobalError('All components must have an actual quantity for approval.')
            return
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('order_id', selectedOrder.id)

        const res = await approveBatch(formData, JSON.stringify(buildPayload()))
        setLoading(false)

        if (res.error) setGlobalError(res.error)
        else {
            setSuccessMsg(`Order ${selectedOrder.order_no} successfully APPROVED.`)
            setSelectedOrderId(null)
        }
    }

    const handleReject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setGlobalError(null)
        setSuccessMsg(null)

        if (!selectedOrder) return

        if (!rejectionReason.trim()) {
            setGlobalError('Rejection reason is mandatory.')
            return
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('order_id', selectedOrder.id)
        formData.append('rejection_reason', rejectionReason)

        const payloadStr = JSON.stringify(buildPayload())
        const res = await rejectBatch(formData, payloadStr === '[]' ? '' : payloadStr)
        setLoading(false)

        if (res.error) setGlobalError(res.error)
        else {
            setSuccessMsg(`Order ${selectedOrder.order_no} successfully REJECTED.`)
            setSelectedOrderId(null)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List Column */}
            <div className="col-span-1 border-r pr-4">
                <h2 className="text-xl font-bold mb-4">Pending Orders</h2>

                {successMsg && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-sm">
                        {successMsg}
                    </div>
                )}

                {orders.length === 0 && <p className="text-gray-500">No pending orders found.</p>}

                <ul className="space-y-3">
                    {orders.map(order => (
                        <li key={order.id}>
                            <button
                                onClick={() => selectOrder(order.id)}
                                className={`w-full text-left p-3 rounded border ${selectedOrderId === order.id ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                            >
                                <p className="font-bold text-gray-900">{order.order_no}</p>
                                <p className="text-sm text-gray-600">{order.recipe_name}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Details Column */}
            <div className="col-span-1 md:col-span-2">
                {!selectedOrder ? (
                    <div className="text-center p-12 text-gray-500 border border-dashed rounded bg-gray-50">
                        Select an order to begin verification
                    </div>
                ) : (
                    <div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Gate Check: {selectedOrder.order_no}
                            </h2>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-6 border-b">
                                <div><span className="text-gray-500">Recipe:</span> {selectedOrder.recipe_name}</div>
                                <div><span className="text-gray-500">Target Qty:</span> {selectedOrder.target_qty} units</div>
                                <div><span className="text-gray-500">Fabric Roll:</span> {selectedOrder.fabric_roll_id}</div>
                                <div><span className="text-gray-500">Fabric Used:</span> {selectedOrder.actual_fabric_yds} yds</div>
                            </div>

                            {globalError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
                                    <p className="font-bold">Execution Blocked</p>
                                    <p className="font-mono text-sm">{globalError}</p>
                                </div>
                            )}

                            <h3 className="font-semibold text-lg mb-4">Component Verification</h3>

                            <div className="space-y-4 mb-6">
                                {selectedOrder.components.map(comp => {
                                    const actualStr = actualCounts[comp.component_id] || ''
                                    const actualInt = parseInt(actualStr, 10)
                                    let uiColor = 'bg-gray-100 text-gray-500'
                                    let uiText = 'PENDING'

                                    if (actualStr !== '' && !isNaN(actualInt)) {
                                        if (actualInt === comp.expected_qty) {
                                            uiColor = 'bg-green-100 text-green-800 border border-green-200'
                                            uiText = 'GREEN'
                                        } else if (actualInt > comp.expected_qty) {
                                            uiColor = 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                            uiText = 'YELLOW'
                                        } else {
                                            uiColor = 'bg-red-100 text-red-800 border border-red-200'
                                            uiText = 'RED'
                                        }
                                    }

                                    return (
                                        <div key={comp.component_id} className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded border">
                                            <div className="col-span-4 font-medium">{comp.component_name}</div>
                                            <div className="col-span-2 text-center text-sm font-mono bg-gray-200 py-1 rounded">Exp: {comp.expected_qty}</div>
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    placeholder="Actual"
                                                    className="w-full p-1 border rounded"
                                                    value={actualStr}
                                                    onChange={e => handleActualChange(comp.component_id, e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-3 text-right">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${uiColor}`}>
                                                    {uiText}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                                <form onSubmit={handleReject} className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Reason for Rejection (Required)"
                                        className="w-full p-2 border rounded"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                        REJECT
                                    </button>
                                </form>
                                <form onSubmit={handleApprove}>
                                    <button
                                        type="submit"
                                        disabled={loading || selectedOrder.components.some(c => !actualCounts[c.component_id])}
                                        className="bg-green-600 text-white font-bold py-2 px-8 rounded hover:bg-green-700 disabled:opacity-50 h-full"
                                    >
                                        APPROVE
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
