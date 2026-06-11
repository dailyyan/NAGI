const storageKey = "nagi-care-state";

const defaultState = {
  points: 40,
  cashOutRequests: 0,
  profile: {
    energy: 68,
    mood: 74,
    focus: 61,
    stress: 38,
  },
  goals: [
    { id: crypto.randomUUID(), title: "가장 중요한 일 25분 집중", type: "focus", done: false },
    { id: crypto.randomUUID(), title: "물 마시고 5분 정리하기", type: "care", done: false },
    { id: crypto.randomUUID(), title: "몸 풀기 10분", type: "body", done: false },
  ],
  tasks: [
    { id: crypto.randomUUID(), title: "매주 생활비 정리", cadence: "weekly", dueDate: todayKey(), done: false, doneDates: [] },
    { id: crypto.randomUUID(), title: "택배 반품 확인", cadence: "once", dueDate: addDaysKey(1), done: false, doneDates: [] },
    { id: crypto.randomUUID(), title: "필터 교체 시기 확인", cadence: "intermittent", dueDate: addDaysKey(4), done: false, doneDates: [] },
  ],
  history: [],
  inventory: ["기본 한복"],
  equipped: ["기본 한복"],
};

const shopItems = [
  { id: "pearl-pin", name: "진주 꽃 머리핀", cost: 80, mood: "감정 안정 +5" },
  { id: "jade-charm", name: "옥 노리개", cost: 120, mood: "집중 의식 +7" },
  { id: "moon-boots", name: "달빛 부츠", cost: 160, mood: "외출 목표 +8" },
  { id: "nagi-badge", name: "나기 보호 뱃지", cost: 240, mood: "장기 목표 +10" },
];

const typeLabel = {
  focus: "집중",
  care: "회복",
  body: "체력",
};

const typePoint = {
  focus: 34,
  care: 22,
  body: 28,
};

const cadenceLabel = {
  once: "단순건",
  daily: "매일 반복",
  weekly: "매주 반복",
  intermittent: "간헐 할일",
};

const $ = (selector) => document.querySelector(selector);
let state = loadState();

