const HISTORY_STORAGE_KEY = "myaa-house-achievement-history";
const GOAL_STORAGE_KEY = "myaa-house-achievement-goals";

function getStoredValue(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function getLocalDate() {
  return new Date().toLocaleDateString("sv-SE");
}

function formatHistoryDate(entry) {
  const time = entry.completedAt ? new Date(entry.completedAt) : new Date(`${entry.date}T12:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: entry.completedAt ? "2-digit" : undefined,
    minute: entry.completedAt ? "2-digit" : undefined,
  }).format(time);
}

function renderHistory() {
  const history = getStoredValue(HISTORY_STORAGE_KEY, [])
    .filter((entry) => entry && entry.date && entry.text)
    .sort((a, b) => String(b.completedAt || b.date).localeCompare(String(a.completedAt || a.date)));
  const today = getLocalDate();
  const currentMonth = today.slice(0, 7);
  const monthlyCount = history.filter((entry) => entry.date.startsWith(currentMonth)).length;
  const dailyCount = history.filter((entry) => entry.date === today).length;
  const goals = getStoredValue(GOAL_STORAGE_KEY, { daily: 3, monthly: 30 });

  document.querySelector("#total-achievements").textContent = history.length;
  document.querySelector("#monthly-achievements").textContent = monthlyCount;
  document.querySelector("#daily-goal").value = goals.daily;
  document.querySelector("#monthly-goal").value = goals.monthly;

  const dailyProgress = document.querySelector("#daily-progress");
  dailyProgress.max = goals.daily;
  dailyProgress.value = Math.min(dailyCount, goals.daily);
  document.querySelector("#daily-progress-text").textContent = `${dailyCount} / ${goals.daily}`;

  const monthlyProgress = document.querySelector("#monthly-progress");
  monthlyProgress.max = goals.monthly;
  monthlyProgress.value = Math.min(monthlyCount, goals.monthly);
  document.querySelector("#monthly-progress-text").textContent = `${monthlyCount} / ${goals.monthly}`;

  const list = document.querySelector("#history-list");
  list.replaceChildren();
  document.querySelector("#history-empty").hidden = history.length > 0;
  history.forEach((entry) => {
    const item = document.createElement("li");
    const icon = document.createElement("span");
    icon.className = "history-type-icon";
    icon.textContent = entry.type === "habit" ? "🌱" : "✨";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = entry.text;
    const date = document.createElement("small");
    date.textContent = formatHistoryDate(entry);
    details.append(title, date);
    item.append(icon, details);
    list.append(item);
  });
}

document.querySelector("#goal-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const daily = Number(document.querySelector("#daily-goal").value);
  const monthly = Number(document.querySelector("#monthly-goal").value);
  if (!Number.isInteger(daily) || daily < 1 || !Number.isInteger(monthly) || monthly < 1) return;
  localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify({ daily, monthly }));
  document.querySelector("#goal-status").textContent = "目標を保存しました。";
  renderHistory();
});

renderHistory();
