/**
 * role-check.js - نظام التحقق من الصلاحيات والوظائف المساعدة لمشروع Elevo Core
 *
 * يوفر هذا الملف:
 * 1. دالة مركزية للتحقق من صلاحيات المستخدم (checkAccess).
 * 2. دوال مساعدة لإنشاء وإدارة النوافذ المنبثقة (Modals) والإشعارات (Toasts) بشكل متناسق.
 * 3. يعتمد على وجود متغير `supabase` مُعرف مسبقًا في الصفحة.
 */

window.elevo = {
    /**
     * للتحقق من صلاحية وصول المستخدم بناءً على قائمة من الأدوار المسموح بها.
     * @param {string[]} allowedRoles - مصفوفة تحتوي على الأدوار المسموح لها بالوصول (مثال: ['admin', 'manager']).
     * @returns {Promise<object|null>} - يُرجع بيانات المستخدم في حال النجاح، أو null في حال فشل التحقق.
     */
    async checkAccess(allowedRoles) {
        const mainContent = document.querySelector('#dashboardContent, #portalContent, #appContainerContent, #initial-view');
        const authLoading = document.getElementById('auth-loading');

        if (mainContent) mainContent.style.display = 'none';
        if (authLoading) authLoading.style.display = 'flex';

        try {
            if (typeof supabase === 'undefined') {
                throw new Error('Supabase client is not available.');
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.replace("login.html");
                return null;
            }

            const { data: userData, error } = await supabase
                .from('users')
                .select('id, name, email, role')
                .eq('id', user.id)
                .single();

            if (error || !userData) {
                throw new Error(error ? error.message : 'User data not found.');
            }

            if (allowedRoles.includes(userData.role)) {
                this.updateUserInterface(userData);
                if (authLoading) authLoading.style.display = 'none';
                
                const displayStyle = mainContent && mainContent.classList.contains('initial-card') ? 'grid' : 'block';
                if (mainContent) mainContent.style.display = displayStyle;

                return userData;
            } else {
                throw new Error(`Access Denied: User role '${userData.role}' is not in [${allowedRoles.join(', ')}].`);
            }

        } catch (err) {
            console.error('Access Check Failed:', err.message);
            this.showAccessDenied();
            return null;
        }
    },

    /**
     * يعرض نافذة "الوصول مرفوض".
     */
    showAccessDenied() {
        document.querySelectorAll('#dashboardContent, #portalContent, #appContainerContent, #initial-view, #auth-loading').forEach(el => el.style.display = 'none');
        
        const accessDeniedModal = document.querySelector('#accessDeniedModal, #accessRestrictedModal');
        if (accessDeniedModal) {
            accessDeniedModal.style.display = 'flex';
            accessDeniedModal.style.opacity = '1';
            
            const backButton = accessDeniedModal.querySelector('#returnToAppBtn, #backToDashboardBtn, #returnToDashboardBtn');
            if (backButton) {
                backButton.onclick = () => window.location.href = 'core-flow.html';
            }
        } else {
            document.body.innerHTML = `<div style="text-align: center; padding-top: 50px; color: white;"><h1>Access Denied</h1><p>You do not have permission to view this page.</p></div>`;
        }
    },

    /**
     * يحدّث واجهة المستخدم بمعلومات المستخدم.
     * @param {object} userData - بيانات المستخدم.
     */
    updateUserInterface(userData) {
        document.querySelectorAll('#userName, .user-name-display').forEach(el => {
            if (el) el.textContent = userData.name || userData.email;
        });

        const adminLinks = document.querySelectorAll('a[href="dashboard.html"], a[href="rtm-dashboard.html"]');
        if (userData.role === 'admin' || userData.role === 'manager') {
            adminLinks.forEach(link => link.style.display = 'inline-flex');
        } else {
            adminLinks.forEach(link => link.style.display = 'none');
        }
    },

    /**
     * ينشئ ويعرض نافذة منبثقة (Modal) بتصميم موحد.
     * @param {string} title - عنوان النافذة.
     * @param {string} contentHtml - محتوى HTML للنافذة.
     * @param {object[]} buttons - مصفوفة من الأزرار (مثال: [{ text: 'Save', className: 'primary', onClick: () => {} }]).
     */
    showModal(title, contentHtml, buttons = []) {
        this.removeModal(); // إزالة أي نافذة قديمة أولاً

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.id = 'elevo-modal';
        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7); display: flex;
            justify-content: center; align-items: center; z-index: 1001;
            backdrop-filter: blur(5px); animation: fadeIn 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: #1f2937; border-radius: 12px; padding: 2rem;
            width: 90%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid #374151; animation: slideIn 0.3s ease-out;
            color: var(--text-color);
        `;

        const modalHeader = document.createElement('h3');
        modalHeader.textContent = title;
        modalHeader.style.cssText = `font-size: 1.5rem; margin: 0 0 1.5rem 0; color: var(--primary-color);`;

        const modalBody = document.createElement('div');
        modalBody.innerHTML = contentHtml;

        const modalFooter = document.createElement('div');
        modalFooter.style.cssText = `display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;`;

        buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = `action-button ${btnInfo.className || 'secondary'}-button`;
            button.onclick = (e) => {
                e.preventDefault();
                btnInfo.onClick(e);
            };
            modalFooter.appendChild(button);
        });
        
        // زر الإغلاق كجزء أساسي
        const closeButton = { text: 'Cancel', className: 'secondary', onClick: () => this.removeModal() };
        const cancelButton = document.createElement('button');
        cancelButton.textContent = closeButton.text;
        cancelButton.className = `action-button ${closeButton.className}-button`;
        cancelButton.onclick = closeButton.onClick;
        if (!buttons.some(b => b.text.toLowerCase() === 'cancel')) {
            modalFooter.appendChild(cancelButton);
        }

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // إضافة الأنميشن
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        `;
        document.head.appendChild(style);
    },

    /**
     * يزيل النافذة المنبثقة من الصفحة.
     */
    removeModal() {
        const modal = document.getElementById('elevo-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * يعرض إشعارًا مؤقتًا (Toast).
     * @param {string} message - نص الرسالة.
     * @param {string} type - نوع الإشعار ('success', 'error', 'warning').
     */
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container') || (() => {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 0.75rem;`;
            document.body.appendChild(container);
            return container;
        })();

        const toast = document.createElement('div');
        const colors = { success: 'var(--success-color)', error: 'var(--danger-color)', warning: 'var(--warning-color)' };
        
        toast.style.cssText = `
            padding: 1rem 1.5rem; border-radius: 8px; color: #fff; font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 0.75rem;
            opacity: 0; transform: translateX(100%); animation: slideInToast 0.3s forwards;
            background-color: ${colors[type] || colors.success};
        `;
        toast.innerHTML = `<span>${message}</span>`;
        toastContainer.appendChild(toast);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInToast { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOutToast { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            toast.style.animation = 'slideOutToast 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};
