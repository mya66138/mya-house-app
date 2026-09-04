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
  actions.append(createButton("消す", "delete-button", options.deleteAction));
  item.append(actions);
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
