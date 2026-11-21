const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const generate = require("../api/generate.js");
const quiz = require("../mock/quiz.json");
const activities = require("../mock/activities.json");

async function request(type, input, method = "POST") {
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await generate({ method, body: { type, input } }, response);
  return response;
}

test("AI 응답을 검증하고 잘못된 응답은 한 번 재요청한다", async () => {
  const requests = [];
  const replies = [];
  const fake = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push(JSON.parse(Buffer.concat(chunks).toString()));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: replies.shift() } }] }));
  });
  await new Promise((resolve) => fake.listen(0, "127.0.0.1", resolve));
  const keys = ["AI_ENDPOINT", "AI_API_KEY", "AI_DEPLOYMENT"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.AI_ENDPOINT = `http://127.0.0.1:${fake.address().port}/v1/`;
  process.env.AI_API_KEY = "test-key";
  process.env.AI_DEPLOYMENT = "test-model";

  try {
    replies.push(JSON.stringify({ questions: quiz.questions }));
    const quizResponse = await request("quiz", quiz.input);
    assert.equal(quizResponse.statusCode, 200);
    assert.deepEqual(quizResponse.body.items, quiz.questions);
    assert.deepEqual(requests[0].messages[0], { role: "system", content: require("../api/_prompt.js") });
    assert.match(requests[0].messages[0].content, /^당신은 교사의 수업 준비를 돕는/);
    assert.match(requests[0].messages[1].content, /^type: quiz\n/);

    replies.push("not json", JSON.stringify({ activities: activities.activities }));
    const activityResponse = await request("activity", activities.input);
    assert.equal(activityResponse.statusCode, 200);
    assert.equal(activityResponse.body.items.length, 3);
    assert.match(requests[1].messages[1].content, /^type: activity\n/);
    assert.equal(requests.length, 3);

    replies.push("{}", "{}");
    const failure = await request("quiz", quiz.input);
    assert.equal(failure.statusCode, 422);
    assert.equal(failure.body.items, undefined);
    assert.equal(requests.length, 5);

    const invalid = await request("quiz", { ...quiz.input, count: 0 });
    assert.equal(invalid.statusCode, 400);
    assert.equal(requests.length, 5);
    assert.equal((await request("other", {})).statusCode, 400);
    assert.equal((await request("quiz", quiz.input, "GET")).statusCode, 405);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    await new Promise((resolve, reject) => fake.close((error) => error ? reject(error) : resolve()));
  }
});
