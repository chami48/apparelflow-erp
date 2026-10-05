import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
    // fetch one row
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        console.log(`Table ${tableName} Error:`, error.message);
    } else {
        if (data && data.length > 0) {
            console.log(`Table ${tableName} Columns:`, Object.keys(data[0]).join(', '));
        } else {
            console.log(`Table ${tableName} is empty. Trying to trigger a constraint error to reveal columns...`);
            // inserting an empty object usually tells us necessary columns or we can just fetch OpenAPI.
            const { error: insErr } = await supabase.from(tableName).insert({}).select();
            if (insErr) {
                console.log(`Table ${tableName} Insert Error Details:`, insErr);
            }
        }
    }
}

async function run() {
    const tables = ['users', 'recipes', 'recipe_components', 'cutting_orders', 'verification_items', 'verification_logs'];
    for (const t of tables) {
        await inspectTable(t);
    }
}

run();
