export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    auth_user_id: string | null
                    email: string
                    full_name: string | null
                    role: 'cutting_supervisor' | 'cutting_verifier' | 'sewing_supervisor'
                    password_hash: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['users']['Insert']>
            }
            recipes: {
                Row: {
                    id: string
                    recipe_code: string
                    name: string
                    std_fabric_yards: number
                    wastage_cap: number
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['recipes']['Insert']>
            }
            recipe_components: {
                Row: {
                    id: string
                    recipe_id: string
                    component_name: string
                    pieces_per_garment: number
                }
                Insert: Omit<Database['public']['Tables']['recipe_components']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['recipe_components']['Insert']>
            }
            cutting_orders: {
                Row: {
                    id: string
                    order_no: string
                    recipe_id: string
                    target_qty: number
                    fabric_roll_id: string
                    actual_fabric_yds: number
                    status: 'CUTTING_IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SEWING'
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['cutting_orders']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['cutting_orders']['Insert']>
            }
            verification_items: {
                Row: {
                    id: string
                    order_id: string
                    component_id: string
                    expected_qty: number
                    actual_qty: number | null
                    status: 'GREEN' | 'YELLOW' | 'RED' | null
                }
                Insert: Omit<Database['public']['Tables']['verification_items']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['verification_items']['Insert']>
            }
            verification_logs: {
                Row: {
                    id: string
                    order_id: string
                    verifier_id: string
                    verified_at: string
                    decision: 'APPROVED' | 'REJECTED'
                    rejection_reason: string | null
                    wastage_pct: number | null
                }
                Insert: Omit<Database['public']['Tables']['verification_logs']['Row'], 'id' | 'verified_at'>
                Update: Partial<Database['public']['Tables']['verification_logs']['Insert']>
            }
        }
    }
}
