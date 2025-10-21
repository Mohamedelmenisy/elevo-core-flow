import { supabase } from './supabaseClient.js';

// 🎵 إعداد الصوت
const notificationSound = new Audio('/elevo-core-flow/sounds/compensation_alert.mp3');
notificationSound.volume = 0.5;

// 🧍‍♂️ جلب بيانات المستخدم الحالي
async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { ...user, ...profile, role: profile?.role || 'agent' };
  } catch (e) {
    console.error('Error getting user profile:', e.message);
    return null;
  }
}

// 🧱 عرض الرسالة الحديثة
function showProtectedModal(message = "Access Restricted") {
  if (document.getElementById('access-restricted-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'access-restricted-modal';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.4s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: rgba(25,28,40,0.88);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 2.5rem;
      max-width: 420px;
      width: 90%;
      text-align: center;
      color: #fff;
      box-shadow: 0 0 40px rgba(0,0,0,0.6);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    ">
      <div style="
        width:80px;height:80px;margin:0 auto 1.5rem;
        border-radius:50%;
        background:rgba(96,165,250,0.15);
        display:flex;align-items:center;justify-content:center;
        border:1px solid rgba(96,165,250,0.3);
        box-shadow: 0 0 20px rgba(96,165,250,0.25);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 style="font-size:1.6rem;margin-bottom:1rem;font-weight:700;">Access Restricted</h3>
      <p style="margin-bottom:1.5rem;color:#cbd5e1;line-height:1.6;">${message}</p>
      <button id="modal-close-btn" style="
        background:linear-gradient(135deg,#3b82f6,#60a5fa);
        border:none;color:#fff;font-weight:600;
        padding:0.8rem 2.2rem;border-radius:10px;
        cursor:pointer;font-size:1rem;
        box-shadow:0 0 25px rgba(78,140,255,0.25);
        transition:all 0.25s ease;
      ">Okay</button>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.style.opacity = '1';
    overlay.querySelector('div').style.transform = 'scale(1)';
  }, 20);

  const closeBtn = overlay.querySelector('#modal-close-btn');
  closeBtn.addEventListener('click', () => {
    notificationSound.play().catch(() => {});
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  });
}

// 🧩 حماية الصفحة حسب الصلاحية
export async function protectPage(allowedRoles = []) {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) {
    window.location.href = './login.html';
    return;
  }

  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = userProfile.name || userProfile.email;

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

// ✅ إصلاح مشكلة منع الصوت أول مرة
document.addEventListener('click', () => {
  notificationSound.play().then(() => {
    notificationSound.pause();
    notificationSound.currentTime = 0;
  }).catch(() => {});
}, { once: true });
