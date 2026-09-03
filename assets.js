const assetForm = document.querySelector("#asset-form");
const assetDate = document.querySelector("#asset-date");
const assetAmount = document.querySelector("#asset-amount");
const assetList = document.querySelector("#asset-list");
const assetEmpty = document.querySelector("#asset-empty");
const assetChart = document.querySelector("#asset-chart");
const assetChartEmpty = document.querySelector("#asset-chart-empty");
const ASSET_STORAGE_KEY = "myaa-house-assets";
const SVG_NS = "http://www.w3.org/2000/svg";

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

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function renderAssetChart(assets) {
  assetChart.replaceChildren();
  assetChartEmpty.hidden = assets.length > 0;
  if (assets.length === 0) return;

  const width = 640;
  const height = 270;
  const padding = { top: 22, right: 22, bottom: 48, left: 84 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const amounts = assets.map((asset) => asset.amount);
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const range = Math.max(maxAmount - minAmount, Math.max(maxAmount * 0.1, 1));
  const yMin = Math.max(0, minAmount - range * 0.2);
  const yMax = maxAmount + range * 0.2;
  const xPosition = (index) =>
    assets.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + (chartWidth * index) / (assets.length - 1);
  const yPosition = (amount) => padding.top + ((yMax - amount) / (yMax - yMin)) * chartHeight;

  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    "aria-hidden": "true",
  });

  for (let index = 0; index <= 3; index += 1) {
    const y = padding.top + (chartHeight * index) / 3;
    const amount = yMax - ((yMax - yMin) * index) / 3;
    svg.append(createSvgElement("line", {
      x1: padding.left,
      y1: y,
      x2: width - padding.right,
      y2: y,
      class: "chart-grid-line",
    }));

    const label = createSvgElement("text", { x: padding.left - 10, y: y + 4, class: "chart-y-label" });
    label.textContent = `${Math.round(amount / 10000).toLocaleString("ja-JP")}万円`;
    svg.append(label);
  }

  const path = createSvgElement("path", {
    d: assets.map((asset, index) => `${index === 0 ? "M" : "L"} ${xPosition(index)} ${yPosition(asset.amount)}`).join(" "),
    class: "asset-chart-line",
  });
  svg.append(path);

  const labelIndexes = assets.length <= 3 ? assets.map((_, index) => index) : [0, Math.floor((assets.length - 1) / 2), assets.length - 1];
  assets.forEach((asset, index) => {
    const x = xPosition(index);
    const y = yPosition(asset.amount);
    const point = createSvgElement("circle", { cx: x, cy: y, r: 5, class: "asset-chart-point" });
    const title = createSvgElement("title");
    title.textContent = `${asset.date}：${formatAmount(asset.amount)}`;
    point.append(title);
    svg.append(point);

    if (labelIndexes.includes(index)) {
      const label = createSvgElement("text", { x, y: height - 18, class: "chart-x-label" });
      label.textContent = asset.date.slice(5).replace("-", "/");
      svg.append(label);
    }
  });

  assetChart.append(svg);
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

  renderAssetChart(assets);
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
