const baseStorageKey = "nagi-care-state";
const activeNicknameKey = "nagi-care-active-nickname";
const sessionStartedAt = new Date();
let activeNickname = localStorage.getItem(activeNicknameKey) || "";

const defaultState = {
  nickname: "",
  points: 40,
  cashOutRequests: 0,
  firstVisitAt: new Date().toISOString(),
  visitDates: [todayKey()],
  lastVisitAt: new Date().toISOString(),
  profile: {
    energy: 68,
    mood: 74,
    focus: 61,
    stress: 38,
  },
  goals: [
    { id: crypto.randomUUID(), title: "가장 중요한 일 25분 집중", type: "focus", difficulty: "medium", importance: "high", done: false },
    { id: crypto.randomUUID(), title: "물 마시고 5분 정리하기", type: "care", difficulty: "low", importance: "normal", done: false },
    { id: crypto.randomUUID(), title: "몸 풀기 10분", type: "body", difficulty: "low", importance: "normal", done: false },
  ],
  planningDates: [todayKey()],
  bestPlanStreak: 1,
  tasks: [
    { id: crypto.randomUUID(), title: "매주 생활비 정리", cadence: "weekly", dueDate: todayKey(), done: false, doneDates: [] },
    { id: crypto.randomUUID(), title: "택배 반품 확인", cadence: "once", dueDate: addDaysKey(1), done: false, doneDates: [] },
    { id: crypto.randomUUID(), title: "필터 교체 시기 확인", cadence: "intermittent", dueDate: addDaysKey(4), done: false, doneDates: [] },
  ],
  history: [],
  inventory: ["기본 한복"],
  equipped: ["기본 한복"],
  selectedIllustration: "care",
};

const shopItems = [
  { id: "pearl-pin", name: "진주 꽃 머리핀", cost: 80, mood: "감정 안정 +5" },
  { id: "jade-charm", name: "옥 노리개", cost: 120, mood: "집중 의식 +7" },
  { id: "moon-boots", name: "달빛 부츠", cost: 160, mood: "외출 목표 +8" },
  { id: "nagi-badge", name: "나기 보호 뱃지", cost: 240, mood: "장기 목표 +10" },
];

const illustrationRewards = [
  { id: "care", name: "나기의 케어룸", requiredDays: 0, src: "assets/nagi-care.jpg" },
  { id: "hug", name: "포근한 응원", requiredDays: 3, src: "assets/nagi-hug.jpg" },
  { id: "street", name: "거리의 인사", requiredDays: 5, src: "assets/nagi-street.jpg" },
  { id: "badge", name: "보호 배지", requiredDays: 7, src: "assets/nagi-badge.jpg" },
  { id: "reference", name: "나기 설정화", requiredDays: 30, src: "assets/nagi-reference.jpg" },
];

const typeLabel = {
  focus: "집중",
  care: "회복",
  body: "체력",
};

const difficultyLabel = {
  low: "난이도 하",
  medium: "난이도 중",
  high: "난이도 상",
};

const difficultyPoint = {
  low: 10,
  medium: 20,
  high: 28,
};

const importanceLabel = {
  low: "중요도 낮음",
  normal: "중요도 보통",
  high: "중요도 높음",
};

const importanceBonus = {
  low: 0,
  normal: 4,
  high: 7,
};

const cadenceLabel = {
  once: "단순건",
  daily: "매일 반복",
  weekly: "매주 반복",
  intermittent: "간헐 할일",
};

