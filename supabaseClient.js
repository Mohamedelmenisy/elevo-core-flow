// ✅ Universal Supabase client for browser-based HTML (Elevo Core)

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://aefiigottnlcmjzilqnh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4";

// إنشاء العميل
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// توفيره على window لاستخدامه من ملفات أخرى مثل role-check.js
if (typeof window !== "undefined") {
  window.supabase = supabase;
  console.log("✅ Supabase client initialized globally");
}

export default supabase;
