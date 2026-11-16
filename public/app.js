// ISA Chat — Cliente Frontend interactivo
document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const chatFeed = document.getElementById('chatFeed');
  const messagesContainer = document.getElementById('messagesContainer');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const stopBtn = document.getElementById('stopBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const chatsHistoryList = document.getElementById('chatsHistoryList');
  const sidebar = document.getElementById('sidebar');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  
  // Model selector
  const modelSelectorBtn = document.getElementById('modelSelectorBtn');
  const modelDropdown = document.getElementById('modelDropdown');
  const currentModelLabel = document.getElementById('currentModelLabel');

  // Settings Modal
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const modalModelSelect = document.getElementById('modalModelSelect');
  const deleteAllChatsBtn = document.getElementById('deleteAllChatsBtn');

  // Configurar Marked para renderizado seguro y resaltado de sintaxis
  marked.setOptions({
    highlight: function(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
    breaks: true,
    gfm: true
  });

  const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

  // Comprobar estado del servidor
  async function checkServerConfig() {
    try {
      await fetch(`${API_BASE}/api/config`);
    } catch (e) {
      console.warn('Servidor local no disponible:', e);
    }
  }
  let conversations = JSON.parse(localStorage.getItem('isa_conversations') || '[]');
  let currentChatId = null;
  let currentModel = localStorage.getItem('isa_model') || 'gemini-3.5-flash-lite';
  let activeAbortController = null;
  let isGenerating = false;

  // Inicialización
  init();

  function init() {
    setupEventListeners();
    updateModelUI(currentModel);
    renderChatHistory();

    if (conversations.length > 0) {
      loadChat(conversations[0].id);
    } else {
      startNewChat();
    }
  }

  // Manejo de eventos
  function setupEventListeners() {
    // Input auto-expand y envío con Enter
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 180) + 'px';
      sendBtn.disabled = !messageInput.value.trim() || isGenerating;
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
          handleSendMessage();
        }
      }
    });

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage();
    });

    stopBtn.addEventListener('click', stopGeneration);
    newChatBtn.addEventListener('click', () => startNewChat());
    clearChatBtn.addEventListener('click', clearCurrentChat);

    // Sugerencias iniciales
    document.querySelectorAll('.suggestion-card').forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        if (prompt) {
          messageInput.value = prompt;
          messageInput.dispatchEvent(new Event('input'));
          handleSendMessage();
        }
      });
    });

    // Sidebar collapse & mobile menu
    sidebarCollapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });

    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Model Selector Dropdown
    modelSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modelDropdown.classList.toggle('show');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const modelId = item.getAttribute('data-model');
        setModel(modelId);
        modelDropdown.classList.remove('show');
      });
    });

    document.addEventListener('click', (e) => {
      if (!modelDropdown.contains(e.target) && !modelSelectorBtn.contains(e.target)) {
        modelDropdown.classList.remove('show');
      }
    });

    // Modal de ajustes
    openSettingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);

    saveSettingsBtn.addEventListener('click', () => {
      const model = modalModelSelect.value;
      setModel(model);
      closeSettings();
    });

    deleteAllChatsBtn.addEventListener('click', () => {
      if (confirm('¿Estás segura de que deseas borrar todas las conversaciones?')) {
        conversations = [];
        saveConversations();
        startNewChat();
        closeSettings();
      }
    });
  }

  function setModel(modelId) {
    currentModel = modelId;
    localStorage.setItem('isa_model', modelId);
    updateModelUI(modelId);
  }

  function updateModelUI(modelId) {
    const labels = {
      'gemini-3.5-flash-lite': 'ISA v3.5',
      'gemini-3.5-flash': 'ISA Turbo',
      'gemini-3.8-flash': 'ISA Plus'
    };
    currentModelLabel.textContent = labels[modelId] || 'ISA v3.5';

    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-model') === modelId);
    });

    if (modalModelSelect) {
      modalModelSelect.value = modelId;
    }
  }

  function openSettings() {
    if (modalModelSelect) modalModelSelect.value = currentModel;
    settingsModal.classList.remove('hidden');
  }

  function closeSettings() {
    settingsModal.classList.add('hidden');
  }

  // Iniciar nuevo chat
  function startNewChat() {
    if (isGenerating) stopGeneration();
    currentChatId = 'chat_' + Date.now();
    renderMessages([]);
    renderChatHistory();
    messageInput.focus();
  }

  // Limpiar conversación actual
  function clearCurrentChat() {
    if (!currentChatId) return;
    const chatIndex = conversations.findIndex(c => c.id === currentChatId);
    if (chatIndex !== -1) {
      conversations[chatIndex].messages = [];
      saveConversations();
      renderMessages([]);
      renderChatHistory();
    }
  }

  // Cargar chat existente
  function loadChat(id) {
    if (isGenerating) stopGeneration();
    currentChatId = id;
    const chat = conversations.find(c => c.id === id);
    if (chat) {
      renderMessages(chat.messages);
    } else {
      renderMessages([]);
    }
    renderChatHistory();
  }

  // Borrar un chat
  function deleteChat(id, e) {
    e.stopPropagation();
    conversations = conversations.filter(c => c.id !== id);
    saveConversations();
    if (currentChatId === id) {
      if (conversations.length > 0) {
        loadChat(conversations[0].id);
      } else {
        startNewChat();
      }
    } else {
      renderChatHistory();
    }
  }

  function saveConversations() {
    localStorage.setItem('isa_conversations', JSON.stringify(conversations));
  }

  // Renderizar historial en la barra lateral
  function renderChatHistory() {
    chatsHistoryList.innerHTML = '';
    conversations.forEach(chat => {
      const item = document.createElement('div');
      item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
      item.innerHTML = `
        <span class="history-item-title">${escapeHtml(chat.title || 'Nueva conversación')}</span>
        <button class="history-delete-btn" title="Eliminar chat"><i class="ph-bold ph-trash"></i></button>
      `;

      item.addEventListener('click', () => loadChat(chat.id));
      item.querySelector('.history-delete-btn').addEventListener('click', (e) => deleteChat(chat.id, e));
      chatsHistoryList.appendChild(item);
    });
  }

  // Renderizar todos los mensajes
  function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    if (!messages || messages.length === 0) {
      welcomeScreen.classList.remove('hidden');
      return;
    }

    welcomeScreen.classList.add('hidden');
    messages.forEach(msg => appendMessageElement(msg.role, msg.content));
    scrollToBottom();
  }

  // Agregar elemento visual de mensaje
  function appendMessageElement(role, content) {
    welcomeScreen.classList.add('hidden');
    const isUser = role === 'user';
    const row = document.createElement('div');
    row.className = `message-row ${isUser ? 'user' : 'assistant'}`;

    if (isUser) {
      row.innerHTML = `
        <div class="message-content-wrapper">
          <div class="message-bubble">${escapeHtml(content)}</div>
        </div>
        <div class="avatar-container user"><i class="ph-bold ph-user"></i></div>
      `;
    } else {
      const parsedHtml = formatMarkdown(content);
      row.innerHTML = `
        <div class="avatar-container isa"><i class="ph-fill ph-sparkle"></i></div>
        <div class="message-content-wrapper">
          <div class="message-bubble markdown-body">${parsedHtml}</div>
          <div class="message-actions">
            <button class="msg-action-btn copy-msg-btn" title="Copiar respuesta">
              <i class="ph-bold ph-copy"></i>
            </button>
          </div>
        </div>
      `;

      row.querySelector('.copy-msg-btn')?.addEventListener('click', function() {
        navigator.clipboard.writeText(content);
        const icon = this.querySelector('i');
        icon.className = 'ph-bold ph-check';
        setTimeout(() => { icon.className = 'ph-bold ph-copy'; }, 2000);
      });

      setupCodeCopyButtons(row);
    }

    messagesContainer.appendChild(row);
    scrollToBottom();
    return row;
  }

  // Formato markdown con Marked y decorador de bloques de código
  function formatMarkdown(markdownText) {
    if (!markdownText) return '';
    const rawHtml = marked.parse(markdownText);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHtml;

    tempDiv.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      const langClass = code ? Array.from(code.classList).find(c => c.startsWith('language-')) : '';
      const lang = langClass ? langClass.replace('language-', '') : 'código';

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      wrapper.innerHTML = `
        <div class="code-header">
          <span>${lang}</span>
          <button class="code-copy-btn">
            <i class="ph-bold ph-copy"></i>
            <span>Copiar</span>
          </button>
        </div>
      `;
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    });

    return tempDiv.innerHTML;
  }

  function setupCodeCopyButtons(container) {
    container.querySelectorAll('.code-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pre = btn.closest('.code-block-wrapper').querySelector('pre');
        if (pre) {
          navigator.clipboard.writeText(pre.innerText);
          btn.innerHTML = `<i class="ph-bold ph-check"></i><span>¡Copiado!</span>`;
          setTimeout(() => {
            btn.innerHTML = `<i class="ph-bold ph-copy"></i><span>Copiar</span>`;
          }, 2000);
        }
      });
    });
  }

  // Enviar mensaje al backend y procesar streaming
  async function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text || isGenerating) return;

    // Obtener o crear conversación
    let chat = conversations.find(c => c.id === currentChatId);
    if (!chat) {
      chat = {
        id: currentChatId || ('chat_' + Date.now()),
        title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
        createdAt: new Date().toISOString(),
        messages: []
      };
      currentChatId = chat.id;
      conversations.unshift(chat);
    } else if (chat.messages.length === 0) {
      chat.title = text.slice(0, 32) + (text.length > 32 ? '...' : '');
    }

    // Agregar mensaje del usuario
    chat.messages.push({ role: 'user', content: text });
    appendMessageElement('user', text);
    saveConversations();
    renderChatHistory();

    // Limpiar input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Iniciar respuesta asistente con streaming
    isGenerating = true;
    sendBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');

    // Crear burbuja temporal de ISA
    welcomeScreen.classList.add('hidden');
    const assistantRow = document.createElement('div');
    assistantRow.className = 'message-row assistant';
    assistantRow.innerHTML = `
      <div class="avatar-container isa"><i class="ph-fill ph-sparkle"></i></div>
      <div class="message-content-wrapper">
        <div class="message-bubble markdown-body">
          <span class="typing-cursor"></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(assistantRow);
    scrollToBottom();

    const bubble = assistantRow.querySelector('.message-bubble');
    let fullResponse = '';

    activeAbortController = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: activeAbortController.signal,
        body: JSON.stringify({
          messages: chat.messages,
          model: currentModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error en el servidor al comunicarse con ISA.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.chunk) {
              fullResponse += data.chunk;
              bubble.innerHTML = formatMarkdown(fullResponse) + '<span class="typing-cursor"></span>';
              setupCodeCopyButtons(assistantRow);
              scrollToBottom();
            }
          } catch (pe) {
            if (pe.message && !pe.message.includes('JSON')) {
              throw pe;
            }
          }
        }
      }

      // Finalizar respuesta
      bubble.innerHTML = formatMarkdown(fullResponse);
      setupCodeCopyButtons(assistantRow);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      actionsDiv.innerHTML = `
        <button class="msg-action-btn copy-msg-btn" title="Copiar respuesta">
          <i class="ph-bold ph-copy"></i>
        </button>
      `;
      actionsDiv.querySelector('.copy-msg-btn').addEventListener('click', function() {
        navigator.clipboard.writeText(fullResponse);
        const icon = this.querySelector('i');
        icon.className = 'ph-bold ph-check';
        setTimeout(() => { icon.className = 'ph-bold ph-copy'; }, 2000);
      });
      assistantRow.querySelector('.message-content-wrapper').appendChild(actionsDiv);

      chat.messages.push({ role: 'assistant', content: fullResponse });
      saveConversations();

    } catch (err) {
      if (err.name === 'AbortError') {
        bubble.innerHTML = formatMarkdown(fullResponse + '\n\n*(Generación detenida)*');
        if (fullResponse.trim()) {
          chat.messages.push({ role: 'assistant', content: fullResponse + '\n\n*(Generación detenida)*' });
          saveConversations();
        }
      } else {
        const errorMsg = (err.message && err.message.includes('fetch'))
          ? 'No se pudo conectar con el servidor. Recuerda iniciar <code>node server.js</code> en la terminal de abajo.'
          : escapeHtml(err.message);
        bubble.innerHTML = `<div style="color: #ef4444; font-size: 14px; line-height: 1.5;"><strong>⚠️ Nota:</strong> ${errorMsg}</div>`;
      }
    } finally {
      finishGeneration();
    }
  }

  function stopGeneration() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    finishGeneration();
  }

  function finishGeneration() {
    isGenerating = false;
    sendBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    sendBtn.disabled = !messageInput.value.trim();
    messageInput.focus();
    scrollToBottom();
  }

  function scrollToBottom() {
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
