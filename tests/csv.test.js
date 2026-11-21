const test = require("node:test");
const assert = require("node:assert/strict");
const { activitiesToCsv, quizToCsv, formatSteps } = require("../public/js/csv.js");
const { activities } = require("../mock/activities.json");
const quiz = require("../mock/quiz.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\r" && text[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function screenValues(activity, index) {
  return [String(index + 1), activity.name, activity.format, String(activity.duration),
    activity.supplies, formatSteps(activity.steps), activity.question];
}

test("activities.csv는 BOM, 머리글, 활동 3행을 갖는다", () => {
  const csv = activitiesToCsv(activities);
  assert.deepEqual([...Buffer.from(csv, "utf8").subarray(0, 3)], [0xef, 0xbb, 0xbf]);

  const rows = parseCsv(csv.slice(1));
  assert.equal(rows[0].join(","), "번호,활동명,형태,소요 시간(분),준비물,진행 순서,확인 질문");
  assert.equal(rows.length, 4);
  rows.slice(1).forEach((row, index) => assert.deepEqual(row, screenValues(activities[index], index)));
});

test("쉼표·큰따옴표·줄바꿈이 든 값도 다시 읽으면 화면 값과 같다", () => {
  const tricky = {
    name: '"마인드맵" 그리기, 발표',
    format: "모둠",
    duration: 15,
    supplies: "종이, 색연필",
    steps: ["주제를 정한다", '가지를 "그린다"', "발표한다\n질문을 받는다"],
    question: "뿌리, 줄기, 잎의 역할은?",
  };
  const list = [tricky, activities[1], activities[2]];
  const csv = activitiesToCsv(list);
  assert.match(csv, /"""마인드맵"" 그리기, 발표"/);
  assert.equal(formatSteps(tricky.steps), '1) 주제를 정한다 2) 가지를 "그린다" 3) 발표한다\n질문을 받는다');

  const rows = parseCsv(csv.slice(1));
  assert.equal(rows.length, 4);
  rows.slice(1).forEach((row, index) => assert.deepEqual(row, screenValues(list[index], index)));
});

function quizScreenValues(question, index) {
  return [String(index + 1), question.type, question.question, ...question.options.map(String),
    String(question.answer), question.explanation];
}

test("quiz.csv는 BOM, 머리글, 요청한 N행을 갖는다", () => {
  const csv = quizToCsv(quiz.questions);
  assert.deepEqual([...Buffer.from(csv, "utf8").subarray(0, 3)], [0xef, 0xbb, 0xbf]);

  const rows = parseCsv(csv.slice(1));
  assert.equal(rows[0].join(","), "번호,유형,문제,선택지1,선택지2,선택지3,선택지4,정답,해설");
  assert.equal(rows.length, quiz.input.count + 1);
  rows.slice(1).forEach((row, index) => assert.deepEqual(row, quizScreenValues(quiz.questions[index], index)));
});

test("OX·단답형은 선택지 칸을 비우고 특수문자 값도 그대로 다시 읽힌다", () => {
  const questions = [
    { type: "OX", question: '"뿌리"는 물을 흡수한다, 맞나요?', options: ["", "", "", ""], answer: "O", explanation: "뿌리는\n물을 흡수합니다." },
    { type: "단답형", question: "잎에서 양분을 만드는 과정은?", options: ["", "", "", ""], answer: "광합성", explanation: '"광합성"이라고 합니다.' },
  ];
  const rows = parseCsv(quizToCsv(questions).slice(1));
  assert.equal(rows.length, 3);
  rows.slice(1).forEach((row, index) => {
    assert.deepEqual(row.slice(3, 7), ["", "", "", ""]);
    assert.deepEqual(row, quizScreenValues(questions[index], index));
  });
});
