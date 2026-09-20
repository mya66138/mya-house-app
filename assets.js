const assetForm = document.querySelector("#asset-form");
const assetDate = document.querySelector("#asset-date");
const assetAmount = document.querySelector("#asset-amount");
const assetList = document.querySelector("#asset-list");
const assetEmpty = document.querySelector("#asset-empty");
const assetChart = document.querySelector("#asset-chart");
const assetChartEmpty = document.querySelector("#asset-chart-empty");
const ASSET_STORAGE_KEY = "myaa-house-assets";
const MONTHLY_EXPENSE_STORAGE_KEY = "myaa-house-monthly-expenses";
const SVG_NS = "http://www.w3.org/2000/svg";
const monthlyExpenseForm = document.querySelector("#monthly-expense-form");
const monthlyExpenseMonth = document.querySelector("#monthly-expense-month");
const monthlyExpenseAmount = document.querySelector("#monthly-expense-amount");
const monthlyExpenseList = document.querySelector("#monthly-expense-list");
const monthlyExpenseEmpty = document.querySelector("#monthly-expense-empty");
const monthlyExpenseStatus = document.querySelector("#monthly-expense-status");

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

function saveMonthlyExpenses(expenses) {
  localStorage.setItem(MONTHLY_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
}

function getMonthlyExpenses() {
  try {
    const expenses = JSON.parse(localStorage.getItem(MONTHLY_EXPENSE_STORAGE_KEY));
    return Array.isArray(expenses) ? expenses : [];
  } catch {
    return [];
  }
}

function formatAmountInput(value) {
  const digits = value.replace(/[^0-9]/g, "");
  return digits === "" ? "" : Number(digits).toLocaleString("ja-JP");
}

function formatMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${year}年${monthNumber}月`;
}

function previousMonthKey(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return date.toLocaleDateString("sv-SE").slice(0, 7);
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

function renderMonthlyExpenses() {
  const expenses = getMonthlyExpenses().sort((a, b) => a.month.localeCompare(b.month));
  const expensesByMonth = new Map(expenses.map((expense) => [expense.month, expense]));
  monthlyExpenseList.replaceChildren();
  monthlyExpenseEmpty.hidden = expenses.length > 0;

  [...expenses].reverse().forEach((expense) => {
    const previousExpense = expensesByMonth.get(previousMonthKey(expense.month));
    const difference = previousExpense ? expense.amount - previousExpense.amount : null;
    const differenceClass = difference === null ? "" : difference > 0 ? "expense-increase" : difference < 0 ? "expense-decrease" : "";
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${formatMonth(expense.month)}</td>
      <td>${formatAmount(expense.amount)}</td>
      <td class="${differenceClass}">${formatDifference(difference)}</td>
      <td><button class="item-action delete-button" type="button">削除</button></td>
    `;

    row.querySelector("button").addEventListener("click", () => {
      if (!window.confirm(`${formatMonth(expense.month)}の支出記録を削除しますか？`)) return;
      saveMonthlyExpenses(getMonthlyExpenses().filter((item) => item.id !== expense.id));
      monthlyExpenseStatus.textContent = `${formatMonth(expense.month)}の記録を削除しました。`;
      renderMonthlyExpenses();
    });
    monthlyExpenseList.append(row);
  });
}

assetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = assetDate.value;
  const amount = Number(assetAmount.value.replaceAll(",", ""));
  if (!date || Number.isNaN(amount) || amount < 0) return;

  const assets = getAssets();
  assets.push({ id: crypto.randomUUID(), date, amount });
  saveAssets(assets);
  assetForm.reset();
  assetDate.value = new Date().toLocaleDateString("sv-SE");
  assetDate.focus();
  renderAssets();
});

assetAmount.addEventListener("input", () => {
  assetAmount.value = formatAmountInput(assetAmount.value);
});

monthlyExpenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const month = monthlyExpenseMonth.value;
  const amount = Number(monthlyExpenseAmount.value.replaceAll(",", ""));
  if (!month || !Number.isInteger(amount) || amount < 0) return;

  const expenses = getMonthlyExpenses();
  const existingExpense = expenses.find((expense) => expense.month === month);
  if (existingExpense && !window.confirm(`${formatMonth(month)}の記録を上書きしますか？`)) return;

  if (existingExpense) {
    existingExpense.amount = amount;
  } else {
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    expenses.push({ id, month, amount });
  }

  saveMonthlyExpenses(expenses);
  monthlyExpenseAmount.value = "";
  monthlyExpenseStatus.textContent = `${formatMonth(month)}の支出 ${formatAmount(amount)}を記録しました。`;
  renderMonthlyExpenses();
  monthlyExpenseAmount.focus();
});

monthlyExpenseAmount.addEventListener("input", () => {
  monthlyExpenseAmount.value = formatAmountInput(monthlyExpenseAmount.value);
});

assetDate.value = new Date().toLocaleDateString("sv-SE");
monthlyExpenseMonth.value = new Date().toLocaleDateString("sv-SE").slice(0, 7);
renderAssets();
renderMonthlyExpenses();
