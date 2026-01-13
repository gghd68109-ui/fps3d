import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};

io.on("connection", socket => {
    console.log("Player joined:", socket.id);

    players[socket.id] = {
        x: 0,
        y: 1.6,
        z: 0
    };

    socket.emit("currentPlayers", players);
    socket.broadcast.emit("newPlayer", { id: socket.id, player: players[socket.id] });

    socket.on("move", data => {
        if (players[socket.id]) {
            players[socket.id] = data;
            socket.broadcast.emit("playerMoved", { id: socket.id, player: data });
        }
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("playerDisconnected", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
