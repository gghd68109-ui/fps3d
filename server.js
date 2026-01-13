import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

/* PUBLIC KLASÖRÜ */
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const server = app.listen(PORT, () => {
  console.log("FPS Server running on port", PORT);
});

/* --------- WEBSOCKET ---------- */
const wss = new WebSocketServer({ server });
let players = {};

wss.on("connection", ws => {
  const id = Math.random().toString(36).slice(2);
  players[id] = { x: 0, y: 0, z: 0 };

  ws.on("message", msg => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "move") {
        players[id] = data.pos;
      }
    } catch {}
  });

  ws.on("close", () => delete players[id]);
});

setInterval(() => {
  const data = JSON.stringify({ type: "players", players });
  wss.clients.forEach(c => c.readyState === 1 && c.send(data));
}, 50);

