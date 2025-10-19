import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-latest";
const MAX_PROMPT_CHARS = Number.parseInt(process.env.MAX_PROMPT_CHARS || "4000", 10) || 4000;

const ANALYSIS_FIELDS = [
  "Category",
  "Typology",
  "Style",
  "Climate Adaptability",
  "Terrain",
  "Soil Type",
  "Material Used",
  "Interior Layout",
  "Roof Type",
  "Exterior",
  "Additional Features",
  "Sustainability",
];

let cachedGemini;
let cachedKey;

const getGemini = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (cachedGemini && cachedKey === key) {
    return cachedGemini;
  }
  cachedGemini = new GoogleGenerativeAI(key);
  cachedKey = key;
  return cachedGemini;
};

export async function runAnalyzeAndGenerate(prompt, options = {}) {
  const { analysis, promptAnalysis, designAnalysis, source, warning } = await getAnalysis(prompt, options);

  let imagePayload = null;
  const genAI = getGemini();
  if (genAI && source === "gemini") {
    try {
      imagePayload = await generateImageWithGemini(genAI, prompt, analysis);
    } catch (err) {
      console.warn("image_generation_failed", err);
    }
  }

  if (!imagePayload) {
    const err = new Error("image_generation_unavailable");
    err.status = 503;
    throw err;
  }

  if (imagePayload.base64 && !imagePayload.imageUrl) {
    imagePayload.imageUrl = `data:${imagePayload.mime || "image/png"};base64,${imagePayload.base64}`;
  }

  return {
    analysis,
    promptAnalysis,
    designAnalysis,
    source,
    ...(warning ? { warning } : {}),
    ...imagePayload,
  };
}

export async function getAnalysis(prompt, options = {}) {
  if (typeof prompt !== "string") {
    throw new Error("prompt_required");
  }

  let analysis;
  let source = "heuristic";
  let warning;

  const genAI = getGemini();
  if (genAI) {
    try {
      analysis = await analyzeWithGemini(genAI, prompt, options);
      source = "gemini";
    } catch (err) {
      console.warn("analysis_with_gemini_failed", err);
      analysis = heuristicFallback(prompt);
      warning = err?.message || "Gemini analysis failed; using heuristic fallback.";
    }
  } else {
    analysis = heuristicFallback(prompt);
    warning = "Gemini API key not configured; using heuristic fallback.";
  }

  const designAnalysis = deriveDesignAnalysis(analysis);

  return {
    analysis,
    promptAnalysis: analysis,
    designAnalysis,
    source,
    ...(warning ? { warning } : {}),
  };
}

function trimPrompt(input) {
  return input.length > MAX_PROMPT_CHARS ? `${input.slice(0, MAX_PROMPT_CHARS)}...` : input;
}

async function analyzeWithGemini(genAI, prompt, options) {
  if (!genAI) {
    throw new Error("Gemini client unavailable");
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const instructions = [
    "You are an architectural planning assistant.",
    "Analyze the user brief and map it onto the provided classification keys.",
    "Respond with JSON ONLY using this shape:",
    JSON.stringify({
      analysis: Object.fromEntries(ANALYSIS_FIELDS.map((key) => [key, "value"])),
    }),
  ].join(" ");

  const truncatedPrompt = trimPrompt(prompt);
  const promptText = [
    instructions,
    `User Brief:\n"""${truncatedPrompt}"""`,
    `Selected Options JSON:\n${JSON.stringify(options, null, 2)}`,
  ].join("\n\n");

  const result = await model.generateContent(promptText);
  const response = await result.response;
  const text = response.text();
  const json = extractJson(text);
  const base = Object.fromEntries(ANALYSIS_FIELDS.map((key) => [key, "Unknown"]));

  if (json?.analysis && typeof json.analysis === "object") {
    for (const key of ANALYSIS_FIELDS) {
      if (typeof json.analysis[key] === "string" && json.analysis[key].trim()) {
        base[key] = json.analysis[key].trim();
      }
    }
    return base;
  }

  return heuristicFallback(prompt);
}

async function generateImageWithGemini(genAI, prompt, analysis) {
  if (!genAI) {
    return null;
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_IMAGE_MODEL });
  const description = [
    "Generate a strictly top-down 2D architectural floor plan that follows professional drafting standards.",
    "Render in full color with clear fills and outlines so each room type is visually distinct.",
    "Overlay readable text labels for every room and include key dimensions or scale indicators directly on the plan.",
    "Ensure doors, windows, furniture, fixtures, and circulation paths are placed accurately and architecturally coherent.",
    "Return the rendered plan inline in the response (no external URLs).",
    `Incorporate the following program cues: ${JSON.stringify(analysis, null, 2)}`,
    `User brief: ${trimPrompt(prompt)}`,
    "Output as a single high-resolution PNG image (minimum 1200x800) with transparent background disabled.",
  ].join("\n\n");

  const response = await model.generateContent(description);
  const candidate = response?.response;
  if (!candidate) return null;

  const parts = candidate.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data && part.inlineData?.mimeType) {
      return {
        base64: part.inlineData.data,
        mime: part.inlineData.mimeType,
      };
    }
    if (part.fileData?.fileUri) {
      return {
        imageUrl: part.fileData.fileUri,
        mime: part.fileData.mimeType || "image/png",
      };
    }
  }

  return null;
}

