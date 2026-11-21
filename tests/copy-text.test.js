const test = require("node:test");
const assert = require("node:assert/strict");
const { quizToText, activitiesToText } = require("../public/js/copy-text.js");
const quiz = require("../mock/quiz.json");
const activities = require("../mock/activities.json");

test("퀴즈 복사 텍스트에 제목과 문항별 질문·보기·정답·해설이 들어간다", () => {
  const text = quizToText(quiz.questions, quiz.input);
  assert.ok(text.startsWith(`[초3 과학] ${quiz.input.topic} 퀴즈\n\n`));
  quiz.questions.forEach((question, index) => {
    assert.ok(text.includes(`${index + 1}. ${question.question}`));
    question.options.forEach((option, optionIndex) => assert.ok(text.includes(`  ${optionIndex + 1}) ${option}`)));
    assert.ok(text.includes(`정답: ${question.answer}) ${question.options[question.answer - 1]}`));
    assert.ok(text.includes(`해설: ${question.explanation}`));
  });

  const ox = [{ type: "OX", question: "뿌리는 물을 흡수한다.", options: ["", "", "", ""], answer: "O", explanation: "맞습니다." }];
  assert.equal(quizToText(ox, { ...quiz.input, type: "OX" }),
    `[초3 과학] ${quiz.input.topic} 퀴즈\n\n1. 뿌리는 물을 흡수한다.\n정답: O\n해설: 맞습니다.`);
});

test("학습활동 복사 텍스트에 활동 3개의 모든 항목이 들어간다", () => {
  const text = activitiesToText(activities.activities, activities.input);
  assert.ok(text.startsWith("[초3 과학] 학습활동 추천\n\n"));
  activities.activities.forEach((activity, index) => {
    assert.ok(text.includes(`${index + 1}. ${activity.name}`));
    assert.ok(text.includes(`형태: ${activity.format}`));
    assert.ok(text.includes(`소요 시간: ${activity.duration}분`));
    assert.ok(text.includes(`준비물: ${activity.supplies}`));
    activity.steps.forEach((step, stepIndex) => assert.ok(text.includes(`  ${stepIndex + 1}) ${step}`)));
    assert.ok(text.includes(`확인 질문: ${activity.question}`));
  });
});
