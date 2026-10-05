import test from 'node:test'
import assert from 'node:assert'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supa = createClient(supabaseUrl, supabaseKey)

test('Integration Tests: Real Supabase Authorization & RPC Bounds', async (t) => {
    let recipeId = ''
    let pendingOrderId = ''
    let blockRedOrderId = ''
    let rejectMandatoryOrderId = ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let verificationItemsForApproval: any[] = []

    // 1. Setup as Cutting Supervisor to mint fresh TEST batches
    await supa.auth.signInWithPassword({ email: 'cutting.super@apparelflow.com', password: 'Cutting@12345' })
    const { data: { user } } = await supa.auth.getUser()
    const { data: dbUser } = await supa.from('users').select('id').eq('auth_user_id', user!.id).single()
    const supervisorId = dbUser!.id

    const { data: recipes } = await supa.from('recipes').select('*').limit(1)
    recipeId = recipes![0].id

    const createOrder = async (name: string) => {
        const { data, error } = await supa.rpc('create_cutting_order_atomic', {
            p_order_no: name,
            p_recipe_id: recipeId,
            p_target_qty: 100,
            p_fabric_roll_id: 'TEST-ROLL-VITEST',
            p_actual_fabric_yds: 50,
            p_created_by: supervisorId
        })
        if (error) throw new Error(error.message)
        return data as string
    }

    const timestamp = Date.now()
    pendingOrderId = await createOrder(`TEST-GREEN-APP-${timestamp}`)
    blockRedOrderId = await createOrder(`TEST-RED-BLOCK-${timestamp}`)
    rejectMandatoryOrderId = await createOrder(`TEST-REJ-MAND-${timestamp}`)

    const { data: comps } = await supa.from('verification_items').select('*').eq('order_id', pendingOrderId)
    verificationItemsForApproval = comps!

    await t.test('TEST 1 — GREEN approval succeeds', async () => {
        // Sign in as Cutting Verifier
        await supa.auth.signInWithPassword({ email: 'cutting.verifier@apparelflow.com', password: 'Verifier@12345' })

        const payload = verificationItemsForApproval.map(item => ({
            component_id: item.component_id,
            actual_qty: item.expected_qty
        }))

        const { data, error } = await supa.rpc('approve_cutting_batch', {
            p_order_id: pendingOrderId,
            p_component_counts: payload
        })
        assert.strictEqual(error, null)
        assert.strictEqual(data, pendingOrderId)

        const { data: finalRecord } = await supa.from('cutting_orders').select('status').eq('id', pendingOrderId).single()
        assert.strictEqual(finalRecord?.status, 'VERIFIED')
    })

    await t.test('TEST 2 — RED approval is blocked SERVER-SIDE', async () => {
        await supa.auth.signInWithPassword({ email: 'cutting.verifier@apparelflow.com', password: 'Verifier@12345' })
        const { data: currComps } = await supa.from('verification_items').select('*').eq('order_id', blockRedOrderId)

        const payload = currComps!.map((item, index) => ({
            component_id: item.component_id,
            actual_qty: index === 0 ? item.expected_qty - 1 : item.expected_qty // RED CONDITION
        }))

        const { error } = await supa.rpc('approve_cutting_batch', {
            p_order_id: blockRedOrderId,
            p_component_counts: payload
        })
        assert.notStrictEqual(error, null)
        assert.match(error!.message, /RED|422/)

        const { data: finalRecord } = await supa.from('cutting_orders').select('status').eq('id', blockRedOrderId).single()
        assert.strictEqual(finalRecord?.status, 'PENDING_VERIFICATION')
    })

    await t.test('TEST 3 — Rejection reason is mandatory', async () => {
        await supa.auth.signInWithPassword({ email: 'cutting.verifier@apparelflow.com', password: 'Verifier@12345' })
        const { error: emptyError } = await supa.rpc('reject_cutting_batch', {
            p_order_id: rejectMandatoryOrderId,
            p_rejection_reason: '   '
        })
        assert.notStrictEqual(emptyError, null)

        const { error: validError } = await supa.rpc('reject_cutting_batch', {
            p_order_id: rejectMandatoryOrderId,
            p_rejection_reason: 'Testing Valid Failure'
        })
        assert.strictEqual(validError, null)

        const { data: finalRecord } = await supa.from('cutting_orders').select('status').eq('id', rejectMandatoryOrderId).single()
        assert.strictEqual(finalRecord?.status, 'REJECTED')
    })

    await t.test('TEST 4 — Unauthorized approval is blocked', async () => {
        await supa.auth.signInWithPassword({ email: 'sewing.super@apparelflow.com', password: 'Sewing@12345' })
        const { error } = await supa.rpc('approve_cutting_batch', {
            p_order_id: blockRedOrderId,
            p_component_counts: []
        })
        assert.notStrictEqual(error, null)
        assert.match(error!.message, /cutting_verifier/)
    })

    await t.test('TEST 5 — Unapproved orders never enter Sewing Ready Queue', async () => {
        await supa.auth.signInWithPassword({ email: 'sewing.super@apparelflow.com', password: 'Sewing@12345' })
        const { data: sewingQueue } = await supa
            .from('cutting_orders')
            .select('id, status, order_no')
            .eq('status', 'VERIFIED')
            .order('created_at', { ascending: false })
            .limit(100)

        assert.ok(sewingQueue)
        const foundPending = sewingQueue!.some(q => q.order_no.includes('TEST-RED-BLOCK'))
        const foundRejected = sewingQueue!.some(q => q.order_no.includes('TEST-REJ-MAND'))
        const foundVerified = sewingQueue!.some(q => q.order_no.includes('TEST-GREEN-APP'))

        assert.strictEqual(foundPending, false)
        assert.strictEqual(foundRejected, false)
        assert.strictEqual(foundVerified, true)
    })

    // After all tests (cleanup)
    await supa.auth.signInWithPassword({ email: 'cutting.super@apparelflow.com', password: 'Cutting@12345' })
    await supa.from('cutting_orders').delete().in('id', [pendingOrderId, blockRedOrderId, rejectMandatoryOrderId])
})
