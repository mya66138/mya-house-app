const EXPENSE_STORAGE_KEY = "myaa-house-expenses";
const FIXED_EXPENSE_STORAGE_KEY = "myaa-house-fixed-expenses";
const FIXED_EXPENSE_EXCLUSION_STORAGE_KEY = "myaa-house-fixed-expense-exclusions";
const LAST_PAYMENT_KEY = "myaa-house-expense-last-payment";

const paymentLabels = { cash: "現金", paypay: "PayPay", credit: "クレジット", bank: "銀行引き落とし" };
const categoryLabels = { food: "食費", daily: "日用品費", fixed: "固定費", other: "その他" };
const categoryIcons = { food: "🍚", daily: "🧻", fixed: "🏠", other: "📦" };
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
const previousExpenseFilter = document.querySelector("#previous-expense-filter");
const previousFoodFilter = document.querySelector("#previous-food-filter");
const previousFoodFilterField = document.querySelector("#previous-food-filter-field");
const fixedExpenseForm = document.querySelector("#fixed-expense-form");
const fixedExpenseName = document.querySelector("#fixed-expense-name");
const fixedExpenseAmount = document.querySelector("#fixed-expense-amount");
const fixedExpensePayment = document.querySelector("#fixed-expense-payment");
const fixedExpenseCategory = document.querySelector("#fixed-expense-category");
const fixedExpenseList = document.querySelector("#fixed-expense-list");
const fixedExpenseEmpty = document.querySelector("#fixed-expense-empty");
const fixedExpenseStatus = document.querySelector("#fixed-expense-status");

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

function getFixedExpenses() {
  try {
    const expenses = JSON.parse(localStorage.getItem(FIXED_EXPENSE_STORAGE_KEY));
    return Array.isArray(expenses) ? expenses : [];
  } catch {
    return [];
  }
}

