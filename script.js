console.log("AligeIQ JavaScript is connected!");

// Load saved transactions from LocalStorage
const savedTransactions = localStorage.getItem("transactions");

// Use saved data if it exists, otherwise use sample transactions
const transactions = savedTransactions
    ? JSON.parse(savedTransactions)
    : [
        {
            description: "Monthly Salary",
            category: "Income",
            amount: 50000,
            date: "2026-08-01",
            type: "income"
        },
        {
            description: "Groceries",
            category: "Food",
            amount: 1200,
            date: "2026-08-05",
            type: "expense"
        },
        {
            description: "Netflix",
            category: "Entertainment",
            amount: 649,
            date: "2026-08-10",
            type: "expense"
        }
    ];

    // Store chart objects so we can update them later
let categoryChart;
let monthlyChart;
let goals = [];

// form references
// Get the transaction form
const transactionForm = document.getElementById("transaction-form");
// Get the budget form
const budgetForm = document.getElementById("budget-form");
// Get the goal form from HTML
const goalForm = document.getElementById("goal-form");
const goalNameInput = document.getElementById("goal-name");
const goalTargetInput = document.getElementById("goal-target");
const goalSavedInput = document.getElementById("goal-saved");


goalForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = goalNameInput.value.trim();
    const targetAmount = Number(goalTargetInput.value);
    const savedAmount = Number(goalSavedInput.value);

    try {
        const response = await fetch(
            "http://localhost:3000/api/goals",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    targetAmount: targetAmount,
                    savedAmount: savedAmount
                })
            }
        );

        if (!response.ok) {
            throw new Error("Could not add goal");
        }

        // Get the newly saved goal from PostgreSQL
        const savedGoal = await response.json();

        // Add it to our existing frontend array
        goals.push(savedGoal);

        // Update the display immediately
        updateGoalList();

        // Clear the form
        goalForm.reset();

    } catch (error) {
        console.error("Error adding goal:", error);
        alert("Could not add goal.");
    }
});



budgetForm.addEventListener("submit", async function (event) {
    // Prevent the page from refreshing
    event.preventDefault();

    // Get values from the form
    const category = document
        .getElementById("budget-category")
        .value
        .trim();

    const amount = Number(
        document.getElementById("budget-amount").value
    );

    try {
        // Send the new budget to the backend
        const response = await fetch(
            "http://localhost:3000/api/budgets",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category: category,
                    amount: amount
                })
            }
        );

        // Check whether the backend saved it
        if (!response.ok) {
            throw new Error("Could not save budget");
        }

        // Get the saved budget back from PostgreSQL
        const savedBudget = await response.json();

        // Add the database budget to the frontend array
        budgets.push(savedBudget);

        // Update the budget display
        updateBudgetList();

        // Clear the form
        budgetForm.reset();

        console.log("Budget saved:", savedBudget);

    } catch (error) {
        console.error("Error saving budget:", error);
        alert(
            "Budget could not be saved. Make sure the backend is running."
        );
    }
});


// Get search and filter controls
const searchTransaction = document.getElementById("search-transaction");
const filterType = document.getElementById("filter-type");
// Update the list while the user types
searchTransaction.addEventListener("input", updateTransactionList);

// Update the list when the filter changes
filterType.addEventListener("change", updateTransactionList);

// Stores the index of the transaction currently being edited
let editingIndex = null;


transactionForm.addEventListener("submit", async function (event) {
    // Prevent the page from refreshing
    event.preventDefault();

    // Read values from the form
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const date = document.getElementById("date").value;
    const type = document.getElementById("type").value;

    // Create the new transaction object
    const newTransaction = {
        description: description,
        category: category,
        amount: amount,
        date: date,
        type: type
    };

    try {
        // Send the transaction to the backend
        const response = await fetch(
            "http://localhost:3000/api/transactions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newTransaction)
            }
        );

        // Check whether the backend accepted it
        if (!response.ok) {
            throw new Error("Could not save transaction");
        }

        // Get the saved transaction from the backend
        const savedTransaction = await response.json();

        // Add it to the frontend array
        transactions.push(savedTransaction);

        // Update EVERYTHING that depends on transactions
        updateDashboard();
        updateTransactionList();
        updateCategoryAnalysis();
        updateCategoryChart();
        updateMonthlyChart();
        updateInsights();
        updateBudgetList();
        updateGoalList();

        // Clear the form
        transactionForm.reset();

        console.log(
            "Transaction successfully saved:",
            savedTransaction
        );

    } catch (error) {
        console.error("Error saving transaction:", error);
        alert("Transaction could not be saved. Make sure the backend server is running.");
    }
});