function heuristicFallback(prompt) {
  const lower = prompt.toLowerCase();
  const pick = (pairs, defaultValue) => {
    for (const [needle, value] of pairs) {
      if (lower.includes(needle)) return value;
    }
    return defaultValue;
  };

  return Object.fromEntries([
    ["Category", pick([["residential", "Residential"], ["commercial", "Commercial"], ["industrial", "Industrial"]], "Residential")],
    ["Typology", pick([["duplex", "Residential - Duplex"], ["apartment", "Residential - Apartment"]], "Residential - Apartment")],
    ["Style", pick([["modern", "Modern"], ["traditional", "Traditional"], ["minimal", "Minimalist"]], "Contemporary")],
    ["Climate Adaptability", pick([["hot", "Hot & Dry"], ["tropical", "Tropical"], ["cold", "Cold"]], "Temperate")],
    ["Terrain", pick([["hill", "Hilly"], ["coastal", "Coastal"], ["desert", "Desert"]], "Urban Flatland")],
    ["Soil Type", pick([["clay", "Clay"], ["sand", "Sandy"], ["rock", "Rocky"]], "Mixed Soil")],
    ["Material Used", pick([["concrete", "Reinforced Concrete"], ["timber", "Timber"], ["steel", "Steel"]], "Concrete and Glass")],
    ["Interior Layout", pick([["open plan", "Open Plan"], ["courtyard", "Courtyard"], ["loft", "Loft"]], "Open Plan")],
    ["Roof Type", pick([["flat roof", "Flat Roof"], ["gable", "Gable Roof"], ["vault", "Barrel Vault"]], "Flat Roof")],
    ["Exterior", pick([["brick", "Brick Facade"], ["glass", "Curtain Wall"], ["stone", "Stone Cladding"]], "Stucco Finish")],
    ["Additional Features", pick([["solar", "Solar Panels"], ["green roof", "Green Roof"], ["rainwater", "Rainwater Harvesting"]], "Terrace Garden")],
    ["Sustainability", pick([["net zero", "Net-Zero Ready"], ["leed", "LEED Platinum"], ["passive", "Passive Strategies"]], "Efficient Envelope")],
  ]);
}

function extractJson(text) {
  if (!text) return null;
  const codeBlockMatch = text.match(/```json([\s\S]*?)```/);
  const candidate = codeBlockMatch ? codeBlockMatch[1] : text;
  const braceMatch = candidate.match(/\{[\s\S]*\}/);
  if (!braceMatch) return null;

  try {
    return JSON.parse(braceMatch[0]);
  } catch (err) {
    console.warn("json_parse_failed", err);
    return null;
  }
}

function deriveDesignAnalysis(base = {}) {
  const value = (key, fallback = "Not specified") => {
    const raw = typeof base[key] === "string" ? base[key].trim() : "";
    return raw || fallback;
  };

  const featuresValue = () => {
    const raw = value("Additional Features", "");
    return raw && raw !== "Not specified" ? raw : "Standard amenities";
  };

  return {
    "Program Fit": `Optimized for ${value("Typology", value("Category", "General use"))}.`,
    "Climate Response": `Envelope tuned for ${value("Climate Adaptability", "Temperate conditions")}.`,
    "Material Strategy": `Primary palette: ${value("Material Used", "Mixed materials")}.`,
    "Spatial Layout": `Interior layout emphasizes ${value("Interior Layout", "flexible zoning")}.`,
    "Roof & Exterior": `${value("Roof Type", "Standard roof")} with ${value("Exterior", "neutral facade treatment")}.`,
    "Sustainability Notes": `${value("Sustainability", "Baseline efficiency")} | Features: ${featuresValue()}.`,
  };
}
