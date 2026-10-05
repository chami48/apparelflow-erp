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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 animate-fade-in">
            {/* Premium Nav Header */}
            <header className="glassmorphism sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center relative">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-extrabold text-lg">V</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">ApparelFlow <span className="text-indigo-600">ERP</span></h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                    Quality Gate &bull; <span className="normal-case tracking-normal font-medium">{session.appUser.email}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <form action={logout}>
                        <button type="submit" className="text-sm bg-white hover:bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg font-semibold text-slate-600 shadow-sm transition-all hover:shadow hover:text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                            Sign Out
                        </button>
                    </form>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {ordersError ? (
                    <div className="text-red-500">Failed to load verification queue.</div>
                ) : (
                    <VerificationClient orders={mappedOrders} />
                )}
            </main>
        </div>
    )
}