const controls = ["energy", "mood", "focus", "stress"].map((id) => $(`#${id}`));

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return structuredClone(defaultState);

  try {
    const parsed = { ...structuredClone(defaultState), ...JSON.parse(saved) };
    parsed.inventory = parsed.inventory?.length ? parsed.inventory : ["기본 한복"];
    parsed.equipped = parsed.equipped?.length ? parsed.equipped : ["기본 한복"];
    parsed.tasks = parsed.tasks?.length ? parsed.tasks : structuredClone(defaultState.tasks);
    parsed.tasks = parsed.tasks.map((task) => ({ doneDates: [], done: false, dueDate: todayKey(), ...task }));
    return parsed;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function readiness() {
  const { energy, mood, focus, stress } = state.profile;
  return Math.round(energy * 0.32 + mood * 0.28 + focus * 0.26 + (100 - stress) * 0.14);
}

function recommendationFor(score) {
  if (score >= 78) {
    return {
      title: "추천 강도: 확장 모드",
      body: "핵심 목표 3개까지 괜찮아 보여요. 대신 끝나면 회복 목표를 하나 넣어 균형을 맞춰요.",
      advice: "오늘은 추진력이 좋아 보여. 큰 목표 하나를 먼저 끝내고, 작은 보상으로 흐름을 이어가자.",
      portrait: "assets/nagi-care.jpg",
    };
  }

  if (score >= 55) {
    return {
      title: "추천 강도: 균형 모드",
      body: "핵심 목표 2개와 회복 목표 1개가 좋아 보여요. 목표는 40분 이하 단위로 쪼개면 좋아요.",
      advice: "오늘은 충분히 해낼 수 있는 날이야. 너무 크게 잡기보다 완료 표시를 여러 번 만들자.",
      portrait: "assets/nagi-care.jpg",
    };
  }

  return {
    title: "추천 강도: 보호 모드",
    body: "필수 목표 1개와 회복 목표 2개를 추천해요. 완주보다 다시 시작하는 감각이 중요해요.",
    advice: "오늘은 나를 밀어붙이기보다 지켜주는 계획이 좋아. 아주 작은 목표도 포인트를 줄게.",
    portrait: "assets/nagi-hug.jpg",
  };
}

function todayKey() {
  return dateKey(new Date());
}

function addDaysKey(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ensureTodayHistory() {
  const key = todayKey();
  let today = state.history.find((entry) => entry.date === key);
  if (!today) {
    today = { date: key, done: 0, readiness: readiness(), points: 0 };
    state.history.push(today);
  }
  today.readiness = readiness();
  state.history = state.history.slice(-14);
  return today;
}

function renderProfile() {
  controls.forEach((control) => {
    control.value = state.profile[control.id];
    control.parentElement.querySelector("output").value = control.value;
  });

  const score = readiness();
  const rec = recommendationFor(score);
  $("#readinessScore").value = `${score}%`;
  $("#recommendation").innerHTML = `<strong>${rec.title}</strong><p>${rec.body}</p>`;
  $("#nagiAdvice").textContent = rec.advice;
  $("#nagiPortrait").src = rec.portrait;
}

function renderGoals() {
  const list = $("#goalList");
  list.innerHTML = "";

  state.goals.forEach((goal) => {
    const card = document.createElement("article");
    card.className = `goal-card${goal.done ? " is-done" : ""}`;
    card.innerHTML = `
      <div class="goal-meta">
        <span class="goal-title">${escapeHtml(goal.title)}</span>
        <span class="goal-sub">${typeLabel[goal.type]} 목표 · ${typePoint[goal.type]}P</span>
      </div>
      <button type="button" data-goal="${goal.id}">${goal.done ? "완료" : "수행"}</button>
    `;
    list.appendChild(card);
  });

  const done = state.goals.filter((goal) => goal.done).length;
  const total = Math.max(state.goals.length, 1);
  const progress = Math.round((done / total) * 100);
  const ring = $(".progress-ring");
  $("#goalProgress").textContent = `${progress}%`;
  ring.style.background = `conic-gradient(var(--jade) ${progress * 3.6}deg, rgba(255, 255, 255, 0.12) 0deg)`;
}

function renderTasks() {
  $("#taskDate").value ||= todayKey();
  $("#taskCount").textContent = `${state.tasks.length}개`;
  renderCalendarStrip();
  renderTaskGroup("#repeatTaskList", state.tasks.filter((task) => ["daily", "weekly"].includes(task.cadence)));
  renderTaskGroup("#onceTaskList", state.tasks.filter((task) => task.cadence === "once"));
  renderTaskGroup("#intermittentTaskList", state.tasks.filter((task) => task.cadence === "intermittent"));
}

function renderCalendarStrip() {
  const strip = $("#calendarStrip");
  strip.innerHTML = "";

  calendarDays().forEach((day) => {
    const tasks = state.tasks.filter((task) => isTaskOnDate(task, day.key));
    const item = document.createElement("article");
    item.className = `calendar-day${day.key === todayKey() ? " is-today" : ""}`;
    item.innerHTML = `
      <div class="calendar-date">
        <span>${day.weekday}</span>
        <strong>${day.day}</strong>
      </div>
      <div class="calendar-tasks">${tasks.length ? `${tasks.length}개 예정` : "비어 있음"}</div>
    `;
    strip.appendChild(item);
  });
}

function renderTaskGroup(selector, tasks) {
  const list = $(selector);
  list.innerHTML = "";

  if (!tasks.length) {
    list.innerHTML = `<p class="task-empty">아직 등록된 할일이 없어요.</p>`;
    return;
  }

  tasks.forEach((task) => {
    const done = isTaskDone(task);
    const card = document.createElement("article");
    card.className = `task-card${done ? " is-done" : ""}`;
    card.innerHTML = `
      <div class="task-meta">
        <span class="task-title">${escapeHtml(task.title)}</span>
        <span class="task-sub">${cadenceLabel[task.cadence]} · ${formatTaskDate(task)}</span>
      </div>
      <button type="button" data-task="${task.id}">${done ? "완료" : "체크"}</button>
    `;
    list.appendChild(card);
  });
}

function isTaskDone(task) {
  if (["daily", "weekly"].includes(task.cadence)) {
    return task.doneDates.includes(todayKey());
  }

  return Boolean(task.done);
}

function isTaskOnDate(task, key) {
  if (task.done && task.cadence === "once") return false;
  if (task.cadence === "daily") return true;
  if (task.cadence === "weekly") return sameWeekday(task.dueDate, key);
  return task.dueDate === key;
}

function sameWeekday(baseKey, compareKey) {
  return new Date(`${baseKey}T00:00:00`).getDay() === new Date(`${compareKey}T00:00:00`).getDay();
}

function formatTaskDate(task) {
  if (task.cadence === "daily") return "매일";
  const date = new Date(`${task.dueDate}T00:00:00`);
  const formatted = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(date);
  return task.cadence === "weekly" ? `${formatted} 기준 반복` : formatted;
}

function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  if (["daily", "weekly"].includes(task.cadence)) {
    const key = todayKey();
    task.doneDates = task.doneDates.includes(key)
      ? task.doneDates.filter((doneKey) => doneKey !== key)
      : [...task.doneDates, key];
  } else {
    task.done = !task.done;
  }

  saveState();
  render();
}

function completeGoal(id) {
  const goal = state.goals.find((item) => item.id === id);
  if (!goal || goal.done) return;

  goal.done = true;
  const score = readiness();
  const careBonus = score < 55 ? 10 : 0;
  const earned = typePoint[goal.type] + careBonus;
  const today = ensureTodayHistory();

  today.done += 1;
  today.points += earned;
  state.points += earned;
  saveState();
  render();
}

function renderRewards() {
  $("#pointsTotal").textContent = `${state.points.toLocaleString("ko-KR")} P`;
  $("#cashValue").textContent = `${(state.points * 10).toLocaleString("ko-KR")}원`;

  const equippedList = $("#equippedList");
  equippedList.innerHTML = "";
  state.equipped.forEach((name) => {
    const card = document.createElement("article");
    card.className = "equipped-card";
    card.innerHTML = `
      <div class="shop-meta">
        <span class="shop-title">${escapeHtml(name)}</span>
        <span class="shop-sub">현재 착용 중</span>
      </div>
    `;
    equippedList.appendChild(card);
  });

  if (!state.equipped.length) {
    equippedList.innerHTML = `<p class="equipped-empty">아직 착용한 아이템이 없어요.</p>`;
  }

  const shop = $("#shopList");
  shop.innerHTML = "";

  shopItems.forEach((item) => {
    const owned = state.inventory.includes(item.name);
    const equipped = state.equipped.includes(item.name);
    const card = document.createElement("article");
    card.className = `shop-card${equipped ? " is-equipped" : ""}${owned ? "" : " is-locked"}`;
    const status = owned ? (equipped ? "착용 중" : "보유 · 미착용") : "미보유";
    const action = owned ? (equipped ? "해제" : "착용") : "구매";
    card.innerHTML = `
      <div class="shop-meta">
        <span class="shop-title">${item.name}</span>
        <span class="shop-sub">${status} · ${item.mood} · ${item.cost}P</span>
      </div>
      <button type="button" data-shop="${item.id}">${action}</button>
    `;
    shop.appendChild(card);
  });

  const items = state.equipped.length ? state.equipped.join(", ") : "미착용";
  $("#activeItems").innerHTML = `<span>착용 중</span><strong>${items}</strong>`;
}

function handleShopItem(id) {
  const item = shopItems.find((entry) => entry.id === id);
  if (!item) return;

  if (!state.inventory.includes(item.name)) {
    if (state.points < item.cost) return;
    state.points -= item.cost;
    state.inventory.push(item.name);
    state.equipped.push(item.name);
    saveState();
    render();
    return;
  }

  if (state.equipped.includes(item.name)) {
    state.equipped = state.equipped.filter((name) => name !== item.name);
  } else {
    state.equipped.push(item.name);
  }
  saveState();
  render();
}

function renderHistory() {
  ensureTodayHistory();
  const grid = $("#historyGrid");
  grid.innerHTML = "";

  const days = lastSevenDays();
  days.forEach((day) => {
    const entry = state.history.find((item) => item.date === day.key);
    const done = entry?.done ?? 0;
    const height = Math.min(100, done * 25 + (entry?.readiness ?? 0) * 0.35);
    const item = document.createElement("div");
    item.className = "history-day";
    item.innerHTML = `
      <div class="history-bar" style="height:${Math.max(8, height)}%"></div>
      <span>${day.label}</span>
    `;
    grid.appendChild(item);
  });

  const doneCount = state.history.reduce((sum, entry) => sum + entry.done, 0);
  const avg = state.history.length
    ? Math.round(state.history.reduce((sum, entry) => sum + entry.readiness, 0) / state.history.length)
    : 0;

  $("#doneCount").textContent = `${doneCount}개`;
  $("#avgReadiness").textContent = `${avg}%`;
  $("#streakCount").textContent = `${calculateStreak()}일`;
}

function lastSevenDays() {
  const formatter = new Intl.DateTimeFormat("ko-KR", { weekday: "short" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: dateKey(date),
      label: formatter.format(date),
    };
  });
}

