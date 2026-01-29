import { messagesEl, statusEl, usernameEl } from "./dom.js";
import { escapeHTML, linkify, formatTime } from "./utils.js";

export function setStatus(text) {
  statusEl.textContent = text;
}

export function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

export function addSystemMessage(text, ts) {
  const el = document.createElement("div");
  el.className = "flex justify-center my-2";
  el.innerHTML = `
    <div class="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
      ${escapeHTML(text)} • ${formatTime(ts)}
    </div>`;
  messagesEl.appendChild(el);
  scrollToBottom();
}

export function addChatMessage(user, text, ts) {
  const me = usernameEl.value.trim() || "Anon";
  const isMe = user === me;
  const row = document.createElement("div");
  row.className = "my-2 flex " + (isMe ? "justify-end" : "justify-start");

  row.innerHTML = `
    <div class="${isMe ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-800"} max-w-[75%] px-4 py-2 rounded-2xl shadow
                    ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}">
      <div class="text-xs ${isMe ? "text-indigo-100" : "text-slate-500"} mb-0.5">${escapeHTML(user)}</div>
      <div class="whitespace-pre-wrap break-words">${linkify(escapeHTML(text))}</div>
      <div class="text-[10px] opacity-70 mt-1">${formatTime(ts)}</div>
    </div>`;
  messagesEl.appendChild(row);
  scrollToBottom();
}

export function createTypingBubble(user) {
  const me = usernameEl.value.trim() || "Anon";
  const isMe = user === me;
  const row = document.createElement("div");
  row.className = "my-2 flex " + (isMe ? "justify-end" : "justify-start");
  row.innerHTML = `
    <div class="${isMe ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-800"} max-w-[75%] px-4 py-2 rounded-2xl shadow
                    ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}">
      <div class="text-xs ${isMe ? "text-indigo-100" : "text-slate-500"} mb-0.5">${escapeHTML(user)}</div>
      <div class="whitespace-pre-wrap break-words opacity-70 italic">typing...</div>
    </div>`;
  return row;
}
