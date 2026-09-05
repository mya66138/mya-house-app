const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const category = document.querySelector("#todo-category");
const progress = document.querySelector("#progress");
const shoppingForm = document.querySelector("#shopping-form");
const shoppingInput = document.querySelector("#shopping-input");
const shoppingCategory = document.querySelector("#shopping-category");
const STORAGE_KEY = "myaa-house-todos";
const DATE_KEY = "myaa-house-last-open-date";
const SHOPPING_STORAGE_KEY = "myaa-house-shopping-list";
const HABIT_STORAGE_KEY = "myaa-house-habits";
const PRAISE_IMAGES = ["image/homeru/erai.PNG"];
let praiseImageTimer;

function showPraiseImage() {
  if (PRAISE_IMAGES.length === 0) return;

  let praiseOverlay = document.querySelector("#praise-overlay");

  if (!praiseOverlay) {
    praiseOverlay = document.createElement("div");
    praiseOverlay.id = "praise-overlay";
    praiseOverlay.className = "praise-overlay";
    praiseOverlay.setAttribute("aria-hidden", "true");

    const praiseImage = document.createElement("img");
    praiseImage.alt = "よくできました！";
    praiseOverlay.append(praiseImage);
    document.body.append(praiseOverlay);
  }

  const praiseImage = praiseOverlay.querySelector("img");
  const randomIndex = Math.floor(Math.random() * PRAISE_IMAGES.length);
  praiseImage.src = PRAISE_IMAGES[randomIndex];

  clearTimeout(praiseImageTimer);
  praiseOverlay.classList.remove("show");
  void praiseOverlay.offsetWidth;
  praiseOverlay.classList.add("show");

  praiseImageTimer = setTimeout(() => {
    praiseOverlay.classList.remove("show");
  }, 1500);
}

function getToday() {
  return new Date().toLocaleDateString("sv-SE");
}

function saveTodos() {
  const todos = [...document.querySelectorAll(".todo-item:not(.shopping-item)")].map((item) => ({
    text: item.querySelector("span").textContent,
    completed: item.querySelector("input").checked,
    category: item.dataset.category,
    habitId: item.dataset.habitId || null,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function saveShoppingItems() {
  const shoppingItems = [...document.querySelectorAll(".shopping-item")].map((item) => ({
    text: item.querySelector("span").textContent,
    completed: item.querySelector("input").checked,
    category: item.dataset.category,
  }));

  localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(shoppingItems));
}

function removeCompletedItems() {
  document.querySelectorAll(".todo-item input:checked").forEach((checkbox) => {
    checkbox.closest(".todo-item").remove();
  });
  updateProgress();
  saveTodos();
  saveShoppingItems();
}

function scheduleMidnightCleanup() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);

  setTimeout(() => {
    removeCompletedItems();
    localStorage.setItem(DATE_KEY, getToday());
    syncHabitTodos();
    saveTodos();
    scheduleMidnightCleanup();
  }, nextMidnight - now);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE");
}

function daysFromToday(dateString) {
  const today = new Date(`${getToday()}T12:00:00`);
  const date = new Date(`${dateString}T12:00:00`);
  return Math.round((date - today) / 86400000);
}

function getHabitCategory(habit) {
  const nextDate = addDays(habit.lastCompletedDate, habit.intervalDays);
  const daysUntilNext = daysFromToday(nextDate);
  if (habit.intervalDays === 1 && daysUntilNext <= 0) return "today";
  if (habit.intervalDays >= 2 && daysUntilNext <= 1) return "soon";
  return null;
}

function updateHabitCompletedDate(habitId) {
  if (!habitId) return;
  const habits = JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY)) || [];
  const updatedHabits = habits.map((habit) =>
    habit.id === habitId ? { ...habit, lastCompletedDate: getToday() } : habit,
  );
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(updatedHabits));
}

function syncHabitTodos() {
  const habits = JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY)) || [];
  const habitIds = new Set(habits.map((habit) => habit.id));
  const linkedItems = [...document.querySelectorAll(".todo-item:not(.shopping-item)[data-habit-id]")];

  linkedItems.forEach((item) => {
    if (!habitIds.has(item.dataset.habitId)) item.remove();
  });

  habits.forEach((habit) => {
    const desiredCategory = getHabitCategory(habit);
    const matchingItems = [...document.querySelectorAll(".todo-item:not(.shopping-item)[data-habit-id]")]
      .filter((item) => item.dataset.habitId === habit.id);
    const existingItem = matchingItems.shift();
    matchingItems.forEach((item) => item.remove());

    if (!desiredCategory) {
      if (existingItem && !existingItem.querySelector("input").checked) existingItem.remove();
      return;
    }

    if (!existingItem) {
      addTodo(habit.name, desiredCategory, false, habit.id);
      return;
    }

    const wasManuallyMovedToToday =
      desiredCategory === "soon" && existingItem.dataset.category === "today";

    if (
      !existingItem.querySelector("input").checked &&
      existingItem.dataset.category !== desiredCategory &&
      !wasManuallyMovedToToday
    ) {
      existingItem.remove();
      addTodo(habit.name, desiredCategory, false, habit.id);
    }
  });
}