function calendarDays() {
  const formatter = new Intl.DateTimeFormat("ko-KR", { weekday: "short" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      key: dateKey(date),
      weekday: formatter.format(date),
      day: date.getDate(),
    };
  });
}

function calculateStreak() {
  let streak = 0;
  const entries = new Map(state.history.map((entry) => [entry.date, entry]));

  for (let offset = 0; offset < 30; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const entry = entries.get(dateKey(date));
    if (!entry || entry.done === 0) break;
    streak += 1;
  }

  return streak;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

function render() {
  renderProfile();
  renderGoals();
  renderTasks();
  renderRewards();
  renderHistory();
  saveState();
}

function setActiveView(viewName) {
  const fallback = viewName || "home";
  const nextView = document.querySelector(`[data-view="${fallback}"]`) ? fallback : "home";
  document.body.dataset.view = nextView;

  document.querySelectorAll(".app-view[data-view]").forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === nextView);
  });

  document.querySelectorAll("[data-nav]").forEach((nav) => {
    nav.classList.toggle("is-active", nav.dataset.nav === nextView);
  });
}

function syncViewFromHash() {
  setActiveView(window.location.hash.replace("#", "") || "home");
  window.scrollTo(0, 0);
  window.requestAnimationFrame(() => window.scrollTo(0, 0));
}

