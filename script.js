const $ = (id) => document.getElementById(id);
const read = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
  catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let tasks = read("rozana-tasks", []);
let shopping = read("rozana-shopping", []);
let language = localStorage.getItem("rozana-language") || "ur";

function renderList(type) {
  const isTask = type === "task";
  const data = isTask ? tasks : shopping;
  const list = $(isTask ? "taskList" : "shoppingList");
  list.replaceChildren();
  data.forEach((item, index) => {
    const li = document.createElement("li");
    if (item.done) li.classList.add("done");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = !!item.done;
    check.setAttribute("aria-label", language === "ur" ? "مکمل نشان لگائیں" : "Mark complete");
    check.addEventListener("change", () => {
      item.done = check.checked;
      write(isTask ? "rozana-tasks" : "rozana-shopping", data);
      renderList(type);
    });
    const span = document.createElement("span");
    span.textContent = item.text;
    const del = document.createElement("button");
    del.className = "delete";
    del.type = "button";
    del.textContent = "×";
    del.setAttribute("aria-label", language === "ur" ? "حذف کریں" : "Delete");
    del.addEventListener("click", () => {
      data.splice(index, 1);
      write(isTask ? "rozana-tasks" : "rozana-shopping", data);
      renderList(type);
    });
    li.append(check, span, del);
    list.append(li);
  });
  $(isTask ? "taskCount" : "shoppingCount").textContent = data.filter(x => !x.done).length;
  $(isTask ? "taskEmpty" : "shoppingEmpty").hidden = data.length > 0;
}

$("taskForm").addEventListener("submit", e => {
  e.preventDefault();
  const text = $("taskInput").value.trim();
  if (!text) return;
  tasks.unshift({text, done:false});
  write("rozana-tasks", tasks);
  $("taskInput").value = "";
  renderList("task");
});
$("shoppingForm").addEventListener("submit", e => {
  e.preventDefault();
  const text = $("shoppingInput").value.trim();
  if (!text) return;
  shopping.unshift({text, done:false});
  write("rozana-shopping", shopping);
  $("shoppingInput").value = "";
  renderList("shopping");
});

$("noteInput").value = localStorage.getItem("rozana-note") || "";
$("noteInput").addEventListener("input", () => {
  localStorage.setItem("rozana-note", $("noteInput").value);
  $("noteStatus").textContent = language === "ur" ? "محفوظ ہو گیا" : "Saved";
});
$("clearNote").addEventListener("click", () => {
  $("noteInput").value = "";
  localStorage.removeItem("rozana-note");
  $("noteStatus").textContent = language === "ur" ? "نوٹ صاف کر دیا گیا" : "Note cleared";
});

document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x === btn));
  document.querySelectorAll(".panel").forEach(x => x.classList.toggle("active", x.id === btn.dataset.tab));
}));

function setLanguage(lang) {
  language = lang;
  localStorage.setItem("rozana-language", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  document.body.dir = lang === "ur" ? "rtl" : "ltr";
  document.querySelectorAll("[data-ur][data-en]").forEach(el => el.textContent = el.dataset[lang]);
  document.querySelectorAll("[data-ur-placeholder][data-en-placeholder]").forEach(el => el.placeholder = el.dataset[lang + "Placeholder"]);
  $("languageBtn").textContent = lang === "ur" ? "English" : "اردو";
  $("noteStatus").textContent = lang === "ur" ? "اسی ڈیوائس پر محفوظ" : "Saved on this device";
  renderList("task");
  renderList("shopping");
}
$("languageBtn").addEventListener("click", () => setLanguage(language === "ur" ? "en" : "ur"));

function updateClock() {
  const now = new Date();
  $("todayDate").textContent = new Intl.DateTimeFormat(language === "ur" ? "ur-PK" : "en", {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  }).format(now);
  $("clock").textContent = new Intl.DateTimeFormat("en-GB", {
    hour:"2-digit", minute:"2-digit", second:"2-digit"
  }).format(now);
}
updateClock();
setInterval(updateClock, 1000);

let expression = "";
const display = $("calcDisplay");
function showCalc(value) { display.textContent = value || "0"; }
document.querySelectorAll("[data-key]").forEach(btn => btn.addEventListener("click", () => {
  const key = btn.dataset.key;
  if (key === "clear") { expression = ""; showCalc("0"); return; }
  if (key === "back") { expression = expression.slice(0, -1); showCalc(expression); return; }
  if (key === "=") {
    if (!expression || !/^[0-9+*/.() -]+$/.test(expression)) return;
    try {
      const result = Function('"use strict";return (' + expression + ')')();
      if (!Number.isFinite(result)) throw Error();
      expression = String(Number(result.toFixed(8)));
      showCalc(expression);
    } catch {
      expression = "";
      showCalc(language === "ur" ? "غلط حساب" : "Error");
    }
    return;
  }
  if (expression.length < 30) {
    expression += key;
    showCalc(expression.replaceAll("*", "×").replaceAll("/", "÷"));
  }
}));
setLanguage(language);
