import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
    let output = `[${tableName}]\n`;
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (data && data.length > 0) {
        output += `Columns: ${Object.keys(data[0]).join(', ')}\n`;
    } else {
        const { error: insErr } = await supabase.from(tableName).insert({}).select();
        if (insErr) {
            output += `Insert Error: ${JSON.stringify(insErr)}\n`;
        }
    }
    return output;
}

async function run() {
    const tables = ['users', 'recipes', 'recipe_components', 'cutting_orders', 'verification_items', 'verification_logs'];
    let results = '';
    for (const t of tables) {
        results += await inspectTable(t) + '\n';
    }
    fs.writeFileSync('schema_dump.json', results, 'utf8');
}
run();
