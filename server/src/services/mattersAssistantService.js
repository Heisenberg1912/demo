import { GoogleGenerativeAI } from "@google/generative-ai";

const CHAT_MODEL =
  process.env.MATTERS_CHAT_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
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

const CIVIL_KEYWORDS = [
  "foundation",
  "structural",
  "beam",
  "column",
  "load",
  "soil",
  "geotech",
  "retaining",
  "rebar",
  "concrete",
  "steel",
  "footing",
  "pile",
  "grade",
  "slope",
  "earthwork",
  "drainage",
  "mep",
];

const ARCHITECTURE_KEYWORDS = [
  "facade",
  "facade",
  "plan",
  "layout",
  "interior",
  "elevation",
  "lighting",
  "material palette",
  "concept",
  "zoning",
  "massing",
  "program",
  "aesthetic",
  "design language",
  "circulation",
];

const clampHistory = (messages = []) => {
  const copy = [...messages];
  return copy.slice(-8);
};

const detectDiscipline = (prompt = "") => {
  const lower = prompt.toLowerCase();
  const contains = (keywords) => keywords.some((needle) => lower.includes(needle));
  if (contains(CIVIL_KEYWORDS)) {
    return "civil engineer";
  }
  if (contains(ARCHITECTURE_KEYWORDS)) {
    return "architect";
  }
  return "architect";
};

const buildInstruction = (persona, mode) => {
  const discipline = persona === "civil engineer" ? "civil and structural engineering" : "architecture";
  return [
    `You are a senior ${persona} at Builtattic responding inside the Matters control room.`,
    `Provide concise, technically accurate answers grounded in professional ${discipline} practice.`,
    "If the user question implies structural load paths, reinforcement, soil or infrastructure topics, respond as a civil engineer.",
    "If the user focuses on planning, aesthetics, spatial layout, or building envelope, respond as an architect.",
    "Use plain language with optional bullet points. Include rough calculations or code references when the user asks for them.",
    "If the user asks for something outside architecture or civil engineering, gently explain you only provide guidance in those areas.",
    mode ? `Active mode context: ${mode}. Factor this into your recommendations when relevant.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

export const chatWithAssistant = async ({ messages = [], mode }) => {
  const genAI = getGemini();
  if (!genAI) {
    const err = new Error("Gemini API key not configured for assistant.");
    err.status = 503;
    throw err;
  }

  const history = clampHistory(
    Array.isArray(messages)
      ? messages.filter((entry) => entry && typeof entry.content === "string" && entry.content.trim())
      : [],
  );

  const lastUserMessage = [...history].reverse().find((entry) => entry.role === "user");
  const persona = detectDiscipline(lastUserMessage?.content || "");
  const instruction = buildInstruction(persona, mode);

  const transcript = history
    .map((entry) => `${entry.role === "assistant" ? "Assistant" : "User"}: ${entry.content.trim()}`)
    .join("\n");

  const prompt = [instruction, "Conversation so far:", transcript || "User: Hello", "Assistant:"].filter(Boolean).join("\n\n");

  let text = "";
  try {
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    text =
      response?.text?.() ||
      response?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") ||
      "";
  } catch (error) {
    const wrapped = new Error(`Gemini assistant request failed: ${error.message || error}`);
    wrapped.status = 502;
    wrapped.cause = error;
    throw wrapped;
  }

  if (!text.trim()) {
    const err = new Error("Assistant failed to produce a response.");
    err.status = 502;
    throw err;
  }

  return {
    persona,
    reply: text.trim(),
  };
};


