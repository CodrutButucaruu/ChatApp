export function createWS({ onOpen, onClose, onSystem, onTyping, onMessage }) {
  const protocol = location.protocol === "http:" ? "ws" : "wss";
  const ws = new WebSocket(`${protocol}://${location.host}`);

  ws.addEventListener("open", () => onOpen?.());
  ws.addEventListener("close", () => onClose?.());
  ws.addEventListener("message", (evt) => {
    try {
      const data = JSON.parse(evt.data);
      switch (data.type) {
        case "system":
          onSystem?.(data.text, data.timestamp);
          break;
        case "history":
          const messages = data.messages;
          messages.forEach((message) => {
            onMessage?.(message.user, message.text, message.timestamp);
          });
          break;
        case "typing":
          onTyping?.(data.user, data.isTyping);
          break;
        case "message":
          onMessage?.(data.user, data.text, data.timestamp);
          break;
        default:
          console.warn("Unknown message type:", data);
      }
    } catch (e) {
      console.error("Invalid message:", e);
    }
  });

  function sendMessage(payload) {
    ws.send(JSON.stringify(payload));
  }

  function close() {
    ws.close();
  }

  return { sendMessage, close, raw: ws };
}
