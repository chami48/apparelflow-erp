'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const StartSewingSchema = z.object({
    order_id: z.string().uuid("Invalid Order ID"),
})

export async function startSewing(formData: FormData) {
    try {
        // Enforce server-side role check mathematically preventing spoofing via client payloads
        await requireRole(['sewing_supervisor'])
        const supabase = await createClient()

        const rawData = { order_id: formData.get('order_id') as string }
        const validation = StartSewingSchema.safeParse(rawData)

        if (!validation.success) {
            return { error: 'Validation failed', details: validation.error.flatten().fieldErrors }
        }

        // Strict transition using exclusively the installed Secure RPC bounds
        const { error: rpcError } = await supabase.rpc('start_sewing_batch', {
            p_order_id: validation.data.order_id
        })

        if (rpcError) {
            console.error('RPC Error (Sewing):', rpcError)
            return { error: rpcError.message }
        }

        revalidatePath('/dashboard/sewing')
        return { success: true }
    } catch (err: unknown) {
        console.error('Action Exception:', err)
        return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
}
