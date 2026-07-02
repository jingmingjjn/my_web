const storageKey = "learning-life-records-v1";

const starterRecords = [
  {
    id: makeId(),
    title: "整理本周英语错题",
    date: new Date().toISOString().slice(0, 10),
    type: "学习",
    hours: 1.5,
    mood: "专注",
    content: "把阅读题里反复错的长难句摘出来，发现主要问题是没有先看主干。",
    tags: ["英语", "复盘"]
  },
  {
    id: makeId(),
    title: "散步后想清楚作品集方向",
    date: offsetDate(-2),
    type: "思考",
    hours: 0.5,
    mood: "平静",
    content: "不急着堆功能，先把最想表达的学习路径做清楚。",
    tags: ["作品集", "规划"]
  },
  {
    id: makeId(),
    title: "完成网页布局练习",
    date: offsetDate(-4),
    type: "项目",
    hours: 2,
    mood: "开心",
    content: "练习了响应式布局，手机端终于不挤在一起了。",
    tags: ["前端", "CSS"]
  }
];

const goals = [
  { title: "每周学习 12 小时", caption: "保持节奏比偶尔冲刺更可靠", value: 12 },
  { title: "每月至少读完 1 本书", caption: "记录摘抄和自己的想法", value: 1 },
  { title: "每周完成 1 次复盘", caption: "写下做对、做错和下次怎么改", value: 1 }
];

const els = {
  form: document.querySelector("#entryForm"),
  title: document.querySelector("#titleInput"),
  date: document.querySelector("#dateInput"),
  type: document.querySelector("#typeInput"),
  hours: document.querySelector("#hoursInput"),
  mood: document.querySelector("#moodInput"),
  content: document.querySelector("#contentInput"),
  tags: document.querySelector("#tagsInput"),
  todayLabel: document.querySelector("#todayLabel"),
  totalCount: document.querySelector("#totalCount"),
  studyHours: document.querySelector("#studyHours"),
  streakCount: document.querySelector("#streakCount"),
  weekHours: document.querySelector("#weekHours"),
  weekProgress: document.querySelector("#weekProgress"),
  moodBoard: document.querySelector("#moodBoard"),
  heatmap: document.querySelector("#heatmap"),
  recordList: document.querySelector("#recordList"),
  search: document.querySelector("#searchInput"),
  filter: document.querySelector("#filterInput"),
  goalGrid: document.querySelector("#goalGrid"),
  template: document.querySelector("#recordTemplate"),
  clearForm: document.querySelector("#clearFormBtn"),
  resetDemo: document.querySelector("#resetDemoBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput")
};

let records = loadRecords();

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function loadRecords() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    localStorage.setItem(storageKey, JSON.stringify(starterRecords));
    return starterRecords;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : starterRecords;
  } catch {
    return starterRecords;
  }
}

function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

function init() {
  els.date.value = new Date().toISOString().slice(0, 10);
  els.todayLabel.textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());

  bindEvents();
  render();
}

function bindEvents() {
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const entry = {
      id: makeId(),
      title: els.title.value.trim(),
      date: els.date.value,
      type: els.type.value,
      hours: Number(els.hours.value || 0),
      mood: els.mood.value,
      content: els.content.value.trim(),
      tags: els.tags.value
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    };

    records = [entry, ...records];
    saveRecords();
    els.form.reset();
    els.date.value = new Date().toISOString().slice(0, 10);
    els.hours.value = 1;
    render();
  });

  els.clearForm.addEventListener("click", () => {
    els.form.reset();
    els.date.value = new Date().toISOString().slice(0, 10);
    els.hours.value = 1;
  });

  els.search.addEventListener("input", renderRecords);
  els.filter.addEventListener("change", renderRecords);

  els.recordList.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-btn");
    if (!button) return;
    records = records.filter((record) => record.id !== button.dataset.id);
    saveRecords();
    render();
  });

  els.resetDemo.addEventListener("click", () => {
    records = starterRecords.map((record) => ({ ...record, id: makeId() }));
    saveRecords();
    render();
  });

  els.exportBtn.addEventListener("click", exportRecords);
  els.importInput.addEventListener("change", importRecords);
}

