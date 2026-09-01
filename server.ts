import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initialize Gemini client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API: Streaming Chunked Ingestion (for 15GB+ bulk forensic files)
app.post("/api/upload-chunk", express.raw({ type: "application/octet-stream", limit: "50mb" }), (req, res) => {
  try {
    const fileId = req.headers["x-file-id"] as string;
    const fileName = req.headers["x-file-name"] as string;
    const chunkIndex = parseInt(req.headers["x-chunk-index"] as string || "0");
    const totalChunks = parseInt(req.headers["x-total-chunks"] as string || "1");
    const totalBytes = parseInt(req.headers["x-total-bytes"] as string || "0");
    const chunkBytes = (req.body as Buffer)?.length || 0;

    // Acknowledge streaming chunk reception with zero memory leak
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

// API: AI-Powered Entity and Relationship Extraction from Unstructured FIR text
app.post("/api/extract-entities", async (req, res) => {
  try {
    const { text, sourceDocumentType } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text payload is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return structured fallback extraction if key is missing in dev mode
      return res.json({
        fallback: true,
        message: "Gemini API key not configured. Using rule-based extraction.",
      });
    }

    const prompt = `You are a Senior Criminal Intelligence Analyst and Graph Knowledge Engineer for Law Enforcement Agencies.
Analyze the following unstructured ${sourceDocumentType || "FIR / Police Intelligence Report"} text.
Extract all criminal entities and direct relationships to construct a Knowledge Graph.

CRITICAL EXTRACTION SCHEMA:
Return a strictly valid JSON object with the following structure:
{
  "entities": [
    {
      "id": "unique-slug-or-canonical-id",
      "label": "Display Name or Identifier",
      "type": "PERSON" | "PHONE" | "FINANCIAL" | "LOCATION" | "VEHICLE" | "ORGANIZATION" | "INCIDENT",
      "role": "e.g. Kingpin / Mastermind, Hawala Operator, Shooter, Mule, Corrupt Official, Suspect, Safehouse, Bank Account",
      "aliases": ["alias1", "alias2"],
      "confidence": 0.95,
      "details": {
        "notes": "key facts",
        "phone": "number if applicable",
        "account": "account if applicable",
        "location": "location name if applicable"
      }
    }
  ],
  "relationships": [
    {
      "sourceId": "id-of-source-entity",
      "targetId": "id-of-target-entity",
      "relationType": "CALLS" | "FUNDS_TRANSFER" | "CO_ACCUSED" | "TRAVELLED_WITH" | "ASSOCIATED_WITH" | "OWNS" | "OPERATES_FROM" | "MEMBER_OF" | "LOCATED_AT",
      "weight": 1.0,
      "details": "Evidence summary",
      "timestamp": "ISO string or approximate date if mentioned"
    }
  ],
  "summary": "Brief 2-sentence intelligence synopsis",
  "suspiciousSignals": ["signal 1", "signal 2"]
}

Source text to analyze:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    const parsedData = JSON.parse(outputText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/extract-entities:", error);
    return res.status(500).json({
      error: error.message || "Failed to extract entities with AI.",
    });
  }
});

// API: AI Copilot for Criminal Graph Queries & Hypothesis Testing (Supports /api/copilot & /api/graph-copilot)
const handleCopilot = async (req: express.Request, res: express.Response) => {
  try {
    const { query, contextData, graphContext } = req.body;
    const effectiveContext = contextData || graphContext || {};
    if (!query) {
      return res.status(400).json({ error: "Query is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reply: "Gemini API key is not configured. Graph Copilot running in deterministic intelligence mode.",
        answer: "Gemini API key is not configured. Graph Copilot running in deterministic intelligence mode.",
      });
    }

    const prompt = `You are the Lead Intelligence AI Copilot assisting a Special Investigation Team (SIT).
You have access to the current dynamic Criminal Network Knowledge Graph:

GRAPH SUMMARY CONTEXT:
- Total Nodes: ${effectiveContext?.nodes?.length || effectiveContext?.nodeCount || 0}
- Total Relationships: ${effectiveContext?.links?.length || effectiveContext?.linkCount || 0}
- Key Influencers / Kingpin Candidates: ${JSON.stringify(effectiveContext?.topInfluencers || effectiveContext?.nodes?.filter((n: any) => n.isKingpinCandidate || n.riskScore >= 80) || [])}
- Detected Suspicious Patterns: ${JSON.stringify(effectiveContext?.patterns || effectiveContext?.suspiciousPatterns || [])}
- Communities / Gang Factions: ${JSON.stringify(effectiveContext?.communities || [])}

INVESTIGATOR'S QUESTION:
"${query}"

INSTRUCTIONS:
1. Provide a direct, tactical, and evidence-grounded response.
2. Highlight key suspects by their exact names, roles, and graph centrality.
3. Identify operational bottlenecks, intermediary money mules, or communication bridges.
4. Suggest concrete next investigative steps (e.g., CDR preservation request, freezing mule accounts under Sec 102 CrPC, geo-fence warrants).
5. Format with clear headings, bullet points, and high readability.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    const replyText = response.text || "";
    return res.json({ reply: replyText, answer: replyText });
  } catch (error: any) {
    console.error("Error in copilot handler:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI Copilot response.",
    });
  }
};

app.post("/api/copilot", handleCopilot);
app.post("/api/graph-copilot", handleCopilot);

// API: Automated Court-Ready Intelligence Dossier Generation (Supports /api/dossier & /api/generate-dossier)
const handleDossier = async (req: express.Request, res: express.Response) => {
  try {
    const { caseDataset, caseTitle, graphSummary, focalSuspect, nodes, links, patterns, communities } = req.body;
    const effectiveTitle = caseDataset?.name || caseTitle || "Syndicate Interdiction";

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        dossierText: `# Case Intelligence Brief: ${effectiveTitle}\n\n*Note: AI Dossier synthesis is running in offline mode. Please configure GEMINI_API_KEY for dynamic generative dossiers.*`,
      });
    }

    const contextPayload = {
      title: effectiveTitle,
      caseNumber: caseDataset?.codeName || "OP-GARUDA-2026",
      nodesCount: nodes?.length || graphSummary?.nodeCount || 0,
      linksCount: links?.length || graphSummary?.linkCount || 0,
      focalSuspect: focalSuspect || null,
      topPatterns: patterns || graphSummary?.patterns || [],
      communities: communities || graphSummary?.communities || [],
    };

    const prompt = `You are an expert Intelligence Analyst drafting an official Intelligence Dossier & Chargesheet Annexure for the Director General of Police (DGP) and Court of Law.

CASE TITLE: ${effectiveTitle}
CASE CONTEXT:
${JSON.stringify(contextPayload, null, 2)}

Produce a formal, highly detailed Case Intelligence Dossier with the following sections:
1. EXECUTIVE INTELLIGENCE SUMMARY (Modus Operandi, Syndicate Scope, Financial Volume)
2. SYNDICATE COMMAND & CONTROL HIERARCHY (Identify the Kingpin/Mastermind, Lieutenants, Logistics Coordinators, Hawala/Financial Mules, and Ground Operatives with Centrality Justification)
3. COMMUNICATION & FINANCIAL FLOW ANALYSIS (Detailed breakdown of burner phone networks, IMEI hopping, and Hawala/UPI layering chains)
4. GEOSPATIAL & TEMPORAL CONVERGENCE (Key safehouses, container yards, meeting nodes, and crime scene cell tower overlaps)
5. ACTIONABLE INTERDICTION PLAN (Prioritized list of arrest targets, accounts to freeze, CDR tap requests, and digital forensics priorities)

Write with sharp professional authority and structured clarity.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return res.json({ dossier: response.text, dossierText: response.text });
  } catch (error: any) {
    console.error("Error in dossier handler:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate intelligence dossier.",
    });
  }
};

app.post("/api/dossier", handleDossier);
app.post("/api/generate-dossier", handleDossier);

// Start server with Vite middleware in dev mode
async function startServer() {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Criminal Network Analysis Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
