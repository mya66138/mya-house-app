const assetForm = document.querySelector("#asset-form");
const assetDate = document.querySelector("#asset-date");
const assetAmount = document.querySelector("#asset-amount");
const assetList = document.querySelector("#asset-list");
const assetEmpty = document.querySelector("#asset-empty");
const ASSET_STORAGE_KEY = "myaa-house-assets";

function formatAmount(amount) {
  return `${Number(amount).toLocaleString("ja-JP")}円`;
}

function formatDifference(difference) {
  if (difference === null) return "—";

  const sign = difference > 0 ? "+" : "";
  return `${sign}${Number(difference).toLocaleString("ja-JP")}円`;
}

function saveAssets(assets) {
  localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
}

function getAssets() {
  return JSON.parse(localStorage.getItem(ASSET_STORAGE_KEY)) || [];
}

function renderAssets() {
  const assets = getAssets().sort((a, b) => a.date.localeCompare(b.date));
  assetList.replaceChildren();
  assetEmpty.hidden = assets.length > 0;

  assets.forEach((asset, index) => {
    const previousAsset = assets[index - 1];
    const difference = previousAsset ? asset.amount - previousAsset.amount : null;
    const row = document.createElement("tr");
    const differenceClass = difference === null ? "" : difference >= 0 ? "increase" : "decrease";

    row.innerHTML = `
      <td>${asset.date}</td>
      <td>${formatAmount(asset.amount)}</td>
      <td class="${differenceClass}">${formatDifference(difference)}</td>
      <td><button class="item-action delete-button" type="button">削除</button></td>
    `;

    row.querySelector("button").addEventListener("click", () => {
      saveAssets(getAssets().filter((item) => item.id !== asset.id));
      renderAssets();
    });
    assetList.append(row);
  });
}

assetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = assetDate.value;
  const amount = Number(assetAmount.value);
  if (!date || Number.isNaN(amount) || amount < 0) return;

  const assets = getAssets();
  assets.push({ id: crypto.randomUUID(), date, amount });
  saveAssets(assets);
  assetForm.reset();
  assetDate.value = new Date().toLocaleDateString("sv-SE");
  assetDate.focus();
  renderAssets();
});

assetDate.value = new Date().toLocaleDateString("sv-SE");
renderAssets();
