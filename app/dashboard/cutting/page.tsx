import { verifyRoleOrRedirect } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { CuttingForm, RecipeWithComponents } from './CuttingForm'
import { logout } from '@/app/login/actions'

export default async function CuttingDashboard() {
    // 1. Authorize - Strict Server-side RBAC
    const session = await verifyRoleOrRedirect(['cutting_supervisor'])
    const supabase = await createClient()

    // 2. Fetch Recipes (with components) for the creation form
    const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select(`
            id, recipe_code, name, std_fabric_yards, wastage_cap,
            recipe_components(component_name, pieces_per_garment)
        `)
        .order('name')

    // 3. Fetch recent cutting orders created by this supervisor
    const { data: recentOrders } = await supabase
        .from('cutting_orders')
        .select('id, order_no, recipe_id, target_qty, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 animate-fade-in">
            {/* Premium Nav Header */}
            <header className="glassmorphism sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center relative">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-extrabold text-lg">A</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">ApparelFlow <span className="text-blue-600">ERP</span></h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                    Cutting Supervisor &bull; <span className="normal-case tracking-normal font-medium">{session.appUser.email}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <form action={logout}>
                        <button type="submit" className="text-sm bg-white hover:bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg font-semibold text-slate-600 shadow-sm transition-all hover:shadow hover:text-slate-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Sign Out
                        </button>
                    </form>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Cutting Floor Engine</h2>
                    <p className="text-slate-500 mt-1">Configure and mint batch recipes into physical production queues.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        {recipesError ? (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-sm">Failed to load recipes. Connection error.</div>
                        ) : (
                            <CuttingForm recipes={(recipes as unknown as RecipeWithComponents[]) || []} />
                        )}
                    </div>

                    {/* Right Column: Recent Orders */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <div className="bg-white p-8 rounded-2xl premium-shadow border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-extrabold text-slate-800">Live Cutting Orders</h2>
                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">Last 5 Batches</span>
                            </div>

                            {!recentOrders || recentOrders.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-500 font-medium">No recent orders found.</p>
                                    <p className="text-xs text-slate-400 mt-1">Initiate a new batch to see limits.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentOrders.map((order) => {
                                        const r = recipes?.find(rec => rec.id === order.recipe_id)
                                        return (
                                            <div key={order.id} className="group border border-slate-100 p-5 rounded-xl flex justify-between items-center bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="hidden sm:flex h-12 w-12 rounded-full bg-indigo-50 items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
                                                        <span className="text-indigo-600 font-bold text-xl uppercase">{r?.name?.substring(0, 1) || 'B'}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">{order.order_no}</p>
                                                        <p className="text-sm font-medium text-slate-500 mt-0.5">{r?.name || 'Unknown Recipe'} &bull; <span className="text-slate-700">{order.target_qty} units</span></p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                                                        <p className="text-[10px] text-slate-300">{new Date(order.created_at).toLocaleTimeString()}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm tracking-wide ${order.status === 'PENDING_VERIFICATION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            order.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                order.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    order.status === 'SEWING' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                        }`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