function updateProgress() {
  const completedCount = document.querySelectorAll(".todo-item:not(.shopping-item) input:checked").length;
  progress.textContent = `本日${completedCount}個達成！`;
}

function sortCompletedItemsToBottom(list) {
  const items = [...list.children];
  const incompleteItems = items.filter((item) => !item.querySelector("input").checked);
  const completedItems = items.filter((item) => item.querySelector("input").checked);
  list.append(...incompleteItems, ...completedItems);
}

function deleteItem(item, isShoppingItem) {
  item.remove();
  if (isShoppingItem) {
    saveShoppingItems();
  } else {
    updateProgress();
    saveTodos();
  }
}

function addTodo(todoText, todoCategory = "today", completed = false, habitId = null) {
  const item = document.createElement("li");
  item.classList.add("todo-item");
  item.dataset.category = todoCategory;
  if (habitId) item.dataset.habitId = habitId;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = completed;

  const text = document.createElement("span");
  text.textContent = todoText;

  const actions = document.createElement("div");
  actions.classList.add("item-actions");

  if (todoCategory === "soon") {
    const moveButton = document.createElement("button");
    moveButton.type = "button";
    moveButton.classList.add("item-action", "move-button");
    moveButton.textContent = "今日やる";
    moveButton.setAttribute("aria-label", `「${todoText}」を今日やりたいことへ移動`);
    moveButton.addEventListener("click", () => {
      item.dataset.category = "today";
      const todayList = document.querySelector("#today-list");
      todayList.append(item);
      moveButton.remove();
      sortCompletedItemsToBottom(todayList);
      saveTodos();
    });
    actions.append(moveButton);
  }

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.classList.add("item-action", "delete-button");
  deleteButton.textContent = "消す";
  deleteButton.setAttribute("aria-label", `「${todoText}」を削除`);
  deleteButton.addEventListener("click", () => deleteItem(item, false));
  actions.append(deleteButton);

  checkbox.addEventListener("change", () => {
    item.classList.toggle("completed", checkbox.checked);
    if (checkbox.checked) {
      showPraiseImage();
      updateHabitCompletedDate(item.dataset.habitId);
    }
    sortCompletedItemsToBottom(item.parentElement);
    updateProgress();
    saveTodos();
  });

  item.append(checkbox, text, actions);
  const todoList = document.querySelector(`#${todoCategory}-list`);
  todoList.append(item);
  item.classList.toggle("completed", completed);
  sortCompletedItemsToBottom(todoList);
}

function addShoppingItem(itemText, itemCategory = "shopping-now", completed = false) {
  const item = document.createElement("li");
  item.classList.add("todo-item", "shopping-item");
  item.dataset.category = itemCategory;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = completed;

  const text = document.createElement("span");
  text.textContent = itemText;

  const actions = document.createElement("div");
  actions.classList.add("item-actions");

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.classList.add("item-action", "delete-button");
  deleteButton.textContent = "消す";
  deleteButton.setAttribute("aria-label", `「${itemText}」を削除`);
  deleteButton.addEventListener("click", () => deleteItem(item, true));
  actions.append(deleteButton);

  checkbox.addEventListener("change", () => {
    item.classList.toggle("completed", checkbox.checked);
    sortCompletedItemsToBottom(item.parentElement);
    saveShoppingItems();
  });

  item.append(checkbox, text, actions);
  const shoppingList = document.querySelector(`#${itemCategory}-list`);
  shoppingList.append(item);
  item.classList.toggle("completed", completed);
  sortCompletedItemsToBottom(shoppingList);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const todoText = input.value.trim();
  if (todoText === "") return;

  addTodo(todoText, category.value);
  input.value = "";
  input.focus();
  saveTodos();
});

shoppingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const itemText = shoppingInput.value.trim();
  if (itemText === "") return;

  addShoppingItem(itemText, shoppingCategory.value);
  shoppingInput.value = "";
  shoppingInput.focus();
  saveShoppingItems();
});

const lastOpenDate = localStorage.getItem(DATE_KEY);
const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const isNewDay = lastOpenDate !== null && lastOpenDate !== getToday();

const todosToShow = isNewDay
  ? savedTodos.filter((todo) => !todo.completed)
  : savedTodos;

if (todosToShow.length === 0 && lastOpenDate === null) {
} else {
  todosToShow.forEach((todo) => addTodo(todo.text, todo.category || "today", todo.completed, todo.habitId));
}

localStorage.setItem(DATE_KEY, getToday());
syncHabitTodos();
updateProgress();
saveTodos();
scheduleMidnightCleanup();

const savedShoppingItems = JSON.parse(localStorage.getItem(SHOPPING_STORAGE_KEY)) || [];
const shoppingItemsToShow = isNewDay
  ? savedShoppingItems.filter((item) => !item.completed)
  : savedShoppingItems;

shoppingItemsToShow.forEach((item) => {
  addShoppingItem(item.text, item.category || "shopping-now", item.completed);
});
saveShoppingItems();
