const APP_STORAGE_PREFIX = "myaa-house-";
const BACKUP_FORMAT = "myaa-house-backup";
const BACKUP_VERSION = 1;
const LAST_BACKUP_KEY = "myaa-house-last-backup-date";

const exportButton = document.querySelector("#export-button");
const importButton = document.querySelector("#import-button");
const importFile = document.querySelector("#import-file");
const restoreButton = document.querySelector("#restore-button");
const selectedFile = document.querySelector("#selected-file");
const statusMessage = document.querySelector("#backup-status");

let pendingBackup = null;

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `backup-status ${type}`.trim();
}

function collectAppData() {
  const data = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(APP_STORAGE_PREFIX)) continue;

    const storedValue = localStorage.getItem(key);
    try {
      data[key] = JSON.parse(storedValue);
    } catch {
      data[key] = storedValue;
    }
  }

  return data;
}

function createBackupFile() {
  const createdAt = new Date();
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: createdAt.toISOString(),
    data: collectAppData(),
  };
  const date = createdAt.toLocaleDateString("sv-SE");
  const fileName = `myaa-house-backup-${date}.json`;
  const json = JSON.stringify(backup, null, 2);
  return new File([json], fileName, { type: "application/json" });
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportBackup() {
  setStatus("");
  const file = createBackupFile();

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "みゃーの家 バックアップ",
      });
      localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
      setStatus("バックアップを共有しました。", "success");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        setStatus("保存をキャンセルしました。", "info");
        return;
      }
    }
  }

  downloadFile(file);
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  setStatus("バックアップファイルを保存しました。", "success");
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateBackup(backup) {
  if (!isPlainObject(backup) || backup.format !== BACKUP_FORMAT) {
    throw new Error("このアプリのバックアップファイルではありません。");
  }
  if (backup.version !== BACKUP_VERSION || !isPlainObject(backup.data)) {
    throw new Error("このバックアップ形式には対応していません。");
  }

  const entries = Object.entries(backup.data);
  if (entries.some(([key]) => !key.startsWith(APP_STORAGE_PREFIX))) {
    throw new Error("バックアップ内に不正なデータがあります。");
  }
  return backup;
}

async function readSelectedFile(file) {
  if (!file) return;
  pendingBackup = null;
  restoreButton.disabled = true;
  selectedFile.textContent = file.name;
  setStatus("ファイルを確認しています…", "info");

  try {
    const text = await file.text();
    pendingBackup = validateBackup(JSON.parse(text));
    const itemCount = Object.keys(pendingBackup.data).length;
    restoreButton.disabled = false;
    setStatus(`${itemCount}種類の保存データを取り込めます。`, "success");
  } catch (error) {
    selectedFile.textContent = "ファイルを読み込めませんでした";
    setStatus(error instanceof SyntaxError ? "JSONファイルの内容が壊れています。" : error.message, "error");
  }
}

function restoreBackup() {
  if (!pendingBackup) return;
  const shouldRestore = window.confirm(
    "現在のデータをバックアップの内容に置き換えます。よろしいですか？",
  );
  if (!shouldRestore) return;

  const previousData = {};
  const keysToRemove = [];
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(APP_STORAGE_PREFIX)) {
        keysToRemove.push(key);
        previousData[key] = localStorage.getItem(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    Object.entries(pendingBackup.data).forEach(([key, value]) => {
      const storedValue = typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, storedValue);
    });

    setStatus("データを取り込みました。各ページに反映されています。", "success");
    restoreButton.disabled = true;
    pendingBackup = null;
    importFile.value = "";
    selectedFile.textContent = "取り込みが完了しました";
  } catch {
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    Object.entries(previousData).forEach(([key, value]) => localStorage.setItem(key, value));
    setStatus("データを保存できませんでした。端末の空き容量をご確認ください。", "error");
  }
}

exportButton.addEventListener("click", exportBackup);
importButton.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => readSelectedFile(importFile.files[0]));
restoreButton.addEventListener("click", restoreBackup);
