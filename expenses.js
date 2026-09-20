const EXPENSE_STORAGE_KEY = "myaa-house-expenses";
const LAST_PAYMENT_KEY = "myaa-house-expense-last-payment";

const paymentLabels = { cash: "現金", paypay: "PayPay", credit: "クレジット" };
const categoryLabels = { food: "食費", daily: "日用品費", other: "その他" };
const categoryIcons = { food: "🍚", daily: "🧻", other: "📦" };
const foodCategoryLabels = {
  grocery: "食材・スーパー",
  dining: "外食",
  treat: "嗜好品",
};

const expenseForm = document.querySelector("#expense-form");
const expenseDate = document.querySelector("#expense-date");
const expenseAmount = document.querySelector("#expense-amount");
const expensePayment = document.querySelector("#expense-payment");
const expenseCategory = document.querySelector("#expense-category");
const expenseFoodCategory = document.querySelector("#expense-food-category");
const foodCategoryField = document.querySelector("#food-category-field");
const expenseMemo = document.querySelector("#expense-memo");
const expenseFilter = document.querySelector("#expense-filter");
const foodFilter = document.querySelector("#food-filter");
const foodFilterField = document.querySelector("#food-filter-field");
const foodBreakdownToggle = document.querySelector("#food-breakdown-toggle");
const foodBreakdown = document.querySelector("#food-breakdown");
const previousFoodBreakdownToggle = document.querySelector("#previous-food-breakdown-toggle");
const previousFoodBreakdown = document.querySelector("#previous-food-breakdown");

function localDate(date = new Date()) {
  return date.toLocaleDateString("sv-SE");
}

function monthKey(date) {
  return localDate(new Date(date.getFullYear(), date.getMonth(), 1)).slice(0, 7);
}

function getExpenses() {
  try {
    const expenses = JSON.parse(localStorage.getItem(EXPENSE_STORAGE_KEY));
    return Array.isArray(expenses) ? expenses : [];
  } catch {
    return [];
  }
}

function saveExpenses(expenses) {
  localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
}

function formatMoney(amount) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(amount);
}

function formatMonth(key) {
  const [year, month] = key.split("-").map(Number);
  return `${year}年${month}月`;
}

