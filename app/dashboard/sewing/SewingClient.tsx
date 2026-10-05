'use client'

import { useState } from 'react'
import { startSewing } from '@/lib/actions/sewing'

export type SewingOrderData = {
    id: string
    order_no: string
    recipe_name: string
    target_qty: number
    fabric_roll_id: string
    actual_fabric_yds: number
    status: string
    updated_at: string
}

export function SewingClient({ orders }: { orders: SewingOrderData[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [globalError, setGlobalError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const handleStartSewing = async (e: React.FormEvent<HTMLFormElement>, orderId: string, orderNo: string) => {
        e.preventDefault()
        setGlobalError(null)
        setSuccessMsg(null)
        setLoadingId(orderId)

        const formData = new FormData()
        formData.append('order_id', orderId)

        const res = await startSewing(formData)
        setLoadingId(null)

        if (res.error) {
            setGlobalError(res.error)
        } else {
            setSuccessMsg(`Order ${orderNo} successfully transitioned to SEWING.`)
        }
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Sewing Ready Queue</h2>

            {globalError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded shadow-sm">
                    <p className="font-bold">Transition Blocked</p>
                    <p className="font-mono text-sm">{globalError}</p>
                </div>
            )}

            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded shadow-sm">
                    {successMsg}
                </div>
            )}

            {orders.length === 0 ? (
                <div className="text-center p-12 text-gray-500 border border-dashed rounded bg-gray-50 shadow-sm">
                    No verified batches are currently ready for sewing.
                </div>
            ) : (
                <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Order</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Garment</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Qty</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Fabric Roll</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Used (yds)</th>
                                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Verification</th>
                                <th scope="col" className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{order.order_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.recipe_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-mono">{order.target_qty}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-xs">{order.fabric_roll_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono">{order.actual_fabric_yds}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800 border border-green-200 shadow-sm">
                                            {order.status}
                                        </span>
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            {new Date(order.updated_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <form onSubmit={(e) => handleStartSewing(e, order.id, order.order_no)}>
                                            <button
                                                type="submit"
                                                disabled={loadingId !== null}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded shadow disabled:opacity-50 transition-colors"
                                            >
                                                {loadingId === order.id ? 'PROCESSING...' : 'START SEWING'}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