const adviceLibrary = {
  morning: [
    "아침에는 시작이 제일 중요해. 오늘은 작은 목표 하나로 리듬을 먼저 깨워보자.",
    "아직 하루가 넓게 남아 있어. 큰 결심보다 첫 체크 표시를 빨리 만드는 게 좋아.",
    "오늘의 첫 목표는 짧고 선명하게 잡아보자. 나기가 시작선을 같이 잡아줄게.",
  ],
  afternoon: [
    "지금은 흐름을 다시 잡기 좋은 시간이야. 남은 에너지를 가장 중요한 곳에 먼저 써보자.",
    "오후에는 목표를 너무 많이 늘리기보다, 하나씩 닫아가는 쪽이 좋아 보여.",
    "오늘 중간 점검 시간이야. 지금 할 수 있는 목표와 나중으로 미룰 일을 가볍게 나눠보자.",
  ],
  evening: [
    "저녁에는 완주보다 정리가 중요해. 오늘 끝낼 수 있는 작은 마무리부터 잡아보자.",
    "하루가 꽤 지나왔어. 새로 벌리기보다 이미 정한 목표를 하나만 골라 닫아보자.",
    "지금은 차분한 마무리 모드가 좋아 보여. 부담 큰 목표는 내일의 나기에게 넘겨도 괜찮아.",
  ],
  night: [
    "밤에는 회복도 목표야. 아주 작은 정리 하나만 하고 몸을 편하게 돌려놓자.",
    "지금은 무리해서 밀어붙이기보다 내일을 위한 발판을 놓는 시간이야.",
    "오늘의 마지막 체크는 가볍게 가자. 나기는 네가 다시 이어갈 수 있게 기록해둘게.",
  ],
  highReadiness: [
    "오늘은 추진력이 좋아 보여. 큰 목표 하나를 먼저 끝내고 작은 보상으로 흐름을 이어가자.",
    "컨디션이 괜찮은 편이야. 중요한 목표를 앞쪽에 두면 성취감이 크게 남을 것 같아.",
    "해낼 힘이 있는 날이야. 다만 너무 많이 담기보다 우선순위를 선명하게 잡아보자.",
  ],
  balanced: [
    "오늘은 충분히 해낼 수 있는 날이야. 너무 크게 잡기보다 완료 표시를 여러 번 만들자.",
    "균형이 괜찮아 보여. 집중 목표와 회복 목표를 하나씩 섞으면 오래 갈 수 있어.",
    "오늘은 속도보다 흐름이 중요해. 30분 안에 끝나는 목표부터 시작해보자.",
  ],
  lowReadiness: [
    "오늘은 보호 모드가 좋아 보여. 목표를 줄여도 기록을 남기면 흐름은 이어져.",
    "컨디션이 낮은 날에는 작은 성공이 더 소중해. 쉬운 목표 하나부터 같이 잡자.",
    "오늘은 나를 몰아붙이지 않는 쪽이 좋아. 회복 목표도 충분히 가치 있는 목표야.",
  ],
  highStress: [
    "부담감이 높게 올라와 있어. 목표를 더하지 말고 지금 있는 것 중 하나만 작게 쪼개보자.",
    "오늘은 압박을 낮추는 게 먼저야. 10분짜리 목표로 시작하면 마음이 조금 풀릴 수 있어.",
    "해야 할 일이 커 보이는 날이야. 나기가 보기엔 완료보다 시작 표시가 먼저야.",
  ],
  noGoals: [
    "아직 오늘 목표가 비어 있어. 아주 쉬운 목표 하나만 세워도 출석 보상은 이어져.",
    "오늘의 계획 칸이 조용해. 부담 없는 목표 하나로 나기에게 오늘을 알려줘.",
    "처음부터 완벽하게 잡지 않아도 돼. 지금 떠오르는 작은 일 하나만 적어보자.",
  ],
  completeProgress: [
    "이미 꽤 해냈어. 남은 목표는 욕심보다 마무리 기준으로 골라보자.",
    "완료 표시가 쌓이고 있어. 이 흐름을 지키려면 다음 목표는 조금 가볍게 가자.",
    "좋아, 오늘 기록이 살아났어. 이제는 보상까지 생각하면서 천천히 닫아보자.",
  ],
};

const $ = (selector) => document.querySelector(selector);
let state = loadState();

const controls = ["energy", "mood", "focus", "stress"].map((id) => $(`#${id}`));

function loadState() {
  const saved = localStorage.getItem(getStorageKey());
  if (!saved) return prepareState(structuredClone(defaultState));

  try {
    const parsed = { ...structuredClone(defaultState), ...JSON.parse(saved) };
    return prepareState(parsed);
  } catch {
    return prepareState(structuredClone(defaultState));
  }
}

