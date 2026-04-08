(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var agentToken = script.getAttribute('data-agent');
  var origin = script.getAttribute('data-origin') || '';
  var position = script.getAttribute('data-position') || 'right';
  var label = script.getAttribute('data-label') || 'Suporte';
  var primaryColor = script.getAttribute('data-color') || '#7c3aed';

  if (!agentToken) {
    console.warn('[ProjectFlow Widget] data-agent não informado');
    return;
  }

  var chatUrl = origin + '/public/agent/' + agentToken + '?widget=1';

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '#pf-widget-btn {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  ' + position + ': 24px;',
    '  z-index: 99998;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  background: ' + primaryColor + ';',
    '  color: #fff;',
    '  border: none;',
    '  border-radius: 999px;',
    '  padding: 12px 20px 12px 16px;',
    '  font-size: 13px;',
    '  font-weight: 600;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    '  cursor: pointer;',
    '  box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);',
    '  transition: transform 0.15s ease, box-shadow 0.15s ease;',
    '  letter-spacing: -0.01em;',
    '}',
    '#pf-widget-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.5); }',
    '#pf-widget-btn svg { flex-shrink: 0; }',
    '#pf-widget-frame {',
    '  position: fixed;',
    '  bottom: 90px;',
    '  ' + position + ': 24px;',
    '  z-index: 99999;',
    '  width: 400px;',
    '  height: 600px;',
    '  max-width: calc(100vw - 48px);',
    '  max-height: calc(100vh - 120px);',
    '  border-radius: 16px;',
    '  overflow: hidden;',
    '  box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);',
    '  border: 1px solid rgba(255,255,255,0.06);',
    '  transition: opacity 0.2s ease, transform 0.2s ease;',
    '  transform-origin: bottom ' + position + ';',
    '}',
    '#pf-widget-frame.pf-hidden {',
    '  opacity: 0;',
    '  transform: scale(0.95) translateY(8px);',
    '  pointer-events: none;',
    '}',
    '#pf-widget-frame iframe {',
    '  width: 100%; height: 100%; border: none; display: block;',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  // Button
  var btn = document.createElement('button');
  btn.id = 'pf-widget-btn';
  btn.setAttribute('aria-label', label);
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' + label;
  document.body.appendChild(btn);

  // Frame container
  var frameContainer = document.createElement('div');
  frameContainer.id = 'pf-widget-frame';
  frameContainer.classList.add('pf-hidden');

  var iframe = document.createElement('iframe');
  iframe.src = chatUrl;
  iframe.title = label;
  iframe.setAttribute('allow', 'microphone');
  frameContainer.appendChild(iframe);
  document.body.appendChild(frameContainer);

  var open = false;

  btn.addEventListener('click', function () {
    open = !open;
    if (open) {
      frameContainer.classList.remove('pf-hidden');
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Fechar';
    } else {
      frameContainer.classList.add('pf-hidden');
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' + label;
    }
  });
})();
