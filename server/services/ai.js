const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(model, systemPrompt, history) {
  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    }),
  });

  if (!res.ok) {
    console.error(`Gemini error (${model}):`, res.status, await res.text());
    const err = new Error("AI request failed");
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("AI returned an empty reply");
  return text;
}

async function generateReply(systemPrompt, history) {
  if (process.env.AI_MOCK === "true") {
    const last = history[history.length - 1]?.content || "";
    return `(test reply) You said: "${last.slice(0, 80)}"`;
  }
  const models = [
    process.env.GEMINI_MODEL,
    process.env.GEMINI_FALLBACK_MODEL,
  ].filter(Boolean);

  let lastError;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await callGemini(model, systemPrompt, history);
      } catch (err) {
        lastError = err;
        const temporary =
          err.status === 503 || err.status === 500 || err.name === "TimeoutError";
        if (!temporary) break;
        await sleep(attempt * 1500);
      }
    }
  }

  throw lastError;
}

module.exports = { generateReply };