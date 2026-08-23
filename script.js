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

// Get the transaction form
const transactionForm = document.getElementById("transaction-form");

// Get search and filter controls
const searchTransaction = document.getElementById("search-transaction");
const filterType = document.getElementById("filter-type");
// Update the list while the user types
searchTransaction.addEventListener("input", updateTransactionList);

// Update the list when the filter changes
filterType.addEventListener("change", updateTransactionList);

// Stores the index of the transaction currently being edited
let editingIndex = null;


// Run when the user submits the form
transactionForm.addEventListener("submit", function (event) {
    // Prevent the page from refreshing
    event.preventDefault();

    // Read values from the form
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const date = document.getElementById("date").value;
    const type = document.getElementById("type").value;

    // Create one new transaction object
    const newTransaction = {
        description: description,
        category: category,
        amount: amount,
        date: date,
        type: type
    };

    // Check whether we are adding or editing
if (editingIndex === null) {
    // No transaction is being edited, so add a new one
    transactions.push(newTransaction);
} else {
    // Replace the existing transaction with the updated data
    transactions[editingIndex] = newTransaction;

    // Leave edit mode
    editingIndex = null;

    // Change the button back to its normal text
    document.querySelector("#transaction-form button").textContent =
        "Add Transaction";
}

    // Save the complete updated dataset in LocalStorage
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Update everything on the screen
    updateDashboard();
    updateTransactionList();
    updateCategoryAnalysis();
    updateCategoryChart();
    updateMonthlyChart();

    // Clear the form
    transactionForm.reset();
});


// Calculate and update all financial KPIs
function updateDashboard() {
    let totalIncome = 0;
    let totalExpenses = 0;

    // Analyze every transaction
    for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].type === "income") {
            totalIncome += transactions[i].amount;
        } else if (transactions[i].type === "expense") {
            totalExpenses += transactions[i].amount;
        }
    }

    // Calculate financial metrics
    const currentBalance = totalIncome - totalExpenses;

    const savingsRate =
        totalIncome > 0
            ? (currentBalance / totalIncome) * 100
            : 0;

    // Display calculated values
    document.getElementById("total-income").textContent =
        `₹${totalIncome.toLocaleString("en-IN")}`;

    document.getElementById("total-expenses").textContent =
        `₹${totalExpenses.toLocaleString("en-IN")}`;

    document.getElementById("current-balance").textContent =
        `₹${currentBalance.toLocaleString("en-IN")}`;

    document.getElementById("savings-rate").textContent =
        `${savingsRate.toFixed(1)}%`;
}


// Display transactions on the dashboard
// Display transactions on the dashboard
function updateTransactionList() {
    const transactionList = document.getElementById("transaction-list");

    // Remove old displayed transactions
    transactionList.innerHTML = "";

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
                    <button onclick="editTransaction(${i})">Edit</button>
                    <button onclick="deleteTransaction(${i})">Delete</button>
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

// Load an existing transaction into the form for editing
function editTransaction(index) {
    // Get the selected transaction from the array
    const transaction = transactions[index];

    // Put its existing values into the form
    document.getElementById("description").value = transaction.description;
    document.getElementById("category").value = transaction.category;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("date").value = transaction.date;
    document.getElementById("type").value = transaction.type;

    // Remember which transaction we are editing
    editingIndex = index;

    // Change the button text to make the mode clear
    document.querySelector("#transaction-form button").textContent =
        "Update Transaction";

    // Move the user to the form
    document.querySelector(".add-transaction").scrollIntoView({
        behavior: "smooth"
    });
}


// Delete transaction 
function deleteTransaction(index) {
    // Remove 1 transaction from the specified array position
    transactions.splice(index, 1);

    // Save the updated data
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Refresh KPIs and transaction list
    updateDashboard();
updateTransactionList();
updateCategoryAnalysis();
updateCategoryChart();
updateMonthlyChart();
}

// Display initial data when the page opens
updateDashboard();
updateTransactionList();
updateCategoryAnalysis();
updateCategoryChart();
updateMonthlyChart();