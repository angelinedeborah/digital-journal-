let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;
let currentUserId = null;
let isSignUp = false;
let entryDates = []; 

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const API_BASE = 'http://localhost:3000'; 

// --- 1. AUTH TOGGLE & LOGIC ---
function toggleAuth() {
    isSignUp = !isSignUp;
    document.getElementById('auth-title').innerText = isSignUp ? "Create Account" : "Sign In";
    document.getElementById('auth-btn').innerText = isSignUp ? "Sign Up" : "Login";
    document.querySelector('.toggle-text').innerHTML = isSignUp ? "Already have an account? <span>Login</span>" : "New here? <span>Create an account</span>";
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim().toLowerCase();
    const pass = document.getElementById('password').value;
    const error = document.getElementById('auth-error');

    const endpoint = isSignUp ? `${API_BASE}/signup` : `${API_BASE}/login`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const data = await response.json();

        if (!response.ok) {
            error.innerText = data.error || "Authentication failed.";
            return;
        }

        if (isSignUp) {
            alert("Account created! Please login.");
            toggleAuth();
            document.getElementById('password').value = ''; 
        } else {
            sessionStorage.setItem('activeUser', data.username);
            sessionStorage.setItem('userId', data.userId); 
            initApp();
        }
    } catch (err) {
        error.innerText = "Server connection failed.";
        console.error(err);
    }
});

function handleLogout() {
    sessionStorage.clear();
    location.reload();
}

async function initApp() {
    currentUser = sessionStorage.getItem('activeUser');
    currentUserId = sessionStorage.getItem('userId');
    
    if (currentUser && currentUserId) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('user-display').innerText = currentUser;
        
        setupDropdowns();
        await fetchHistory(); 
        renderCalendar(currentMonth, currentYear);
    }
}

// --- 2. DATA FETCHING ---
async function fetchHistory() {
    try {
        const response = await fetch(`${API_BASE}/entries/${currentUserId}`);
        if (response.ok) {
            const data = await response.json();
            entryDates = data.map(row => {
                const d = new Date(row.entry_date);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            });
            updateHistoryUI();
        }
    } catch (err) {
        console.error("Failed to fetch history:", err);
    }
}

// --- 3. CALENDAR & JOURNAL ---
function renderCalendar(month, year) {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = "";
    document.getElementById('month-select').value = month;
    document.getElementById('year-select').value = year;

    let firstDay = new Date(year, month, 1).getDay();
    let daysInMonth = 32 - new Date(year, month, 32).getDate();

    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="day empty"></div>`;
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(d).padStart(2, '0');
        const dateString = `${year}-${monthStr}-${dayStr}`;
        
        const hasEntry = entryDates.includes(dateString) ? 'has-content' : '';
        grid.innerHTML += `<div class="day ${hasEntry}" onclick="openJournal('${dateString}')">${d}</div>`;
    }
}

async function openJournal(date) {
    document.getElementById('calendar-view').classList.add('hidden');
    document.getElementById('editor-view').classList.remove('hidden');
    document.getElementById('entry-date-title').innerText = date;
    document.getElementById('journal-text').value = "Loading..."; 
    
    try {
        const response = await fetch(`${API_BASE}/entries/${currentUserId}/${date}`);
        const data = await response.json();
        document.getElementById('journal-text').value = data.content || "";
    } catch (err) {
        console.error("Failed to load entry", err);
        document.getElementById('journal-text').value = "";
    }
}

async function saveEntry() {
    const date = document.getElementById('entry-date-title').innerText;
    const content = document.getElementById('journal-text').value;

    try {
        const response = await fetch(`${API_BASE}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, date, content })
        });
        
        if (response.ok) {
            alert("Entry Saved to Vault.");
            await fetchHistory(); 
            renderCalendar(currentMonth, currentYear); 
        } else {
            alert("Failed to save entry.");
        }
    } catch (err) {
        console.error("Error saving:", err);
    }
}

function updateHistoryUI() {
    const list = document.getElementById('history-list');
    list.innerHTML = "";
    const sortedDates = [...entryDates].sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
        const li = document.createElement('li');
        li.innerText = date;
        li.onclick = () => openJournal(date);
        list.appendChild(li);
    });
}

// --- 4. NAVIGATION HELPERS ---
function setupDropdowns() {
    const monthSelect = document.getElementById('month-select');
    monthSelect.innerHTML = months.map((m, i) => `<option value="${i}">${m}</option>`).join('');
    document.getElementById('year-select').value = currentYear;
}

function changeMonth(s) { 
    currentMonth += s; 
    if(currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if(currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } 
    renderCalendar(currentMonth, currentYear); 
}

function jump() { 
    currentMonth = parseInt(document.getElementById('month-select').value); 
    currentYear = parseInt(document.getElementById('year-select').value); 
    renderCalendar(currentMonth, currentYear); 
}

function showCalendar() { 
    document.getElementById('editor-view').classList.add('hidden'); 
    document.getElementById('calendar-view').classList.remove('hidden'); 
    renderCalendar(currentMonth, currentYear); 
}

window.onload = initApp;