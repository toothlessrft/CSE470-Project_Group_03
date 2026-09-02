// AI artifact identification: turns an uploaded photo into the same tags the
// artifact search filters on (Type, civilization, era, region, material,
// usage), so a suggestion can be fed straight into the catalogue search.
//
// Provider is Google Gemini over plain HTTPS. It does not guarantee schema
// adherence, so every reply is validated against identificationSchema below
// and retried once before giving up.
const { z } = require("zod");

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-3.5-flash";

// Keep in step with the Type enum on models/Item.js, so the model can only
// answer with values the catalogue can store.
const ITEM_TYPES = [
  "Pottery",
  "Metal_Object",
  "Paintings",
  "Human_Remains",
  "Rock",
  "Jewelry",
  "Bone/Ivory",
  "other",
];

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// ~7 MB of base64 is about 5 MB of image. The uploader caps at 1 MB, so
// anything near this is a bug or someone poking the endpoint directly.
const MAX_BASE64_LENGTH = 7 * 1024 * 1024;

const identificationSchema = z.object({
  identifiable: z.boolean(),
  Type: z.enum(ITEM_TYPES),
  civilization: z.string(),
  era: z.string(),
  region: z.string(),
  material: z.string(),
  usage: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  summary: z.string(),
  alternatives: z.array(
    z.object({
      civilization: z.string(),
      era: z.string(),
      note: z.string(),
    })
  ),
  caution: z.string(),
});

// The same contract expressed as JSON Schema, for the API's response_format.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    identifiable: {
      type: "boolean",
      description: "false when the photo is too unclear, or shows something that is not an artifact",
    },
    Type: { type: "string", enum: ITEM_TYPES },
    civilization: { type: "string", description: "Suggested civilization or culture, or '' if unknown" },
    era: { type: "string", description: "Suggested period or era, or '' if unknown" },
    region: { type: "string", description: "Likely region of origin, or '' if unknown" },
    material: { type: "string", description: "Primary material, or '' if unknown" },
    usage: { type: "string", description: "Likely original use, or '' if unknown" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string", description: "Two or three sentences of concrete visual reasoning" },
    alternatives: {
      type: "array",
      description: "Up to three other plausible attributions; empty when there are none",
      items: {
        type: "object",
        properties: {
          civilization: { type: "string" },
          era: { type: "string" },
          note: { type: "string" },
        },
        required: ["civilization", "era", "note"],
      },
    },
    caution: {
      type: "string",
      description: "What a specialist would need in order to confirm or rule out this attribution",
    },
  },
  required: [
    "identifiable",
    "Type",
    "civilization",
    "era",
    "region",
    "material",
    "usage",
    "confidence",
    "summary",
    "alternatives",
    "caution",
  ],
};

const SYSTEM_PROMPT = `You are assisting ArchiveEarth, a Bangladeshi archaeological heritage management system, with preliminary artifact identification from photographs.

You are looking at a photo an archaeologist, museum manager or member of the public has uploaded. Give your best reading of what it is, based only on what is visible: form, material, surface treatment, decoration, wear, manufacturing marks and any scale reference in the frame.

Rules you must follow:
- This is a preliminary suggestion for a human specialist to check, never a determination. Write in that register.
- Never invent provenance. If the photo cannot tell you where something came from, leave the field as an empty string rather than guessing a plausible-sounding answer.
- Prefer an honest "low" confidence and an empty field over a confident-sounding fabrication. A photograph alone genuinely cannot settle most attributions.
- Set identifiable to false when the image is too blurry or dark to read, shows no artifact, or shows a clearly modern mass-produced object. Say so plainly in the summary.
- Weight the regional context: this catalogue is centred on Bangladesh and the wider Bengal delta, so Pala, Gupta, Mauryan, Sultanate, Mughal and British colonial material is common. Do not force a find into that frame if the evidence points elsewhere.
- Keep the summary to two or three sentences of concrete visual reasoning, not a lecture.
- In caution, name the specific test or examination that would settle it (fabric analysis, thermoluminescence dating, epigraphic reading, stratigraphic context, and so on).
- Reply with JSON matching the requested schema and nothing else.`;