controls.forEach((control) => {
  control.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.profile[event.target.id] = value;
    event.target.parentElement.querySelector("output").value = value;
    ensureTodayHistory();
    render();
  });
});

$("#goalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#goalInput").value.trim();
  if (!title) return;

  state.goals.push({
    id: crypto.randomUUID(),
    title,
    type: $("#goalType").value,
    done: false,
  });
  $("#goalInput").value = "";
  saveState();
  render();
});

$("#goalList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-goal]");
  if (button) completeGoal(button.dataset.goal);
});

$("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#taskInput").value.trim();
  if (!title) return;

  state.tasks.push({
    id: crypto.randomUUID(),
    title,
    cadence: $("#taskCadence").value,
    dueDate: $("#taskDate").value || todayKey(),
    done: false,
    doneDates: [],
  });
  $("#taskInput").value = "";
  $("#taskDate").value = todayKey();
  saveState();
  render();
});

document.querySelector(".task-columns").addEventListener("click", (event) => {
  const button = event.target.closest("[data-task]");
  if (button) toggleTask(button.dataset.task);
});

$("#shopList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-shop]");
  if (button) handleShopItem(button.dataset.shop);
});

$("#cashOutButton").addEventListener("click", () => {
  state.cashOutRequests += 1;
  $("#nagiAdvice").textContent = `출금 예약을 ${state.cashOutRequests}번 기록했어. 실제 돈 대신 스스로에게 줄 보상을 정해두면 오래 가기 좋아.`;
  saveState();
});

$("#resetButton").addEventListener("click", () => {
  const keep = confirm("나기 케어 기록을 처음 상태로 되돌릴까요?");
  if (!keep) return;
  state = structuredClone(defaultState);
  saveState();
  render();
});

window.addEventListener("hashchange", syncViewFromHash);
syncViewFromHash();
render();
