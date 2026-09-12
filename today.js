const TODAY_KEYS = {
  todos: "myaa-house-todos",
  shopping: "myaa-house-shopping-list",
  habits: "myaa-house-habits",
  toReadBooks: "myaa-house-books-to-read",
  currentBooks: "myaa-house-books-current",
  movies: "myaa-house-movies",
};

function getList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function localDate(date = new Date()) {
  return date.toLocaleDateString("sv-SE");
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + Number(days));
  return localDate(date);
}

function renderList(listId, countId, items, unit = "件") {
  const list = document.querySelector(listId);
  document.querySelector(countId).textContent = `${items.length}${unit}`;
  list.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "today-empty";
    empty.textContent = "いまはありません";
    list.append(empty);
    return;
  }

  items.slice(0, 3).forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    list.append(item);
  });
  if (items.length > 3) {
    const more = document.createElement("li");
    more.className = "today-more";
    more.textContent = `ほか${items.length - 3}件`;
    list.append(more);
  }
}

const today = localDate();
const todos = getList(TODAY_KEYS.todos);
const shopping = getList(TODAY_KEYS.shopping);
const habits = getList(TODAY_KEYS.habits);
const currentBooks = getList(TODAY_KEYS.currentBooks);

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
}).format(new Date());

renderList(
  "#today-todos",
  "#today-todo-count",
  todos.filter((item) => item.category === "today" && !item.completed).map((item) => item.text),
);
renderList(
  "#today-shopping",
  "#today-shopping-count",
  shopping.filter((item) => item.category === "shopping-now" && !item.completed).map((item) => item.text),
);
renderList(
  "#today-habits",
  "#today-habit-count",
  habits
    .filter((habit) => addDays(habit.lastCompletedDate, habit.intervalDays) <= today)
    .map((habit) => habit.name),
);
renderList(
  "#today-books",
  "#today-book-count",
  currentBooks.map((book) => book.text),
  "冊",
);

const suggestions = [
  ...todos
    .filter((item) => item.category === "someday" && !item.completed)
    .map((item) => ({ icon: "💭", label: "そのうちやりたいこと", text: item.text, href: "index.html" })),
  ...shopping
    .filter((item) => item.category === "shopping-someday" && !item.completed)
    .map((item) => ({ icon: "🛍️", label: "そのうち買いたいもの", text: item.text, href: "index.html" })),
  ...getList(TODAY_KEYS.toReadBooks)
    .map((item) => ({ icon: "📚", label: "読みたい本", text: item.text, href: "media.html" })),
  ...getList(TODAY_KEYS.movies)
    .map((item) => ({ icon: "🎬", label: "見たい映画", text: item.text, href: "movies.html" })),
];

let lastSuggestionIndex = -1;

function showRandomSuggestion() {
  const container = document.querySelector("#random-suggestion");
  container.replaceChildren();
  if (suggestions.length === 0) {
    container.textContent = "候補を登録すると、ここで今日のおすすめを選びます。";
    document.querySelector("#shuffle-suggestion").disabled = true;
    return;
  }

  let index = Math.floor(Math.random() * suggestions.length);
  if (suggestions.length > 1 && index === lastSuggestionIndex) index = (index + 1) % suggestions.length;
  lastSuggestionIndex = index;
  const suggestion = suggestions[index];

  const label = document.createElement("span");
  label.className = "suggestion-label";
  label.textContent = `${suggestion.icon} ${suggestion.label}`;
  const link = document.createElement("a");
  link.href = suggestion.href;
  link.textContent = suggestion.text;
  container.append(label, link);
}

document.querySelector("#shuffle-suggestion").addEventListener("click", showRandomSuggestion);
showRandomSuggestion();