// Load saved budgets from localStorage
const savedBudgets = localStorage.getItem("budgets");

// Calculate and update all financial KPIs
function updateDashboard() {
    let totalIncome = 0;
    let totalExpenses = 0;

    // Check every transaction
    for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].type === "income") {
        totalIncome += Number(transactions[i].amount);
    } else if (transactions[i].type === "expense") {
        totalExpenses += Number(transactions[i].amount);
    }
}

    // Calculate remaining balance
    const currentBalance = totalIncome - totalExpenses;

    // Calculate savings rate
    const savingsRate =
        totalIncome > 0
            ? (currentBalance / totalIncome) * 100
            : 0;

    // Update all dashboard cards
    document.getElementById("total-income").textContent =
        `₹${totalIncome.toLocaleString("en-IN")}`;

    document.getElementById("total-expenses").textContent =
        `₹${totalExpenses.toLocaleString("en-IN")}`;

    document.getElementById("current-balance").textContent =
        `₹${currentBalance.toLocaleString("en-IN")}`;

    document.getElementById("savings-rate").textContent =
        `${savingsRate.toFixed(1)}%`;
}

// Use saved budgets, or start with an empty array
const budgets = savedBudgets
    ? JSON.parse(savedBudgets)
    : [];


// Display transactions on the dashboard
// Display transactions on the dashboard
function updateTransactionList() {
    const transactionList = document.getElementById("transaction-list");

    // Remove old displayed transactions
    transactionList.innerHTML = "";

    // Show a message when there are no transactions
if (transactions.length === 0) {
    transactionList.innerHTML = `
        <p class="empty-state">
            No transactions yet. Add your first income or expense below.
        </p>
    `;

    return;
}

    // Get the current search text
const searchText = searchTransaction.value.toLowerCase();

// Get the selected transaction type
const selectedType = filterType.value;

    // Display newest transactions first
    for (let i = transactions.length - 1; i >= 0; i--) {
        const transaction = transactions[i];
        // Check if this transaction matches the search
const matchesSearch =
    transaction.description.toLowerCase().includes(searchText) ||
    transaction.category.toLowerCase().includes(searchText);

// Check if it matches the selected type
const matchesType =
    selectedType === "all" ||
    transaction.type === selectedType;

// Skip transactions that don't match
if (!matchesSearch || !matchesType) {
    continue;
}

        // Show + for income and - for expenses
        const sign =
            transaction.type === "income" ? "+" : "-";

        transactionList.innerHTML += `
            <div class="transaction-item">
                <div>
                    <h3>${transaction.description}</h3>
                    <p>${transaction.category} · ${transaction.date}</p>
                </div>

                <div class="transaction-actions">
                    <span>${sign}₹${transaction.amount.toLocaleString("en-IN")}</span>

                    <!-- Store the array index so JavaScript knows what to delete -->
                    <!-- Use the actual PostgreSQL transaction ID -->
<button onclick="editTransaction(${transaction.id})">Edit</button>
<button onclick="deleteTransaction(${transaction.id})">Delete</button>
                </div>
            </div>
        `;
    }
}

// Analyze total expenses for each category
function updateCategoryAnalysis() {
    // Object to store total spending for each category
    const categoryTotals = {};

    // Check every transaction
    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        // Only include expenses
        if (transaction.type === "expense") {

            // Create the category if it doesn't exist yet
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }

            // Add the expense amount to that category
            categoryTotals[transaction.category] += transaction.amount;
        }
    }

    // Get the category analysis container
    const categoryList = document.getElementById("category-list");

    // Clear old results
    categoryList.innerHTML = "";

    // Calculate total expenses across all categories
    let totalCategoryExpenses = 0;

    for (const category in categoryTotals) {
        totalCategoryExpenses += categoryTotals[category];
    }

    // Display each category
    for (const category in categoryTotals) {
        // Calculate the percentage of total expenses
        const percentage =
            (categoryTotals[category] / totalCategoryExpenses) * 100;

        categoryList.innerHTML += `
            <div class="category-item">
                <div>
                    <span>${category}</span>
                    <p>${percentage.toFixed(1)}% of total expenses</p>
                </div>

                <strong>₹${categoryTotals[category].toLocaleString("en-IN")}</strong>
            </div>
        `;
    }
}


