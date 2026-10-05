import { requireAuth } from '@/lib/auth/server'
import { logout } from '@/app/login/actions'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    let appUser;

    try {
        const session = await requireAuth();
        appUser = session.appUser;
    } catch (error) {
        redirect('/login');
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <p className="mb-4">Welcome back!</p>

                <div className="bg-gray-50 p-4 rounded border mb-6">
                    <h2 className="font-semibold mb-2">Verified Server Session Data (RBAC)</h2>
                    <pre className="text-sm text-gray-700">
                        {JSON.stringify(appUser, null, 2)}
                    </pre>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Role resolved safely server-side via auth_user_id mapped to public.users table.
                </p>

                <form action={logout}>
                    <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    )
}
