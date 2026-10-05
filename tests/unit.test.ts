import test from 'node:test'
import assert from 'node:assert'
import { CuttingOrderSchema, VerificationComponentSchema, RejectionSchema } from '../lib/validations/schema'

test('Unit Tests: Zod Validations', async (t) => {
    await t.test('CuttingOrderSchema ensures positive target quantity', () => {
        const result = CuttingOrderSchema.safeParse({
            recipe_id: '123e4567-e89b-12d3-a456-426614174000',
            target_qty: -10,
            fabric_roll_id: 'R123',
            actual_fabric_yds: 50
        })
        assert.strictEqual(result.success, false)
        if (!result.success) {
            assert.match(result.error.issues[0].message, /positive/i)
        }
    })

    await t.test('VerificationComponentSchema allows exactly zero or positive integers, but not decimals', () => {
        const valid = VerificationComponentSchema.safeParse({ component_id: '123e4567-e89b-12d3-a456-426614174000', actual_qty: 0 })
        assert.strictEqual(valid.success, true)

        const invalidDecimal = VerificationComponentSchema.safeParse({ component_id: '123e4567-e89b-12d3-a456-426614174000', actual_qty: 1.5 })
        assert.strictEqual(invalidDecimal.success, false)
    })

    await t.test('RejectionSchema mandates a non-empty trimmed reason', () => {
        const emptyResult = RejectionSchema.safeParse({ order_id: '123e4567-e89b-12d3-a456-426614174000', rejection_reason: '   ' })
        assert.strictEqual(emptyResult.success, false)

        const validResult = RejectionSchema.safeParse({ order_id: '123e4567-e89b-12d3-a456-426614174000', rejection_reason: 'Fabric is heavily torn' })
        assert.strictEqual(validResult.success, true)
    })
})
