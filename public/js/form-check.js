function topicParticle(word) {
  const last = [...word].reverse().find((char) => char >= "가" && char <= "힣");
  if (!last) return "은(는)";
  return (last.charCodeAt(0) - 0xac00) % 28 ? "은" : "는";
}

function validateForm(form) {
  const fields = [...form.querySelectorAll("input, select, textarea")];
  let firstInvalid = null;

  for (const field of fields) {
    const error = document.getElementById(`${field.id}-error`);
    const missing = field.required && !field.value.trim() && !field.validity.badInput;
    const invalid = missing || !field.validity.valid;

    error.textContent = invalid ? `${field.name}${topicParticle(field.name)} ${field.dataset.rule} 입력하세요.` : "";

    if (invalid) {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", error.id);
      firstInvalid ??= field;
    } else {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    }
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  return true;
}