// Create or update the spending chart
function updateCategoryChart() {
    const categoryTotals = {};

    // Calculate spending for each expense category
    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        if (transaction.type === "expense") {
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }

            categoryTotals[transaction.category] += transaction.amount;
        }
    }

    
    // Get category names and their spending totals
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Get the canvas from HTML
    const chartCanvas = document.getElementById("category-chart");

    // If there are no expense categories, don't display a chart
if (labels.length === 0) {
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }

    return;
}

    // Destroy the old chart before creating a new one
    if (categoryChart) {
        categoryChart.destroy();
    }

    /// Create the new chart
categoryChart = new Chart(chartCanvas, {
    type: "doughnut",

    data: {
        labels: labels,
        datasets: [{
            label: "Spending",
            data: data
        }]
    },

    // Chart settings
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});
}

// Create or update the monthly spending trend chart
function updateMonthlyChart() {
    // Object to store total expenses for each month
    const monthlyTotals = {};

    // Check every transaction
    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        // Only expenses should be included in spending trends
        if (transaction.type === "expense") {

            // Get YYYY-MM from a date like 2026-08-23
            const month = transaction.date.slice(0, 7);

            // Create the month if it does not exist yet
            if (!monthlyTotals[month]) {
                monthlyTotals[month] = 0;
            }

            // Add this expense to that month's total
            monthlyTotals[month] += transaction.amount;
        }
    }

    // Get the month names and spending amounts
    const labels = Object.keys(monthlyTotals);
    const data = Object.values(monthlyTotals);

    // Get the chart canvas from HTML
    const chartCanvas = document.getElementById("monthly-chart");

    // If there is no expense data, remove the chart
if (data.length === 0 || data.every(amount => amount === 0)) {
    if (monthlyChart) {
        monthlyChart.destroy();
        monthlyChart = null;
    }

    return;
}

    // Remove the old chart before creating an updated one
    if (monthlyChart) {
        monthlyChart.destroy();
    }

    // Create the line chart
    monthlyChart = new Chart(chartCanvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Monthly Expenses",
                data: data
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Generate useful insights from transaction data
function updateInsights() {
    // Store total expenses for each month
    const monthlyTotals = {};

    // Go through all transactions
    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        // Only analyze expenses
        if (transaction.type === "expense") {
            // Extract YYYY-MM from the date
            const month = transaction.date.slice(0, 7);

            // Create the month if needed
            if (!monthlyTotals[month]) {
                monthlyTotals[month] = 0;
            }

            // Add this transaction to the month's spending
            monthlyTotals[month] += transaction.amount;
        }
    }

    // Get all months and sort them chronologically
    const months = Object.keys(monthlyTotals).sort();

    // Get the insights container
    const insightsList = document.getElementById("insights-list");

    // Clear old insights
    insightsList.innerHTML = "";

    // Show a message when there is no financial data
if (transactions.length === 0) {
    insightsList.innerHTML = `
        <p class="empty-state">
            Add some transactions to receive personalized financial insights.
        </p>
    `;

    return;
}

    // We need at least two months to compare
    if (months.length < 2) {
        insightsList.innerHTML = `
            <div class="insight-item">
                Add transactions from at least two different months
                to see spending trends.
            </div>
        `;
        return;
    }

    // Get the latest month and the month before it
    const latestMonth = months[months.length - 1];
    const previousMonth = months[months.length - 2];

    const latestSpending = monthlyTotals[latestMonth];
    const previousSpending = monthlyTotals[previousMonth];

    // Calculate percentage change
    const percentageChange =
        ((latestSpending - previousSpending) / previousSpending) * 100;

    // Decide whether spending increased or decreased
    const trend =
        percentageChange > 0 ? "increased" : "decreased";

    // Display the insight
    insightsList.innerHTML = `
        <div class="insight-item">
            Your spending <strong>${trend}</strong> by
            <strong>${Math.abs(percentageChange).toFixed(1)}%</strong>
            compared with the previous month.
        </div>
    `;
}
function updateBudgetList() {
    const budgetList = document.getElementById("budget-list");

    budgetList.innerHTML = "";

    if (budgets.length === 0) {
        budgetList.innerHTML =
            "<p>No budgets yet. Set your first spending limit above.</p>";

        return;
    }

    budgets.forEach(budget => {
        const spent = transactions
            .filter(transaction =>
                transaction.type === "expense" &&
                transaction.category.toLowerCase() ===
                    budget.category.toLowerCase()
            )
            .reduce(
                (total, transaction) =>
                    total + Number(transaction.amount),
                0
            );

        const budgetAmount = Number(budget.amount);

        const percentageUsed =
            budgetAmount > 0
                ? Math.min((spent / budgetAmount) * 100, 100)
                : 0;

        budgetList.innerHTML += `
            <div class="budget-item">
                <div class="item-header">
                    <h3>${budget.category}</h3>

                    <div class="item-actions">
                        <button
                            class="action-button edit-button"
                            onclick="editBudget(${budget.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="action-button delete-button"
                            onclick="deleteBudget(${budget.id}, '${budget.category}')"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <p>
                    ₹${spent.toFixed(2)} spent of
                    ₹${budgetAmount.toFixed(2)}
                </p>

                <div class="progress-bar">
                    <div
                        class="progress-fill"
                        style="width: ${percentageUsed}%"
                    ></div>
                </div>

                <p>${percentageUsed.toFixed(1)}% used</p>
            </div>
        `;
    });
}

