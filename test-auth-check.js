const { createClient } = require("@supabase/supabase-js");

const url = "https://mtiwvzvlmwoocwbzogiu.supabase.co";
const anon = "sb_publishable_o0ntm3gCtD6bspCWdLGeRw_gg0MSzw4";

const sb = createClient(url, anon, { auth: { persistSession: false } });

async function run() {
  // Try sign-in with existing user from tests
  const { data, error } = await sb.auth.signInWithPassword({
    email: "yissekpanou96@gmail.com",
    password: "password123",
  });
  console.log("Anon sign-in:", error ? `ERROR: ${error.message}` : `OK user=${data.user?.email}`);
}
run().catch((e) => console.error("FATAL", e.message));
