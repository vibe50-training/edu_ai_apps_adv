const OpenAI = require("openai");
const prompt = require("./_prompt.js");
const {
  validate, validateActivities, validateQuizInput, validateActivityInput,
} = require("./validate.js");

module.exports = async function generate(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  const { type, input } = req.body ?? {};
  const validInput = type === "quiz" ? validateQuizInput
    : type === "activity" ? validateActivityInput : null;
  if (!validInput || !validInput(input)) {
    return res.status(400).json({ error: "요청 유형 또는 입력값이 올바르지 않습니다." });
  }

  const { AI_ENDPOINT, AI_API_KEY, AI_DEPLOYMENT } = process.env;
  if (!AI_ENDPOINT || !AI_API_KEY || !AI_DEPLOYMENT) {
    console.error("AI 연결 환경변수가 설정되지 않았습니다.");
    return res.status(503).json({ error: "AI 연결 설정이 필요합니다." });
  }

  const fields = type === "quiz"
    ? ["grade", "subject", "topic", "material", "type", "count", "difficulty"]
    : ["grade", "subject", "goal", "duration", "format", "groupSize", "supplies"];
  const safeInput = Object.fromEntries(fields.filter((key) => input[key] !== undefined).map((key) => [key, input[key]]));

  let client;
  try {
    client = new OpenAI({ apiKey: AI_API_KEY, baseURL: AI_ENDPOINT, maxRetries: 0 });
  } catch {
    console.error("AI 연결 설정이 올바르지 않습니다.");
    return res.status(503).json({ error: "AI 연결 설정이 올바르지 않습니다." });
  }
  const messages = [
    { role: "system", content: prompt },
    { role: "user", content: `type: ${type}\n${JSON.stringify(safeInput)}` },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await client.chat.completions.create({
        model: AI_DEPLOYMENT,
        messages,
        response_format: { type: "json_object" },
      });
    } catch {
      console.error("AI 요청에 실패했습니다.");
      return res.status(502).json({ error: "AI 요청에 실패했습니다." });
    }

    let output;
    try {
      output = JSON.parse(response.choices[0]?.message?.content);
    } catch {
      output = null;
    }

    const items = type === "quiz" ? output?.questions : output?.activities;
    const valid = type === "quiz" ? validate(safeInput, items) : validateActivities(safeInput, items);
    if (valid) return res.status(200).json({ type, items });
  }

  console.error("AI 응답이 검증을 통과하지 못했습니다.");
  return res.status(422).json({ error: "AI 응답이 검증을 통과하지 못했습니다." });
};
