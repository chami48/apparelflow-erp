'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { CuttingOrderSchema } from '@/lib/validations/schema'
import { revalidatePath } from 'next/cache'

export async function createCuttingOrder(formData: FormData) {
    try {
        const session = await requireRole(['cutting_supervisor'])
        const supabase = await createClient()

        // 1. Zod Validation
        const rawData = {
            recipe_id: formData.get('recipe_id') as string,
            target_qty: parseInt(formData.get('target_qty') as string, 10),
            fabric_roll_id: formData.get('fabric_roll_id') as string,
            actual_fabric_yds: parseFloat(formData.get('actual_fabric_yds') as string),
        }

        const validation = CuttingOrderSchema.safeParse(rawData)

        if (!validation.success) {
            return {
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors,
            }
        }

        const data = validation.data

        // 2. Validate Recipe Existence Server-Side
        const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .select('id')
            .eq('id', data.recipe_id)
            .single()

        if (recipeError || !recipe) {
            return { error: 'Selected recipe does not exist or could not be loaded.' }
        }

        // 3. Generate secure server-side order_no: CUT-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const randomHex = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0')
        // Using a short millisecond component adds additional collision resistance
        const shortMs = (Date.now() % 1000).toString().padStart(3, '0')
        const order_no = `CUT-${dateStr}-${shortMs}${randomHex}`

        // 4. Call RPC purely atomic
        const { data: newOrderId, error: rpcError } = await supabase.rpc('create_cutting_order_atomic', {
            p_order_no: order_no,
            p_recipe_id: data.recipe_id,
            p_target_qty: data.target_qty,
            p_fabric_roll_id: data.fabric_roll_id,
            p_actual_fabric_yds: data.actual_fabric_yds,
            p_created_by: session.appUser.id, // Using correct public.users.id
        })

        if (rpcError) {
            console.error('RPC Error:', rpcError)
            return { error: `Database error: ${rpcError.message}` }
        }

        revalidatePath('/dashboard/cutting')

        return { success: true, order_no }

    } catch (err: unknown) {
        console.error('Action Exception:', err)
        return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
}
