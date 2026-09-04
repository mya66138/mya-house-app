const bookForm = document.querySelector("#book-form");
const bookInput = document.querySelector("#book-input");
const bookList = document.querySelector("#book-list");
const currentBookList = document.querySelector("#current-book-list");
const readBookList = document.querySelector("#read-book-list");
const currentBookEmpty = document.querySelector("#current-book-empty");
const readBookEmpty = document.querySelector("#read-book-empty");
const TO_READ_BOOKS_KEY = "myaa-house-books-to-read";
const CURRENT_BOOKS_KEY = "myaa-house-books-current";
const READ_BOOKS_KEY = "myaa-house-books-read";
const LEGACY_BOOKS_KEY = "myaa-house-books";

function getBooks(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveBooks(key, books) {
  localStorage.setItem(key, JSON.stringify(books));
}

function migrateLegacyBooks() {
  if (localStorage.getItem(TO_READ_BOOKS_KEY) !== null) return;

  const legacyBooks = getBooks(LEGACY_BOOKS_KEY);
  if (legacyBooks.length === 0) return;
  saveBooks(TO_READ_BOOKS_KEY, legacyBooks.map((book) => ({
    id: crypto.randomUUID(),
    text: book.text,
  })));
}

function createButton(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("item-action", className);
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function createBookItem(book, options = {}) {
  const item = document.createElement("li");
  item.classList.add("todo-item", "media-item");
  const title = document.createElement("span");
  title.textContent = book.text;
  item.append(title);

  if (book.finishedDate) {
    const date = document.createElement("small");
    date.classList.add("finished-date");
    date.textContent = `${book.finishedDate.replaceAll("-", "/")} 読了`;
    item.append(date);
  }

  const actions = document.createElement("div");
  actions.classList.add("item-actions");
  if (options.primaryAction) actions.append(options.primaryAction);
  actions.append(createButton("消す", "delete-button", options.deleteAction));
  item.append(actions);
  return item;
}

function renderBooks() {
  const toReadBooks = getBooks(TO_READ_BOOKS_KEY);
  const currentBooks = getBooks(CURRENT_BOOKS_KEY);
  const readBooks = getBooks(READ_BOOKS_KEY);
  bookList.replaceChildren();
  currentBookList.replaceChildren();
  readBookList.replaceChildren();
  currentBookEmpty.hidden = currentBooks.length > 0;
  readBookEmpty.hidden = readBooks.length > 0;

  toReadBooks.forEach((book) => {
    const readButton = createButton("読む", "move-button", () => {
      saveBooks(TO_READ_BOOKS_KEY, getBooks(TO_READ_BOOKS_KEY).filter((item) => item.id !== book.id));
      saveBooks(CURRENT_BOOKS_KEY, [...getBooks(CURRENT_BOOKS_KEY), book]);
      renderBooks();
    });
    bookList.append(createBookItem(book, {
      primaryAction: readButton,
      deleteAction: () => {
        saveBooks(TO_READ_BOOKS_KEY, getBooks(TO_READ_BOOKS_KEY).filter((item) => item.id !== book.id));
        renderBooks();
      },
    }));
  });

  currentBooks.forEach((book) => {
    const finishButton = createButton("読み終わった", "finish-button", () => {
      const finishedBook = { ...book, finishedDate: new Date().toLocaleDateString("sv-SE") };
      saveBooks(CURRENT_BOOKS_KEY, getBooks(CURRENT_BOOKS_KEY).filter((item) => item.id !== book.id));
      saveBooks(READ_BOOKS_KEY, [finishedBook, ...getBooks(READ_BOOKS_KEY)]);
      renderBooks();
    });
    currentBookList.append(createBookItem(book, {
      primaryAction: finishButton,
      deleteAction: () => {
        saveBooks(CURRENT_BOOKS_KEY, getBooks(CURRENT_BOOKS_KEY).filter((item) => item.id !== book.id));
        renderBooks();
      },
    }));
  });

  readBooks.forEach((book) => {
    readBookList.append(createBookItem(book, {
      deleteAction: () => {
        saveBooks(READ_BOOKS_KEY, getBooks(READ_BOOKS_KEY).filter((item) => item.id !== book.id));
        renderBooks();
      },
    }));
  });
}

migrateLegacyBooks();

bookForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = bookInput.value.trim();
  if (text === "") return;

  saveBooks(TO_READ_BOOKS_KEY, [...getBooks(TO_READ_BOOKS_KEY), { id: crypto.randomUUID(), text }]);
  bookInput.value = "";
  bookInput.focus();
  renderBooks();
});

renderBooks();
