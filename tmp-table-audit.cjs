const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '.env.local');
const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter(Boolean);
const env = Object.fromEntries(lines.map(l => {
  const idx = l.indexOf('=');
  return [l.slice(0, idx), l.slice(idx + 1)];
}));

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const tables = [
  'admin_alerts','admin_inbox','admin_messages','admin_settings','ai_audit_log','ai_jobs','api_keys','app_events','audit_logs','client_meal_plans','clients','entitlements','favorite_recipes','ingredient_prices','pantry_items','personal_recipes','planner_meals','profiles','recipe_guidance','recipe_micronutrients','recipe_notes','recipes','shopping_list_items','user_preferences','user_progress','weekly_plans'
];

(async () => {
  const out = [];
  for (const t of tables) {
    try {
      const { error, status } = await supabase.from(t).select('*', { head: true, count: 'exact' }).limit(1);
      out.push({ table: t, status, ok: !error, error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null });
    } catch (e) {
      out.push({ table: t, status: null, ok: false, error: { message: e.message } });
    }
  }
  console.log(JSON.stringify(out, null, 2));
})();
