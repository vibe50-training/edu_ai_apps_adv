const ACTIVITY_CSV_HEADER = ["번호", "활동명", "형태", "소요 시간(분)", "준비물", "진행 순서", "확인 질문"];
const QUIZ_CSV_HEADER = ["번호", "유형", "문제", "선택지1", "선택지2", "선택지3", "선택지4", "정답", "해설"];

function csvCell(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(header, rows) {
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

function quizToCsv(questions) {
  return toCsv(QUIZ_CSV_HEADER, questions.map((question, index) => [
    index + 1,
    question.type,
    question.question,
    ...(question.type === "선택형" ? question.options : ["", "", "", ""]),
    question.answer,
    question.explanation,
  ]));
}

function formatSteps(steps) {
  return steps.map((step, index) => `${index + 1}) ${step}`).join(" ");
}

function activitiesToCsv(activities) {
  return toCsv(ACTIVITY_CSV_HEADER, activities.map((activity, index) => [
    index + 1,
    activity.name,
    activity.format,
    activity.duration,
    activity.supplies,
    formatSteps(activity.steps),
    activity.question,
  ]));
}

function downloadCsv(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

if (typeof module !== "undefined") {
  module.exports = { ACTIVITY_CSV_HEADER, QUIZ_CSV_HEADER, activitiesToCsv, quizToCsv, formatSteps };
}
