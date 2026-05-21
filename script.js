// === State & Data Initialization ===
let tasks = JSON.parse(localStorage.getItem('studentTasks')) || [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Quotes for motivation
const quotes = [
    "Believe you can and you're halfway there.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Don't let what you cannot do interfere with what you can do.",
    "Education is the most powerful weapon which you can use to change the world.",
    "The expert in anything was once a beginner."
];

// === DOM Elements ===
const body = document.body;
const themeBtn = document.getElementById('theme-btn');
const dateTimeDisplay = document.getElementById('current-date-time');
const dailyQuoteDisplay = document.getElementById('daily-quote');
const toast = document.getElementById('toast');

// Form Elements
const addTaskForm = document.getElementById('add-task-form');
const tasksContainer = document.getElementById('tasks-container');

// Stats Elements
const totalTasksEl = document.getElementById('total-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const streakCounterEl = document.getElementById('streak-counter');
const progressBar = document.getElementById('progress-bar');
const progressPercentage = document.getElementById('progress-percentage');

// Filters
const searchInput = document.getElementById('search-task');
const filterStatus = document.getElementById('filter-status');
const filterPriority = document.getElementById('filter-priority');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close-modal');
const editTaskForm = document.getElementById('edit-task-form');

// === App Initialization ===
function initApp() {
    // Apply Theme
    if (isDarkMode) body.setAttribute('data-theme', 'dark');
    updateThemeIcon();

    // Set Date, Time and Quote
    updateDateTime();
    setInterval(updateDateTime, 60000); // update every minute
    dailyQuoteDisplay.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
    
    // Render Components
    renderTasks();
    updateStats();
    renderCalendar();
    calculateStreak();
}

// === Theme Logic ===
themeBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        body.setAttribute('data-theme', 'dark');
    } else {
        body.removeAttribute('data-theme');
    }
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeIcon();
});

function updateThemeIcon() {
    const icon = themeBtn.querySelector('i');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    themeBtn.innerHTML = `<i class="${icon.className}"></i> Toggle ${isDarkMode ? 'Light' : 'Dark'} Mode`;
}

// === Utility: Date & Time ===
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    dateTimeDisplay.textContent = now.toLocaleDateString('en-US', options);
}

// === Utility: Toast Notification ===
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// === CRUD Operations ===

// Save Tasks to Local Storage
function saveTasks() {
    localStorage.setItem('studentTasks', JSON.stringify(tasks));
}

// Create Task
addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTask = {
        id: Date.now().toString(),
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        date: document.getElementById('task-date').value,
        priority: document.getElementById('task-priority').value,
        subject: document.getElementById('task-subject').value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    addTaskForm.reset();
    showToast('Task added successfully!');
});

// Read/Render Tasks
function renderTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;
    const priorityFilter = filterPriority.value;
    
    tasksContainer.innerHTML = '';
    
    // Filter logic
    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                              task.subject.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || 
                              (statusFilter === 'completed' && task.completed) ||
                              (statusFilter === 'pending' && !task.completed);
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort by due date, pushing completed tasks to bottom
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.date) - new Date(b.date);
    });
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; opacity: 0.7;">No tasks found. Try adjusting filters or add a new task!</p>`;
        return;
    }
    
    // Create UI elements for tasks
    filteredTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${task.completed ? 'completed' : ''}`;
        
        const dateObj = new Date(task.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        taskEl.innerHTML = `
            <div class="task-header">
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            </div>
            <h3>${task.title}</h3>
            <div class="task-subject"><i class="fas fa-book"></i> ${task.subject}</div>
            <p class="task-desc">${task.description || 'No description provided.'}</p>
            <div class="task-footer">
                <span class="task-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                <div class="task-actions">
                    <button class="action-btn btn-complete" onclick="toggleTaskStatus('${task.id}')" title="Mark Complete">
                        <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="openEditModal('${task.id}')" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteTask('${task.id}')" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        tasksContainer.appendChild(taskEl);
    });
}

// Toggle Completion
window.toggleTaskStatus = (id) => {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex > -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        if(tasks[taskIndex].completed) {
            tasks[taskIndex].completedAt = new Date().toISOString();
        }
        saveTasks();
        renderTasks();
        updateStats();
        calculateStreak();
        showToast(tasks[taskIndex].completed ? 'Task completed! Great job!' : 'Task marked as pending.');
    }
};

