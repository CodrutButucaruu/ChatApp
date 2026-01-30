const statusEl = document.getElementById("status");
const messagesEl = document.getElementById("messages");
const composer = document.getElementById("composer");
const usernameEl = document.getElementById("username");
const inputEl = document.getElementById("messageInput");

// Conectare WS
console.log(location.protocol);
const protocol = location.protocol === "http:" ? "ws" : "wss";
const ws = new WebSocket(`${protocol}://${location.host}`);

const typingPlaceholders = new Map();

ws.addEventListener("open", () => {
  statusEl.textContent = "Connected 💚";
});

ws.addEventListener("close", () => {
  statusEl.textContent = "Disconnected 💔";
});

ws.addEventListener("message", (evt) => {
  try {
    const data = JSON.parse(evt.data);
    console.log(data);
    if (data.type === "history") {
      const messages = data.messages;
      messages.forEach((message) => {
        addChatMessage(message.user, message.text, message.timestamp);
        // console.log(message.user, message.text, message.timestamp);
      });
    } else if (data.type === "system") {
      addSystemMessage(data.text, data.timestamp);
    } else if (data.type === "typing") {
      handleTypingEvent(data.user, data.isTyping);
    } else if (data.type === "message") {
      //   console.log(data.user);
      if (typingPlaceholders.has(data.user)) {
        replaceTypingWithMessage(data.user, data.text, data.timestamp);
      } else {
        addChatMessage(data.user, data.text, data.timestamp);
      }
      statusEl.textContent = "Connected 💚";
    }
  } catch (e) {
    console.error("Invalid message:", e);
  }
});

// trimite mesaj
composer.addEventListener("submit", (e) => {
  e.preventDefault(); // ca sa nu se reincarce pagina
  const user = usernameEl.value.trim() || "Anon";
  const text = inputEl.value.trim();
  if (!text) return;

  ws.send(JSON.stringify({ type: "message", user, text }));
  inputEl.value = "";
  signalTyping(false);
});

// indicator typing
let typingTimeout = null;
inputEl.addEventListener("input", () => {
  signalTyping(true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => signalTyping(false), 300);
});

function signalTyping(isTyping) {
  const user = usernameEl.value.trim() || "Anon";
  ws.send(JSON.stringify({ type: "typing", user, isTyping }));
}

function addSystemMessage(text, ts) {
  const el = document.createElement("div");
  el.className = "flex justify-center my-2";
  el.innerHTML = `
        <div class="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
          ${escapeHTML(text)} • ${formatTime(ts)}
        </div>`;
  messagesEl.appendChild(el);
  scrollToBottom();
}

function addChatMessage(user, text, ts) {
  const isMe = user === (usernameEl.value.trim() || "Anon");
  const row = document.createElement("div");
  row.className = "my-2 flex " + (isMe ? "justify-end" : "justify-start");

  row.innerHTML = `
        <div class="${isMe ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-800"} max-w-[75%] px-4 py-2 rounded-2xl shadow
                      ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}">
          <div class="text-xs ${isMe ? "text-indigo-100" : "text-slate-500"} mb-0.5">${escapeHTML(user)}</div>
          <div class="whitespace-pre-wrap break-words">${linkify(escapeHTML(text))}</div>
          <div class="text-[10px] opacity-70 mt-1">${formatTime(ts)}</div>
        </div>
      `;

  messagesEl.appendChild(row);
  scrollToBottom();
}

function handleTypingEvent(user, isTyping) {
  if (isTyping) {
    statusEl.textContent = `${user} typing...`;
    if (!typingPlaceholders.has(user)) {
      const el = createTypingBubble(user);
      messagesEl.appendChild(el);
      typingPlaceholders.set(user, { el }); // set pe obiectul care contine cheia el
      scrollToBottom();
    }
  } else {
    statusEl.textContent = "Connected 💚";
    const ph = typingPlaceholders.get(user);
    if (ph?.el?.parentNode) ph.el.parentNode.removeChild(ph.el); //scenariu: serverul trimite typing=false inainte ca broweserul sa creeze placeholderul
    typingPlaceholders.delete(user);
  }
}

function replaceTypingWithMessage(user, text, ts) {
  const ph = typingPlaceholders.get(user);
  if (!ph) {
    addChatMessage(user, text, ts);
    return;
  }
  typingPlaceholders.delete(user);
  scrollToBottom();
}

function createTypingBubble(user) {
  const isMe = user === (usernameEl.value.trim() || "Anon");
  const row = document.createElement("div");
  row.className = "my-2 flex " + (isMe ? "justify-end" : "justify-start");

  row.innerHTML = `
    <div class="${isMe ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-800"} max-w-[75%] px-4 py-2 rounded-2xl shadow
                    ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}">
      <div class="text-xs ${isMe ? "text-indigo-100" : "text-slate-500"} mb-0.5">${escapeHTML(user)}</div>
      <div class="whitespace-pre-wrap break-words opacity-70 italic">typing...</div>
    </div>
  `;
  return row;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// escape pentru carctere html sensibile
function escapeHTML(str) {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

// pentru url urile dint text, refolosibile
function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(
    urlRegex,
    (url) =>
      `<a class="underline" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  );
}
