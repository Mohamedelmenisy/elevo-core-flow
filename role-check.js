import { supabase } from './supabaseClient.js';

const notificationSound = new Audio('/elevo-core-flow/sounds/call_sound.mp3');
notificationSound.volume = 0.5;

async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('id', user.id)
      .single();

    return { ...user, ...profile, role: profile?.role || 'agent' };
  } catch {
    return null;
  }
}

function showProtectedModal(message = "Access Restricted") {
  if (document.getElementById('access-restricted-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'access-restricted-modal';
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.92);
    backdrop-filter: blur(10px);
    display: flex; justify-content: center; align-items: center;
    z-index: 9999;
    opacity: 0; transition: opacity 0.4s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: rgba(25,28,40,0.9);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 2.5rem;
      max-width: 420px; width: 90%;
      text-align: center; color: #fff;
      transform: scale(0.9); transition: transform 0.3s ease;
      box-shadow: 0 0 40px rgba(0,0,0,0.6);
    ">
      <h3 style="font-size:1.6rem;margin-bottom:1rem;font-weight:700;">Access Restricted</h3>
      <p style="margin-bottom:1.5rem;color:#cbd5e1;line-height:1.6;">
        ${message}
      </p>
      <button id="modal-close-btn" style="
        background:linear-gradient(135deg,#3b82f6,#60a5fa);
        border:none;color:#fff;font-weight:600;
        padding:0.8rem 2.2rem;border-radius:10px;
        cursor:pointer;font-size:1rem;
      ">Okay</button>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.style.opacity = '1';
    overlay.querySelector('div').style.transform = 'scale(1)';
    notificationSound.play().catch(()=>{});
  }, 100);

  overlay.querySelector('#modal-close-btn').addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  });
}

export async function protectPage(allowedRoles = []) {
  const userProfile = await Promise.race([
    getCurrentUserProfile(),
    new Promise(res => setTimeout(() => res(null), 3000)) // fallback بعد 3 ثواني
  ]);

  if (!userProfile) {
    showProtectedModal("Unable to verify user access. Please login again.");
    return;
  }

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

// ✅ unlock الصوت بعد أول كليك
document.addEventListener("click", () => {
  notificationSound.play().then(() => {
    notificationSound.pause();
    notificationSound.currentTime = 0;
    console.log("🔊 Sound unlocked");
  }).catch(()=>{});
}, { once: true });
