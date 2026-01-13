const express = require("express");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 8080;

/* -------------------- */
/*   PUBLIC KLASÖRÜ     */
/* -------------------- */
app.use(express.static(path.join(__dirname, "public")));

/* Ana sayfa */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* -------------------- */
/*   HTTP SERVER        */
/* -------------------- */
const server = app.listen(PORT, () => {
  console.log("HTTP Server running on port", PORT);
});

/* -------------------- */
/*   WEBSOCKET SERVER   */
/* -------------------- */
const wss = new WebSocket.Server({ server });

let players = {};

wss.on("connection", ws => {
  const id = Math.random().toString(36).substr(2, 9);
  players[id] = { x: 0, y: 0, z: 0 };

  console.log("Player connected:", id);

  ws.on("message", msg => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "move") {
        players[id] = data.pos;
      }
    } catch {}
  });

  ws.on("close", () => {
    delete players[id];
    console.log("Player disconnected:", id);
  });
});

/* Oyuncuları yayınla */
setInterval(() => {
  const data = JSON.stringify({ type: "players", players });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}, 50);


