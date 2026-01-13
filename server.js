import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = {};

io.on("connection", socket => {
    players[socket.id] = { x: 0, y: 1, z: 0 };

    socket.emit("players", players);

    socket.on("move", data => {
        players[socket.id] = data;
        socket.broadcast.emit("player", { id: socket.id, data });
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("remove", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Running on", PORT);
});