async function editBudget(id) {
    // Find the budget in the frontend array
    const budget = budgets.find(
        budget => Number(budget.id) === Number(id)
    );

    if (!budget) {
        alert("Budget not found.");
        return;
    }

    // Ask for the updated category
    const category = prompt(
        "Category:",
        budget.category
    );

    // Stop if the user cancels
    if (category === null) {
        return;
    }

    // Ask for the updated amount
    const amount = prompt(
        "Monthly budget amount:",
        budget.amount
    );

    // Stop if the user cancels
    if (amount === null) {
        return;
    }

    const updatedCategory = category.trim();
    const updatedAmount = Number(amount);

    // Validate the values
    if (!updatedCategory) {
        alert("Category cannot be empty.");
        return;
    }

    if (!updatedAmount || updatedAmount <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/budgets/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category: updatedCategory,
                    amount: updatedAmount
                })
            }
        );

        if (!response.ok) {
            throw new Error("Could not update budget");
        }

        // Get the updated budget from the backend
        const updatedBudget = await response.json();

        // Find its position in the frontend array
        const budgetIndex = budgets.findIndex(
            budget => Number(budget.id) === Number(id)
        );

        // Replace the old budget
        if (budgetIndex !== -1) {
            budgets[budgetIndex] = updatedBudget;
        }

        // Refresh the display
        updateBudgetList();

        console.log(
            "Budget updated successfully:",
            updatedBudget
        );

    } catch (error) {
        console.error("Error editing budget:", error);
        alert(
            `Could not update the budget: ${error.message}`
        );
    }
}

