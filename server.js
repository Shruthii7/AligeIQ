// Import Express so we can create the backend server
const express = require("express");

// Import CORS so the frontend can communicate with the backend
const cors = require("cors");

// Import Pool from pg so Node.js can connect to PostgreSQL
const { Pool } = require("pg");

// Create the Express application
const app = express();

// Allow requests from the frontend
app.use(cors());

// Allow the backend to read JSON data sent by the frontend
app.use(express.json());

// Connect to the AligeIQ PostgreSQL database
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "aligeiq",
    password: "sqlminny",
    port: 5432
});

// Choose the port where our backend will run
const PORT = 3000;

// Create a test API route
app.get("/", (req, res) => {
    res.send("AligeIQ backend is running!");
});

// // Temporary transaction data from our backend
// const transactions = [
//     {
//         id: 1,
//         description: "Monthly Salary",
//         category: "Income",
//         amount: 50000,
//         date: "2026-08-01",
//         type: "income"
//     },
//     {
//         id: 2,
//         description: "Groceries",
//         category: "Food",
//         amount: 1200,
//         date: "2026-08-05",
//         type: "expense"
//     }
// ];

// API route to add a new transaction to PostgreSQL
app.post("/api/transactions", async (req, res) => {
    try {
        // Get transaction data sent by the frontend
        const {
            description,
            category,
            amount,
            date,
            type
        } = req.body;

        // Insert the transaction into PostgreSQL
        const result = await pool.query(
            `INSERT INTO transactions
            (description, category, amount, date, type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                description,
                category,
                amount,
                date,
                type
            ]
        );

        // Send the newly created database row back
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Could not add transaction"
        });
    }
});

// API route to delete a transaction from PostgreSQL
app.delete("/api/transactions/:id", async (req, res) => {
    try {
        // Get the transaction ID from the URL
        const transactionId = req.params.id;

        // Delete the transaction from PostgreSQL
        const result = await pool.query(
            "DELETE FROM transactions WHERE id = $1 RETURNING *",
            [transactionId]
        );

        // Check whether the transaction existed
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        // Send the deleted transaction back
        res.json({
            message: "Transaction deleted successfully",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Could not delete transaction"
        });
    }
});
// API route to update a transaction in PostgreSQL
app.put("/api/transactions/:id", async (req, res) => {
    try {
        // Get the transaction ID from the URL
        const transactionId = req.params.id;

        // Get the updated transaction data from the frontend
        const {
            description,
            category,
            amount,
            date,
            type
        } = req.body;

        // Update the transaction in PostgreSQL
        const result = await pool.query(
            `UPDATE transactions
             SET description = $1,
                 category = $2,
                 amount = $3,
                 date = $4,
                 type = $5
             WHERE id = $6
             RETURNING *`,
            [
                description,
                category,
                amount,
                date,
                type,
                transactionId
            ]
        );

        // Check whether the transaction exists
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        // Send the updated transaction back
        res.json(result.rows[0]);

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Could not update transaction"
        });
    }
});
// API route to get all transactions from PostgreSQL
app.get("/api/transactions", async (req, res) => {
    try {
        // Read all transactions from the database
        const result = await pool.query(
            "SELECT * FROM transactions ORDER BY id ASC"
        );

        // Send the database rows to the frontend
        res.json(result.rows);

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Could not fetch transactions"
        });
    }
});

// Start the backend server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});