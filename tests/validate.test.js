const test = require("node:test");
const assert = require("node:assert/strict");

const quizInput = {
  grade: "초3",
  subject: "과학",
  topic: "식물의 한살이",
  material: "",
  type: "선택형",
  count: 1,
  difficulty: "보통",
};

const question = {
  type: "선택형",
  question: "식물의 뿌리는 무엇을 흡수할까요?",
  options: ["물", "빛", "소리", "열"],
  answer: 1,
  explanation: "뿌리는 물을 흡수합니다.",
};

const activityInput = {
  grade: "초3",
  subject: "과학",
  goal: "식물의 부분을 설명한다",
  duration: 20,
  format: "모둠",
  groupSize: 4,
  supplies: "종이, 색연필",
};

const activity = {
  name: "식물 그리기",
  format: "모둠",
  duration: 20,
  supplies: "종이, 색연필",
  steps: ["식물을 살펴본다", "식물을 그린다", "각 부분을 설명한다"],
  question: "뿌리는 어떤 일을 하나요?",
};

test("퀴즈 입력과 생성 문항의 수용 기준을 검증한다", () => {
  const { validate } = require("../api/validate.js");
  assert.equal(validate(quizInput, [question]), true, "유효한 입력과 문항");

  const invalidInputs = [
    { grade: "" },
    { grade: "초7" },
    { subject: " " },
    { subject: "가".repeat(31) },
    { topic: "" },
    { topic: "가".repeat(201) },
    { material: "가".repeat(2001) },
    { type: "서술형" },
    { count: 0 },
    { count: 21 },
    { count: 1.5 },
    { difficulty: "매우 쉬움" },
  ];
  for (const changes of invalidInputs) {
    assert.equal(validate({ ...quizInput, ...changes }, [question]), false, JSON.stringify(changes));
  }

  assert.equal(validate({ ...quizInput, count: 2 }, [question]), false, "요청한 문항 수와 다름");
  const invalidQuestions = [
    { type: "OX" },
    { question: " " },
    { explanation: "" },
    { options: ["물", "빛", "소리"] },
    { options: ["물", " 물 ", "소리", "열"] },
    { answer: 0 },
    { answer: 5 },
  ];
  for (const changes of invalidQuestions) {
    assert.equal(validate(quizInput, [{ ...question, ...changes }]), false, JSON.stringify(changes));
  }

  const oxInput = { ...quizInput, type: "OX" };
  const oxQuestion = { ...question, type: "OX", options: ["", "", "", ""], answer: "O" };
  assert.equal(validate(oxInput, [oxQuestion]), true, "유효한 OX 문항");
  assert.equal(validate(oxInput, [{ ...oxQuestion, answer: "Y" }]), false, "잘못된 OX 정답");
  assert.equal(validate(oxInput, [{ ...oxQuestion, options: ["물", "", "", ""] }]), false, "OX 선택지는 비어야 함");

  const square = { shapes: [{ kind: "polygon", points: [[20, 20], [80, 20], [80, 80], [20, 80]] }] };
  const circle = { shapes: [{ kind: "circle", cx: 50, cy: 50, r: 30 }] };
  const segment = { shapes: [{ kind: "line", x1: 10, y1: 50, x2: 90, y2: 50 }] };
  const figures = [square, circle, segment, square];
  assert.equal(validate(quizInput, [{ ...question, figures }]), true, "보기 도형 4개");
  const invalidFigures = [
    [square, circle, segment],
    [square, circle, segment, { shapes: [] }],
    [square, circle, segment, { shapes: [{ kind: "polygon", points: [[0, 0], [100, 0]] }] }],
    [square, circle, segment, { shapes: [{ kind: "polygon", points: [[0, 0], [101, 0], [50, 50]] }] }],
    [square, circle, segment, { shapes: [{ kind: "circle", cx: 10, cy: 50, r: 20 }] }],
    [square, circle, segment, { shapes: [{ kind: "line", x1: 5, y1: 5, x2: 5, y2: 5 }] }],
    [square, circle, segment, { shapes: [{ kind: "path", d: "M0 0" }] }],
    [square, circle, segment, { shapes: [{ kind: "polygon", points: [["0", 0], [50, 0], [50, 50]] }] }],
  ];
  for (const changes of invalidFigures) {
    assert.equal(validate(quizInput, [{ ...question, figures: changes }]), false, JSON.stringify(changes));
  }
  assert.equal(validate(oxInput, [{ ...oxQuestion, figures }]), false, "OX에는 보기 도형 없음");
  assert.equal(validate(quizInput, [{ ...question, question: "그림을 보고 고르세요." }]), false, "그림이라고 했는데 도형 없음");
  assert.equal(validate(quizInput, [{ ...question, question: "그림을 보고 고르세요.", figures }]), true, "그림이라고 하고 도형 있음");

  const shortInput = { ...quizInput, type: "단답형" };
  const shortQuestion = { ...question, type: "단답형", options: ["", "", "", ""], answer: "뿌리" };
  assert.equal(validate(shortInput, [shortQuestion]), true, "유효한 단답형 문항");
  assert.equal(validate(shortInput, [{ ...shortQuestion, answer: " " }]), false, "빈 단답형 정답");
});

test("학습활동 입력과 추천 결과의 수용 기준을 검증한다", () => {
  const { validateActivities } = require("../api/validate.js");
  const activities = [activity, activity, activity];
  assert.equal(validateActivities(activityInput, activities), true, "유효한 입력과 활동 3개");

  const invalidInputs = [
    { grade: "" },
    { grade: "고4" },
    { subject: " " },
    { subject: "가".repeat(31) },
    { goal: "" },
    { goal: "가".repeat(201) },
    { duration: 0 },
    { duration: 4 },
    { duration: 51 },
    { duration: 1.5 },
    { format: "강의" },
    { groupSize: 1 },
    { groupSize: 7 },
    { groupSize: 2.5 },
    { groupSize: null },
    { supplies: "가".repeat(201) },
  ];
  for (const changes of invalidInputs) {
    assert.equal(validateActivities({ ...activityInput, ...changes }, activities), false, JSON.stringify(changes));
  }

  assert.equal(validateActivities(activityInput, activities.slice(0, 2)), false, "활동이 3개 미만");
  assert.equal(validateActivities(activityInput, [...activities, activity]), false, "활동이 3개 초과");
  const invalidActivities = [
    { name: " " },
    { format: "강의" },
    { format: "개인" },
    { duration: 0 },
    { duration: 21 },
    { duration: 1.5 },
    { supplies: "" },
    { supplies: "종이, 태블릿" },
    { steps: ["도입", "정리"] },
    { steps: ["1", "2", "3", "4", "5", "6", "7"] },
    { question: " " },
  ];
  for (const changes of invalidActivities) {
    assert.equal(validateActivities(activityInput, [{ ...activity, ...changes }, activity, activity]), false, JSON.stringify(changes));
  }

  assert.equal(validateActivities(activityInput, [{ ...activity, supplies: "없음" }, activity, activity]), true, "준비물 없음");
  const shortInput = { ...activityInput, duration: 5 };
  const shortActivity = { ...activity, duration: 5 };
  assert.equal(validateActivities(shortInput, [shortActivity, shortActivity, shortActivity]), true, "활동 시간 5분");
});