async function deleteBudget(id, category) {
    const confirmDelete = confirm(
        `Delete the ${category} budget?`
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/budgets/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            const errorData = await response.json();

            throw new Error(
                errorData.message || "Could not delete budget"
            );
        }

       // Find the deleted budget in the existing array
const budgetIndex = budgets.findIndex(
    budget => Number(budget.id) === Number(id)
);

// Remove it from the existing array
if (budgetIndex !== -1) {
    budgets.splice(budgetIndex, 1);
}

        // Refresh the display
        updateBudgetList();

    } catch (error) {
        console.error("Error deleting budget:", error);
        alert(`Could not delete the budget: ${error.message}`);
    }
}
function updateGoalList() {
    const goalList = document.getElementById("goal-list");

    goalList.innerHTML = "";

    if (goals.length === 0) {
        goalList.innerHTML =
            "<p>No financial goals yet. Add your first goal above.</p>";
        return;
    }

    goals.forEach((goal) => {
        const targetAmount = Number(goal.target_amount);
        const savedAmount = Number(goal.saved_amount);

        const percentage =
            targetAmount > 0
                ? Math.min((savedAmount / targetAmount) * 100, 100)
                : 0;

        const goalItem = document.createElement("div");
        goalItem.classList.add("goal-item");

        goalItem.innerHTML = `
            <div class="item-header">
                <h3>${goal.name}</h3>

                <div class="item-actions">
                    <button
                        class="action-button edit-button"
                        onclick="editGoal(${goal.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="action-button delete-button"
                        onclick="deleteGoal(${goal.id}, '${goal.name}')"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <p>
                ₹${savedAmount.toLocaleString("en-IN")}
                saved of
                ₹${targetAmount.toLocaleString("en-IN")}
            </p>

            <div class="goal-progress">
                <div
                    class="goal-progress-bar"
                    style="width: ${percentage}%"
                ></div>
            </div>

            <p>${percentage.toFixed(1)}% completed</p>
        `;

        goalList.appendChild(goalItem);
    });
}


async function deleteGoal(id, name) {
    const confirmDelete = confirm(
        `Delete the ${name} goal?`
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/goals/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Could not delete goal");
        }

        const goalIndex = goals.findIndex(
            goal => Number(goal.id) === Number(id)
        );

        if (goalIndex !== -1) {
            goals.splice(goalIndex, 1);
        }

        updateGoalList();

    } catch (error) {
        console.error("Error deleting goal:", error);
        alert(`Could not delete the goal: ${error.message}`);
    }
}


async function editGoal(id) {
    const goal = goals.find(
        goal => Number(goal.id) === Number(id)
    );

    if (!goal) {
        return;
    }

    const name = prompt(
        "Goal name:",
        goal.name
    );

    const targetAmount = prompt(
        "Target amount:",
        goal.target_amount
    );

    const savedAmount = prompt(
        "Amount saved:",
        goal.saved_amount
    );

    if (
        name === null ||
        targetAmount === null ||
        savedAmount === null
    ) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/goals/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name.trim(),
                    targetAmount: Number(targetAmount),
                    savedAmount: Number(savedAmount)
                })
            }
        );

        if (!response.ok) {
            throw new Error("Could not update goal");
        }

        const updatedGoal = await response.json();

        const goalIndex = goals.findIndex(
            goal => Number(goal.id) === Number(id)
        );

        if (goalIndex !== -1) {
            goals[goalIndex] = updatedGoal;
        }

        updateGoalList();

    } catch (error) {
        console.error("Error editing goal:", error);
        alert(`Could not update the goal: ${error.message}`);
    }
}


async function addSavings(id) {
    const goal = goals.find(
        goal => Number(goal.id) === Number(id)
    );

    if (!goal) {
        return;
    }

    const amount = Number(
        prompt("How much do you want to add to this goal?")
    );

    if (!amount || amount <= 0) {
        return;
    }

    const newSavedAmount =
        Number(goal.saved_amount) + amount;

    try {
        const response = await fetch(
            `http://localhost:3000/api/goals/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: goal.name,
                    targetAmount: Number(goal.target_amount),
                    savedAmount: newSavedAmount
                })
            }
        );

        if (!response.ok) {
            throw new Error("Could not update savings");
        }

        const updatedGoal = await response.json();

        const goalIndex = goals.findIndex(
            goal => Number(goal.id) === Number(id)
        );

        if (goalIndex !== -1) {
            goals[goalIndex] = updatedGoal;
        }

        updateGoalList();

    } catch (error) {
        console.error("Error adding savings:", error);
        alert(`Could not add savings: ${error.message}`);
    }
}


async function editTransaction(id) {
    // Find the transaction we want to edit
    const transaction = transactions.find(
        transaction => transaction.id === id
    );

    // Stop if it doesn't exist
    if (!transaction) {
        return;
    }

    // Ask the user for updated values
    const description = prompt(
        "Description:",
        transaction.description
    );

    const category = prompt(
        "Category:",
        transaction.category
    );

    const amount = prompt(
        "Amount:",
        transaction.amount
    );

    // Stop if the user cancels
    if (description === null || category === null || amount === null) {
        return;
    }

    // Create the updated transaction
    const updatedTransaction = {
        description: description,
        category: category,
        amount: Number(amount),
        date: transaction.date,
        type: transaction.type
    };

    try {
        // Send the updated transaction to the backend
        const response = await fetch(
            `http://localhost:3000/api/transactions/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedTransaction)
            }
        );

        if (!response.ok) {
            throw new Error("Could not update transaction");
        }

        // Get the updated transaction back from the backend
        const savedTransaction = await response.json();

        // Find it in the frontend array
        const transactionIndex = transactions.findIndex(
            transaction => transaction.id === id
        );

        // Replace the old transaction with the backend version
        if (transactionIndex !== -1) {
            transactions[transactionIndex] = savedTransaction;
        }

        // Refresh everything
        updateDashboard();
        updateTransactionList();
        updateCategoryAnalysis();
        updateCategoryChart();
        updateMonthlyChart();
        updateInsights();
        updateBudgetList();
        updateGoalList();

        console.log("Transaction updated successfully");

    } catch (error) {
        console.error("Error updating transaction:", error);
        alert("Could not update transaction.");
    }
}