function prepareState(parsed) {
    parsed.nickname = activeNickname;
    parsed.firstVisitAt = parsed.firstVisitAt || new Date().toISOString();
    parsed.visitDates = Array.isArray(parsed.visitDates) ? [...new Set(parsed.visitDates)] : [];
    if (!parsed.visitDates.includes(todayKey())) parsed.visitDates.push(todayKey());
    parsed.lastVisitAt = new Date().toISOString();
    parsed.goals = (Array.isArray(parsed.goals) ? parsed.goals : structuredClone(defaultState.goals)).map((goal) => ({
      difficulty: "medium",
      importance: "normal",
      ...goal,
    }));
    parsed.inventory = parsed.inventory?.length ? parsed.inventory : ["기본 한복"];
    parsed.equipped = parsed.equipped?.length ? parsed.equipped : ["기본 한복"];
    parsed.tasks = parsed.tasks?.length ? parsed.tasks : structuredClone(defaultState.tasks);
    parsed.tasks = parsed.tasks.map((task) => ({ doneDates: [], done: false, dueDate: todayKey(), ...task }));
    parsed.planningDates = Array.isArray(parsed.planningDates) ? [...new Set(parsed.planningDates)] : [];
    if (!parsed.planningDates.length && parsed.goals?.length) parsed.planningDates = [todayKey()];
    parsed.bestPlanStreak = Math.max(parsed.bestPlanStreak || 0, calculateBestPlanningStreak(parsed.planningDates));
    parsed.selectedIllustration = illustrationRewards.some((item) => item.id === parsed.selectedIllustration)
      ? parsed.selectedIllustration
      : "care";
    return parsed;
}

function saveState() {
  localStorage.setItem(getStorageKey(), JSON.stringify(state));
}

function getStorageKey(nickname = activeNickname) {
  return nickname ? `${baseStorageKey}:${nickname}` : baseStorageKey;
}

function normalizeNickname(value) {
  return value.trim();
}

function isValidNickname(value) {
  return /^[가-힣A-Za-z0-9]+$/.test(value);
}

function sanitizeNickname(value) {
  return value.replace(/[^가-힣A-Za-z0-9]/g, "");
}

function setNickname(value) {
  const nickname = normalizeNickname(value);
  const previousNickname = activeNickname;
  if (!nickname || !isValidNickname(nickname)) {
    $("#nicknameInput").setCustomValidity("한글, 영어, 숫자만 입력할 수 있어요.");
    $("#nicknameInput").reportValidity();
    return;
  }

  saveState();
  activeNickname = nickname;
  localStorage.setItem(activeNicknameKey, activeNickname);

  const existing = localStorage.getItem(getStorageKey());
  if (existing) {
    state = loadState();
  } else if (!previousNickname) {
    state = prepareState({ ...state, nickname: activeNickname });
  } else {
    state = loadState();
  }

  saveState();
  render();
}

function visitGreeting() {
  if (!activeNickname) return "닉네임을 입력하면 나기가 기록을 따로 보관해둘게요.";
  const days = Math.max(1, state.visitDates?.length || 1);
  return `${activeNickname}님 안녕하세요. ${days}일째 방문이네요. 반가워요.`;
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
      advice: buildNagiAdvice(score),
      portrait: "assets/nagi-care.jpg",
    };
  }

  if (score >= 55) {
    return {
      title: "추천 강도: 균형 모드",
      body: "핵심 목표 2개와 회복 목표 1개가 좋아 보여요. 목표는 40분 이하 단위로 쪼개면 좋아요.",
      advice: buildNagiAdvice(score),
      portrait: "assets/nagi-care.jpg",
    };
  }

  return {
    title: "추천 강도: 보호 모드",
    body: "필수 목표 1개와 회복 목표 2개를 추천해요. 완주보다 다시 시작하는 감각이 중요해요.",
    advice: buildNagiAdvice(score),
    portrait: "assets/nagi-hug.jpg",
  };
}

function buildNagiAdvice(score) {
  const bucket = chooseAdviceBucket(score);
  const messages = adviceLibrary[bucket] || adviceLibrary.balanced;
  return pickStableMessage(messages, `${todayKey()}-${bucket}-${score}-${state.goals.length}-${state.firstVisitAt}`);
}

