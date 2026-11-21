function validGrade(grade) {
  return typeof grade === "string" && /^(초[1-6]|중[1-3]|고[1-3])$/.test(grade);
}

function validText(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function validOptionalText(value, maxLength) {
  return value === undefined || (typeof value === "string" && value.length <= maxLength);
}

function validInteger(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function validCoordinate(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function validShape(shape) {
  if (!shape || typeof shape !== "object" || Array.isArray(shape)) return false;
  if (shape.kind === "polygon") {
    return Array.isArray(shape.points) && shape.points.length >= 3 && shape.points.length <= 12 &&
      shape.points.every((point) => Array.isArray(point) && point.length === 2 && point.every(validCoordinate));
  }
  if (shape.kind === "circle") {
    return [shape.cx, shape.cy].every(validCoordinate) && validCoordinate(shape.r) && shape.r > 0 &&
      shape.cx - shape.r >= 0 && shape.cx + shape.r <= 100 &&
      shape.cy - shape.r >= 0 && shape.cy + shape.r <= 100;
  }
  if (shape.kind === "line") {
    return [shape.x1, shape.y1, shape.x2, shape.y2].every(validCoordinate) &&
      (shape.x1 !== shape.x2 || shape.y1 !== shape.y2);
  }
  return false;
}

function validFigure(figure) {
  return !!figure && typeof figure === "object" && !Array.isArray(figure) &&
    Array.isArray(figure.shapes) && figure.shapes.length >= 1 && figure.shapes.length <= 10 &&
    figure.shapes.every(validShape);
}

function validFigures(question) {
  if (question.figures === undefined) {
    // 그림이 없는데 문제나 보기가 그림을 가리키면 교사가 쓸 수 없는 문항이다.
    return ![question.question, ...question.options].some((text) => typeof text === "string" && text.includes("그림"));
  }
  return question.type === "선택형" && Array.isArray(question.figures) &&
    question.figures.length === 4 && question.figures.every(validFigure);
}

function validateQuizInput(input) {
  return !!input && typeof input === "object" && !Array.isArray(input) &&
    validGrade(input.grade) && validText(input.subject, 30) &&
    validText(input.topic, 200) && validOptionalText(input.material, 2000) &&
    ["선택형", "OX", "단답형"].includes(input.type) &&
    validInteger(input.count, 1, 20) &&
    ["쉬움", "보통", "어려움"].includes(input.difficulty);
}

function validate(input, questions) {
  if (!validateQuizInput(input) || !Array.isArray(questions) || questions.length !== input.count) {
    return false;
  }

  return questions.every((question) => {
    if (!question || typeof question !== "object" || Array.isArray(question) ||
        question.type !== input.type || !validText(question.question, Infinity) ||
        !validText(question.explanation, Infinity) ||
        !Array.isArray(question.options) || question.options.length !== 4 ||
        !validFigures(question)) {
      return false;
    }

    if (question.type === "선택형") {
      if (!question.options.every((option) => validText(option, Infinity))) return false;
      const options = question.options.map((option) => option.trim());
      return new Set(options).size === 4 && validInteger(question.answer, 1, 4);
    }

    if (!question.options.every((option) => option === "")) return false;
    return question.type === "OX"
      ? question.answer === "O" || question.answer === "X"
      : validText(question.answer, Infinity);
  });
}

function validateActivityInput(input) {
  return !!input && typeof input === "object" && !Array.isArray(input) &&
    validGrade(input.grade) && validText(input.subject, 30) &&
    validText(input.goal, 200) && validInteger(input.duration, 5, 50) &&
    validInteger(input.groupSize, 2, 6) && validOptionalText(input.supplies, 200) &&
    (input.format === undefined || ["상관없음", "개인", "짝", "모둠", "전체"].includes(input.format));
}

function validateActivities(input, activities) {
  if (!validateActivityInput(input) || !Array.isArray(activities) || activities.length !== 3) {
    return false;
  }

  const allowedSupplies = input.supplies && input.supplies.trim()
    ? new Set(input.supplies.split(",").map((item) => item.trim()))
    : null;

  return activities.every((activity) => {
    if (!activity || typeof activity !== "object" || Array.isArray(activity) ||
        !validText(activity.name, Infinity) ||
        !["개인", "짝", "모둠", "전체"].includes(activity.format) ||
        (input.format && input.format !== "상관없음" && activity.format !== input.format) ||
        !validInteger(activity.duration, 1, input.duration) ||
        !validText(activity.supplies, Infinity) ||
        !Array.isArray(activity.steps) || activity.steps.length < 3 || activity.steps.length > 6 ||
        !activity.steps.every((step) => validText(step, Infinity)) ||
        !validText(activity.question, Infinity)) {
      return false;
    }

    return !allowedSupplies || activity.supplies.trim() === "없음" ||
      activity.supplies.split(",").every((item) => item.trim() && allowedSupplies.has(item.trim()));
  });
}

module.exports = { validate, validateActivities, validateQuizInput, validateActivityInput, validFigure };
