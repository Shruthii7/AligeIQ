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

// form references
// Get the transaction form
const transactionForm = document.getElementById("transaction-form");
// Get the budget form
const budgetForm = document.getElementById("budget-form");
// Get the goal form from HTML
const goalForm = document.getElementById("goal-form");

// Run when the user submits the goal form
goalForm.addEventListener("submit", function (event) {
    // Stop the page from refreshing
    event.preventDefault();

    // Get values entered by the user
    const name = document.getElementById("goal-name").value;
    const target = Number(document.getElementById("goal-target").value);
    const saved = Number(document.getElementById("goal-saved").value);

    // Create one goal object
    const newGoal = {
        name: name,
        target: target,
        saved: saved
    };

    // Add the goal to our goals array
    goals.push(newGoal);

    // Save goals in the browser
    localStorage.setItem("goals", JSON.stringify(goals));

    // Refresh the goals shown on the page
    updateGoalList();

    // Clear the form
    goalForm.reset();
});

// Run this when the user submits the budget form
budgetForm.addEventListener("submit", function (event) {
    // Stop the page from refreshing
    event.preventDefault();

    // Get values entered by the user
    const category = document.getElementById("budget-category").value;
    const amount = Number(document.getElementById("budget-amount").value);

    // Create a new budget object
    const newBudget = {
        category: category,
        amount: amount
    };

    // Add the budget to our budgets array
    budgets.push(newBudget);

    // Save budgets in localStorage
    localStorage.setItem("budgets", JSON.stringify(budgets));

    // Update the budget display
    updateBudgetList();

    // Clear the form
    budgetForm.reset();
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


// Load saved goals from localStorage
const savedGoals = localStorage.getItem("goals");

// Use saved goals, or start with an empty array
const goals = savedGoals
    ? JSON.parse(savedGoals)
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

// Display all budgets and calculate their usage
function updateBudgetList() {
    // Get the budget display area from HTML
    const budgetList = document.getElementById("budget-list");

    // Clear the previous display
   budgetList.innerHTML = "";

// Show a message when no budgets exist
if (budgets.length === 0) {
    budgetList.innerHTML = `
        <p class="empty-state">
            No budgets yet. Set your first spending limit above.
        </p>
    `;

    return;
}

    // Go through every budget
    for (let i = 0; i < budgets.length; i++) {
        const budget = budgets[i];

        // Start the spent amount at 0
        let spent = 0;

        // Check every transaction
        for (let j = 0; j < transactions.length; j++) {
            const transaction = transactions[j];

            // Add expenses that belong to this budget category
            if (
                transaction.type === "expense" &&
                transaction.category.toLowerCase() ===
                    budget.category.toLowerCase()
            ) {
                spent += transaction.amount;
            }
        }

        // Calculate remaining budget
        const remaining = budget.amount - spent;

        // Calculate percentage used
        const percentage =
    budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        // Keep the progress bar from becoming wider than 100%
        const progressWidth = Math.min(percentageUsed, 100);

        // Decide whether the budget needs a warning
let alertMessage = "";

if (percentageUsed >= 100) {
    alertMessage = "🚨 You have exceeded this budget!";
} else if (percentageUsed >= 80) {
    alertMessage = "⚠️ You are close to your budget limit.";
}


        // Add the budget to the page
        budgetList.innerHTML += `
            <div class="budget-item">
               <div class="budget-top">
    <strong>${budget.category}</strong>

    <div class="budget-actions">
        <strong>₹${budget.amount.toLocaleString("en-IN")}</strong>

        <button
            type="button"
            onclick="deleteBudget(${i})"
            class="delete-budget-btn"
        >
            Delete
        </button>
    </div>
</div>

                <div class="budget-details">
    Spent: ₹${spent.toLocaleString("en-IN")} ·
    Remaining: ₹${remaining.toLocaleString("en-IN")} ·
    ${percentageUsed.toFixed(1)}% used
</div>

${alertMessage ? `
    <div class="budget-alert">
        ${alertMessage}
    </div>
` : ""}

                <div class="budget-progress">
                    <div
                        class="budget-progress-bar"
                        style="width: ${progressWidth}%"
                    ></div>
                </div>
            </div>
        `;
    }
}


// Delete a budget using its position in the budgets array
function deleteBudget(index) {
    // Remove one budget from the array
    budgets.splice(index, 1);

    // Save the updated budgets array
    localStorage.setItem("budgets", JSON.stringify(budgets));

    // Refresh the budget display
    updateBudgetList();
}

// Display all financial goals
function updateGoalList() {
    // Get the container from HTML
    const goalList = document.getElementById("goal-list");

    // Clear the previous display
    goalList.innerHTML = "";

    // Show a message when no goals exist
if (goals.length === 0) {
    goalList.innerHTML = `
        <p class="empty-state">
            No financial goals yet. Add your first goal above.
        </p>
    `;

    return;
}

    // Go through every goal
    for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];

        // Calculate percentage progress
        const percentage =
    goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;

        // Prevent the progress bar from going beyond 100%
        const progressWidth = Math.min(percentage, 100);

        // Calculate how much is still needed
        const remaining = Math.max(goal.target - goal.saved, 0);

        // Add the goal to the page
        goalList.innerHTML += `
            <div class="goal-item">
                <div class="goal-top">
    <strong>${goal.name}</strong>

    <div class="goal-actions">
        <button
            type="button"
            class="add-savings-btn"
            onclick="addSavings(${i})"
        >
            Add Savings
        </button>

        <button
            type="button"
            class="delete-goal-btn"
            onclick="deleteGoal(${i})"
        >
            Delete
        </button>
    </div>
</div>

                <div class="goal-details">
                    Saved: ₹${goal.saved.toLocaleString("en-IN")} ·
                    Target: ₹${goal.target.toLocaleString("en-IN")} ·
                    Remaining: ₹${remaining.toLocaleString("en-IN")} ·
                    ${percentage.toFixed(1)}% complete
                </div>

                <div class="goal-progress">
                    <div
                        class="goal-progress-bar"
                        style="width: ${progressWidth}%"
                    ></div>
                </div>
            </div>
        `;
    }
}

// Delete a goal using its position in the goals array
function deleteGoal(index) {
    // Remove one goal from the array
    goals.splice(index, 1);

    // Save the updated goals
    localStorage.setItem("goals", JSON.stringify(goals));

    // Refresh the goals on the page
    updateGoalList();
}

// Add more money to an existing financial goal
function addSavings(index) {
    // Ask the user how much money they want to add
    const amount = Number(
        prompt("How much do you want to add to this goal?")
    );

    // Stop if the user enters an invalid amount
    if (!amount || amount <= 0) {
        return;
    }

    // Add the new savings amount to the goal
    goals[index].saved += amount;

    // Save the updated goals in localStorage
    localStorage.setItem("goals", JSON.stringify(goals));

    // Refresh the goals display
    updateGoalList();
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

// Load backend data when AligeIQ opens
loadTransactions();