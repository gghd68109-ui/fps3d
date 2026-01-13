import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// ES module path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static dosyalar (index.html, main.js, three.js vs)
app.use(express.static(__dirname));

// Ana sayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Server başlat
app.listen(PORT, () => {
  console.log("FPS3D server running on port " + PORT);
});
