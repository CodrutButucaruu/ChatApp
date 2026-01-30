// express pentru fisiere si rute http, http ca server de baza pe care ruleaza express si ws,
// ws comunicare in timp real, un singur server

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const CHAT_FILE = path.join(DATA_DIR, "chat.jsonl");
const HISTORY_LIMIT = 50;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR); // creaza directory ul pe filesystem

function readLastMessages(filepath, limit = 50) {
  if (!fs.existsSync(filepath)) return [];

  const lines = fs.readFileSync(filepath, "utf8").trim().split("\n");
  const last = lines.slice(-limit);

  const messages = [];
  for (const line of last) {
    try {
      messages.push(JSON.parse(line));
    } catch {}
  }
  return messages;
}

function saveMessage(msg) {
  const line = JSON.stringify(msg) + "\n";
  fs.appendFileSync(CHAT_FILE, line, "utf8");
}

const app = express(); // creaza aplicatia express
app.use(express.static("public")); // serveste fisierele statice din folderul public

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data, except = null) {
  wss.clients.forEach((client) => {
    if (client !== except && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client conectat");

  ws.send(
    JSON.stringify({
      type: "system",
      text: "Welcome",
      timestamp: Date.now(),
    }),
  );

  const history = readLastMessages(CHAT_FILE, HISTORY_LIMIT);
  ws.send(
    JSON.stringify({
      type: "history",
      messages: history,
    }),
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "message") {
        const payload = {
          type: "message",
          user: data.user?.slice(0, 32) || "Anon",
          text: String(data.text || "").slice(0, 1000),
          timestamp: Date.now(),
        };

        saveMessage(payload);

        broadcast(JSON.stringify(payload));
      }

      if (data.type === "typing") {
        const payload = {
          type: "typing",
          user: data.user?.slice(0, 32) || "Anon",
          isTyping: !!data.isTyping,
        };
        broadcast(JSON.stringify(payload), ws);
      }
    } catch (e) {
      console.error("Mesaj invalid:", e);
    }
  });

  ws.on("close", () => {
    console.log("Client deconectat");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server pornește pe http://localhost:${PORT}`);
});
