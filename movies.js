const movieForm = document.querySelector("#movie-form");
const movieInput = document.querySelector("#movie-input");
const movieList = document.querySelector("#movie-list");
const seenMovieList = document.querySelector("#seen-movie-list");
const seenMovieEmpty = document.querySelector("#seen-movie-empty");
const WANT_MOVIES_KEY = "myaa-house-movies";
const SEEN_MOVIES_KEY = "myaa-house-seen-movies";

function getMovies(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveMovies(key, movies) {
  localStorage.setItem(key, JSON.stringify(movies));
}

function updateMovieReview(movieId, review) {
  saveMovies(
    SEEN_MOVIES_KEY,
    getMovies(SEEN_MOVIES_KEY).map((movie) => (movie.id === movieId ? { ...movie, review } : movie)),
  );
  renderMovies();
}

function ensureMovieIds() {
  const wantMovies = getMovies(WANT_MOVIES_KEY);
  if (wantMovies.some((movie) => !movie.id)) {
    saveMovies(WANT_MOVIES_KEY, wantMovies.map((movie) => ({
      id: movie.id || crypto.randomUUID(),
      text: movie.text,
    })));
  }
}

function createButton(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("item-action", className);
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function createMovieItem(movie, options = {}) {
  const item = document.createElement("li");
  item.classList.add("todo-item", "media-item");
  const title = document.createElement("span");
  title.textContent = movie.text;
  item.append(title);

  if (movie.seenDate) {
    const date = document.createElement("small");
    date.classList.add("finished-date");
    date.textContent = `${movie.seenDate.replaceAll("-", "/")} 鑑賞`;
    item.append(date);
  }

  const actions = document.createElement("div");
  actions.classList.add("item-actions");
  if (options.primaryAction) actions.append(options.primaryAction);
  if (options.reviewAction) {
    actions.append(createButton(movie.review ? "感想を編集" : "感想を書く", "review-button", () => {
      const editor = item.querySelector(".review-editor");
      editor.hidden = false;
      editor.querySelector("textarea").focus();
    }));
  }
  actions.append(createButton("消す", "delete-button", () => {
    if (window.confirm(`「${movie.text}」を削除しますか？`)) options.deleteAction();
  }));
  item.append(actions);

  if (options.reviewAction) {
    if (movie.review) {
      const reviewText = document.createElement("p");
      reviewText.className = "review-text";
      reviewText.textContent = movie.review;
      item.append(reviewText);
    }

    const editor = document.createElement("div");
    editor.className = "review-editor";
    editor.hidden = true;
    const label = document.createElement("label");
    label.textContent = `「${movie.text}」の感想`;
    const textarea = document.createElement("textarea");
    textarea.rows = 5;
    textarea.value = movie.review || "";
    textarea.placeholder = "印象に残ったことや、好きだったところを書いてみよう。";
    label.append(textarea);
    const editorActions = document.createElement("div");
    editorActions.className = "review-editor-actions";
    const saveButton = createButton("保存", "review-save-button", () => options.reviewAction(textarea.value.trim()));
    const cancelButton = createButton("キャンセル", "review-cancel-button", () => {
      textarea.value = movie.review || "";
      editor.hidden = true;
    });
    editorActions.append(saveButton, cancelButton);
    editor.append(label, editorActions);
    item.append(editor);
  }
  return item;
}

function renderMovies() {
  const wantMovies = getMovies(WANT_MOVIES_KEY);
  const seenMovies = getMovies(SEEN_MOVIES_KEY);
  movieList.replaceChildren();
  seenMovieList.replaceChildren();
  seenMovieEmpty.hidden = seenMovies.length > 0;

  wantMovies.forEach((movie) => {
    const seenButton = createButton("見た", "finish-button", () => {
      const seenMovie = { ...movie, seenDate: new Date().toLocaleDateString("sv-SE") };
      saveMovies(WANT_MOVIES_KEY, getMovies(WANT_MOVIES_KEY).filter((item) => item.id !== movie.id));
      saveMovies(SEEN_MOVIES_KEY, [seenMovie, ...getMovies(SEEN_MOVIES_KEY)]);
      renderMovies();
    });
    movieList.append(createMovieItem(movie, {
      primaryAction: seenButton,
      deleteAction: () => {
        saveMovies(WANT_MOVIES_KEY, getMovies(WANT_MOVIES_KEY).filter((item) => item.id !== movie.id));
        renderMovies();
      },
    }));
  });

  seenMovies.forEach((movie) => {
    seenMovieList.append(createMovieItem(movie, {
      reviewAction: (review) => updateMovieReview(movie.id, review),
      deleteAction: () => {
        saveMovies(SEEN_MOVIES_KEY, getMovies(SEEN_MOVIES_KEY).filter((item) => item.id !== movie.id));
        renderMovies();
      },
    }));
  });
}

ensureMovieIds();

movieForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = movieInput.value.trim();
  if (text === "") return;

  saveMovies(WANT_MOVIES_KEY, [...getMovies(WANT_MOVIES_KEY), { id: crypto.randomUUID(), text }]);
  movieInput.value = "";
  movieInput.focus();
  renderMovies();
});

renderMovies();
