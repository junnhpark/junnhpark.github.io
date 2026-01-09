/* eslint-disable no-alert */
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    img: (params.get("img") || "").trim(),
    caption: (params.get("caption") || params.get("title") || "").trim(),
    back: (params.get("back") || "").trim(),
    bg: (params.get("bg") || "").trim(),
  };
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveToAllowedImgUrl(value) {
  // Support relative paths like ./assets/sample.svg when hosted (http/https),
  // and also allow file:// for easy local preview without a server.
  try {
    const u = new URL(value, window.location.href);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:")
      return u.toString();
  } catch {
    // ignore
  }
  return null;
}

function isNotionHost(hostname) {
  const h = hostname.toLowerCase();
  return h === "notion.so" || h.endsWith(".notion.so") || h.endsWith(".notion.site");
}

function sanitizeBackdrop(bg) {
  const v = (bg || "").trim();
  if (!v) return "";

  // Allow only safe-ish color formats (no url(), no var(), etc.)
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v);
  const isRgb =
    /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(v) ||
    /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i.test(v);
  return isHex || isRgb ? v : "";
}

function pickBackUrl(backParam) {
  // 1) explicit back= (allow only Notion URLs to avoid open redirect abuse)
  if (backParam && isHttpUrl(backParam)) {
    const u = new URL(backParam);
    if (isNotionHost(u.hostname)) return u.toString();
  }

  // 2) referrer (if from Notion)
  if (document.referrer && isHttpUrl(document.referrer)) {
    const u = new URL(document.referrer);
    if (isNotionHost(u.hostname)) return u.toString();
  }

  return null;
}

function renderHelp(appEl) {
  const card = document.createElement("section");
  card.className = "card";

  const h1 = document.createElement("h1");
  h1.textContent = "이미지 팝업 링크 사용법";

  const p1 = document.createElement("p");
  p1.textContent =
    "Notion에서 특정 텍스트에 링크를 걸 때, 아래 형태로 연결하면 이 페이지가 즉시 이미지 모달을 띄웁니다.";

  const p2 = document.createElement("p");
  const code = document.createElement("code");
  code.textContent = `${location.origin}${location.pathname}?img=./assets/sample.svg&caption=Sample%20Creative`;
  p2.appendChild(code);

  const row = document.createElement("div");
  row.className = "row";

  const btn = document.createElement("a");
  btn.className = "btn";
  btn.href = "./builder.html";
  btn.textContent = "링크 생성기 열기";

  row.appendChild(btn);

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent =
    "파라미터: img(필수: http/https 또는 상대경로), caption(선택), back(선택: notion.so/notion.site만 허용)";

  card.appendChild(h1);
  card.appendChild(p1);
  card.appendChild(p2);
  card.appendChild(row);
  card.appendChild(hint);
  appEl.appendChild(card);
}

function renderModal({ imgUrl, caption, bg }) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Image preview");
  if (bg) modal.style.background = bg;

  const panel = document.createElement("div");
  panel.className = "modal__panel";

  const topbar = document.createElement("div");
  topbar.className = "modal__topbar";

  const cap = document.createElement("div");
  cap.className = "modal__caption";
  cap.textContent = caption || "클릭하면 닫힙니다 (ESC 가능)";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal__close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";

  topbar.appendChild(cap);
  topbar.appendChild(closeBtn);

  const img = document.createElement("img");
  img.className = "modal__img";
  img.alt = caption || "Image";
  img.decoding = "async";
  img.loading = "eager";
  img.referrerPolicy = "no-referrer";
  img.src = imgUrl;

  panel.appendChild(topbar);
  panel.appendChild(img);
  modal.appendChild(panel);

  return { modal, closeBtn, img, panel };
}

function closeAndReturn(backUrl) {
  // Hide instantly (so it feels like a modal closing)
  const modal = document.querySelector(".modal");
  if (modal) modal.remove();

  // Then navigate back if we can.
  if (backUrl) {
    window.location.href = backUrl;
    return;
  }

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.innerHTML = "";
    const card = document.createElement("section");
    card.className = "card";
    const h1 = document.createElement("h1");
    h1.textContent = "닫았습니다";
    const p = document.createElement("p");
    p.textContent = "이 탭을 닫거나 뒤로가기를 눌러 Notion으로 돌아가세요.";
    card.appendChild(h1);
    card.appendChild(p);
    appEl.appendChild(card);
  }
}

function main() {
  const appEl = document.getElementById("app");
  if (!appEl) return;

  const { img, caption, back, bg } = parseParams();

  const imgUrl = img ? resolveToAllowedImgUrl(img) : null;
  if (!imgUrl) {
    renderHelp(appEl);
    return;
  }

  const backUrl = pickBackUrl(back);
  const safeBg = sanitizeBackdrop(bg);
  const { modal, closeBtn, panel } = renderModal({ imgUrl, caption, bg: safeBg });

  const onClose = () => closeAndReturn(backUrl);

  // Click outside closes
  modal.addEventListener("click", onClose);
  panel.addEventListener("click", (e) => e.stopPropagation());
  closeBtn.addEventListener("click", onClose);

  // ESC closes
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") onClose();
  });

  document.body.appendChild(modal);
  closeBtn.focus({ preventScroll: true });
}

main();
