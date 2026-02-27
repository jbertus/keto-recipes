const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const env = Object.fromEntries(fs.readFileSync(path.join(__dirname,'.env.local'),'utf8').split(/\r?\n/).filter(Boolean).map(l=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1)]}));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false }});
(async () => {
  const tables = ['recipes','planner_meals','personal_recipes'];
  const out = [];
  for (const t of tables) {
    const { count, error, status } = await supabase.from(t).select('*', { head: true, count: 'exact' });
    out.push({ table: t, status, count, error: error ? { message: error.message, code: error.code } : null });
  }
  console.log(JSON.stringify(out, null, 2));
})();
