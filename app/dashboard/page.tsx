import { requireAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    let appUser;

    try {
        const session = await requireAuth();
        appUser = session.appUser;
    } catch {
        redirect('/login');
    }

    if (appUser.role === 'cutting_supervisor') {
        redirect('/dashboard/cutting')
    } else if (appUser.role === 'cutting_verifier') {
        redirect('/dashboard/verification')
    } else if (appUser.role === 'sewing_supervisor') {
        redirect('/dashboard/sewing')
    }

    return (
        <div className="p-8">
            <h1>Unknown Role: {appUser.role}</h1>
        </div>
    )
}
