// Defined Allowed Order States
export type OrderState =
    | 'CUTTING_IN_PROGRESS'
    | 'PENDING_VERIFICATION'
    | 'VERIFIED'
    | 'REJECTED'
    | 'SEWING'

export type TrafficLightState = 'GREEN' | 'YELLOW' | 'RED'

// Centralized State Transition Definition/Helper
// Note: Newly submitted Cutting Supervisor orders default directly to PENDING_VERIFICATION.
// CUTTING_IN_PROGRESS remains supported for edge-case tracking if utilized.
export const ALLOWED_TRANSITIONS: Record<OrderState, OrderState[]> = {
    CUTTING_IN_PROGRESS: ['PENDING_VERIFICATION'],
    PENDING_VERIFICATION: ['VERIFIED', 'REJECTED'],
    VERIFIED: ['SEWING'],
    REJECTED: [], // Terminal or requires manual intervention beyond basic flow
    SEWING: [],   // Final state for this assessment scope
}

export function isValidTransition(currentState: OrderState, nextState: OrderState): boolean {
    const allowed = ALLOWED_TRANSITIONS[currentState]
    if (!allowed) return false
    return allowed.includes(nextState)
}
