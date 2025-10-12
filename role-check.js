// role-check.js - نظام التحقق من الصلاحيات
const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUserRole() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', user.id)
            .single();

        if (error || !data) {
            console.error('Error fetching user data:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error checking user role:', error);
        return null;
    }
}

function showAccessDeniedModal() {
  if (document.getElementById('accessDeniedModal')) return;

  const modalHTML = `
    <div id="accessDeniedModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
    ">
        <div style="
            background: #2b2b3d;
            border-radius: 16px;
            padding: 3rem;
            text-align: center;
            max-width: 500px;
            width: 90%;
            border: 1px solid #444444;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        ">
            <div style="font-size: 4rem; margin-bottom: 1.5rem;">⚠️</div>
            <h3 style="color: #f0f0f0; font-size: 1.8rem; margin-bottom: 1rem; font-weight: 700;">Access Restricted</h3>
            <p style="color: #a0a0b0; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
                You don't have permission to view this page. This section is available for <strong style="color: #4e8cff;">Admins</strong> and <strong style="color: #4e8cff;">Managers</strong> only.
            </p>
            <button onclick="window.location.href='core-flow.html'" style="
                background: linear-gradient(135deg, #4e8cff, #3d7eff);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 1rem 2rem;
                font-weight: 600;
                cursor: pointer;
                font-size: 1.1rem;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(78, 140, 255, 0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                🔙 Back to Core Flow
            </button>
        </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}


async function checkAccess(allowedRoles = []) {
  const userData = await checkUserRole();
  if (!userData) return false;

  if (allowedRoles.includes(userData.role)) {
    updateUserInterface(userData);
    return userData;
  } else {
    showAccessDeniedModal();
    return false;
  }
}

function updateUserInterface(userData) {
    console.log('Updating UI with user data:', userData);
    
    // تحديث اسم المستخدم في كل العناصر
    const userNameElements = document.querySelectorAll('#userName, .user-name-display');
    userNameElements.forEach(element => {
        if (element) {
            
            console.log('Updated element:', element, 'with:', userData.name || userData.email);
        }
    });

    // إظهار/إخفاء رابط Dashboard بناءً على الصلاحية
    const dashboardLinks = document.querySelectorAll('#dashboardLink, .nav-link[href="dashboard.html"]');
    dashboardLinks.forEach(link => {
        if (link) {
            if (userData.role === 'admin' || userData.role === 'manager') {
                link.style.display = 'inline-block';
            } else {
                link.style.display = 'none';
            }
        }
    });

    // إظهار user info
    const userInfoDivs = document.querySelectorAll('#userInfo, .user-info');
    userInfoDivs.forEach(div => {
        if (div) {
            div.style.display = 'flex';
        }
    });
}

window.roleCheck = {
  checkUserRole,
  showAccessDeniedModal,
  checkAccess,
  updateUserInterface
};

// ✅ استدعاء التحقق من الصلاحيات حسب الصفحة
// للداشبورد (Admins & Managers فقط)
if (window.location.pathname.includes('dashboard.html')) {
  checkAccess(['admin', 'manager']);
}

window.roleCheck = {
  checkUserRole,
  checkAccess,
  updateUserInterface,
  showAccessDeniedModal
};

// ✅ لتحديد من له صلاحية الوصول للصفحة الحالية
document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname;

  if (currentPage.includes('dashboard')) {
    await roleCheck.checkAccess(['admin', 'manager']);
  } else if (currentPage.includes('core-flow')) {
    await roleCheck.checkAccess(['agent', 'admin', 'manager']);
  }
});
