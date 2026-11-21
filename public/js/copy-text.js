function quizToText(questions, input) {
  const title = `[${input.grade} ${input.subject}] ${input.topic} 퀴즈`;
  const blocks = questions.map((question, index) => {
    const lines = [`${index + 1}. ${question.question}`];
    if (question.type === "선택형") {
      question.options.forEach((option, optionIndex) => lines.push(`  ${optionIndex + 1}) ${option}`));
    }
    const answer = question.type === "선택형"
      ? `${question.answer}) ${question.options[question.answer - 1]}`
      : question.answer;
    lines.push(`정답: ${answer}`, `해설: ${question.explanation}`);
    return lines.join("\n");
  });
  return [title, ...blocks].join("\n\n");
}

function activitiesToText(activities, input) {
  const title = `[${input.grade} ${input.subject}] 학습활동 추천`;
  const blocks = activities.map((activity, index) => [
    `${index + 1}. ${activity.name}`,
    `형태: ${activity.format}`,
    `소요 시간: ${activity.duration}분`,
    `준비물: ${activity.supplies}`,
    "진행 순서:",
    ...activity.steps.map((step, stepIndex) => `  ${stepIndex + 1}) ${step}`),
    `확인 질문: ${activity.question}`,
  ].join("\n"));
  return [title, ...blocks].join("\n\n");
}

if (typeof module !== "undefined") {
  module.exports = { quizToText, activitiesToText };
}
