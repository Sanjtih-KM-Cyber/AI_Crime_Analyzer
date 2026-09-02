import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initDatabase } from "./server/db";
import { initWebSocketServer } from "./server/realtime";
import authRouter from "./server/routes/auth";
import adminRouter from "./server/routes/admin";
import casesRouter from "./server/routes/cases";
import copilotRouter from "./server/routes/copilot";
import investigatorRouter from "./server/routes/investigator";
import { extractEntitiesWithGemini, generateDossierWithGemini } from "./src/services/nlpExtractor";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cases", casesRouter);
app.use("/api/cases", investigatorRouter);
app.use("/api/copilot", copilotRouter);
app.use("/api/cases", copilotRouter); // handles /api/cases/:caseId/query

// API: Streaming Chunked Ingestion (for 15GB+ bulk forensic files)
app.post("/api/upload-chunk", express.raw({ type: "application/octet-stream", limit: "50mb" }), (req, res) => {
  try {
    const fileId = req.headers["x-file-id"] as string;
    const fileName = req.headers["x-file-name"] as string;
    const chunkIndex = parseInt((req.headers["x-chunk-index"] as string) || "0");
    const totalChunks = parseInt((req.headers["x-total-chunks"] as string) || "1");
    const totalBytes = parseInt((req.headers["x-total-bytes"] as string) || "0");
    const chunkBytes = (req.body as Buffer)?.length || 0;

    res.json({
      success: true,
      fileId: fileId || `stream-${Date.now()}`,
      fileName: fileName || "evidence.dat",
      chunkIndex,
      totalChunks,
      receivedBytes: chunkBytes,
      totalBytes,
      status: chunkIndex + 1 === totalChunks ? "COMPLETE" : "STREAMING",
    });
  } catch (err: any) {
    console.error("Error in /api/upload-chunk:", err);
    res.status(500).json({ error: "Failed to process stream chunk" });
  }
});

// API: AI-Powered Entity Extraction
app.post("/api/extract-entities", async (req, res) => {
  try {
    const { text, sourceDocumentType } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text payload is required." });
    }

    const result = await extractEntitiesWithGemini(text, sourceDocumentType || "FIR Report");
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/extract-entities:", error);
    return res.status(500).json({
      error: error.message || "Failed to extract entities.",
    });
  }
});

// API: Automated Court-Ready Intelligence Dossier Generation
app.post(["/api/dossier", "/api/generate-dossier"], async (req, res) => {
  try {
    const { caseDataset, caseTitle, graphSummary, focalSuspect, nodes, links, patterns, communities } = req.body;
    const effectiveCase = caseDataset || {
      name: caseTitle || "Syndicate Interdiction",
      codeName: "OP-GARUDA-2026",
      nodes: nodes || [],
      links: links || [],
      firs: [],
      cdrs: [],
      financials: [],
      intels: [],
    };

    const dossierText = await generateDossierWithGemini(
      effectiveCase,
      effectiveCase.nodes || [],
      effectiveCase.links || [],
      patterns || [],
      communities || []
    );
    return res.json({ dossier: dossierText, dossierText });
  } catch (error: any) {
    console.error("Error in dossier generation:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate intelligence dossier.",
    });
  }
});

// Server Initialization
async function startServer() {
  // Initialize Database
  await initDatabase();

  const server = http.createServer(app);

  // Initialize Real-time WebSocket Server
  initWebSocketServer(server);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[CRIM-INTEL OS] Full-stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
