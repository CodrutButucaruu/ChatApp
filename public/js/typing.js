import { messagesEl } from "./dom.js";
import {
  setStatus,
  createTypingBubble,
  scrollToBottom,
  addChatMessage,
} from "./ui.js";

const typingPlaceholders = new Map();

export function handleTypingEvent(user, isTyping) {
  if (isTyping) {
    setStatus(`${user} typing...`);
    if (!typingPlaceholders.has(user)) {
      const el = createTypingBubble(user);
      messagesEl.appendChild(el);
      typingPlaceholders.set(user, { el });
      scrollToBottom();
    }
  } else {
    setStatus("Connected 💚");
    const ph = typingPlaceholders.get(user);
    if (ph?.el?.parentNode) ph.el.parentNode.removeChild(ph.el);
    typingPlaceholders.delete(user);
  }
}

export function replaceTypingWithMessage(user, text, ts) {
  const ph = typingPlaceholders.get(user);
  if (!ph) {
    return false;
  }
  if (ph.el?.parentNode) ph.el.parentNode.removeChild(ph.el);
  typingPlaceholders.delete(user);
  return false;
}
