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

// API: AI Copilot for Criminal Graph Queries & Hypothesis Testing
app.post("/api/graph-copilot", async (req, res) => {
  try {
    const { query, graphContext } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        answer: "Gemini API key is not configured. Graph Copilot requires GEMINI_API_KEY.",
      });
    }

    const prompt = `You are the Lead Intelligence AI Copilot assisting a Special Investigation Team (SIT).
You have access to the current dynamic Criminal Network Knowledge Graph:

GRAPH SUMMARY CONTEXT:
- Total Nodes: ${graphContext?.nodeCount || 0}
- Total Relationships: ${graphContext?.linkCount || 0}
- Key Influencers / Kingpin Candidates: ${JSON.stringify(graphContext?.topInfluencers || [])}
- Detected Suspicious Patterns: ${JSON.stringify(graphContext?.suspiciousPatterns || [])}
- Communities / Gang Factions: ${JSON.stringify(graphContext?.communities || [])}
- Sample Entities & Links: ${JSON.stringify(graphContext?.sampleEntities || [])}

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

    return res.json({ answer: response.text });
  } catch (error: any) {
    console.error("Error in /api/graph-copilot:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI Copilot response.",
    });
  }
});

// API: Automated Court-Ready Intelligence Dossier Generation
app.post("/api/generate-dossier", async (req, res) => {
  try {
    const { caseTitle, graphSummary, focalSuspect } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        dossierText: `# Case Intelligence Brief: ${caseTitle || "Criminal Syndicate Investigation"}\n\n*Note: AI Dossier synthesis is running in offline mode. Please configure GEMINI_API_KEY for dynamic generative dossiers.*`,
      });
    }

    const prompt = `You are an expert Intelligence Analyst drafting an official Intelligence Dossier & Chargesheet Annexure for the Director General of Police (DGP) and Court of Law.

CASE TITLE: ${caseTitle || "Syndicate Interdiction"}
FOCAL SUSPECT / TARGET: ${focalSuspect ? JSON.stringify(focalSuspect) : "Entire Syndicate"}

CURRENT NETWORK EVIDENCE BASE:
${JSON.stringify(graphSummary, null, 2)}

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

    return res.json({ dossier: response.text });
  } catch (error: any) {
    console.error("Error in /api/generate-dossier:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate intelligence dossier.",
    });
  }
});

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
