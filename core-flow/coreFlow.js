/* ... (أنماطك الحالية) ... */

body {
    /* ... */
    background-color: #f0f2f5; /* لون خلفية عام لطيف */
}

.app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    /* يمكنك تحديد max-width وتوسيطه إذا أردت */
}

.app-header {
    background-color: #333; /* لون داكن للهيدر كمثال */
    color: white;
    padding: 15px 25px;
    display: flex;
    align-items: center;
}

.company-logo {
    height: 40px; /* اضبط الحجم حسب شعارك */
    margin-left: 20px; /* أو margin-right إذا كان الشعار على اليمين في LTR */
}

.app-header h1 {
    margin: 0;
    font-size: 1.5em;
}

.app-main {
    flex-grow: 1;
    padding: 25px;
    display: flex; /* لتوسيط المحتوى المبدئي */
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

#initial-view, #call-flow-view {
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    text-align: center;
    min-width: 300px; /* أو حسب الحاجة */
}

#receive-call-btn, #next-step-btn {
    /* ... (أنماط أزرارك الحالية أو أنماط جديدة فاخرة) ... */
    padding: 12px 25px;
    font-size: 1em;
}

.app-footer {
    background-color: #222;
    color: #aaa;
    text-align: center;
    padding: 10px;
    font-size: 0.9em;
}
