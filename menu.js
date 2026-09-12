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

const BACKUP_REMINDER_DAYS = 30;
const MENU_LAST_BACKUP_KEY = "myaa-house-last-backup-date";
const REMINDER_DISMISSED_KEY = "myaa-house-backup-reminder-dismissed";

function shouldShowBackupReminder() {
  if (location.pathname.endsWith("backup.html")) return false;
  if (sessionStorage.getItem(REMINDER_DISMISSED_KEY) === "true") return false;

  const hasSavedData = Object.keys(localStorage).some(
    (key) => key.startsWith("myaa-house-") && key !== MENU_LAST_BACKUP_KEY,
  );
  if (!hasSavedData) return false;

  const lastBackup = localStorage.getItem(MENU_LAST_BACKUP_KEY);
  if (!lastBackup) return true;
  const elapsedDays = (Date.now() - new Date(lastBackup).getTime()) / 86400000;
  return !Number.isFinite(elapsedDays) || elapsedDays >= BACKUP_REMINDER_DAYS;
}

function showBackupReminder() {
  if (!shouldShowBackupReminder()) return;

  const reminder = document.createElement("aside");
  reminder.className = "backup-reminder";
  reminder.setAttribute("aria-label", "バックアップのお知らせ");

  const message = document.createElement("p");
  message.textContent = localStorage.getItem(MENU_LAST_BACKUP_KEY)
    ? "前回のバックアップから30日以上経っています。大切な記録を保存しませんか？"
    : "まだバックアップがありません。大切な記録をJSONファイルに保存しておきませんか？";

  const link = document.createElement("a");
  link.href = "backup.html";
  link.textContent = "保存する";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "あとで";
  closeButton.addEventListener("click", () => {
    sessionStorage.setItem(REMINDER_DISMISSED_KEY, "true");
    reminder.remove();
  });

  reminder.append(message, link, closeButton);
  document.querySelector("header").insertAdjacentElement("afterend", reminder);
}

showBackupReminder();
