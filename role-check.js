// role-check.js - نظام التحقق من الصلاحيات المشترك
class RoleChecker {
    constructor(supabase) {
        this.supabase = supabase;
        this.currentUser = null;
        this.userRole = null;
    }

    // التحقق من صلاحية المستخدم
    async checkUserRole() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return null;

            const { data: profile, error } = await this.supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
                return null;
            }

            this.currentUser = user;
            this.userRole = profile?.role || 'agent';
            return this.userRole;
        } catch (error) {
            console.error('Error in checkUserRole:', error);
            return null;
        }
    }

    // التحقق من صلاحية المدير أو المسؤول
    hasAdminAccess() {
        return this.userRole === 'admin' || this.userRole === 'manager';
    }

    // التحقق من صلاحية الوكيل
    hasAgentAccess() {
        return this.userRole === 'agent' || this.hasAdminAccess();
    }

    // التحقق من صلاحية محددة
    hasRole(role) {
        return this.userRole === role;
    }

    // إنشاء نافذة تقييد الوصول
    createAccessDeniedModal(message = "You don't have permission to view this page. This section is available for Admins and Managers only.") {
        const modal = document.createElement('div');
        modal.id = 'accessDeniedModal';
        modal.style.cssText = `
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
            backdrop-filter: blur(8px);
        `;

        modal.innerHTML = `
            <div class="access-denied-content" style="
                background: linear-gradient(145deg, #2b2b3d, #242436);
                padding: 3rem;
                border-radius: 20px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 1px solid #444444;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                color: #f0f0f0;
                position: relative;
                overflow: hidden;
            ">
                <div style="margin-bottom: 2rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1.5rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.8rem; font-weight: 700; color: #ff6b6b;">Access Restricted</h3>
                    <p style="margin: 0; line-height: 1.6; color: #a0a0b0; font-size: 1.1rem;">${message}</p>
                </div>
                <button id="returnToDashboardBtn" class="action-button primary-button" style="
                    background: linear-gradient(135deg, #4e8cff, #3d7eff);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 1rem 2rem;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    Back to Dashboard
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // إضافة تأثيرات تفاعلية للأزرار
        const returnBtn = document.getElementById('returnToDashboardBtn');
        returnBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(78, 140, 255, 0.4)';
        });
        returnBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        returnBtn.addEventListener('click', function() {
            window.location.href = 'core-flow.html';
        });

        return modal;
    }

    // إخفاء نافذة تقييد الوصول
    hideAccessDeniedModal() {
        const modal = document.getElementById('accessDeniedModal');
        if (modal) {
            modal.remove();
        }
    }
}

// إنشاء نسخة عامة للاستخدام في جميع الصفحات
window.RoleChecker = RoleChecker;
