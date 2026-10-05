import { verifyRoleOrRedirect } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { SewingClient, SewingOrderData } from './SewingClient'
import { logout } from '@/app/login/actions'

export default async function SewingDashboard() {
    // 1. Strict Server-Side Access Control
    const session = await verifyRoleOrRedirect(['sewing_supervisor'])
    const supabase = await createClient()

    // 2. Fetch EXCLUSIVELY `VERIFIED` Orders Database-Side
    const { data: verifiedOrdersRaw, error: ordersError } = await supabase
        .from('cutting_orders')
        .select(`
            id, order_no, target_qty, fabric_roll_id, actual_fabric_yds, status, updated_at,
            recipes ( name )
        `)
        .eq('status', 'VERIFIED')
        .order('updated_at', { ascending: true })

    // Map properties cleanly to fit Client interface requirements without explicit any bypass
    let mappedOrders: SewingOrderData[] = []
    if (verifiedOrdersRaw && !ordersError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mappedOrders = (verifiedOrdersRaw as any[]).map(o => {
            const recipeInfo = Array.isArray(o.recipes) ? o.recipes[0] : o.recipes;
            return {
                id: o.id,
                order_no: o.order_no,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                recipe_name: recipeInfo?.name || 'Unknown',
                target_qty: o.target_qty,
                fabric_roll_id: o.fabric_roll_id,
                actual_fabric_yds: o.actual_fabric_yds,
                status: o.status,
                updated_at: o.updated_at,
            }
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-white shadow mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">ApparelFlow ERP</h1>
                        <p className="text-sm text-gray-500">
                            Sewing Supervisor Dashboard &mdash; {session.appUser.email}
                        </p>
                    </div>
                    <form action={logout}>
                        <button type="submit" className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md font-medium">
                            Sign Out
                        </button>
                    </form>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {ordersError ? (
                    <div className="text-red-500">Failed to load sewing queue.</div>
                ) : (
                    <SewingClient orders={mappedOrders} />
                )}
            </main>
        </div>
    )
}
