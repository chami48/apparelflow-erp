'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { VerificationComponentSchema, RejectionSchema } from '@/lib/validations/schema'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ApproveBatchSchema = z.object({
    order_id: z.string().uuid("Invalid Order ID"),
    components: z.array(VerificationComponentSchema).min(1, "Components are required for approval"),
})

const RejectBatchSchema = RejectionSchema.extend({
    components: z.array(VerificationComponentSchema).optional(),
})

export async function approveBatch(formData: FormData, componentsJsonStr: string) {
    try {
        await requireRole(['cutting_verifier'])
        const supabase = await createClient()

        let components
        try {
            components = JSON.parse(componentsJsonStr)
        } catch {
            return { error: 'Malformed components payload' }
        }

        const rawData = {
            order_id: formData.get('order_id') as string,
            components,
        }

        const validation = ApproveBatchSchema.safeParse(rawData)
        if (!validation.success) {
            return { error: 'Validation failed', details: validation.error.flatten().fieldErrors }
        }

        const { error: rpcError } = await supabase.rpc('approve_cutting_batch', {
            p_order_id: validation.data.order_id,
            p_component_counts: validation.data.components,
        })

        if (rpcError) {
            console.error('RPC Error (Approve):', rpcError)
            return { error: rpcError.message }
        }

        revalidatePath('/dashboard/verification')
        return { success: true }
    } catch (err: unknown) {
        console.error('Action Exception:', err)
        return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
}

export async function rejectBatch(formData: FormData, componentsJsonStr: string) {
    try {
        await requireRole(['cutting_verifier'])
        const supabase = await createClient()

        let components
        try {
            components = componentsJsonStr ? JSON.parse(componentsJsonStr) : undefined
        } catch {
            return { error: 'Malformed components payload' }
        }

        const rawData = {
            order_id: formData.get('order_id') as string,
            rejection_reason: formData.get('rejection_reason') as string,
            components,
        }

        const validation = RejectBatchSchema.safeParse(rawData)
        if (!validation.success) {
            return { error: 'Validation failed', details: validation.error.flatten().fieldErrors }
        }

        const { error: rpcError } = await supabase.rpc('reject_cutting_batch', {
            p_order_id: validation.data.order_id,
            p_rejection_reason: validation.data.rejection_reason,
            p_component_counts: validation.data.components || null,
        })

        if (rpcError) {
            console.error('RPC Error (Reject):', rpcError)
            return { error: rpcError.message }
        }

        revalidatePath('/dashboard/verification')
        return { success: true }
    } catch (err: unknown) {
        console.error('Action Exception:', err)
        return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
}
