import https from 'https';

const url = 'https://mssjcavoyyieijsipwno.supabase.co/rest/v1/?apikey=sb_publishable_Kkw_XyRHBgfG2sdXoM6FiA_p8-2thCA';
const options = {
    headers: {
        'Authorization': 'Bearer sb_publishable_Kkw_XyRHBgfG2sdXoM6FiA_p8-2thCA',
        'apikey': 'sb_publishable_Kkw_XyRHBgfG2sdXoM6FiA_p8-2thCA'
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const definitions = parsed.definitions;
            if (!definitions) {
                console.log("No definitions found", data.substring(0, 500));
                return;
            }

            const tables = ['users', 'recipes', 'recipe_components', 'cutting_orders', 'verification_items', 'verification_logs'];
            const schema = {};

            for (const table of tables) {
                schema[table] = definitions[table] || 'Missing';
            }

            console.log(JSON.stringify(schema, null, 2));
        } catch (e) {
            console.log("Error parsing", e);
            console.log(data.substring(0, 500));
        }
    });
}).on('error', err => console.log('Error: ', err.message));
