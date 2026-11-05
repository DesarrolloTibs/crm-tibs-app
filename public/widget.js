/**
 * CRM TIBS - Standalone Public WebChat Widget
 * Embeddable script for tenant websites
 * Usage:
 * <script src="https://crm.tibs/widget.js" data-tenant-key="YOUR-TENANT-KEY" defer></script>
 */
(function () {
  'use strict';

  // Evitar inicializaciones duplicadas
  if (window.__CRM_TIBS_WEBCHAT_LOADED__) return;
  window.__CRM_TIBS_WEBCHAT_LOADED__ = true;

  // Localizar el script que fue incrustado para leer sus atributos data-*
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
          return scripts[i];
        }
      }
      return scripts[scripts.length - 1];
    })();

  var tenantKey = currentScript ? currentScript.getAttribute('data-tenant-key') : null;
  var apiUrl = currentScript ? currentScript.getAttribute('data-api-url') : null;

  if (!apiUrl) {
    // Si el script se carga desde la app, inferir origen
    if (currentScript && currentScript.src) {
      try {
        var parsedUrl = new URL(currentScript.src);
        apiUrl = parsedUrl.origin;
      } catch (e) {
        apiUrl = window.location.origin;
      }
    } else {
      apiUrl = window.location.origin;
    }
  }

  // Quitar slash final si existe
  apiUrl = apiUrl.replace(/\/+$/, '');

  if (!tenantKey) {
    console.warn('[CRM TIBS WebChat] Falta el atributo data-tenant-key en el script.');
    return;
  }

  // Generador / recuperador de UUID de visitante persistente en localStorage
  var STORAGE_KEY_VISITOR = 'tibs_webchat_visitor_id';
  var STORAGE_KEY_NICKNAME = 'tibs_webchat_nickname';

  function getOrCreateVisitorId() {
    var stored = localStorage.getItem(STORAGE_KEY_VISITOR);
    if (stored) return stored;
    var newId = 'vis_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_VISITOR, newId);
    } catch (e) {}
    return newId;
  }

  var visitorId = getOrCreateVisitorId();
  var visitorNickname = localStorage.getItem(STORAGE_KEY_NICKNAME) || 'Visitante Web';
  var isOpen = false;
  var pollInterval = null;
  var lastMessagesCount = 0;

  // Estilos inyectados
  var styles = `
    #tibs-webchat-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #tibs-webchat-btn {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      color: white;
      border: none;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      outline: none;
    }
    #tibs-webchat-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 14px 28px -4px rgba(79, 70, 229, 0.5);
    }
    #tibs-webchat-btn:active {
      transform: scale(0.95);
    }
    #tibs-webchat-btn svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    #tibs-webchat-box {
      display: none;
      position: absolute;
      bottom: 74px;
      right: 0;
      width: 375px;
      max-width: calc(100vw - 32px);
      height: 540px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      flex-direction: column;
      animation: tibs-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes tibs-fade-in {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #tibs-webchat-header {
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      color: white;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    #tibs-webchat-header .tibs-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #tibs-webchat-header .tibs-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      box-shadow: 0 0 8px #10b981;
    }
    #tibs-webchat-header button {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    #tibs-webchat-header button:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    #tibs-webchat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f8fafc;
    }
    .tibs-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.45;
      word-break: break-word;
      animation: tibs-msg-in 0.2s ease-out;
    }
    @keyframes tibs-msg-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .tibs-msg-visitor {
      align-self: flex-end;
      background: #4f46e5;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .tibs-msg-agent {
      align-self: flex-start;
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .tibs-msg-agent .tibs-msg-author {
      font-size: 10px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    #tibs-webchat-inputbar {
      padding: 12px 14px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #tibs-webchat-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 9px 12px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    #tibs-webchat-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }
    #tibs-webchat-sendbtn {
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 12px;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    }
    #tibs-webchat-sendbtn:hover {
      background: #4338ca;
    }
    #tibs-webchat-sendbtn:active {
      transform: scale(0.92);
    }
    #tibs-webchat-sendbtn svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
    }
    .tibs-badge-new {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
    }
  `;

  var styleEl = document.createElement('style');
  styleEl.type = 'text/css';
  styleEl.appendChild(document.createTextNode(styles));
  document.head.appendChild(styleEl);

  // Crear contenedor
  var container = document.createElement('div');
  container.id = 'tibs-webchat-container';
  container.innerHTML = `
    <div id="tibs-webchat-box">
      <div id="tibs-webchat-header">
        <div class="tibs-title">
          <span class="tibs-status-dot"></span>
          <span>Atención en Línea</span>
        </div>
        <button id="tibs-webchat-close" title="Cerrar chat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div id="tibs-webchat-messages">
        <div class="tibs-msg tibs-msg-agent">
          <div class="tibs-msg-author">Asistente</div>
          ¡Hola! Bienvenido. ¿En qué podemos ayudarte el día de hoy?
        </div>
      </div>
      <form id="tibs-webchat-inputbar">
        <input type="text" id="tibs-webchat-input" placeholder="Escribe tu mensaje aquí..." autocomplete="off" />
        <button type="submit" id="tibs-webchat-sendbtn" title="Enviar">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
    <button id="tibs-webchat-btn" title="Chatear con nosotros">
      <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
    </button>
  `;
  document.body.appendChild(container);

  var btn = document.getElementById('tibs-webchat-btn');
  var box = document.getElementById('tibs-webchat-box');
  var closeBtn = document.getElementById('tibs-webchat-close');
  var form = document.getElementById('tibs-webchat-inputbar');
  var input = document.getElementById('tibs-webchat-input');
  var messagesContainer = document.getElementById('tibs-webchat-messages');

  function toggleChat() {
    isOpen = !isOpen;
    box.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) {
      input.focus();
      fetchMessages();
      startPolling();
    } else {
      stopPolling();
    }
  }

  btn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  function appendMessage(text, isVisitor, author) {
    var msgEl = document.createElement('div');
    msgEl.className = 'tibs-msg ' + (isVisitor ? 'tibs-msg-visitor' : 'tibs-msg-agent');
    if (!isVisitor && author) {
      var authorEl = document.createElement('div');
      authorEl.className = 'tibs-msg-author';
      authorEl.textContent = author;
      msgEl.appendChild(authorEl);
    }
    var textNode = document.createTextNode(text);
    msgEl.appendChild(textNode);
    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Enviar mensaje
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    appendMessage(text, true);

    fetch(apiUrl + '/api/webchat/public/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-key': tenantKey,
      },
      body: JSON.stringify({
        tenantKey: tenantKey,
        visitorId: visitorId,
        nickname: visitorNickname,
        text: text,
      }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        // Mensaje recibido y encolado/procesado
      })
      .catch(function (err) {
        console.warn('[CRM TIBS WebChat] Error al enviar mensaje:', err);
      });
  });

  // Consultar historial
  function fetchMessages() {
    fetch(apiUrl + '/api/webchat/public/messages/' + encodeURIComponent(visitorId) + '?tenantKey=' + encodeURIComponent(tenantKey))
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (messages) {
        if (!Array.isArray(messages)) return;
        if (messages.length !== lastMessagesCount) {
          lastMessagesCount = messages.length;
          // Reconstruir o sincronizar feed
          messagesContainer.innerHTML = '';
          appendMessage('¡Hola! Bienvenido. ¿En qué podemos ayudarte el día de hoy?', false, 'Asistente');
          messages.forEach(function (m) {
            var isVis = m.sender === 'contact';
            var author = m.sender === 'bot' ? 'Agente IA' : (m.senderUser ? m.senderUser.username : 'Asesor');
            appendMessage(m.content, isVis, author);
          });
        }
      })
      .catch(function (err) {
        // Silenciar fallos de red en sondeo
      });
  }

  function startPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(fetchMessages, 3500);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // Inicializar canal y validar tenantKey
  fetch(apiUrl + '/api/webchat/public/init?tenantKey=' + encodeURIComponent(tenantKey))
    .then(function (res) {
      if (!res.ok) throw new Error('Canal inactivo');
      return res.json();
    })
    .then(function () {
      // Canal verificado con éxito
    })
    .catch(function (err) {
      console.warn('[CRM TIBS WebChat] Widget inicializado pero el canal no respondió:', err.message);
    });
})();