function render() {
  renderStats();
  renderMoodBoard();
  renderHeatmap();
  renderRecords();
  renderGoals();
}

function renderStats() {
  const totalHours = records.reduce((sum, record) => sum + Number(record.hours || 0), 0);
  const weekHours = getCurrentWeekRecords().reduce((sum, record) => sum + Number(record.hours || 0), 0);

  els.totalCount.textContent = records.length;
  els.studyHours.textContent = totalHours.toFixed(totalHours % 1 ? 1 : 0);
  els.streakCount.textContent = getStreak();
  els.weekHours.textContent = `${weekHours.toFixed(weekHours % 1 ? 1 : 0)} / 12h`;
  els.weekProgress.value = Math.min(weekHours, 12);
}

function renderMoodBoard() {
  const moodCounts = records.reduce((result, record) => {
    result[record.mood] = (result[record.mood] || 0) + 1;
    return result;
  }, {});

  const moods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  els.moodBoard.innerHTML = moods.length
    ? moods.map(([mood, count]) => `<div class="mood-chip"><strong>${count}</strong><span>${escapeHtml(mood)}</span></div>`).join("")
    : `<div class="mood-chip"><strong>0</strong><span>还没有心情记录</span></div>`;
}

function renderHeatmap() {
  const byDate = records.reduce((result, record) => {
    result[record.date] = (result[record.date] || 0) + 1;
    return result;
  }, {});

  const cells = [];
  for (let index = 27; index >= 0; index -= 1) {
    const date = offsetDate(-index);
    const count = byDate[date] || 0;
    const level = count > 2 ? 3 : count;
    cells.push(`<span class="heat-cell level-${level}" title="${date}: ${count} 条记录"></span>`);
  }
  els.heatmap.innerHTML = cells.join("");
}

function renderRecords() {
  const keyword = els.search.value.trim().toLowerCase();
  const type = els.filter.value;
  const visibleRecords = records
    .filter((record) => type === "全部" || record.type === type)
    .filter((record) => {
      const haystack = [record.title, record.content, record.type, record.mood, ...record.tags].join(" ").toLowerCase();
      return haystack.includes(keyword);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!visibleRecords.length) {
    els.recordList.innerHTML = `<div class="empty-state">还没有匹配的记录，换个关键词试试。</div>`;
    return;
  }

  els.recordList.innerHTML = "";
  visibleRecords.forEach((record) => {
    const node = els.template.content.cloneNode(true);
    node.querySelector(".record-type").textContent = record.type;
    node.querySelector("time").textContent = record.date;
    node.querySelector("h2").textContent = record.title;
    node.querySelector("p").textContent = record.content;
    node.querySelector(".record-meta").innerHTML = [
      `<span class="mood-pill">${escapeHtml(record.mood)} · ${Number(record.hours || 0)}h</span>`,
      ...record.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    ].join("");
    node.querySelector(".delete-btn").dataset.id = record.id;
    els.recordList.appendChild(node);
  });
}

function renderGoals() {
  els.goalGrid.innerHTML = goals
    .map((goal) => {
      const progress = goal.title.includes("学习")
        ? Math.min(getCurrentWeekRecords().reduce((sum, record) => sum + Number(record.hours || 0), 0) / goal.value, 1)
        : Math.min(records.length / 6, 1);

      return `
        <article class="goal-card">
          <span>${escapeHtml(goal.caption)}</span>
          <h3>${escapeHtml(goal.title)}</h3>
          <progress max="1" value="${progress.toFixed(2)}"></progress>
        </article>
      `;
    })
    .join("");
}

function getCurrentWeekRecords() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);

  return records.filter((record) => new Date(`${record.date}T00:00:00`) >= monday);
}

function getStreak() {
  const dates = new Set(records.map((record) => record.date));
  let streak = 0;
  let cursor = new Date();

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function exportRecords() {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `learning-life-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importRecords(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("Invalid data");
      records = imported.map((record) => ({ ...record, id: record.id || makeId() }));
      saveRecords();
      render();
    } catch {
      alert("导入失败，请确认文件是从本站导出的 JSON。");
    }
  });
  reader.readAsText(file);
  event.target.value = "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

init();
