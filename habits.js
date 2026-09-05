const habitForm = document.querySelector("#habit-form");
const habitName = document.querySelector("#habit-name");
const habitInterval = document.querySelector("#habit-interval");
const habitLastDate = document.querySelector("#habit-last-date");
const habitList = document.querySelector("#habit-list");
const habitEmpty = document.querySelector("#habit-empty");
const HABIT_STORAGE_KEY = "myaa-house-habits";
const TODO_STORAGE_KEY = "myaa-house-todos";

function getToday() {
  return new Date().toLocaleDateString("sv-SE");
}

function getHabits() {
  return JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY)) || [];
}

function saveHabits(habits) {
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE");
}

function formatDate(dateString) {
  return dateString.replaceAll("-", "/");
}

function removeHabitTodo(habitId) {
  const todos = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || [];
  localStorage.setItem(
    TODO_STORAGE_KEY,
    JSON.stringify(todos.filter((todo) => todo.habitId !== habitId)),
  );
}

function renderHabits() {
  const habits = getHabits();
  habitList.replaceChildren();
  habitEmpty.hidden = habits.length > 0;

  habits.forEach((habit) => {
    const item = document.createElement("li");
    item.className = "habit-item";

    const details = document.createElement("div");
    details.className = "habit-details";

    const title = document.createElement("strong");
    title.textContent = habit.name;

    const schedule = document.createElement("span");
    schedule.textContent = `${habit.intervalDays}日ごと・最終実行 ${formatDate(habit.lastCompletedDate)}`;

    const nextDate = document.createElement("small");
    nextDate.textContent = `次回の目安 ${formatDate(addDays(habit.lastCompletedDate, habit.intervalDays))}`;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "item-action delete-button";
    deleteButton.textContent = "消す";
    deleteButton.setAttribute("aria-label", `「${habit.name}」を削除`);
    deleteButton.addEventListener("click", () => {
      saveHabits(getHabits().filter((itemHabit) => itemHabit.id !== habit.id));
      removeHabitTodo(habit.id);
      renderHabits();
    });

    details.append(title, schedule, nextDate);
    item.append(details, deleteButton);
    habitList.append(item);
  });
}

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = habitName.value.trim();
  const intervalDays = Number(habitInterval.value);
  const lastCompletedDate = habitLastDate.value;
  if (name === "" || !Number.isInteger(intervalDays) || intervalDays < 1 || !lastCompletedDate) return;

  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  saveHabits([...getHabits(), { id, name, intervalDays, lastCompletedDate }]);
  habitName.value = "";
  habitInterval.value = "1";
  habitLastDate.value = getToday();
  habitName.focus();
  renderHabits();
});

habitLastDate.max = getToday();
habitLastDate.value = getToday();
renderHabits();
