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

function getToday() {
  return new Date().toLocaleDateString("sv-SE");
}

function saveTodos() {
  const todos = [...document.querySelectorAll(".todo-item:not(.shopping-item)")].map((item) => ({
    text: item.querySelector("span").textContent,
    completed: item.querySelector("input").checked,
    category: item.dataset.category,
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
    scheduleMidnightCleanup();
  }, nextMidnight - now);
}

function updateProgress() {
  const completedCount = document.querySelectorAll(".todo-item:not(.shopping-item) input:checked").length;
  progress.textContent = `本日${completedCount}個達成！`;
}

function addTodo(todoText, todoCategory = "today", completed = false) {
  const item = document.createElement("li");
  item.classList.add("todo-item");
  item.dataset.category = todoCategory;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = completed;

  const text = document.createElement("span");
  text.textContent = todoText;

  checkbox.addEventListener("change", () => {
    item.classList.toggle("completed", checkbox.checked);
    updateProgress();
    saveTodos();
  });

  item.append(checkbox, text);
  document.querySelector(`#${todoCategory}-list`).append(item);
  item.classList.toggle("completed", completed);
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

  checkbox.addEventListener("change", () => {
    item.classList.toggle("completed", checkbox.checked);
    saveShoppingItems();
  });

  item.append(checkbox, text);
  document.querySelector(`#${itemCategory}-list`).append(item);
  item.classList.toggle("completed", completed);
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
  todosToShow.forEach((todo) => addTodo(todo.text, todo.category || "today", todo.completed));
}

localStorage.setItem(DATE_KEY, getToday());
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