function sum(expenses) {
  return expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

function updateFoodCategoryVisibility() {
  const isFood = expenseCategory.value === "food";
  foodCategoryField.hidden = !isFood;
  expenseFoodCategory.disabled = !isFood;
  if (isFood) expenseFoodCategory.value = "grocery";
}

function matchesFilter(expense) {
  if (expenseFilter.value === "all") return true;
  if (expense.category !== expenseFilter.value) return false;
  if (expenseFilter.value === "food" && foodFilter.value !== "all") {
    return expense.foodCategory === foodFilter.value;
  }
  return true;
}

function createExpenseItem(expense) {
  const item = document.createElement("li");
  const main = document.createElement("div");
  main.className = "expense-item-main";
  const heading = document.createElement("div");
  heading.className = "expense-item-heading";
  const category = document.createElement("strong");
  const foodDetail = expense.category === "food" && foodCategoryLabels[expense.foodCategory]
    ? `・${foodCategoryLabels[expense.foodCategory]}`
    : "";
  category.textContent = `${categoryIcons[expense.category] || "📦"} ${categoryLabels[expense.category] || "その他"}${foodDetail}`;
  const amount = document.createElement("strong");
  amount.className = "expense-item-amount";
  amount.textContent = formatMoney(expense.amount);
  heading.append(category, amount);

  const details = document.createElement("small");
  const displayDate = String(expense.date).replaceAll("-", "/");
  details.textContent = `${displayDate}・${paymentLabels[expense.payment] || expense.payment}`;
  main.append(heading, details);
  if (expense.memo) {
    const memo = document.createElement("p");
    memo.textContent = expense.memo;
    main.append(memo);
  }

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "item-action delete-button";
  deleteButton.textContent = "消す";
  deleteButton.setAttribute("aria-label", `${displayDate}の${formatMoney(expense.amount)}の支出を削除`);
  deleteButton.addEventListener("click", () => {
    if (!window.confirm("この支出記録を削除しますか？")) return;
    saveExpenses(getExpenses().filter((itemExpense) => itemExpense.id !== expense.id));
    renderExpenses();
  });

  item.append(main, deleteButton);
  return item;
}

function renderMonthList(listSelector, emptySelector, expenses) {
  const list = document.querySelector(listSelector);
  list.replaceChildren();
  document.querySelector(emptySelector).hidden = expenses.length > 0;
  expenses.forEach((expense) => list.append(createExpenseItem(expense)));
}

function renderExpenses() {
  const now = new Date();
  const currentMonth = monthKey(now);
  const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const allExpenses = getExpenses();
  const currentExpenses = allExpenses.filter((expense) => String(expense.date).startsWith(currentMonth));
  const previousExpenses = allExpenses.filter((expense) => String(expense.date).startsWith(previousMonth));

  document.querySelector("#expense-month-total").textContent = formatMoney(sum(currentExpenses));
  ["food", "daily", "other"].forEach((category) => {
    document.querySelector(`#${category}-total`).textContent = formatMoney(
      sum(currentExpenses.filter((expense) => expense.category === category)),
    );
  });
  ["grocery", "dining", "treat"].forEach((foodCategory) => {
    document.querySelector(`#${foodCategory}-total`).textContent = formatMoney(
      sum(currentExpenses.filter((expense) => expense.category === "food" && expense.foodCategory === foodCategory)),
    );
  });

  document.querySelector("#previous-month-total").textContent = formatMoney(sum(previousExpenses));
  ["food", "daily", "other"].forEach((category) => {
    document.querySelector(`#previous-${category}-total`).textContent = formatMoney(
      sum(previousExpenses.filter((expense) => expense.category === category)),
    );
  });
  ["grocery", "dining", "treat"].forEach((foodCategory) => {
    document.querySelector(`#previous-${foodCategory}-total`).textContent = formatMoney(
      sum(previousExpenses.filter((expense) => expense.category === "food" && expense.foodCategory === foodCategory)),
    );
  });

  foodFilterField.hidden = expenseFilter.value !== "food";
  const visibleExpenses = currentExpenses
    .filter(matchesFilter)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  document.querySelector("#filtered-total").textContent = `表示中 ${formatMoney(sum(visibleExpenses))}`;
  document.querySelector("#current-expense-title").textContent = formatMonth(currentMonth);
  document.querySelector("#previous-expense-month").textContent = formatMonth(previousMonth);
  renderMonthList(
    "#current-expense-list",
    "#current-expense-empty",
    visibleExpenses.filter((expense) => String(expense.date).startsWith(currentMonth)),
  );
}

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(expenseAmount.value);
  if (!expenseDate.value || !Number.isInteger(amount) || amount < 1) return;

  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const expense = {
    id,
    date: expenseDate.value,
    amount,
    payment: expensePayment.value,
    category: expenseCategory.value,
    foodCategory: expenseCategory.value === "food" ? expenseFoodCategory.value : null,
    memo: expenseMemo.value.trim(),
    createdAt: new Date().toISOString(),
  };
  saveExpenses([...getExpenses(), expense]);
  localStorage.setItem(LAST_PAYMENT_KEY, expensePayment.value);
  expenseAmount.value = "";
  expenseMemo.value = "";
  expenseFoodCategory.value = "grocery";
  document.querySelector("#expense-status").textContent = `${formatMoney(amount)}を記録しました。`;
  renderExpenses();
  expenseAmount.focus();
});

expenseCategory.addEventListener("change", updateFoodCategoryVisibility);
expenseFilter.addEventListener("change", () => {
  if (expenseFilter.value !== "food") foodFilter.value = "all";
  renderExpenses();
});
foodFilter.addEventListener("change", renderExpenses);

function setupBreakdownToggle(toggle, breakdown) {
  toggle.addEventListener("click", () => {
    const willOpen = breakdown.hidden;
    breakdown.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
    toggle.textContent = willOpen ? "内訳を閉じる" : "内訳";
  });
}

setupBreakdownToggle(foodBreakdownToggle, foodBreakdown);
setupBreakdownToggle(previousFoodBreakdownToggle, previousFoodBreakdown);

expenseDate.value = localDate();
expenseDate.max = localDate();
const savedPayment = localStorage.getItem(LAST_PAYMENT_KEY);
if (savedPayment && paymentLabels[savedPayment]) expensePayment.value = savedPayment;
updateFoodCategoryVisibility();
renderExpenses();
