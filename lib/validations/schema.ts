import { z } from 'zod'

// 1. Cutting Order Input Validation
export const CuttingOrderSchema = z.object({
    recipe_id: z.string().uuid("Invalid Recipe ID"),
    target_qty: z.number().int("Must be an integer").positive("Target quantity must be positive"),
    fabric_roll_id: z.string().trim().min(1, "Fabric Roll ID is required"),
    actual_fabric_yds: z.number().nonnegative("Actual fabric cannot be negative").finite("Must be a finite number"),
})

// 2. Verification Component Counts Validation
export const VerificationComponentSchema = z.object({
    component_id: z.string().uuid("Invalid Component ID"),
    actual_qty: z.number().int("Decimal values are not allowed").nonnegative("Cannot be negative"),
    // Note: z.number() intrinsically rejects missing and non-numeric values
})

// 3. Rejection Validation
export const RejectionSchema = z.object({
    order_id: z.string().uuid("Invalid Order ID"),
    rejection_reason: z.string().trim().min(1, "Rejection reason is mandatory"),
})
