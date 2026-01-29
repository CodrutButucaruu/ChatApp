import { composer, usernameEl, inputEl } from "./dom.js";
import { setStatus, addSystemMessage, addChatMessage } from "./ui.js";
import { handleTypingEvent, replaceTypingWithMessage } from "./typing.js";
import { createWS } from "./ws.js";

const ws = createWS({
  onOpen: () => setStatus("Connected 💚"),
  onClose: () => setStatus("Disconnected 💔"),
  onSystem: (text, ts) => addSystemMessage(text, ts),
  onTyping: (user, isTyping) => handleTypingEvent(user, isTyping),
  onMessage: (user, text, ts) => {
    const handled = replaceTypingWithMessage(user, text, ts);
    if (!handled) {
      addChatMessage(user, text, ts);
    }
    setStatus("Connected 💚");
  },
});

composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = usernameEl.value.trim() || "Anon";
  const text = inputEl.value.trim();
  if (!text) return;

  ws.sendMessage({ type: "message", user, text });

  inputEl.value = "";
  signalTyping(false);
});

let typingTimeout = null;
inputEl.addEventListener("input", () => {
  signalTyping(true);
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => signalTyping(false), 300);
});

function signalTyping(isTyping) {
  const user = usernameEl.value.trim() || "Anon";
  ws.sendMessage({ type: "typing", user, isTyping });
}
