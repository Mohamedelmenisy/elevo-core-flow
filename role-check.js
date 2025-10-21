export async function protectPage(allowedRoles = []) {
  let userProfile = null;

  try {
    // نوقف انتظار supabase لو طول أكتر من 2 ثانية
    userProfile = await Promise.race([
      getCurrentUserProfile(),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 2000))
    ]);
  } catch (e) {
    console.error("Supabase error:", e);
  }

  // لو supabase اتأخر أو رجع null
  if (!userProfile || userProfile === "timeout") {
    console.warn("⚠️ Supabase response delayed, showing fallback modal.");
    document.querySelectorAll('body > *:not(script)').forEach(el => {
      el.style.filter = 'blur(10px)';
      el.style.pointerEvents = 'none';
    });
    showProtectedModal("Unable to verify user access. Please try again later.");
    return;
  }

  // لو المستخدم موجود
  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = userProfile.name || userProfile.email;

  // لو الدور غير مسموح له بالدخول
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    document.querySelectorAll('body > *:not(script)').forEach(el => {
      el.style.filter = 'blur(10px)';
      el.style.pointerEvents = 'none';
    });
    showProtectedModal(
      `This area requires admin privileges.<br>Your current role: <strong>${userProfile.role}</strong>`
    );
  }
}
