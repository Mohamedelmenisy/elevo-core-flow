// role-check.js - نظام التحقق من الصلاحيات للمشروع

// تهيئة Supabase
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// متغيرات عامة
let currentUser = null;
let userRole = null;
let userName = null;

// وظيفة للتحقق من صلاحيات المستخدم
async function checkUserPermissions() {
    try {
        // الحصول على بيانات المستخدم الحالي
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            // إذا لم يكن المستخدم مسجلاً، إعادة التوجيه لصفحة تسجيل الدخول
            redirectToLogin();
            return false;
        }
        
        currentUser = user;
        
        // جلب بيانات المستخدم من قاعدة البيانات
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', user.id)
            .single();
            
        if (error) {
            console.error('Error fetching user data:', error);
            showAccessDeniedModal();
            return false;
        }
        
        if (!data) {
            console.error('User data not found');
            showAccessDeniedModal();
            return false;
        }
        
        userRole = data.role;
        userName = data.name || data.email;
        
        // تحديث واجهة المستخدم بمعلومات المستخدم
        updateUserInterface();
        
        return true;
        
    } catch (error) {
        console.error('Error checking user permissions:', error);
        showAccessDeniedModal();
        return false;
    }
}

// التحقق من صلاحيات المدير
async function checkAdminPermissions() {
    const hasPermissions = await checkUserPermissions();
    
    if (!hasPermissions) {
        return false;
    }
    
    // التحقق من أن المستخدم لديه صلاحية مدير أو مسؤول
    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    } else {
        showAccessDeniedModal();
        return false;
    }
}

// التحقق من صلاحيات الوكيل
async function checkAgentPermissions() {
    const hasPermissions = await checkUserPermissions();
    
    if (!hasPermissions) {
        return false;
    }
    
    // جميع الأدوار مسموح لها بالوصول (وكيل، مدير، مسؤول)
    return true;
}

// إعادة التوجيه لصفحة تسجيل الدخول
function redirectToLogin() {
    window.location.href = 'index.html';
}

// عرض نافذة رفض الوصول
function showAccessDeniedModal() {
    // إنشاء النافذة المنبثقة إذا لم تكن موجودة
    if (!document.getElementById('accessDeniedModal')) {
        const modalHTML = `
            <div id="accessDeniedModal" class="access-denied-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(8px);
            ">
                <div class="access-denied-content" style="
                    background: #2b2b3d;
                    border-radius: 16px;
                    padding: 3rem;
                    text-align: center;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    border: 1px solid #444444;
                    animation: fadeInAnimation 0.5s ease-out;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFC107" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1.5rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    <h3 style="font-size: 1.8rem; margin-bottom: 1rem; color: #f0f0f0;">Access Restricted</h3>
                    <p style="color: #a0a0b0; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
                        This page is for <strong style="color: #4e8cff;">admins</strong> and <strong style="color: #4e8cff;">managers</strong> only.
                    </p>
                    <button id="backToDashboardBtnModal" class="action-button primary-button" style="
                        background: linear-gradient(135deg, #4e8cff, #3d7eff);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        padding: 1rem 2rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease-in-out;
                        margin-top: 1.5rem;
                    ">Back to Dashboard</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // إضافة مستمع الحدث للزر
        document.getElementById('backToDashboardBtnModal').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
        
        // إضافة أنيميشن إذا لم تكن موجودة
        if (!document.querySelector('style#accessDeniedStyles')) {
            const style = document.createElement('style');
            style.id = 'accessDeniedStyles';
            style.textContent = `
                @keyframes fadeInAnimation {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .access-denied-modal {
                    animation: fadeInAnimation 0.5s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // عرض النافذة
    document.getElementById('accessDeniedModal').style.display = 'flex';
}

// تحديث واجهة المستخدم بمعلومات المستخدم
function updateUserInterface() {
    // تحديث اسم المستخدم في الرأس إذا كان العنصر موجوداً
    const userNameElements = document.querySelectorAll('#userName, .user-name-display');
    userNameElements.forEach(element => {
        if (element) {
            element.textContent = userName;
        }
    });
    
    // تحديث رابط Dashboard بناءً على الصلاحية
    const dashboardLinks = document.querySelectorAll('#dashboardLink, .nav-link[href="dashboard.html"]');
    dashboardLinks.forEach(link => {
        if (link) {
            link.style.display = 'inline-block';
        }
    });
    
    // إظهار أو إخفاء عناصر واجهة المستخدم بناءً على الصلاحية
    updateUIBasedOnRole();
}

// تحديث واجهة المستخدم بناءً على الدور
function updateUIBasedOnRole() {
    if (userRole === 'admin' || userRole === 'manager') {
        // إظهار عناصر المديرين والمسؤولين
        const adminElements = document.querySelectorAll('.admin-only, [data-role="admin"], [data-role="manager"]');
        adminElements.forEach(element => {
            element.style.display = 'block';
        });
        
        // إخفاء عناصر الوكيل فقط إذا لزم الأمر
        const agentOnlyElements = document.querySelectorAll('.agent-only, [data-role="agent"]');
        agentOnlyElements.forEach(element => {
            // يمكن إبقاؤها ظاهرة أو إخفاؤها حسب التصميم
        });
    } else {
        // إخفاء عناصر المديرين والمسؤولين للمستخدمين العاديين
        const adminElements = document.querySelectorAll('.admin-only, [data-role="admin"], [data-role="manager"]');
        adminElements.forEach(element => {
            element.style.display = 'none';
        });
        
        // إظهار عناصر الوكيل فقط
        const agentOnlyElements = document.querySelectorAll('.agent-only, [data-role="agent"]');
        agentOnlyElements.forEach(element => {
            element.style.display = 'block';
        });
    }
}

// الحصول على دور المستخدم الحالي
function getUserRole() {
    return userRole;
}

// الحصول على اسم المستخدم الحالي
function getUserName() {
    return userName;
}

// الحصول على بيانات المستخدم الحالي
function getCurrentUser() {
    return currentUser;
}

// التحقق مما إذا كان المستخدم مديراً أو مسؤولاً
function isAdminOrManager() {
    return userRole === 'admin' || userRole === 'manager';
}

// التحقق مما إذا كان المستخدم وكيلاً فقط
function isAgentOnly() {
    return userRole === 'agent';
}

// تهيئة نظام التحقق من الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من الصلاحيات عند تحميل كل صفحة
    checkUserPermissions().then(hasPermissions => {
        if (hasPermissions) {
            console.log('User permissions verified:', userRole);
        } else {
            console.log('User does not have required permissions');
        }
    });
});

// تصدير الوظائف للاستخدام في الملفات الأخرى
window.roleCheck = {
    checkUserPermissions,
    checkAdminPermissions,
    checkAgentPermissions,
    getUserRole,
    getUserName,
    getCurrentUser,
    isAdminOrManager,
    isAgentOnly,
    redirectToLogin,
    showAccessDeniedModal
};
