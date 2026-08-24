// Import Express so we can create the backend server
const express = require("express");

// Import CORS so the frontend can communicate with the backend
const cors = require("cors");

// Import Pool from pg so Node.js can connect to PostgreSQL
const { Pool } = require("pg");

// Create the Express application
const app = express();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

// API route to get all budgets from PostgreSQL
app.get("/api/budgets", async (req, res) => {
    try {
        // Read all budgets from the database
        const result = await pool.query(
            "SELECT * FROM budgets ORDER BY id ASC"
        );

        // Send the budget rows to the frontend
        res.json(result.rows);

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Could not fetch budgets"
        });
    }
});


// API route to add a budget to PostgreSQL
app.post("/api/budgets", async (req, res) => {
    try {
        // Get budget data sent by the frontend
        const { category, amount } = req.body;

        // Insert the budget into PostgreSQL
        const result = await pool.query(
            `INSERT INTO budgets (category, amount)
             VALUES ($1, $2)
             RETURNING *`,
            [category, amount]
        );

        // Send the newly created budget back
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Could not add budget"
        });
    }
});

// API route to delete a budget from PostgreSQL
app.delete("/api/budgets/:id", async (req, res) => {
    try {
        const budgetId = Number(req.params.id);

        const result = await pool.query(
            "DELETE FROM budgets WHERE id = $1 RETURNING *",
            [budgetId]
        );

        // Stop if the budget does not exist
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Budget not found"
            });
        }

        res.json({
            message: "Budget deleted successfully",
            deletedBudget: result.rows[0]
        });

    } catch (error) {
        console.error("Error deleting budget:", error);

        res.status(500).json({
            message: "Could not delete budget"
        });
    }
});

// API route to get all goals from PostgreSQL
app.get("/api/goals", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM goals ORDER BY id ASC"
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Error fetching goals:", error);

        res.status(500).json({
            message: "Could not fetch goals"
        });
    }
});


// API route to add a new goal to PostgreSQL
app.post("/api/goals", async (req, res) => {
    try {
        const { name, targetAmount, savedAmount } = req.body;

        const result = await pool.query(
            `INSERT INTO goals
            (name, target_amount, saved_amount)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [name, targetAmount, savedAmount]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Error adding goal:", error);

        res.status(500).json({
            message: "Could not add goal"
        });
    }
});

app.put("/api/budgets/:id", async (req, res) => {
    const { category, amount } = req.body;
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            UPDATE budgets
            SET category = $1,
                amount = $2
            WHERE id = $3
            RETURNING *
            `,
            [category, amount, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Budget not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(
            "Error updating budget:",
            error
        );

        res.status(500).json({
            message: "Could not update budget"
        });
    }
});

app.delete("/api/goals/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            DELETE FROM goals
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Goal not found"
            });
        }

        res.json({
            message: "Goal deleted successfully",
            goal: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Error deleting goal:",
            error
        );

        res.status(500).json({
            message: "Could not delete goal"
        });
    }
});

app.put("/api/goals/:id", async (req, res) => {
    const {
        name,
        targetAmount,
        savedAmount
    } = req.body;

    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            UPDATE goals
            SET name = $1,
                target_amount = $2,
                saved_amount = $3
            WHERE id = $4
            RETURNING *
            `,
            [
                name,
                targetAmount,
                savedAmount,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Goal not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(
            "Error updating goal:",
            error
        );

        res.status(500).json({
            message: "Could not update goal"
        });
    }
});

app.post("/api/signup", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check whether the email already exists
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const result = await pool.query(
            `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, created_at
            `,
            [name, email, hashedPassword]
        );

        // Send the new user back
        res.status(201).json({
            message: "Account created successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating user:", error);

        res.status(500).json({
            message: "Could not create account"
        });
    }
});

// Register a new user
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check if email already exists
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [name, email, password]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Could not register user"
        });
    }
});

// ================================
// USER LOGIN
// ================================

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await pool.query(
            `SELECT id, name, email, password
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        if (user.password !== password) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Could not log in"
        });
    }
});


// Start the backend server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});