// Delete Task
window.deleteTask = (id) => {
    if(confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        showToast('Task deleted.', 'error');
    }
};

// Update Task (Modal Logic)
window.openEditModal = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-desc').value = task.description;
        document.getElementById('edit-task-date').value = task.date;
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-subject').value = task.subject;
        
        editModal.classList.add('show');
    }
};

closeModal.addEventListener('click', () => editModal.classList.remove('show'));
window.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.remove('show');
});

editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-task-id').value;
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex > -1) {
        tasks[taskIndex].title = document.getElementById('edit-task-title').value;
        tasks[taskIndex].description = document.getElementById('edit-task-desc').value;
        tasks[taskIndex].date = document.getElementById('edit-task-date').value;
        tasks[taskIndex].priority = document.getElementById('edit-task-priority').value;
        tasks[taskIndex].subject = document.getElementById('edit-task-subject').value;
        
        saveTasks();
        renderTasks();
        updateStats();
        editModal.classList.remove('show');
        showToast('Task updated successfully!');
    }
});

// Event Listeners for Filters
searchInput.addEventListener('input', renderTasks);
filterStatus.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);

// === Stats & Progress Logic ===
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
    
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
}

// Calculate Task Completion Streak
function calculateStreak() {
    let streak = 0;
    // Get unique dates where tasks were completed
    const completedDates = tasks
        .filter(t => t.completed && t.completedAt)
        .map(t => new Date(t.completedAt).toDateString());
    
    const uniqueDates = [...new Set(completedDates)].sort((a, b) => new Date(b) - new Date(a));
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    // Check if the streak is currently active
    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
        let currentDate = uniqueDates.includes(today) ? new Date(today) : new Date(yesterday);
        
        for (let i = 0; i < uniqueDates.length; i++) {
            const checkDate = new Date(currentDate.getTime() - (i * 86400000)).toDateString();
            if (uniqueDates.includes(checkDate)) {
                streak++;
            } else {
                break;
            }
        }
    }
    
    streakCounterEl.textContent = `${streak} Days`;
}

// === Pomodoro Timer Logic ===
let pomodoroTimer;
let timeLeft = 25 * 60; // 25 minutes
let isTimerRunning = false;
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer');
const pauseTimerBtn = document.getElementById('pause-timer');
const resetTimerBtn = document.getElementById('reset-timer');

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

startTimerBtn.addEventListener('click', () => {
    if (!isTimerRunning) {
        isTimerRunning = true;
        pomodoroTimer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(pomodoroTimer);
                isTimerRunning = false;
                showToast('Pomodoro session completed! Take a break.', 'success');
                timeLeft = 25 * 60;
                updateTimerDisplay();
            }
        }, 1000);
    }
});

pauseTimerBtn.addEventListener('click', () => {
    clearInterval(pomodoroTimer);
    isTimerRunning = false;
});

resetTimerBtn.addEventListener('click', () => {
    clearInterval(pomodoroTimer);
    isTimerRunning = false;
    timeLeft = 25 * 60;
    updateTimerDisplay();
});

// === Calendar Widget Logic ===
function renderCalendar() {
    const miniCalendar = document.getElementById('mini-calendar');
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const today = new Date();
    
    miniCalendar.innerHTML = '';
    
    // Render Days of Week Header
    days.forEach(day => {
        const headerEl = document.createElement('div');
        headerEl.className = 'cal-header';
        headerEl.textContent = day;
        miniCalendar.appendChild(headerEl);
    });
    
    // Get calendar metrics
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    // Fill empty starting slots
    for (let i = 0; i < firstDay; i++) {
        const emptyEl = document.createElement('div');
        miniCalendar.appendChild(emptyEl);
    }
    
    // Fill days
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = `cal-day ${i === today.getDate() ? 'active' : ''}`;
        dayEl.textContent = i;
        miniCalendar.appendChild(dayEl);
    }
}

// Start Application on Load
document.addEventListener('DOMContentLoaded', initApp);
