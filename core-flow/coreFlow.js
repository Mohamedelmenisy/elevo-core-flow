  ```javascript
  // core-flow/coreFlow.js

  // تأكد من تضمين Supabase client هنا إذا لم يكن مضافًا بالفعل
  // import { createClient } from '@supabase/supabase-js'; // أو الطريقة التي تستورد بها
  // const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

  document.addEventListener('DOMContentLoaded', async () => {
      // --- 1. CHECK AUTHENTICATION ---
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
          // المستخدم غير مسجل دخوله
          // قم بتوجيهه إلى صفحة تسجيل الدخول في legacy
          // مع تمرير بارامتر يخبر صفحة login أين تعود بعد النجاح
          const currentPath = window.location.pathname + window.location.search + window.location.hash;
          // الهدف هو شيء مثل: ../legacy/login.html?redirectTo=/elevo-core-flow/core-flow/core-flow.html
          // تأكد من تعديل المسار لـ login.html ليكون صحيحًا بالنسبة لـ core-flow.html
          // إذا كان core-flow.html داخل مجلد core-flow/
          // فإن المسار إلى legacy/login.html سيكون ../legacy/login.html
          window.location.href = `../legacy/login.html?redirectTo=${encodeURIComponent(currentPath.replace('/elevo-core-flow', ''))}`;
          return; // أوقف تنفيذ باقي الكود في coreFlow.js
      }

      // إذا وصل الكود إلى هنا، فالمستخدم مسجل دخوله
      console.log('User is authenticated:', session.user);
      // --- 2. INITIALIZE CORE FLOW ---
      // الآن يمكنك بدء تحميل السيناريوهات وعرض واجهة Core Flow
      loadScenarioAndDisplay(); // أو أي اسم للدالة التي تبدأ عملك
  });

  // ... (باقي دوال coreFlow.js مثل loadScenarioAndDisplay, عرض الخطوات, زر Next الخ)

  async function loadScenarioAndDisplay() {
      // مثال:
      const scenarioName = 'order_delay'; // أو يتم تحديده بطريقة أخرى
      try {
          const response = await fetch('../knowledge-base/kb.json'); // تأكد من صحة المسار
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const kb = await response.json();
          const scenario = kb[scenarioName];

          if (scenario && scenario.steps) {
              displaySteps(scenario.steps);
          } else {
              console.error('Scenario not found or has no steps:', scenarioName);
              document.getElementById('steps-container').innerHTML = '<p>Error: Scenario not found.</p>';
          }
      } catch (error) {
          console.error('Failed to load or parse kb.json:', error);
          document.getElementById('steps-container').innerHTML = '<p>Error loading scenario. Please try again.</p>';
      }
  }

  let currentStepIndex = 0;
  let currentSteps = [];

  function displaySteps(steps) {
      currentSteps = steps;
      currentStepIndex = 0;
      showStep(currentStepIndex);

      const nextButton = document.getElementById('next-step');
      if (nextButton) { // تحقق من وجود الزر قبل إضافة event listener
        nextButton.removeEventListener('click', handleNextStep); // إزالة المستمع القديم إن وجد
        nextButton.addEventListener('click', handleNextStep);
      } else {
        console.error("Button with id 'next-step' not found!");
      }
  }
  
  function handleNextStep() {
      currentStepIndex++;
      if (currentStepIndex < currentSteps.length) {
          showStep(currentStepIndex);
      } else {
          document.getElementById('steps-container').innerHTML = '<p>End of scenario.</p>';
          // يمكنك هنا إضافة منطق لإنهاء المكالمة أو بدء التقييم
      }
  }

  function showStep(index) {
      const stepsContainer = document.getElementById('steps-container');
      if (stepsContainer) { // تحقق من وجود العنصر
        stepsContainer.innerHTML = `<p>${currentSteps[index]}</p>`;
      } else {
        console.error("Element with id 'steps-container' not found!");
      }
  }

  // تأكد من أن Supabase client مهيأ قبل استدعاء getSession
  // هذا يجب أن يكون في مكان ما، إما هنا أو في ملف JS مشترك يتم استيراده
  // const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');
  // إذا كنت تستخدم CDN لـ Supabase في ملف HTML، تأكد من أنه يُحمّل قبل coreFlow.js
  // أو أنك تستخدم `supabase` المعرف عالميًا: `supabase.auth.getSession()`
  ```
