import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { CuttingForm, RecipeWithComponents } from './CuttingForm'
import { logout } from '@/app/login/actions'

export default async function CuttingDashboard() {
    // 1. Authorize - Strict Server-side RBAC
    const session = await requireRole(['cutting_supervisor'])
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
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Nav Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">ApparelFlow ERP</h1>
                        <p className="text-sm text-gray-500">
                            Cutting Supervisor Dashboard &mdash; {session.appUser.email}
                        </p>
                    </div>
                    <form action={logout}>
                        <button type="submit" className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md font-medium">
                            Sign Out
                        </button>
                    </form>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Form */}
                    <div className="md:col-span-1">
                        {recipesError ? (
                            <div className="text-red-500">Failed to load recipes.</div>
                        ) : (
                            <CuttingForm recipes={(recipes as unknown as RecipeWithComponents[]) || []} />
                        )}
                    </div>

                    {/* Right Column: Recent Orders */}
                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold mb-4">Recent Cutting Orders</h2>

                            {!recentOrders || recentOrders.length === 0 ? (
                                <p className="text-gray-500 text-sm">No recent orders found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {recentOrders.map((order) => {
                                        const r = recipes?.find(rec => rec.id === order.recipe_id)
                                        return (
                                            <div key={order.id} className="border border-gray-100 p-4 rounded-md flex justify-between items-center bg-gray-50">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{order.order_no}</p>
                                                    <p className="text-xs text-gray-500">{r?.name || 'Unknown Recipe'} &mdash; {order.target_qty} units</p>
                                                </div>
                                                <div>
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        {order.status}
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
