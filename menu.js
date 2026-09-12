const navToggle = document.querySelector(".nav-toggle");
const appNav = document.querySelector("#app-nav");
const mobileNavQuery = window.matchMedia("(max-width: 440px)");

function setMenuOpen(isOpen) {
  navToggle.setAttribute("aria-expanded", String(isOpen));
  appNav.hidden = !isOpen;
  navToggle.textContent = isOpen ? "✕ メニューを閉じる" : "☰ メニュー";
}

function syncMenuForScreen() {
  if (mobileNavQuery.matches) {
    setMenuOpen(false);
  } else {
    appNav.hidden = false;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.textContent = "☰ メニュー";
  }
}

navToggle.addEventListener("click", () => {
  setMenuOpen(navToggle.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileNavQuery.matches) {
    setMenuOpen(false);
    navToggle.focus();
  }
});

mobileNavQuery.addEventListener("change", syncMenuForScreen);
syncMenuForScreen();
