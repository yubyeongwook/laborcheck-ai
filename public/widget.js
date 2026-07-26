(function() {
  // Prevent double loading
  if (window.LaborCheckWidgetLoaded) return;
  window.LaborCheckWidgetLoaded = true;

  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const serverUrl = (currentScript && currentScript.getAttribute('data-server')) || 'http://43.200.245.223:5000';

  // Inject Styles
  const style = document.createElement('style');
  style.innerHTML = `
    #laborcheck-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: #ffffff;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    #laborcheck-widget-btn:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 12px 28px rgba(37, 99, 235, 0.5);
    }
    #laborcheck-widget-iframe-container {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 420px;
      height: 640px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      z-index: 999998;
      overflow: hidden;
      display: none;
      border: 1px solid #e2e8f0;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    #laborcheck-widget-iframe-container.active {
      display: block;
      animation: laborcheckSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes laborcheckSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  // Create Widget Button
  const btn = document.createElement('div');
  btn.id = 'laborcheck-widget-btn';
  btn.title = '노무·산재 AI 전문 비서';
  btn.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  document.body.appendChild(btn);

  // Create Iframe Container
  const container = document.createElement('div');
  container.id = 'laborcheck-widget-iframe-container';
  container.innerHTML = `<iframe src="${serverUrl}" style="width:100%;height:100%;border:none;"></iframe>`;
  document.body.appendChild(container);

  // Toggle Functionality
  btn.addEventListener('click', function() {
    const isActive = container.classList.contains('active');
    if (isActive) {
      container.classList.remove('active');
    } else {
      container.classList.add('active');
    }
  });
})();
