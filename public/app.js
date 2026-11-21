const form = document.querySelector("[data-preview-form]");

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderFigure(figure, label) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "-4 -4 108 108");
  svg.setAttribute("class", "option-figure");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  for (const shape of figure.shapes) {
    const node = document.createElementNS(ns, shape.kind);
    if (shape.kind === "polygon") {
      node.setAttribute("points", shape.points.map((point) => point.join(",")).join(" "));
    } else {
      const keys = shape.kind === "circle" ? ["cx", "cy", "r"] : ["x1", "y1", "x2", "y2"];
      for (const key of keys) node.setAttribute(key, shape[key]);
    }
    svg.append(node);
  }
  return svg;
}

function renderQuiz(question, index) {
  const card = element("article", undefined, "card sample-card");
  card.append(element("h3", `${index + 1}. ${question.question}`));
  if (question.type === "선택형") {
    const options = element("ol", undefined, question.figures ? "sample-list figure-options" : "sample-list");
    question.options.forEach((option, optionIndex) => {
      const item = element("li");
      if (question.figures) item.append(renderFigure(question.figures[optionIndex], option));
      item.append(element("span", option));
      options.append(item);
    });
    card.append(options);
  }

  const answer = element("details", undefined, "answer");
  const answerText = question.type === "선택형"
    ? `${question.answer}. ${question.options[question.answer - 1]}`
    : question.answer;
  answer.append(
    element("summary", "정답과 해설 보기"),
    element("p", `정답: ${answerText}`),
    element("p", `해설: ${question.explanation}`),
  );
  card.append(answer);
  return card;
}

function renderActivity(activity, index) {
  const card = element("article", undefined, "card sample-card");
  card.append(
    element("h3", `${index + 1}. ${activity.name}`),
    element("p", `형태: ${activity.format}`),
    element("p", `소요 시간: ${activity.duration}분`),
    element("p", `준비물: ${activity.supplies}`),
    element("h4", "진행 순서"),
  );
  const steps = element("ol", undefined, "sample-list");
  for (const step of activity.steps) steps.append(element("li", step));
  card.append(steps, element("p", `확인 질문: ${activity.question}`));
  return card;
}

if (form) {
  const result = document.querySelector("[data-result]");
  const empty = document.querySelector("[data-empty]");
  const status = document.querySelector("[data-status]");
  const retry = document.querySelector("[data-retry]");
  const submit = form.querySelector('button[type="submit"]');
  const fields = [...form.querySelectorAll("input, select, textarea")];
  const kind = form.dataset.kind;
  let lastRequest;

  retry.addEventListener("click", () => {
    if (lastRequest) sendRequest(lastRequest);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(form)) {
      result.hidden = true;
      status.hidden = true;
      retry.hidden = true;
      empty.hidden = false;
      return;
    }

    const list = element("dl", undefined, "preview-list");
    for (const field of fields) {
      const value = field instanceof HTMLSelectElement
        ? field.selectedOptions[0].textContent
        : field.value.trim() ? field.value : "입력하지 않음";
      list.append(element("dt", field.name), element("dd", value));
    }

    const value = (id) => form.querySelector(`#${id}`).value;
    const input = {
      grade: value("grade"),
      subject: value("subject"),
      ...(kind === "quiz"
        ? { topic: value("topic"), material: value("material"), type: value("type"),
          count: Number(value("count")), difficulty: value("difficulty") }
        : { goal: value("goal"), duration: Number(value("duration")), format: value("format"),
          groupSize: Number(value("group-size")), supplies: value("supplies") }),
    };
    lastRequest = { type: kind, input, list };
    sendRequest(lastRequest);
  });

  async function sendRequest(request) {
    submit.disabled = true;
    retry.disabled = true;
    result.hidden = true;
    empty.hidden = true;
    retry.hidden = true;
    status.hidden = false;
    status.textContent = kind === "quiz" ? "생성 중…" : "추천 중…";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: request.type, input: request.input }),
      });
      if (!response.ok) throw new Error(`요청 실패: HTTP ${response.status}`);
      const data = await response.json();
      if (data.type !== kind || !Array.isArray(data.items)) {
        throw new Error("응답 형식이 올바르지 않습니다.");
      }

      const cards = element("div", undefined, "sample-cards");
      for (const [index, item] of data.items.entries()) {
        cards.append(kind === "quiz" ? renderQuiz(item, index) : renderActivity(item, index));
      }
      const items = data.items;
      const download = element("button", "엑셀(CSV) 내려받기", "download-button");
      download.type = "button";
      download.addEventListener("click", () => {
        if (kind === "quiz") downloadCsv("quiz.csv", quizToCsv(items));
        else downloadCsv("activities.csv", activitiesToCsv(items));
      });
      const copy = element("button", "전체 복사", "copy-button");
      copy.type = "button";
      const copied = element("span", "", "copy-message");
      copied.setAttribute("role", "status");
      let copiedTimer;
      copy.addEventListener("click", async () => {
        const text = kind === "quiz"
          ? quizToText(items, request.input)
          : activitiesToText(items, request.input);
        try {
          await navigator.clipboard.writeText(text);
          copied.textContent = "복사됨";
        } catch (error) {
          console.error("복사하지 못했습니다.", error);
          copied.textContent = "복사하지 못했습니다. 다시 눌러 주세요.";
        }
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => { copied.textContent = ""; }, 2000);
      });
      const actions = element("div", undefined, "result-actions");
      actions.append(copy, download, copied);
      result.replaceChildren(cards, actions, element("h3", "입력 내용"), request.list);
      status.hidden = true;
      result.hidden = false;
    } catch (error) {
      console.error("결과를 불러오지 못했습니다.", error);
      status.textContent = kind === "quiz"
        ? "퀴즈를 만들지 못했습니다. 다시 시도해 주세요."
        : "활동을 추천하지 못했습니다. 다시 시도해 주세요.";
      retry.hidden = false;
    } finally {
      submit.disabled = false;
      retry.disabled = false;
    }
  }
}