async function deleteTransaction(id) {
    try {
        // Ask the backend to delete this transaction
        const response = await fetch(
            `http://localhost:3000/api/transactions/${id}`,
            {
                method: "DELETE"
            }
        );

        // Stop if deletion failed
        if (!response.ok) {
            throw new Error("Could not delete transaction");
        }

        // Find the transaction in the frontend array
        const transactionIndex = transactions.findIndex(
            transaction => transaction.id === id
        );

        // Remove it from the frontend array
        if (transactionIndex !== -1) {
            transactions.splice(transactionIndex, 1);
        }

        // Refresh everything
        updateDashboard();
        updateTransactionList();
        updateCategoryAnalysis();
        updateCategoryChart();
        updateMonthlyChart();
        updateInsights();
        updateBudgetList();
        updateGoalList();

        console.log("Transaction deleted successfully");

    } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Could not delete transaction.");
    }
}



// Get all navigation links
const navLinks = document.querySelectorAll("nav a");

// Update the active navigation link when clicked
navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        // Remove active class from every link
        navLinks.forEach(function (navLink) {
            navLink.classList.remove("active");
        });

        // Add active class to the clicked link
        link.classList.add("active");
    });
});


// Sections connected to the navigation
const sections = document.querySelectorAll(
    "#dashboard, #transactions, #budgets, #goals, #insights"
);

// Change the active navigation link while scrolling
window.addEventListener("scroll", function () {
    let currentSection = "";

    // Check which section is currently visible
    sections.forEach(function (section) {
        const sectionTop = section.offsetTop;

        if (window.scrollY >= sectionTop - 150) {
            currentSection = section.id;
        }
    });

    // Update the active navigation link
    navLinks.forEach(function (link) {
        link.classList.remove("active");

        if (link.getAttribute("href") === `#${currentSection}`) {
            link.classList.add("active");
        }
    });
});

// Get the View All button
const viewAllButton = document.getElementById("view-all-button");

// Scroll to the transactions section when clicked
viewAllButton.addEventListener("click", function () {
    document.getElementById("transactions").scrollIntoView({
        behavior: "smooth"
    });

    // Clear any search text
    searchTransaction.value = "";

    // Show all transaction types
    filterType.value = "all";

    // Refresh the complete transaction list
    updateTransactionList();
});

// Load all transactions from the backend when the page opens
async function loadTransactions() {
    try {
        // Ask the backend for all transactions
        const response = await fetch(
            "http://localhost:3000/api/transactions"
        );

        // Check whether the request worked
        if (!response.ok) {
            throw new Error("Could not load transactions");
        }

        // Get the transactions from the backend
        const backendTransactions = await response.json();

        // Remove the old frontend data
        transactions.length = 0;

        // Add backend transactions to the frontend array
        transactions.push(...backendTransactions);

        // Update the whole dashboard
        updateDashboard();
        updateTransactionList();
        updateCategoryAnalysis();
        updateCategoryChart();
        updateMonthlyChart();
        updateInsights();
        updateBudgetList();
        updateGoalList();

        console.log(
            "Transactions loaded from backend:",
            transactions
        );

    } catch (error) {
        console.error("Error loading transactions:", error);
        alert(
            "Could not load data. Make sure the backend server is running."
        );
    }
}

