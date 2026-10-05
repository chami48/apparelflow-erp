import { createClient } from '../supabase/server'

export type ApplicationRole = 'cutting_supervisor' | 'cutting_verifier' | 'sewing_supervisor';

export interface ApplicationUser {
    id: string; // The int/uuid primary key in public.users
    auth_user_id: string; // The Supabase Auth UUID
    role: ApplicationRole;
    email: string;
}

export async function requireAuth() {
    const supabase = await createClient()

    // 1. Get Trusted Session from Supabase Auth Server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error('Not authenticated')
    }

    // 2. Resolve Application Role using the mapped auth_user_id
    const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

    if (dbError || !dbUser) {
        throw new Error('User application record not found or mapping missing.')
    }

    return {
        authUser: user,
        appUser: dbUser as ApplicationUser
    }
}

export async function requireRole(allowedRoles: ApplicationRole | ApplicationRole[]) {
    const session = await requireAuth()

    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    if (!rolesArray.includes(session.appUser.role)) {
        throw new Error(`Unauthorized. Requires one of: ${rolesArray.join(', ')}`)
    }

    return session
}
