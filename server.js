// Import Express so we can create a backend server
const express = require("express");

const cors = require("cors");

// Create the Express application
const app = express();

app.use(cors());

// Allow the backend to read JSON data sent by the frontend
app.use(express.json());

// Choose the port where our backend will run
const PORT = 3000;

// Create a test API route
app.get("/", (req, res) => {
    res.send("AligeIQ backend is running!");
});

// Temporary transaction data from our backend
const transactions = [
    {
        id: 1,
        description: "Monthly Salary",
        category: "Income",
        amount: 50000,
        date: "2026-08-01",
        type: "income"
    },
    {
        id: 2,
        description: "Groceries",
        category: "Food",
        amount: 1200,
        date: "2026-08-05",
        type: "expense"
    }
];

// API route to add a new transaction
app.post("/api/transactions", (req, res) => {
    // Get the transaction sent by the frontend
    const newTransaction = req.body;

    // Give the transaction a new ID
    newTransaction.id = transactions.length + 1;

    // Add it to our backend data
    transactions.push(newTransaction);

    // Send the newly added transaction back
    res.status(201).json(newTransaction);
});

// API route to delete a transaction
app.delete("/api/transactions/:id", (req, res) => {
    // Get the ID from the URL
    const transactionId = Number(req.params.id);

    // Find the transaction index
    const transactionIndex = transactions.findIndex(
        transaction => transaction.id === transactionId
    );

    // Stop if the transaction does not exist
    if (transactionIndex === -1) {
        return res.status(404).json({
            message: "Transaction not found"
        });
    }

    // Remove the transaction
    transactions.splice(transactionIndex, 1);

    // Send a success response
    res.json({
        message: "Transaction deleted successfully"
    });
});

// API route to update an existing transaction
app.put("/api/transactions/:id", (req, res) => {
    // Get the transaction ID from the URL
    const transactionId = Number(req.params.id);

    // Find the transaction we want to update
    const transactionIndex = transactions.findIndex(
        transaction => transaction.id === transactionId
    );

    // Stop if the transaction does not exist
    if (transactionIndex === -1) {
        return res.status(404).json({
            message: "Transaction not found"
        });
    }

    // Get the updated values sent by the frontend
    const updatedTransaction = req.body;

    // Keep the original ID and replace the other values
    transactions[transactionIndex] = {
        ...updatedTransaction,
        id: transactionId
    };

    // Send the updated transaction back
    res.json(transactions[transactionIndex]);
});

// API route to get all transactions
app.get("/api/transactions", (req, res) => {
    res.json(transactions);
});


// Start the backend server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});