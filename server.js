const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json()); 

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Make sure this is your MySQL username
    password: 'root', // Make sure this is your MySQL password
    database: 'juno_journal'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database!');
});

// --- API ROUTES ---

// 1. Sign Up
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    
    db.query(query, [username, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Account created successfully!' });
    });
});

// 2. Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.query(query, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length > 0) {
            res.json({ message: 'Login successful', userId: results[0].id, username: results[0].username });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    });
});

// 3. Save or Update Journal Entry (Strictly tied to user_id)
app.post('/entries', (req, res) => {
    const { userId, date, content } = req.body;
    const query = `
        INSERT INTO entries (user_id, entry_date, content) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE content = ?
    `;
    
    db.query(query, [userId, date, content, content], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ message: 'Entry saved successfully!' });
    });
});

// 4. Get Journal Entry for a Specific Date (Filtered by user_id)
app.get('/entries/:userId/:date', (req, res) => {
    const query = 'SELECT content FROM entries WHERE user_id = ? AND entry_date = ?';
    
    db.query(query, [req.params.userId, req.params.date], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length > 0) {
            res.json({ content: results[0].content });
        } else {
            res.json({ content: '' }); 
        }
    });
});

// 5. Get All Entry Dates for a User (Filtered by user_id)
app.get('/entries/:userId', (req, res) => {
    const query = 'SELECT entry_date FROM entries WHERE user_id = ?';
    
    db.query(query, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Start Server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});