function chooseAdviceBucket(score) {
  const totalGoals = state.goals.length;
  const doneGoals = state.goals.filter((goal) => goal.done).length;
  const progress = totalGoals ? doneGoals / totalGoals : 0;

  if (!totalGoals) return "noGoals";
  if (state.profile.stress >= 72) return "highStress";
  if (progress >= 0.65) return "completeProgress";
  if (score >= 78) return "highReadiness";
  if (score < 55) return "lowReadiness";
  return getTimeAdviceBucket();
}

function getTimeAdviceBucket() {
  const hour = sessionStartedAt.getHours();
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

function pickStableMessage(messages, seed) {
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return messages[hash % messages.length];
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
  $("#nicknameInput").value = activeNickname;
  $("#homeGreeting").textContent = visitGreeting();
  $("#profileGreeting").textContent = activeNickname ? `${activeNickname}님 ${state.visitDates.length}일째 방문` : "나기의 조언";

  controls.forEach((control) => {
    control.value = state.profile[control.id];
    control.parentElement.querySelector("output").value = control.value;
  });

  const score = readiness();
  const rec = recommendationFor(score);
  $("#readinessScore").value = `${score}%`;
  $("#recommendation").innerHTML = `<strong>${rec.title}</strong><p>${rec.body}</p>`;
  $("#nagiAdvice").textContent = rec.advice;
  $("#nagiPortrait").src = getSelectedIllustration().src;
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
        <span class="goal-sub">${typeLabel[goal.type]} · ${difficultyLabel[goal.difficulty]} · ${importanceLabel[goal.importance]} · ${calculateGoalPoints(goal)}P</span>
      </div>
      <div class="goal-actions">
        <button type="button" data-goal="${goal.id}">${goal.done ? "완료" : "수행"}</button>
        <button type="button" class="danger-button" data-delete-goal="${goal.id}" aria-label="${escapeHtml(goal.title)} 삭제">삭제</button>
      </div>
    `;
    list.appendChild(card);
  });

  const done = state.goals.filter((goal) => goal.done).length;
  const total = Math.max(state.goals.length, 1);
  const progress = Math.round((done / total) * 100);
  const ring = $(".progress-ring");
  $("#goalProgress").textContent = `${progress}%`;
  ring.style.background = `conic-gradient(var(--jade) ${progress * 3.6}deg, rgba(255, 255, 255, 0.12) 0deg)`;
  renderPlanningRewardStatus();
}

function calculateGoalPoints(goal) {
  const difficulty = difficultyPoint[goal.difficulty] ?? difficultyPoint.medium;
  const importance = importanceBonus[goal.importance] ?? importanceBonus.normal;
  return Math.min(35, Math.max(10, difficulty + importance));
}

function renderPlanningRewardStatus() {
  const currentStreak = calculateCurrentPlanningStreak();
  const bestStreak = Math.max(state.bestPlanStreak || 0, calculateBestPlanningStreak(state.planningDates));
  state.bestPlanStreak = bestStreak;

  $("#planStreak").textContent = `${currentStreak}일 연속 목표 수립`;
  const nextReward = illustrationRewards.find((item) => item.requiredDays > bestStreak);
  $("#nextUnlock").textContent = nextReward
    ? `최고 ${bestStreak}일 달성. ${nextReward.requiredDays}일 연속이면 '${nextReward.name}' 일러스트가 열려요.`
    : `최고 ${bestStreak}일 달성. 모든 나기 일러스트가 열렸어요.`;

  const days = $("#attendanceDays");
  days.innerHTML = "";
  lastSevenDays().forEach((day) => {
    const dot = document.createElement("span");
    dot.className = `attendance-dot${state.planningDates.includes(day.key) ? " is-active" : ""}`;
    dot.textContent = day.label.slice(0, 1);
    dot.title = day.key;
    days.appendChild(dot);
  });
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
  const earned = calculateGoalPoints(goal);
  const today = ensureTodayHistory();

  today.done += 1;
  today.points += earned;
  state.points += earned;
  saveState();
  render();
}

function deleteGoal(id) {
  state.goals = state.goals.filter((goal) => goal.id !== id);
  saveState();
  render();
}

function markPlanningDay() {
  const key = todayKey();
  if (!state.planningDates.includes(key)) {
    state.planningDates.push(key);
    state.planningDates = state.planningDates.slice(-120);
  }
  state.bestPlanStreak = Math.max(state.bestPlanStreak || 0, calculateBestPlanningStreak(state.planningDates));
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
  renderIllustrations();
}

function renderIllustrations() {
  const list = $("#illustrationList");
  const bestStreak = Math.max(state.bestPlanStreak || 0, calculateBestPlanningStreak(state.planningDates));
  list.innerHTML = "";

  illustrationRewards.forEach((item) => {
    const unlocked = bestStreak >= item.requiredDays;
    const selected = state.selectedIllustration === item.id;
    const card = document.createElement("article");
    card.className = `illustration-card${selected ? " is-selected" : ""}${unlocked ? "" : " is-locked"}`;
    const status = unlocked ? (selected ? "적용 중" : "해금 완료") : `${item.requiredDays}일 연속 필요`;
    const action = unlocked ? (selected ? "적용 중" : "바꾸기") : "잠김";
    card.innerHTML = `
      <img src="${item.src}" alt="${item.name}" />
      <div>
        <strong>${item.name}</strong>
        <span>${status}</span>
      </div>
      <button type="button" data-illustration="${item.id}" ${unlocked ? "" : "disabled"}>${action}</button>
    `;
    list.appendChild(card);
  });
}

function selectIllustration(id) {
  const item = illustrationRewards.find((entry) => entry.id === id);
  const bestStreak = Math.max(state.bestPlanStreak || 0, calculateBestPlanningStreak(state.planningDates));
  if (!item || bestStreak < item.requiredDays) return;

  state.selectedIllustration = id;
  saveState();
  render();
}

function getSelectedIllustration() {
  const selected = illustrationRewards.find((item) => item.id === state.selectedIllustration);
  const bestStreak = Math.max(state.bestPlanStreak || 0, calculateBestPlanningStreak(state.planningDates));
  if (selected && bestStreak >= selected.requiredDays) return selected;
  state.selectedIllustration = "care";
  return illustrationRewards[0];
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

function calculateCurrentPlanningStreak() {
  const dates = new Set(state.planningDates || []);
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    if (!dates.has(dateKey(date))) break;
    streak += 1;
  }

  return streak;
}

function calculateBestPlanningStreak(dates) {
  const sorted = [...new Set(dates || [])].sort();
  let best = 0;
  let current = 0;
  let previous = null;

  sorted.forEach((key) => {
    const date = new Date(`${key}T00:00:00`);
    if (previous) {
      const diff = Math.round((date - previous) / 86400000);
      current = diff === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
    previous = date;
  });

  return best;
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

$("#nicknameInput").addEventListener("input", (event) => {
  const sanitized = sanitizeNickname(event.target.value);
  if (event.target.value !== sanitized) event.target.value = sanitized;
  event.target.setCustomValidity("");
});

$("#nicknameForm").addEventListener("submit", (event) => {
  event.preventDefault();
  setNickname($("#nicknameInput").value);
});

$("#goalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = $("#goalInput").value.trim();
  if (!title) return;

  state.goals.push({
    id: crypto.randomUUID(),
    title,
    type: $("#goalType").value,
    difficulty: $("#goalDifficulty").value,
    importance: $("#goalImportance").value,
    done: false,
  });
  markPlanningDay();
  $("#goalInput").value = "";
  saveState();
  render();
});

$("#goalList").addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-goal]");
  if (deleteButton) {
    deleteGoal(deleteButton.dataset.deleteGoal);
    return;
  }

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

$("#illustrationList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-illustration]");
  if (button) selectIllustration(button.dataset.illustration);
});

$("#cashOutButton").addEventListener("click", () => {
  state.cashOutRequests += 1;
  $("#nagiAdvice").textContent = `출금 예약을 ${state.cashOutRequests}번 기록했어. 실제 돈 대신 스스로에게 줄 보상을 정해두면 오래 가기 좋아.`;
  saveState();
});

$("#resetButton").addEventListener("click", () => {
  const keep = confirm("나기 케어 기록을 처음 상태로 되돌릴까요?");
  if (!keep) return;
  state = prepareState(structuredClone(defaultState));
  saveState();
  render();
});

window.addEventListener("hashchange", syncViewFromHash);
syncViewFromHash();
render();
