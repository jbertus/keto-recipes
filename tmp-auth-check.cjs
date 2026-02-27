const { createClient } = require('@supabase/supabase-js');
(async () => {
  const url = process.env.SUPA_URL;
  const key = process.env.SUPA_KEY;
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  const supabase = createClient(url, key);
  const signup = await supabase.auth.signUp({ email, password });
  const signin = await supabase.auth.signInWithPassword({ email, password });
  const out = {
    email,
    signupError: signup.error ? { message: signup.error.message, status: signup.error.status, code: signup.error.code } : null,
    signupUserId: signup.data?.user?.id || null,
    signInError: signin.error ? { message: signin.error.message, status: signin.error.status, code: signin.error.code } : null,
    hasSession: Boolean(signin.data?.session)
  };
  console.log(JSON.stringify(out, null, 2));
})();
