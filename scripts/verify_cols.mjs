import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns(table, columns) {
    for (const col of columns) {
        const { error } = await supabase.from(table).select(col).limit(1);
        if (error && error.code === 'PGRST106') {
            console.log(`[${table}] MISSING: ${col}`);
        } else if (error) {
            console.log(`[${table}] Error on ${col}: ${error.message}`);
        } else {
            console.log(`[${table}] PASS: ${col}`);
        }
    }
}

async function run() {
    await checkColumns('users', ['id', 'email', 'role', 'full_name', 'auth_user_id']);
    await checkColumns('recipes', ['id', 'recipe_code', 'garment_name', 'name', 'std_fabric_yards', 'wastage_cap_pct', 'wastage_cap']);
    await checkColumns('recipe_components', ['id', 'recipe_id', 'component_name', 'pieces_per_garment']);
    await checkColumns('cutting_orders', ['id', 'recipe_id', 'target_qty', 'fabric_roll_id', 'actual_fabric_yds', 'status', 'created_by', 'created_at', 'order_no']);
    await checkColumns('verification_items', ['id', 'order_id', 'component_id', 'expected_qty', 'actual_qty', 'status']);
    await checkColumns('verification_logs', ['id', 'order_id', 'verifier_id', 'verified_at', 'decision', 'rejection_reason', 'wastage_pct']);
}

run();