function saveFixedExpenses(expenses) {
  localStorage.setItem(FIXED_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
}

function getFixedExpenseExclusions() {
  try {
    const exclusions = JSON.parse(localStorage.getItem(FIXED_EXPENSE_EXCLUSION_STORAGE_KEY));
    return Array.isArray(exclusions) ? exclusions : [];
  } catch {
    return [];
  }
}

function saveFixedExpenseExclusions(exclusions) {
  localStorage.setItem(FIXED_EXPENSE_EXCLUSION_STORAGE_KEY, JSON.stringify(exclusions));
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
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

function ensureFixedExpensesForMonth(month) {
  const fixedExpenses = getFixedExpenses();
  const expenses = getExpenses();
  const exclusions = getFixedExpenseExclusions();
  const missingExpenses = fixedExpenses.filter(
    (expense) => !exclusions.includes(`${expense.id}:${month}`),
  ).filter(
    (fixedExpense) => !expenses.some(
      (expense) => expense.fixedExpenseId === fixedExpense.id && String(expense.date).startsWith(month),
    ),
  );

  if (missingExpenses.length === 0) return expenses;

  const newExpenses = missingExpenses.map((fixedExpense) => ({
    id: createId(),
    date: `${month}-01`,
    amount: fixedExpense.amount,
    payment: fixedExpense.payment,
    category: fixedExpense.category,
    foodCategory: null,
    memo: fixedExpense.name,
    createdAt: new Date().toISOString(),
    fixedExpenseId: fixedExpense.id,
    fixedExpenseStatus: "planned",
  }));
  const updatedExpenses = [...expenses, ...newExpenses];
  saveExpenses(updatedExpenses);
  return updatedExpenses;
}

function updateFoodCategoryVisibility() {
  const isFood = expenseCategory.value === "food";
  foodCategoryField.hidden = !isFood;
  expenseFoodCategory.disabled = !isFood;
  if (isFood) expenseFoodCategory.value = "grocery";
}

function matchesFilter(expense, categoryFilter, foodCategoryFilter) {
  if (categoryFilter.value === "all") return true;
  if (expense.category !== categoryFilter.value) return false;
  if (categoryFilter.value === "food" && foodCategoryFilter.value !== "all") {
    return expense.foodCategory === foodCategoryFilter.value;
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
  if (expense.fixedExpenseId) {
    const fixedStatus = document.createElement("span");
    fixedStatus.className = `fixed-expense-status-badge ${expense.fixedExpenseStatus === "confirmed" ? "is-confirmed" : "is-planned"}`;
    fixedStatus.textContent = expense.fixedExpenseStatus === "confirmed" ? "固定費・確定" : "固定費・予定";
    main.append(fixedStatus);
  }
  if (expense.memo) {
    const memo = document.createElement("p");
    memo.textContent = expense.memo;
    main.append(memo);
  }

  if (expense.fixedExpenseId) {
    item.append(main);
    return item;
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

function renderFixedExpenses() {
  const fixedExpenses = getFixedExpenses();
  const currentMonth = monthKey(new Date());
  const currentMonthExpenses = getExpenses().filter((expense) => String(expense.date).startsWith(currentMonth));
  const exclusions = getFixedExpenseExclusions();
  fixedExpenseList.replaceChildren();
  fixedExpenseEmpty.hidden = fixedExpenses.length > 0;

  fixedExpenses.forEach((expense) => {
    const item = document.createElement("li");
    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = expense.name;
    const summary = document.createElement("small");
    summary.textContent = `${formatMoney(expense.amount)}・${paymentLabels[expense.payment]}・${categoryLabels[expense.category]}`;
    details.append(name, summary);

    const currentExpense = currentMonthExpenses.find((itemExpense) => itemExpense.fixedExpenseId === expense.id);
    const exclusion = `${expense.id}:${currentMonth}`;
    if (currentExpense) {
      const monthlyState = document.createElement("small");
      monthlyState.className = "fixed-expense-current-state";
      monthlyState.textContent = `今月：${currentExpense.fixedExpenseStatus === "confirmed" ? "確定" : "予定"} ${formatMoney(currentExpense.amount)}`;
      details.append(monthlyState);
    } else if (exclusions.includes(exclusion)) {
      const monthlyState = document.createElement("small");
      monthlyState.className = "fixed-expense-current-state";
      monthlyState.textContent = "今月：除外済み";
      details.append(monthlyState);
    }

    const actions = document.createElement("div");
    actions.className = "fixed-expense-item-actions";
    if (currentExpense) {
      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = "item-action fixed-confirm-button";
      const isConfirmed = currentExpense.fixedExpenseStatus === "confirmed";
      confirmButton.textContent = isConfirmed ? "予定に戻す" : "確定する";
      confirmButton.addEventListener("click", () => {
        saveExpenses(getExpenses().map((itemExpense) => (
          itemExpense.id === currentExpense.id
            ? { ...itemExpense, fixedExpenseStatus: isConfirmed ? "planned" : "confirmed" }
            : itemExpense
        )));
        renderExpenses();
      });
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "item-action fixed-edit-button";
      editButton.textContent = "今月だけ変更";
      editButton.addEventListener("click", () => {
        const value = window.prompt("この月の固定費の金額を入力してください。", String(currentExpense.amount));
        if (value === null) return;
        const amount = Number(value.replaceAll(",", "").trim());
        if (!Number.isInteger(amount) || amount < 1) {
          window.alert("1円以上の整数を入力してください。");
          return;
        }
        saveExpenses(getExpenses().map((itemExpense) => (
          itemExpense.id === currentExpense.id ? { ...itemExpense, amount } : itemExpense
        )));
        renderExpenses();
      });
      const removeMonthButton = document.createElement("button");
      removeMonthButton.type = "button";
      removeMonthButton.className = "item-action delete-button";
      removeMonthButton.textContent = "今月は除外";
      removeMonthButton.addEventListener("click", () => {
        if (!window.confirm("今月分の固定費を支出から除外しますか？固定費の登録自体は残ります。")) return;
        if (!exclusions.includes(exclusion)) saveFixedExpenseExclusions([...exclusions, exclusion]);
        saveExpenses(getExpenses().filter((itemExpense) => itemExpense.id !== currentExpense.id));
        renderExpenses();
      });
      actions.append(confirmButton, editButton, removeMonthButton);
    } else if (exclusions.includes(exclusion)) {
      const restoreMonthButton = document.createElement("button");
      restoreMonthButton.type = "button";
      restoreMonthButton.className = "item-action fixed-confirm-button";
      restoreMonthButton.textContent = "今月に戻す";
      restoreMonthButton.addEventListener("click", () => {
        saveFixedExpenseExclusions(getFixedExpenseExclusions().filter((itemExclusion) => itemExclusion !== exclusion));
        ensureFixedExpensesForMonth(currentMonth);
        renderExpenses();
      });
      actions.append(restoreMonthButton);
    }
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "item-action delete-button";
    deleteButton.textContent = "消す";
    deleteButton.addEventListener("click", () => {
      if (!window.confirm(`「${expense.name}」の固定費登録を削除しますか？過去の支出記録は残ります。`)) return;
      saveFixedExpenses(getFixedExpenses().filter((itemExpense) => itemExpense.id !== expense.id));
      renderExpenses();
    });
    actions.append(deleteButton);
    item.append(details, actions);
    fixedExpenseList.append(item);
  });
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
  const allExpenses = ensureFixedExpensesForMonth(currentMonth);
  const currentExpenses = allExpenses.filter((expense) => String(expense.date).startsWith(currentMonth));
  const previousExpenses = allExpenses.filter((expense) => String(expense.date).startsWith(previousMonth));

  document.querySelector("#expense-month-total").textContent = formatMoney(sum(currentExpenses));
  ["food", "daily", "fixed", "other"].forEach((category) => {
    document.querySelector(`#${category}-total`).textContent = formatMoney(
      sum(currentExpenses.filter((expense) => expense.category === category)),
    );
  });
  document.querySelector("#previous-month-total").textContent = formatMoney(sum(previousExpenses));
  ["food", "daily", "fixed", "other"].forEach((category) => {
    document.querySelector(`#previous-${category}-total`).textContent = formatMoney(
      sum(previousExpenses.filter((expense) => expense.category === category)),
    );
  });
  foodFilterField.hidden = expenseFilter.value !== "food";
  previousFoodFilterField.hidden = previousExpenseFilter.value !== "food";
  const visibleExpenses = currentExpenses
    .filter((expense) => matchesFilter(expense, expenseFilter, foodFilter))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  const visiblePreviousExpenses = previousExpenses
    .filter((expense) => matchesFilter(expense, previousExpenseFilter, previousFoodFilter))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  document.querySelector("#filtered-total").textContent = `表示中 ${formatMoney(sum(visibleExpenses))}`;
  document.querySelector("#current-expense-title").textContent = formatMonth(currentMonth);
  document.querySelector("#previous-expense-month").textContent = formatMonth(previousMonth);
  document.querySelector("#previous-list-month-title").textContent = formatMonth(previousMonth);
  document.querySelector("#previous-filtered-total").textContent = `表示中 ${formatMoney(sum(visiblePreviousExpenses))}`;
  renderMonthList(
    "#current-expense-list",
    "#current-expense-empty",
    visibleExpenses.filter((expense) => String(expense.date).startsWith(currentMonth)),
  );
  renderMonthList(
    "#previous-expense-list",
    "#previous-expense-empty",
    visiblePreviousExpenses,
  );
  renderFixedExpenses();
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

fixedExpenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = fixedExpenseName.value.trim();
  const amount = Number(fixedExpenseAmount.value);
  if (!name || !Number.isInteger(amount) || amount < 1) return;

  saveFixedExpenses([
    ...getFixedExpenses(),
    {
      id: createId(),
      name,
      amount,
      payment: fixedExpensePayment.value,
      category: fixedExpenseCategory.value,
    },
  ]);
  ensureFixedExpensesForMonth(monthKey(new Date()));
  fixedExpenseName.value = "";
  fixedExpenseAmount.value = "";
  fixedExpenseStatus.textContent = `「${name}」を固定費に追加しました。今月分は予定として支出に含まれています。`;
  renderExpenses();
  fixedExpenseName.focus();
});

expenseCategory.addEventListener("change", updateFoodCategoryVisibility);
expenseFilter.addEventListener("change", () => {
  if (expenseFilter.value !== "food") foodFilter.value = "all";
  renderExpenses();
});
foodFilter.addEventListener("change", renderExpenses);
previousExpenseFilter.addEventListener("change", () => {
  if (previousExpenseFilter.value !== "food") previousFoodFilter.value = "all";
  renderExpenses();
});
previousFoodFilter.addEventListener("change", renderExpenses);

expenseDate.value = localDate();
expenseDate.max = localDate();
const savedPayment = localStorage.getItem(LAST_PAYMENT_KEY);
if (savedPayment && paymentLabels[savedPayment]) expensePayment.value = savedPayment;
updateFoodCategoryVisibility();
renderExpenses();
