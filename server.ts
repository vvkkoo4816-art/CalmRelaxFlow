import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, "activity_log.txt");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/records", (req, res) => {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        return res.json([]);
      }
      const content = fs.readFileSync(LOG_FILE, "utf-8");
      const records = content
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line));
      res.json(records);
    } catch (error) {
      console.error("Error reading records:", error);
      res.status(500).json({ error: "Failed to read records" });
    }
  });

  app.post("/api/records", (req, res) => {
    try {
      const record = req.body;
      const line = JSON.stringify(record) + "\n";
      fs.appendFileSync(LOG_FILE, line);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving record:", error);
      res.status(500).json({ error: "Failed to save record" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
