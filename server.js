// express pentru fisiere si rute http, http ca server de baza pe care ruleaza express si ws, ws comunicare in timp real, un singur server
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express(); // creaza aplicatia express

app.use(express.static("public")); //  serveste fisierele statice din folderul public

const server = http.createServer(app); // creaza server http, paseaza handler ul express
const wss = new WebSocket.Server({ server }); // cereaza serverul websocket, atsat peste serverul http

// functie de trimis mesaj clientilor
function broadcast(data, except = null) {
  wss.clients.forEach((client) => {
    if (client !== except && client.readyState === WebSocket.OPEN) {
      // sare peste expeditor, doar pentru clientii cu conexiune activa
      client.send(data);
    }
  });
}

// cand un client se contecteaza prin websocket
wss.on("connection", (ws) => {
  console.log("Client conectat");

  // trimite un mesaj de bun venit clientului curent
  ws.send(
    JSON.stringify({
      type: "system",
      text: "Welcome",
      timestamp: Date.now(),
    }),
  );

  // cand serverul primeste mesaj de la client
  ws.on("message", (message) => {
    // JSON { type: 'message', user: 'nume', text: '...' }
    try {
      const data = JSON.parse(message); // parse mesaj ca string

      if (data.type === "message") {
        const payload = {
          type: "message",
          user: data.user?.slice(0, 32) || "Anon", // max 32 caractere pe user
          text: String(data.text || "").slice(0, 1000), // max 1000 caractere pe text
          timestamp: Date.now(),
        };
        broadcast(JSON.stringify(payload)); // broadcast catre toti clientii si expeditor
      }

      if (data.type === "typing") {
        // transmite typing indicator
        const payload = {
          type: "typing",
          user: data.user?.slice(0, 32) || "Anon",
          isTyping: !!data.isTyping, // !! -> converteste obiectul la boolean
        };
        broadcast(JSON.stringify(payload), ws); // broadcast catre toti clientii fara expeditor
      }
    } catch (e) {
      console.error("Mesaj invalid:", e);
    }
  });

  // cand clientul inchide conexiunea
  ws.on("close", () => {
    console.log("Client deconectat");
  });
});

const PORT = 3000; // portul pe care asculta serverul

// porneste serverul http si implicit ws
server.listen(PORT, () => {
  console.log(`Server pornește pe http://localhost:${PORT}`);
});
