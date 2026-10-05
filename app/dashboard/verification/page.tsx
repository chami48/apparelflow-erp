// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { verifyRoleOrRedirect } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { VerificationClient, OrderData } from './VerificationClient'
import { logout } from '@/app/login/actions'

export default async function VerificationDashboard() {
    const session = await verifyRoleOrRedirect(['cutting_verifier'])
    const supabase = await createClient()

    // Needs to fetch pending orders and their components
    const { data: pendingOrdersRaw, error: ordersError } = await supabase
        .from('cutting_orders')
        .select(`
            id, order_no, target_qty, fabric_roll_id, actual_fabric_yds, created_at,
            recipes ( name ),
            verification_items (
                component_id,
                expected_qty,
                recipe_components ( component_name, pieces_per_garment )
            )
        `)
        .eq('status', 'PENDING_VERIFICATION')
        .order('created_at', { ascending: true })

    // Safely map the returned nested data into a clean structure for the Client UI
    let mappedOrders: OrderData[] = []
    if (pendingOrdersRaw && !ordersError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mappedOrders = (pendingOrdersRaw as any[]).map((o: any) => {
            const recipeInfo = Array.isArray(o.recipes) ? o.recipes[0] : o.recipes;
            return {
                id: o.id,
                order_no: o.order_no,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                recipe_name: recipeInfo?.name || 'Unknown',
                target_qty: o.target_qty,
                fabric_roll_id: o.fabric_roll_id,
                actual_fabric_yds: o.actual_fabric_yds,
                created_at: o.created_at,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                components: o.verification_items.map((vi: any) => {
                    const compInfo = Array.isArray(vi.recipe_components) ? vi.recipe_components[0] : vi.recipe_components;
                    return {
                        component_id: vi.component_id,
                        expected_qty: vi.expected_qty,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        component_name: compInfo?.component_name || 'Unknown',
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        pieces_per_garment: compInfo?.pieces_per_garment || 0,
                    }
                }),
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
                            Verification Gate &mdash; {session.appUser.email}
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
                    <div className="text-red-500">Failed to load verification queue.</div>
                ) : (
                    <VerificationClient orders={mappedOrders} />
                )}
            </main>
        </div>
    )
}