function getApiKey() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) {
    const err = new Error(
      "AI identification is not configured on this server (missing GEMINI_API_KEY)."
    );
    err.status = 503;
    throw err;
  }
  return key;
}

// The uploader sends a data URL. Split it into the mime type and base64 body
// the vision API wants, rejecting unsupported images.
function parseDataUrl(dataUrl) {
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(String(dataUrl || "").trim());
  if (!match) {
    const err = new Error("Please upload a valid image.");
    err.status = 400;
    throw err;
  }

  const mediaType = match[1].toLowerCase();
  const data = match[2];

  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    const err = new Error("Only JPEG, PNG, GIF and WebP images can be identified.");
    err.status = 400;
    throw err;
  }
  if (data.length > MAX_BASE64_LENGTH) {
    const err = new Error("That image is too large. Please upload one under 5 MB.");
    err.status = 400;
    throw err;
  }

  return { mediaType, data };
}

// Pull the reply text out of the REST response.
function extractText(payload) {
  // generateContent nests it under candidates[].content.parts[].text. The
  // .text shortcut only exists in Google's SDKs, so join the parts by hand.
  const fromParts = (payload?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .filter((part) => typeof part.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
  if (fromParts) return fromParts;

  // Envelope shapes change between API versions, so as a last resort walk the
  // payload for the first JSON-looking string in it.
  const seen = new Set();
  const stack = [payload];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    for (const value of Object.values(node)) {
      if (typeof value === "string" && value.trim().startsWith("{")) return value.trim();
      if (value && typeof value === "object") stack.push(value);
    }
  }
  return "";
}

// Models sometimes wrap JSON in a ```json fence despite being asked not to.
function parseJsonLoosely(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to the outermost {...} in the reply.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

async function callGemini({ apiKey, promptText, mediaType, data }) {
  const res = await fetch(`${API_BASE}/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }, { inline_data: { mime_type: mediaType, data } }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Gemini ${res.status}:`, body.slice(0, 400));

    // 403 is an account problem with the key itself; retrying cannot fix it.
    let message = "Could not reach the identification service.";
    if (res.status === 429) {
      message = "The free identification quota has been used up for now. Please try again later.";
    } else if (res.status === 403) {
      message =
        "Google denied this API key access. Create a new key from a personal Google account at aistudio.google.com and update GEMINI_API_KEY.";
    } else if (res.status === 404) {
      message = `The configured model (${MODEL}) is not available to this API key.`;
    }

    const err = new Error(message);
    err.status = [429, 403].includes(res.status) ? res.status : 502;
    throw err;
  }

  return res.json();
}

// Runs the identification. `hint` is the optional note the uploader can add
// ("found near a river bank in Comilla"), passed as context, never as fact.
async function identifyArtifact({ image, hint }) {
  const { mediaType, data } = parseDataUrl(image);
  const apiKey = getApiKey();

  const cleanHint = String(hint || "").trim().slice(0, 500);
  const promptText = cleanHint
    ? `Identify this artifact. The person who uploaded it added this note, which is unverified context, not established fact: "${cleanHint}"`
    : "Identify this artifact.";

  let lastProblem = "";
  // One retry - the model sometimes returns prose or a near-miss shape.
  for (let attempt = 0; attempt < 2; attempt++) {
    const payload = await callGemini({ apiKey, promptText, mediaType, data });
    const text = extractText(payload);
    if (!text) {
      lastProblem = "empty response";
      continue;
    }

    const raw = parseJsonLoosely(text);
    if (!raw) {
      lastProblem = "response was not JSON";
      continue;
    }

    const parsed = identificationSchema.safeParse(raw);
    if (parsed.success) return parsed.data;

    lastProblem = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  }

  console.error("AI identification failed validation:", lastProblem);
  const err = new Error("The identification came back in an unreadable form. Please try again.");
  err.status = 502;
  throw err;
}

module.exports = { identifyArtifact, ITEM_TYPES };
