const { createClient } = require('@supabase/supabase-js');
(async () => {
  const supabase = createClient(process.env.SUPA_URL, process.env.SUPA_KEY);
  const email = process.env.TEST_EMAIL;
  const pass1 = process.env.PASS1;
  const pass2 = process.env.PASS2;

  const s1 = await supabase.auth.signUp({ email, password: pass1 });
  const s2 = await supabase.auth.signUp({ email, password: pass2 });
  const signIn1 = await supabase.auth.signInWithPassword({ email, password: pass1 });
  const signIn2 = await supabase.auth.signInWithPassword({ email, password: pass2 });

  console.log(JSON.stringify({
    email,
    signup1: {
      error: s1.error ? { message: s1.error.message, status: s1.error.status, code: s1.error.code } : null,
      userId: s1.data?.user?.id || null,
      identitiesLen: s1.data?.user?.identities?.length ?? null
    },
    signup2: {
      error: s2.error ? { message: s2.error.message, status: s2.error.status, code: s2.error.code } : null,
      userId: s2.data?.user?.id || null,
      identitiesLen: s2.data?.user?.identities?.length ?? null
    },
    signInWithPass1: signIn1.error ? { message: signIn1.error.message, status: signIn1.error.status, code: signIn1.error.code } : { ok: true },
    signInWithPass2: signIn2.error ? { message: signIn2.error.message, status: signIn2.error.status, code: signIn2.error.code } : { ok: true }
  }, null, 2));
})();