async function loadGoals() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/goals"
        );

        if (!response.ok) {
            throw new Error("Could not load goals");
        }

        const backendGoals = await response.json();

        // Remove old frontend goals
        goals.length = 0;

        // Add goals from PostgreSQL
        goals.push(...backendGoals);

        // Show them on the page
        updateGoalList();

        console.log(
            "Goals loaded from backend:",
            goals
        );

    } catch (error) {
        console.error("Error loading goals:", error);
        alert("Could not load goals from the backend.");
    }
}

async function loadBudgets() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/budgets"
        );

        console.log("Budget response status:", response.status);

        if (!response.ok) {
            throw new Error("Could not load budgets");
        }

        const backendBudgets = await response.json();

        console.log("Budgets received:", backendBudgets);

        budgets.length = 0;

        budgets.push(...backendBudgets);

        console.log("Frontend budgets array:", budgets);

        updateBudgetList();

    } catch (error) {
        console.error("Error loading budgets:", error);
        alert("Could not load budgets from the backend.");
    }
}

// Load backend data when AligeIQ opens
loadTransactions();
loadBudgets();
loadGoals();

// ================================
// SIGNUP
// ================================

const signupForm = document.getElementById("signup-form");

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document
        .getElementById("signup-name")
        .value
        .trim();

    const email = document
        .getElementById("signup-email")
        .value
        .trim();

    const password = document
        .getElementById("signup-password")
        .value;

    try {
        const response = await fetch(
            "http://localhost:3000/api/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Could not create account"
            );
        }

        alert("Account created successfully!");

        // Clear the form
        signupForm.reset();

        console.log("New user:", data.user);

    } catch (error) {
        console.error("Signup error:", error);
        alert(error.message);
    }
});

// ================================
// SWITCH BETWEEN SIGNUP AND LOGIN
// ================================

const signupContainer =
    document.getElementById("signup-container");

const loginContainer =
    document.getElementById("login-container");

const showLoginButton =
    document.getElementById("show-login-button");

const showSignupButton =
    document.getElementById("show-signup-button");


// Show the Login form
showLoginButton.addEventListener("click", () => {
    signupContainer.style.display = "none";
    loginContainer.style.display = "block";
});


// Show the Signup form
showSignupButton.addEventListener("click", () => {
    loginContainer.style.display = "none";
    signupContainer.style.display = "block";
});

// ================================
// USER LOGIN
// ================================

const loginForm =
    document.getElementById("login-form");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document
        .getElementById("login-email")
        .value
        .trim();

    const password = document
        .getElementById("login-password")
        .value;

    try {
        const response = await fetch(
            "http://localhost:3000/api/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Could not log in"
            );
        }

        // Save the logged-in user
localStorage.setItem(
    "loggedInUser",
    JSON.stringify(data.user)
);

alert(`Welcome back, ${data.user.name}!`);

console.log("Logged in user:", data.user);

// Clear the login form
loginForm.reset();

// Open the AligeIQ application
showApp();

    } catch (error) {
        console.error("Login error:", error);
        alert(error.message);
    }
});

// ================================
// LOGIN SESSION AND LOGOUT
// ================================

const authSection =
    document.getElementById("auth-section");

const appContent =
    document.getElementById("app-content");

const logoutButton =
    document.getElementById("logout-button");


// Show the finance application
function showApp() {
    authSection.style.display = "none";
    appContent.style.display = "block";
}


// Show authentication
function showAuth() {
    appContent.style.display = "none";
    authSection.style.display = "block";

    // Start with the signup form visible
    signupContainer.style.display = "block";
    loginContainer.style.display = "none";
}


// Check whether a user was already logged in
const savedUser = localStorage.getItem("loggedInUser");

if (savedUser) {
    showApp();
} else {
    showAuth();
}


// Logout
logoutButton.addEventListener("click", () => {
    // Remove the saved login
    localStorage.removeItem("loggedInUser");

    // Return to authentication
    showAuth();

    alert("You have been logged out.");
});