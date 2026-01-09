function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el;
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isResolvableToHttpUrl(value) {
  try {
    const u = new URL(value, window.location.href);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:";
  } catch {
    return false;
  }
}

function buildUrl({ img, caption, back }) {
  const u = new URL("./index.html", window.location.href);
  u.searchParams.set("img", img);
  if (caption) u.searchParams.set("caption", caption);
  if (back) u.searchParams.set("back", back);
  return u.toString();
}

function setMsg(text) {
  $("msg").textContent = text || "";
}

function main() {
  const imgEl = $("img");
  const captionEl = $("caption");
  const backEl = $("back");
  const outEl = $("out");
  const openEl = $("open");

  // If user opened this builder from Notion, prefill `back` with referrer.
  try {
    if (!backEl.value.trim() && document.referrer) {
      const u = new URL(document.referrer);
      const h = u.hostname.toLowerCase();
      const isNotion = h === "notion.so" || h.endsWith(".notion.so") || h.endsWith(".notion.site");
      if (isNotion) backEl.value = u.toString();
    }
  } catch {
    // ignore
  }

  function sync() {
    const img = imgEl.value.trim();
    const caption = captionEl.value.trim();
    const back = backEl.value.trim();

    setMsg("");

    if (!img) {
      outEl.value = "";
      openEl.href = "#";
      return;
    }

    if (!isResolvableToHttpUrl(img)) {
      setMsg("이미지 URL은 http/https 이거나 (호스팅 기준) ./assets/... 같은 상대경로여야 합니다.");
      outEl.value = "";
      openEl.href = "#";
      return;
    }

    if (back && !isHttpUrl(back)) {
      setMsg("back URL도 http/https 여야 합니다. (선택)");
      outEl.value = "";
      openEl.href = "#";
      return;
    }

    const url = buildUrl({ img, caption, back });
    outEl.value = url;
    openEl.href = url;
  }

  $("build").addEventListener("click", sync);
  imgEl.addEventListener("input", sync);
  captionEl.addEventListener("input", sync);
  backEl.addEventListener("input", sync);

  $("copy").addEventListener("click", async () => {
    if (!outEl.value) return;
    try {
      await navigator.clipboard.writeText(outEl.value);
      setMsg("복사 완료");
    } catch {
      outEl.select();
      document.execCommand("copy");
      setMsg("복사 완료");
    }
  });

  sync();
}

main();
