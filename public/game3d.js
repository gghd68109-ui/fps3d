import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

const socket = io();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.y = 1.6;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,5);
scene.add(light);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100,100),
    new THREE.MeshStandardMaterial({color: 0x444444})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

const players = {};
let myId = null;

function createPlayer(color) {
    const geo = new THREE.BoxGeometry(1,2,1);
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
}

socket.on("currentPlayers", data => {
    for (let id in data) {
        if (id === socket.id) {
            myId = id;
            players[id] = createPlayer(0x00ff00);
        } else {
            players[id] = createPlayer(0xff0000);
        }
        players[id].position.set(data[id].x, data[id].y, data[id].z);
    }
});

socket.on("newPlayer", data => {
    players[data.id] = createPlayer(0xff0000);
});

socket.on("playerMoved", data => {
    if (players[data.id]) {
        players[data.id].position.set(data.player.x, data.player.y, data.player.z);
    }
});

socket.on("playerDisconnected", id => {
    if (players[id]) {
        scene.remove(players[id]);
        delete players[id];
    }
});

const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

function animate() {
    requestAnimationFrame(animate);

    if (players[myId]) {
        let p = players[myId].position;

        if (keys["w"]) p.z -= 0.1;
        if (keys["s"]) p.z += 0.1;
        if (keys["a"]) p.x -= 0.1;
        if (keys["d"]) p.x += 0.1;

        camera.position.set(p.x, p.y + 1, p.z + 3);
        camera.lookAt(p);

        socket.emit("move", { x: p.x, y: p.y, z: p.z });
    }

    renderer.render(scene, camera);
}
animate();

