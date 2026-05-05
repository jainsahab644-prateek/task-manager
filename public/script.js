document.addEventListener('DOMContentLoaded', () => {
    // Auth Flow Logic
    const authOverlay = document.getElementById('authOverlay');
    const authForm = document.getElementById('authForm');
    const authToggleBtn = document.getElementById('authToggleBtn');
    const authToggleText = document.getElementById('authToggleText');
    const authSubtitle = document.getElementById('authSubtitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authErrorMsg = document.getElementById('authErrorMsg');
    const logoutBtn = document.getElementById('logoutBtn');
    let isRegisterMode = false;

    // Global Fetch Wrapper for Auth
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        let [resource, config] = args;
        const token = localStorage.getItem('token');
        
        if (typeof resource === 'string' && resource.startsWith('/api') && !resource.startsWith('/api/auth')) {
            config = config || {};
            if (!config.headers) config.headers = {};
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            if (!config.headers['Content-Type'] && config.method && config.method !== 'GET') {
                config.headers['Content-Type'] = 'application/json';
            }
            args = [resource, config];
        }
        
        const res = await originalFetch.apply(window, args);
        if (res.status === 401 || res.status === 403) {
            logout();
        }
        return res;
    };

    function checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            authOverlay.style.display = 'none';
            fetchTasks();
            loadProfile();
            requestNotificationPermission();
        } else {
            authOverlay.style.display = 'flex';
        }
    }

    authToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isRegisterMode = !isRegisterMode;
        
        const authName = document.getElementById('authName');
        const authWork = document.getElementById('authWork');
        
        if (isRegisterMode) {
            authSubtitle.textContent = 'Create a new account';
            authSubmitBtn.textContent = 'Sign Up';
            authToggleText.textContent = 'Already have an account?';
            authToggleBtn.textContent = 'Sign In';
            
            authName.style.display = 'block';
            authName.required = true;
            authWork.style.display = 'block';
            authWork.required = true;
        } else {
            authSubtitle.textContent = 'Sign in to your account';
            authSubmitBtn.textContent = 'Sign In';
            authToggleText.textContent = "Don't have an account?";
            authToggleBtn.textContent = 'Sign Up';
            
            authName.style.display = 'none';
            authName.required = false;
            authWork.style.display = 'none';
            authWork.required = false;
        }
        authErrorMsg.style.display = 'none';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const name = document.getElementById('authName').value;
        const work = document.getElementById('authWork').value;
        
        const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
        
        const payload = { email, password };
        if (isRegisterMode) {
            payload.name = name;
            payload.work = work; // sending as 'work' which is mapped to 'profession' in server
        }
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                authOverlay.style.display = 'none';
                fetchTasks();
                loadProfile();
            } else {
                authErrorMsg.textContent = data.error || 'Authentication failed';
                authErrorMsg.style.display = 'block';
            }
        } catch (err) {
            authErrorMsg.textContent = 'Server error. Try again.';
            authErrorMsg.style.display = 'block';
        }
    });

    function logout() {
        localStorage.removeItem('token');
        tasks = [];
        authOverlay.style.display = 'flex';
        document.getElementById('authPassword').value = '';
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // DOM Elements
    const currentDateEl = document.getElementById('currentDate');
    const viewTitleEl = document.getElementById('viewTitle');
    const mainContentArea = document.getElementById('mainContentArea');
    
    // Containers
    const tasksContainer = document.getElementById('tasksContainer');
    const calendarContainer = document.getElementById('calendarContainer');
    const analyticsContainer = document.getElementById('analyticsContainer');
    const profileForm = document.getElementById('profileForm');
    const profileName = document.getElementById('profileName');
    const profileBio = document.getElementById('profileBio');
    const dropdownNameText = document.getElementById('dropdownNameText');
    const dropdownBioText = document.getElementById('dropdownBioText');
    const headerAvatarInitial = document.getElementById('headerAvatarInitial');
    const dropdownAvatarInitial = document.getElementById('dropdownAvatarInitial');
    const profileAvatarBtn = document.getElementById('profileAvatarBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const consistencyChartEl = document.getElementById('consistencyChart');
    let consistencyChartInstance = null;
    const todayProgressEl = document.getElementById('todayProgress');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    
    // Header Actions
    const searchInput = document.getElementById('searchInput');
    const searchBox = document.querySelector('.search-box');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');

    // Mobile: show search icon button, toggle search box
    function applyMobileSearch() {
        if (window.innerWidth <= 768) {
            if(mobileSearchBtn) mobileSearchBtn.style.display = 'flex';
        } else {
            if(mobileSearchBtn) mobileSearchBtn.style.display = 'none';
            if(searchBox) searchBox.classList.remove('mobile-open');
        }
    }
    applyMobileSearch();
    window.addEventListener('resize', applyMobileSearch);

    if(mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchBox.classList.toggle('mobile-open');
            if(searchBox.classList.contains('mobile-open')) {
                searchInput.focus();
            }
        });
    }
    // Close mobile search when clicking outside
    document.addEventListener('click', (e) => {
        if(searchBox && searchBox.classList.contains('mobile-open')) {
            if(!searchBox.contains(e.target) && e.target !== mobileSearchBtn) {
                searchBox.classList.remove('mobile-open');
            }
        }
    });

    // Progress Elements (Today View)
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Modal Elements
    const modalOverlay = document.getElementById('taskModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const taskForm = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');
    
    // Pomodoro Elements
    const pomodoroWidget = document.querySelector('.pomodoro-widget');
    const timerDisplay = document.getElementById('timerDisplay');
    const startTimerBtn = document.getElementById('startTimer');
    const pauseTimerBtn = document.getElementById('pauseTimer');
    const resetTimerBtn = document.getElementById('resetTimer');

    // Chatbot Elements
    const chatFab = document.getElementById('chatFab');
    const chatWidget = document.getElementById('chatWidget');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatMessages = document.getElementById('chatMessages');

    // State
    let currentView = 'today'; // today, upcoming, daily, calendar, analytics
    let tasks = [];
    let searchQuery = '';
    let editingTaskId = null;
    let calendarInstance = null;
    
    // Chart Instances
    let categoryChartInstance = null;
    let priorityChartInstance = null;

    // Chart.js defaults for dark premium theme
    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;

    // Pomodoro State
    let timerInterval = null;
    let timeRemaining = 25 * 60; // 25 minutes
    let isTimerRunning = false;

    // Initialize
    init();

    function init() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
        
        resetFormDefaults();
        checkAuth(); // Replaces fetchTasks()
        setupEventListeners();
    }

    function setupEventListeners() {
        // Mobile Bottom Nav - simple, direct, no bugs
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // "More" button opens the sheet, not switchView
                if (item.id === 'mobileMoreBtn') {
                    openMobileSheet();
                    return;
                }
                const view = item.getAttribute('data-view');
                if (view) switchView(view);
            });
        });

        // Mobile More Sheet logic
        const mobileSheet = document.getElementById('mobileSheet');
        const mobileSheetOverlay = document.getElementById('mobileSheetOverlay');

        function openMobileSheet() {
            mobileSheet.classList.add('open');
            mobileSheetOverlay.classList.add('open');
        }
        function closeMobileSheet() {
            mobileSheet.classList.remove('open');
            mobileSheetOverlay.classList.remove('open');
        }

        if (mobileSheetOverlay) mobileSheetOverlay.addEventListener('click', closeMobileSheet);

        // Sheet: Dashboard
        const sheetDashboard = document.getElementById('sheetDashboard');
        if (sheetDashboard) sheetDashboard.addEventListener('click', () => {
            closeMobileSheet();
            switchView('analytics');
        });

        // Sheet: AI
        const sheetAiBtn = document.getElementById('sheetAiBtn');
        if (sheetAiBtn) sheetAiBtn.addEventListener('click', () => {
            closeMobileSheet();
            const chatWidget = document.getElementById('chatWidget');
            if (chatWidget) chatWidget.style.display = chatWidget.style.display === 'none' ? 'flex' : 'none';
        });

        // Sheet: Profile
        const sheetProfileBtn = document.getElementById('sheetProfileBtn');
        if (sheetProfileBtn) sheetProfileBtn.addEventListener('click', () => {
            closeMobileSheet();
            const profileDropdown = document.getElementById('profileDropdown');
            if (profileDropdown) {
                profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'flex' : 'none';
            }
        });

        // Sheet: Logout
        const sheetLogoutBtn = document.getElementById('sheetLogoutBtn');
        if (sheetLogoutBtn) sheetLogoutBtn.addEventListener('click', () => {
            closeMobileSheet();
            logout();
        });


        // Mobile FAB
        const mobileAddBtn = document.getElementById('mobileAddBtn');
        if (mobileAddBtn) mobileAddBtn.addEventListener('click', () => openModal());

        // Desktop Navigation
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if (view) switchView(view);
            });
        });

        // Search & Filter
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            if (currentView !== 'calendar' && currentView !== 'analytics') renderTasks();
        });

        // Clear Completed
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);

        // Modal
        openModalBtn.addEventListener('click', () => openModal());
        closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
        modalOverlay.addEventListener('click', (e) => {
            if(e.target === modalOverlay) modalOverlay.classList.remove('active');
        });

        // Form
        taskForm.addEventListener('submit', handleTaskSubmit);

        // Pomodoro
        startTimerBtn.addEventListener('click', startPomodoro);
        pauseTimerBtn.addEventListener('click', pausePomodoro);
        resetTimerBtn.addEventListener('click', resetPomodoro);

        // Chatbot Events
        chatFab.addEventListener('click', () => {
            chatWidget.style.display = chatWidget.style.display === 'none' ? 'flex' : 'none';
        });
        closeChatBtn.addEventListener('click', () => chatWidget.style.display = 'none');
        sendChatBtn.addEventListener('click', handleChatSubmit);
        chatInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') handleChatSubmit();
        });
    }

    function switchView(view) {
        // Update state
        currentView = view;

        // Sync ALL desktop nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === view);
        });

        // Sync ALL mobile nav items
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-view') === view);
        });

        // Animate & render the new view
        if (mainContentArea) {
            mainContentArea.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
            mainContentArea.style.opacity = '0';
            mainContentArea.style.transform = 'translateY(8px)';

            setTimeout(() => {
                updateViewTitle();
                handleViewChange();
                mainContentArea.style.opacity = '1';
                mainContentArea.style.transform = 'translateY(0)';
            }, 160);
        } else {
            updateViewTitle();
            handleViewChange();
        }
    }

    function openModal() {
        editingTaskId = null;
        modalTitle.textContent = 'Create New Task';
        modalSubmitBtn.textContent = 'Save Task';
        resetFormDefaults();
        modalOverlay.classList.add('active');
    }

    function resetFormDefaults() {
        taskForm.reset();
        document.getElementById('date').valueAsDate = new Date();
        const now = new Date();
        document.getElementById('time').value = `${now.getHours().toString().padStart(2, '0')}:00`;
    }

    function updateViewTitle() {
        switch(currentView) {
            case 'today': viewTitleEl.textContent = "Today's Focus"; break;
            case 'upcoming': viewTitleEl.textContent = "Upcoming Roadmap"; break;
            case 'daily': viewTitleEl.textContent = "Daily Rituals"; break;
            case 'calendar': viewTitleEl.textContent = "Master Calendar"; break;
            case 'analytics': viewTitleEl.textContent = "Performance Analytics"; break;
        }
    }

    function handleViewChange() {
        // Hide everything first
        tasksContainer.style.display = 'none';
        calendarContainer.style.display = 'none';
        analyticsContainer.style.display = 'none';
        todayProgressEl.style.display = 'none';
        
        if (currentView === 'calendar') {
            calendarContainer.style.display = 'flex';
            searchInput.parentElement.style.display = 'none';
            if (!calendarInstance) initCalendar();
            else calendarInstance.render();
            setTimeout(() => { if(calendarInstance) calendarInstance.updateSize(); }, 10);

        } else if (currentView === 'analytics') {
            analyticsContainer.style.display = 'flex';
            searchInput.parentElement.style.display = 'none';
            updateAnalytics();

        } else {
            tasksContainer.style.display = 'flex';
            searchInput.parentElement.style.display = 'flex';
            if(currentView === 'today') todayProgressEl.style.display = 'flex';
            renderTasks();
        }
    }

    function updateProgress(filteredTasks) {
        if(currentView !== 'today') return;
        
        const total = filteredTasks.length;
        const completed = filteredTasks.filter(t => t.isCompleted).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${completed} / ${total} Completed (${percentage}%)`;
    }

    // --- Analytics Dashboard Logic ---
    function updateAnalytics() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.isCompleted).length;
        const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        // Counter Animation
        animateValue("statTotal", parseInt(document.getElementById('statTotal').innerText) || 0, totalTasks, 1000);
        animateValue("statCompleted", parseInt(document.getElementById('statCompleted').innerText) || 0, completedTasks, 1000);
        animateValue("statRate", parseInt(document.getElementById('statRate').innerText.replace('%','')) || 0, completionRate, 1000, true);

        // Calculate Category Data
        const categoryCounts = { 'Work': 0, 'Personal': 0, 'Study': 0, 'Health': 0, 'Other': 0 };
        tasks.forEach(t => { if(categoryCounts[t.category] !== undefined) categoryCounts[t.category]++; });

        // Calculate Priority Data
        const priorityCounts = { 'High': 0, 'Medium': 0, 'Low': 0 };
        tasks.forEach(t => { if(priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });

        renderCharts(categoryCounts, priorityCounts);
    }
    
    function animateValue(id, start, end, duration, isPercent = false) {
        if (start === end) return;
        const obj = document.getElementById(id);
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentVal = Math.floor(easeProgress * (end - start) + start);
            obj.innerHTML = currentVal + (isPercent ? '%' : '');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function renderCharts(categoryCounts, priorityCounts) {
        const catCtx = document.getElementById('categoryChart').getContext('2d');
        const prioCtx = document.getElementById('priorityChart').getContext('2d');

        if (categoryChartInstance) categoryChartInstance.destroy();
        if (priorityChartInstance) priorityChartInstance.destroy();

        categoryChartInstance = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryCounts),
                datasets: [{
                    data: Object.values(categoryCounts),
                    backgroundColor: ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#64748b'],
                    borderColor: 'rgba(15, 23, 42, 0.5)',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } } }, animation: { animateScale: true, animateRotate: true } }
        });

        priorityChartInstance = new Chart(prioCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(priorityCounts),
                datasets: [{
                    data: Object.values(priorityCounts),
                    backgroundColor: ['#f87171', '#fbbf24', '#34d399'], // High, Med, Low
                    borderColor: 'rgba(15, 23, 42, 0.5)',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } } }, animation: { animateScale: true, animateRotate: true } }
        });
    }

    // API Calls
    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks');
            if(!res.ok) throw new Error('Failed to fetch tasks');
            tasks = await res.json();
            refreshData();
        } catch (error) {
            showToast('Could not load tasks from database', 'error');
            showError('Could not connect to the database. Ensure server is running.');
        }
    }

    async function handleTaskSubmit(e) {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            priority: document.getElementById('priority').value,
            category: document.getElementById('category').value,
            isDaily: document.getElementById('isDaily').checked
        };

        try {
            if (editingTaskId) {
                const res = await fetch(`/api/tasks/${editingTaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                if(!res.ok) throw new Error('Failed to update task');
                const updatedTask = await res.json();
                tasks = tasks.map(t => t._id === editingTaskId ? updatedTask : t);
                showToast('Task updated successfully!', 'success');
            } else {
                const res = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                if(!res.ok) throw new Error('Failed to create task');
                const savedTask = await res.json();
                tasks.push(savedTask);
                showToast('Task added successfully!', 'success');
            }
            
            modalOverlay.classList.remove('active');
            refreshData();
        } catch (error) {
            showToast('Error saving task', 'error');
        }
    }

    async function toggleTaskStatus(id, currentStatus) {
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: !currentStatus })
            });
            
            if(res.ok) {
                const updatedTask = await res.json();
                tasks = tasks.map(t => t._id === id ? updatedTask : t);
                refreshData();
                if(!currentStatus) {
                    showToast('Task completed! Great job!', 'success');
                }
            }
        } catch (error) {
            showToast('Error updating task', 'error');
        }
    }

    async function deleteTask(id) {
        if(!confirm('Are you sure you want to delete this task?')) return;
        
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if(res.ok) {
                tasks = tasks.filter(t => t._id !== id);
                refreshData();
                showToast('Task deleted.', 'info');
            }
        } catch (error) {
            showToast('Error deleting task', 'error');
        }
    }

    async function clearCompletedTasks() {
        const completedTasks = tasks.filter(t => t.isCompleted);
        if (completedTasks.length === 0) {
            showToast('No completed tasks to clear.', 'info');
            return;
        }

        if(!confirm(`Are you sure you want to permanently delete ${completedTasks.length} completed tasks?`)) return;

        try {
            await Promise.all(completedTasks.map(t => fetch(`/api/tasks/${t._id}`, { method: 'DELETE' })));
            tasks = tasks.filter(t => !t.isCompleted);
            refreshData();
            showToast(`${completedTasks.length} tasks cleared!`, 'success');
        } catch (error) {
            showToast('Error clearing tasks', 'error');
        }
    }

    function editTask(id) {
        const task = tasks.find(t => t._id === id);
        if(!task) return;

        editingTaskId = id;
        modalTitle.textContent = 'Edit Task';
        modalSubmitBtn.textContent = 'Save Changes';

        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description || '';
        document.getElementById('date').value = task.date;
        document.getElementById('time').value = task.time;
        document.getElementById('priority').value = task.priority || 'Medium';
        document.getElementById('category').value = task.category || 'Other';
        document.getElementById('isDaily').checked = task.isDaily;

        modalOverlay.classList.add('active');
    }

    // Rendering Logic
    function refreshData() {
        if (currentView === 'calendar') {
            refreshCalendarEvents();
        } else if (currentView === 'analytics') {
            updateAnalytics();
        } else {
            renderTasks();
        }
        renderConsistencyChart();
    }

    function renderTasks() {
        tasksContainer.innerHTML = '';
        let filteredTasks = filterTasksByView(tasks, currentView);
        
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(t => 
                t.title.toLowerCase().includes(searchQuery) || 
                (t.description && t.description.toLowerCase().includes(searchQuery))
            );
        }

        if(currentView === 'today') {
            updateProgress(filteredTasks);
        }

        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <div class="loader-spinner" style="border-color: transparent; border-top-color: rgba(0,0,0,0.1); animation: none;">
                        <i class="fas fa-clipboard-check" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.5;"></i>
                    </div>
                    <p style="margin-top: 1rem;">${searchQuery ? 'No tasks match your search.' : 'Woohoo! No tasks found.'}</p>
                    <button class="submit-btn" onclick="document.getElementById('openModalBtn').click(); ${currentView === 'daily' ? `setTimeout(() => document.getElementById('taskIsDaily').checked = true, 50);` : ''}" style="margin-top: 1rem; width: auto; padding: 0.8rem 2rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.8rem;">
                        <i class="fas fa-plus"></i> ${currentView === 'daily' ? 'Add Daily Ritual' : 'Add New Task'}
                    </button>
                </div>
            `;
            return;
        }

        const priorities = [
            { label: 'Top Priority', key: 'High', icon: 'fa-fire', color: 'var(--danger-color)' },
            { label: 'Medium Priority', key: 'Medium', icon: 'fa-bolt', color: 'var(--warning-color)' },
            { label: 'Low Priority', key: 'Low', icon: 'fa-leaf', color: 'var(--success-color)' }
        ];

        let globalAnimationIndex = 0;

        const kanbanContainer = document.createElement('div');
        kanbanContainer.className = 'kanban-container-wrapper';
        
        const mobileTabs = document.createElement('div');
        mobileTabs.className = 'mobile-priority-tabs';
        mobileTabs.innerHTML = `
            <button class="priority-tab active" data-target="High">Top</button>
            <button class="priority-tab" data-target="Medium">Medium</button>
            <button class="priority-tab" data-target="Low">Low</button>
        `;
        kanbanContainer.appendChild(mobileTabs);

        const kanbanBoard = document.createElement('div');
        kanbanBoard.className = 'kanban-board active-priority-High';

        priorities.forEach(p => {
            const tasksInGroup = filteredTasks.filter(t => (t.priority || 'Medium') === p.key);
            
            // Create a column for every priority
            const column = document.createElement('div');
            column.className = `kanban-column kanban-col-${p.key}`;
            
            // Header
            const header = document.createElement('div');
            header.className = 'priority-section-header';
            header.innerHTML = `<i class="fas ${p.icon}" style="color: ${p.color};"></i> <span>${p.label}</span> <span class="priority-count">${tasksInGroup.length}</span>`;
            column.appendChild(header);

            // Tasks container for this column
            const columnTasks = document.createElement('div');
            columnTasks.className = 'kanban-column-tasks';

            if (tasksInGroup.length === 0) {
                columnTasks.innerHTML = `<div class="empty-column-state"><i class="fas fa-check-circle"></i><p>Clear!</p></div>`;
            } else {
                tasksInGroup.forEach((task) => {
                    const taskEl = document.createElement('div');
                    taskEl.className = `task-item priority-${task.priority || 'Medium'} ${task.isCompleted ? 'completed' : ''}`;
                    
                    // Staggered animation delay
                    taskEl.style.animationDelay = `${globalAnimationIndex++ * 0.08}s`;
                    
                    taskEl.innerHTML = `
                        <div class="task-checkbox-container">
                            <input type="checkbox" class="task-checkbox" ${task.isCompleted ? 'checked' : ''}>
                        </div>
                        <div class="task-content">
                            <div class="task-header">
                                <h4 class="task-title">${escapeHTML(task.title)}</h4>
                                <div class="task-actions">
                                    <button class="icon-btn edit-btn"><i class="fas fa-pen"></i></button>
                                    <button class="icon-btn delete-btn"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </div>
                            
                            <div class="badges-container">
                                ${task.category ? `<span class="badge badge-category"><i class="fas fa-tag"></i> ${task.category}</span>` : ''}
                            </div>

                            ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
                            
                            <div class="task-meta">
                                <span><i class="far fa-calendar"></i> ${formatDate(task.date)}</span>
                                <span><i class="far fa-clock"></i> ${task.time}</span>
                                ${task.isDaily ? `<span class="badge-daily" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9; padding: 0.3rem 0.8rem; border-radius: 12px; font-weight: 700; border: 1px solid rgba(14, 165, 233, 0.3);"><i class="fas fa-redo"></i> Daily Ritual</span>` : ''}
                            </div>
                        </div>
                    `;

                    const checkbox = taskEl.querySelector('.task-checkbox');
                    checkbox.addEventListener('change', () => toggleTaskStatus(task._id, task.isCompleted));
                    
                    const editBtn = taskEl.querySelector('.edit-btn');
                    editBtn.addEventListener('click', () => editTask(task._id));

                    const deleteBtn = taskEl.querySelector('.delete-btn');
                    deleteBtn.addEventListener('click', () => deleteTask(task._id));

                    columnTasks.appendChild(taskEl);
                });
            }
            
            column.appendChild(columnTasks);
            kanbanBoard.appendChild(column);
        });
        
        mobileTabs.querySelectorAll('.priority-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                mobileTabs.querySelectorAll('.priority-tab').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                kanbanBoard.className = `kanban-board active-priority-${e.currentTarget.dataset.target}`;
            });
        });

        kanbanContainer.appendChild(kanbanBoard);
        tasksContainer.appendChild(kanbanContainer);
    }

    function filterTasksByView(allTasks, view) {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const todayStr = d.toISOString().split('T')[0];
        
        return allTasks.filter(task => {
            if (view === 'daily') return task.isDaily;
            if (view === 'today') return task.date === todayStr || task.isDaily;
            if (view === 'upcoming') return task.date > todayStr && !task.isDaily;
            return true;
        }).sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });
    }

    // --- Calendar Logic ---
    function initCalendar() {
        const calendarEl = document.getElementById('calendar');
        calendarInstance = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // start with month view
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: getCalendarEvents(),
            eventClick: function(info) {
                editTask(info.event.id);
            },
            height: '100%'
        });
        calendarInstance.render();
    }

    function refreshCalendarEvents() {
        if(!calendarInstance) return;
        calendarInstance.removeAllEvents();
        calendarInstance.addEventSource(getCalendarEvents());
    }

    function getCalendarEvents() {
        return tasks.map(t => {
            let color = '#8b5cf6'; // default accent
            if(t.priority === 'High') color = '#f87171';
            if(t.priority === 'Low') color = '#34d399';
            
            if(t.isCompleted) color = 'rgba(255,255,255,0.2)'; // semi-transparent completed tasks
            
            return {
                id: t._id,
                title: t.title + (t.isCompleted ? ' ✓' : ''),
                start: `${t.date}T${t.time}`,
                backgroundColor: color,
                allDay: false,
                borderColor: 'transparent'
            };
        });
    }

    // Pomodoro Logic
    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update horizontal progress bar
        const totalSeconds = 25 * 60;
        const progressPercent = ((totalSeconds - timeRemaining) / totalSeconds) * 100;
        document.getElementById('pomodoroProgress').style.width = `${progressPercent}%`;
    }

    function startPomodoro() {
        if (isTimerRunning) return;
        isTimerRunning = true;
        pomodoroWidget.classList.add('running'); // Adds glowing border
        showToast("Focus session started!", "info");
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                pomodoroWidget.classList.remove('running');
                showToast("Focus session complete! Take a break.", "success");
                
                // Play notification sound
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play();
                } catch(e) {}
                
                timeRemaining = 25 * 60;
                updateTimerDisplay();
            }
        }, 1000);
    }

    function pausePomodoro() {
        isTimerRunning = false;
        clearInterval(timerInterval);
        pomodoroWidget.classList.remove('running');
    }

    function resetPomodoro() {
        isTimerRunning = false;
        clearInterval(timerInterval);
        pomodoroWidget.classList.remove('running');
        timeRemaining = 25 * 60;
        updateTimerDisplay();
    }

    // UI Utilities
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'info-circle';
        if(type === 'success') icon = 'check-circle';
        if(type === 'error') icon = 'exclamation-triangle';

        toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // wait for transition
        }, 3000);
    }

    function escapeHTML(str) {
        if(!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    function formatDate(dateString) {
        if(!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    function showError(msg) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger-color); font-size: 3rem;"></i>
                <p style="margin-top: 1rem;">${msg}</p>
            </div>
        `;
    }

    // --- Chatbot Logic ---
    let chatHistory = [];

    async function handleChatSubmit() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message to UI
        appendMessage(escapeHTML(text), 'user');
        chatInput.value = '';

        // Add typing indicator
        const typingId = 'typing-' + Date.now();
        const typingIndicator = document.createElement('div');
        typingIndicator.id = typingId;
        typingIndicator.className = 'typing-indicator';
        typingIndicator.textContent = 'AI is thinking...';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory })
            });
            const data = await res.json();
            
            document.getElementById(typingId).remove();
            
            if (res.ok) {
                // Update history
                chatHistory.push({ role: 'user', parts: [{ text: text }] });
                chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });

                // Remove basic markdown stars for simpler display
                const formattedReply = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                appendMessage(formattedReply, 'ai');
                if (data.actionTriggered) {
                    fetchTasks();
                }
            } else {
                appendMessage(escapeHTML(data.error) || "Something went wrong.", 'ai');
            }
        } catch (error) {
            if (document.getElementById(typingId)) {
                document.getElementById(typingId).remove();
            }
            appendMessage("Failed to connect to the AI. Ensure server is running.", 'ai');
        }
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.innerHTML = text; // basic HTML allowed from format
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Profile Dropdown Logic ---
    if(profileAvatarBtn) {
        profileAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = profileDropdown.style.display === 'none';
            profileDropdown.style.display = isHidden ? 'flex' : 'none';
        });
    }

    document.addEventListener('click', (e) => {
        if(profileDropdown && profileDropdown.style.display === 'flex') {
            if(!profileDropdown.contains(e.target) && !profileAvatarBtn.contains(e.target)) {
                profileDropdown.style.display = 'none';
            }
        }
    });

    // --- Profile & Consistency Logic ---
    async function loadProfile() {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const profile = await res.json();
                
                const emailPrefix = profile.email ? profile.email.split('@')[0] : 'User';
                const displayName = profile.name || emailPrefix;
                
                if(dropdownNameText) dropdownNameText.textContent = displayName;
                if(dropdownBioText) dropdownBioText.textContent = profile.profession || 'No profession set'; // showing profession
                
                if(profileName) profileName.value = profile.name || '';
                if(profileBio) profileBio.value = profile.bio || '';
                if(document.getElementById('profileProfession')) document.getElementById('profileProfession').value = profile.profession || '';
                
                const initial = displayName.charAt(0).toUpperCase();
                if(headerAvatarInitial) headerAvatarInitial.textContent = initial;
                if(dropdownAvatarInitial) dropdownAvatarInitial.textContent = initial;
            }
        } catch(err) {
            console.error("Error loading profile", err);
        }
    }

    if(profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = profileName.value.trim();
            const bio = profileBio.value.trim();
            const profession = document.getElementById('profileProfession') ? document.getElementById('profileProfession').value.trim() : '';
            try {
                const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, bio, profession })
                });
                if(res.ok) {
                    showToast("Profile saved successfully!", "success");
                    const displayName = name || 'User';
                    if(dropdownNameText) dropdownNameText.textContent = displayName;
                    if(dropdownBioText) dropdownBioText.textContent = bio || 'Set bio...';
                    
                    const initial = displayName.charAt(0).toUpperCase();
                    if(headerAvatarInitial) headerAvatarInitial.textContent = initial;
                    if(dropdownAvatarInitial) dropdownAvatarInitial.textContent = initial;
                } else {
                    showToast("Failed to save profile", "error");
                }
            } catch(err) {
                showToast("Network error", "error");
            }
        });
    }

    function renderConsistencyChart() {
        if (!consistencyChartEl) return;
        
        // Generate last 30 days
        const labels = [];
        const data = [];
        const now = new Date();
        
        // Build map of completion counts per date string (YYYY-MM-DD)
        const completedMap = {};
        tasks.filter(t => t.isCompleted && t.date).forEach(t => {
            if(!completedMap[t.date]) completedMap[t.date] = 0;
            completedMap[t.date]++;
        });

        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            labels.push(shortLabel);
            data.push(completedMap[dateStr] || 0);
        }

        if (consistencyChartInstance) {
            consistencyChartInstance.destroy();
        }

        consistencyChartInstance = new Chart(consistencyChartEl, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: data,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: {
                        grid: { display: false },
                        ticks: { maxTicksLimit: 7 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // =============================================
    // TASK REMINDER NOTIFICATIONS (10 min before)
    // =============================================
    
    // Track which task IDs we've already notified (per session)
    const notifiedTasks = new Set(JSON.parse(sessionStorage.getItem('notifiedTasks') || '[]'));

    function saveNotifiedTasks() {
        sessionStorage.setItem('notifiedTasks', JSON.stringify([...notifiedTasks]));
    }

    function requestNotificationPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showToast('🔔 Notifications enabled! You\'ll be reminded 10 min before tasks.', 'success');
                    startNotificationChecker();
                }
            });
        } else if (Notification.permission === 'granted') {
            startNotificationChecker();
        }
    }

    function startNotificationChecker() {
        // Run immediately, then every 60 seconds
        checkUpcomingTaskNotifications();
        setInterval(checkUpcomingTaskNotifications, 60 * 1000);
    }

    function checkUpcomingTaskNotifications() {
        if (Notification.permission !== 'granted') {
            console.warn('Notifications permission not granted');
            return;
        }
        if (!tasks || tasks.length === 0) return;

        const now = new Date();

        tasks.forEach(task => {
            if (task.isCompleted) return;
            if (!task.date || !task.time) return;
            if (notifiedTasks.has(task._id)) return;

            // Safe parsing: task.date (YYYY-MM-DD) and task.time (HH:MM)
            const [year, month, day] = task.date.split('-').map(Number);
            const [hour, minute] = task.time.split(':').map(Number);
            const taskDateTime = new Date(year, month - 1, day, hour, minute);
            
            const diffMs = taskDateTime - now;
            const diffMinutes = diffMs / (1000 * 60);

            // Notify if task is due in the next 11 minutes (allowing some buffer)
            // But skip if it's too far in the past (e.g. more than 5 minutes overdue)
            if (diffMinutes >= -5 && diffMinutes <= 11) {
                fireTaskNotification(task);
                notifiedTasks.add(task._id);
                saveNotifiedTasks();
            }
        });
    }

    // Diagnostic tool to test notifications
    window.testNotification = function() {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission().then(p => {
                if (p === 'granted') fireTaskNotification({ title: 'Test Task', priority: 'High', _id: 'test' });
                else showToast('Please enable notifications in your browser settings.', 'error');
            });
        } else {
            fireTaskNotification({ title: 'Test Notification', priority: 'High', _id: 'test' });
        }
    };

    function fireTaskNotification(task) {
        const priorityEmoji = { High: '🔴', Medium: '🟡', Low: '🟢' };
        const emoji = priorityEmoji[task.priority] || '📋';

        const notification = new Notification(`${emoji} Task Starting Soon!`, {
            body: `"${task.title}" starts at ${task.time}${task.category ? ' · ' + task.category : ''}`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `task-${task._id}`,  // prevents duplicate notifications
            requireInteraction: true,
            silent: false
        });

        // Clicking the notification focuses the app tab
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

});
