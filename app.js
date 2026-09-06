// ================================
// QUẢN LÝ DỮ LIỆU & STORAGE
// ================================

let schedule = JSON.parse(localStorage.getItem("studyPlannerSchedule")) || {};
let tasks = JSON.parse(localStorage.getItem("studyPlannerTasks")) || {}; 
let extraClasses = JSON.parse(localStorage.getItem("studyPlannerExtraClasses")) || [];

// Danh sách câu nói mặc định
const defaultQuotes = [
    "Học, học nữa, học mãi! 💡",
    "Thành công là kết quả của sự chuẩn bị chu đáo! ✨",
    "Cố gắng mỗi ngày một chút, tương lai sẽ rực rỡ! 🚀",
    "Đừng dừng lại cho đến khi bạn tự hào! 🔥"
];

let quotes = JSON.parse(localStorage.getItem("studyPlannerQuotes")) || defaultQuotes;

const defaultExams = [
    { name: "ĐGNL", date: "2026-12-26" },
    { name: "THPTQG", date: "2027-06-25" }
];

let exams = JSON.parse(localStorage.getItem("studyPlannerExams")) || defaultExams;
let activeExamIndex = parseInt(localStorage.getItem("studyPlannerActiveExamIndex")) || 0;

let taskSelectedDate = new Date(); 
let statsCurrentRange = 'day'; 

// ================================
// QUẢN LÝ NGÀY THÁNG & ĐỊNH DẠNG
// ================================

function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDateDisplay(date) {
    const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dayName = daysOfWeek[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${dayName}, ${day}/${month}`;
}

function updateRealtimeDates() {
    const today = new Date();
    const homeDateText = document.getElementById("home-date-display");
    if (homeDateText) homeDateText.textContent = formatDateDisplay(today);

    renderTasks();
    renderExams();
    renderRandomQuote();
    renderStats();
}

// ================================
// QUẢN LÝ CÂU NÓI ĐỘNG LỰC NGẪU NHIÊN
// ================================

function getRandomQuote() {
    if (quotes.length === 0) return "Cố gắng lên nhé! 💙";
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}

function renderRandomQuote() {
    const homeQuote = document.getElementById("home-quote-text");
    if (homeQuote) {
        homeQuote.textContent = `"${getRandomQuote()}"`;
    }
}

const btnRefreshQuote = document.getElementById("btn-refresh-quote");
if (btnRefreshQuote) {
    btnRefreshQuote.addEventListener("click", renderRandomQuote);
}

function renderQuotesList() {
    const quotesContainer = document.getElementById("quotes-list");
    if (!quotesContainer) return;

    quotesContainer.innerHTML = "";
    quotes.forEach((q, index) => {
        const item = document.createElement("div");
        item.className = "quote-item";
        item.innerHTML = `
            <span>"${q}"</span>
            <button class="delete-quote-btn">🗑️</button>
        `;

        item.querySelector(".delete-quote-btn").addEventListener("click", () => {
            if (quotes.length <= 1) {
                alert("Cần giữ lại ít nhất 1 câu nói!");
                return;
            }
            quotes.splice(index, 1);
            saveQuotes();
            renderQuotesList();
            renderRandomQuote();
        });

        quotesContainer.appendChild(item);
    });
}

function saveQuotes() {
    localStorage.setItem("studyPlannerQuotes", JSON.stringify(quotes));
}

const btnAddQuote = document.getElementById("btn-add-quote");
const inputNewQuote = document.getElementById("input-new-quote");

if (btnAddQuote && inputNewQuote) {
    btnAddQuote.addEventListener("click", () => {
        const text = inputNewQuote.value.trim();
        if (text !== "") {
            quotes.push(text);
            saveQuotes();
            inputNewQuote.value = "";
            renderQuotesList();
            renderRandomQuote();
        }
    });
}

const btnEnableNotify = document.getElementById("btn-enable-notify");
if (btnEnableNotify) {
    btnEnableNotify.addEventListener("click", () => {
        if (!("Notification" in window)) {
            alert("Trình duyệt của bạn không hỗ trợ Thông báo!");
            return;
        }

        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                const randomQ = getRandomQuote();
                new Notification("Nhớ Em Chưa 💡", {
                    body: randomQ,
                    icon: "https://cdn-icons-png.flaticon.com/512/2232/2232688.png"
                });
            } else {
                alert("Bạn cần đồng ý cấp quyền thông báo để tính năng này hoạt động!");
            }
        });
    });
}

// ================================
// QUẢN LÝ CÔNG VIỆC (TASKS) & MỤC CHƯA HOÀN THÀNH
// ================================

const taskDateDisplay = document.getElementById("task-date-display");
const taskListContainer = document.getElementById("task-list");
const btnAddTask = document.getElementById("btn-add-task");
const taskPrevDayBtn = document.getElementById("task-prev-day");
const taskNextDayBtn = document.getElementById("task-next-day");

function renderTasks() {
    if (taskDateDisplay) {
        taskDateDisplay.textContent = formatDateDisplay(taskSelectedDate);
    }

    if (!taskListContainer) return;

    const dateKey = formatDateKey(taskSelectedDate);
    if (!tasks[dateKey]) {
        tasks[dateKey] = [];
    }

    const dayTasks = tasks[dateKey];

    // Thu thập các việc chưa hoàn thành từ các ngày trước đó trong tuần
    let overdueTasks = [];
    const jsDay = taskSelectedDate.getDay(); 
    const currentDayIndex = jsDay === 0 ? 7 : jsDay; // Chủ Nhật tính là 7

    for (let i = 1; i < currentDayIndex; i++) {
        const d = new Date(taskSelectedDate);
        d.setDate(taskSelectedDate.getDate() - (currentDayIndex - i));
        const prevKey = formatDateKey(d);
        
        if (tasks[prevKey]) {
            tasks[prevKey].forEach((t, pIndex) => {
                if (!t.completed) {
                    overdueTasks.push({ ...t, originalDateKey: prevKey, originalIndex: pIndex });
                }
            });
        }
    }

    let htmlContent = "";

    // 1. Hiển thị khu vực "VIỆC CHƯA HOÀN THÀNH" (Tồn đọng)
    if (overdueTasks.length > 0) {
        htmlContent += `
            <div class="overdue-section" style="margin-bottom: 20px; padding: 12px; background: rgba(255, 107, 107, 0.08); border-left: 4px solid #ff6b6b; border-radius: 6px;">
                <h4 style="color: #ff6b6b; margin-bottom: 10px; font-size: 14px;">⚠️ Việc chưa hoàn thành từ ngày trước:</h4>
        `;
        overdueTasks.forEach((task) => {
            htmlContent += `
                <div class="task-item overdue-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div class="task-item-left" style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="task-checkbox overdue-checkbox" data-date="${task.originalDateKey}" data-index="${task.originalIndex}">
                        <span class="task-text">${task.text} <small style="color: var(--text-light);">(Ngày ${task.originalDateKey})</small></span>
                    </div>
                </div>
            `;
        });
        htmlContent += `</div>`;
    }

    // 2. Hiển thị công việc của ngày hiện tại
    if (dayTasks.length === 0 && overdueTasks.length === 0) {
        htmlContent += `
            <div class="empty-task">
                <div>📝</div>
                <h3>Chưa có công việc</h3>
                <p>Thêm việc cần làm hoặc cài đặt sẵn vào Chủ Nhật nhé!</p>
            </div>
        `;
    } else {
        htmlContent += `<h4 style="margin-bottom: 10px; font-size: 14px;">📋 Việc trong ngày:</h4>`;
        dayTasks.forEach((task, index) => {
            htmlContent += `
                <div class="task-item ${task.completed ? "completed" : ""}" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div class="task-item-left" style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="task-checkbox day-checkbox" data-index="${index}" ${task.completed ? "checked" : ""}>
                        <span class="task-text">${task.text}</span>
                    </div>
                    <button class="delete-task-btn" data-index="${index}" style="background: none; border: none; cursor: pointer;">🗑️</button>
                </div>
            `;
        });
    }

    taskListContainer.innerHTML = htmlContent;

    // Lắng nghe sự kiện checkbox ngày hiện tại
    taskListContainer.querySelectorAll(".day-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", (e) => {
            const idx = e.target.dataset.index;
            dayTasks[idx].completed = e.target.checked;
            saveTasks();
            renderTasks();
            renderStats();
        });
    });

    // Lắng nghe sự kiện checkbox việc tồn đọng
    taskListContainer.querySelectorAll(".overdue-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", (e) => {
            const oDate = e.target.dataset.date;
            const oIdx = e.target.dataset.index;
            if (tasks[oDate] && tasks[oDate][oIdx]) {
                tasks[oDate][oIdx].completed = e.target.checked;
                saveTasks();
                renderTasks();
                renderStats();
            }
        });
    });

    // Lắng nghe sự kiện xóa task
    taskListContainer.querySelectorAll(".delete-task-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = e.target.dataset.index;
            dayTasks.splice(idx, 1);
            if (dayTasks.length === 0) delete tasks[dateKey];
            saveTasks();
            renderTasks();
            renderStats();
        });
    });
}

function saveTasks() {
    localStorage.setItem("studyPlannerTasks", JSON.stringify(tasks));
}

if (btnAddTask) {
    btnAddTask.addEventListener("click", () => {
        const text = prompt("Nhập công việc cần làm:");
        if (text && text.trim() !== "") {
            const dateKey = formatDateKey(taskSelectedDate);
            if (!tasks[dateKey]) tasks[dateKey] = [];
            tasks[dateKey].push({ text: text.trim(), completed: false });
            saveTasks();
            renderTasks();
            renderStats();
        }
    });
}

if (taskPrevDayBtn) {
    taskPrevDayBtn.addEventListener("click", () => {
        taskSelectedDate.setDate(taskSelectedDate.getDate() - 1);
        renderTasks();
    });
}

if (taskNextDayBtn) {
    taskNextDayBtn.addEventListener("click", () => {
        taskSelectedDate.setDate(taskSelectedDate.getDate() + 1);
        renderTasks();
    });
}

// ================================
// QUẢN LÝ THỐNG KÊ (STATS)
// ================================

const statsTabs = document.querySelectorAll(".stats-tab");
const statsPercent = document.getElementById("stats-percent");
const statsDetailText = document.getElementById("stats-detail-text");

const homeTodayPercent = document.getElementById("home-today-percent");
const homeTodayCount = document.getElementById("home-today-count");
const homeWeekPercent = document.getElementById("home-week-percent");

statsTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        statsTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        statsCurrentRange = tab.dataset.range;
        renderStats();
    });
});

function getTaskStatsForRange(range) {
    const today = new Date();
    let total = 0;
    let completed = 0;

    if (range === 'day') {
        const key = formatDateKey(today);
        const dayTasks = tasks[key] || [];
        total = dayTasks.length;
        completed = dayTasks.filter(t => t.completed).length;
    } else if (range === 'week') {
        const day = today.getDay();
        const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diffToMonday);

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const key = formatDateKey(d);
            const dayTasks = tasks[key] || [];
            total += dayTasks.length;
            completed += dayTasks.filter(t => t.completed).length;
        }
    } else if (range === 'month') {
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const key = formatDateKey(d);
            const dayTasks = tasks[key] || [];
            total += dayTasks.length;
            completed += dayTasks.filter(t => t.completed).length;
        }
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
}

function renderStats() {
    const rangeStats = getTaskStatsForRange(statsCurrentRange);
    if (statsPercent) statsPercent.textContent = `${rangeStats.percent}%`;
    if (statsDetailText) statsDetailText.textContent = `Hoàn thành ${rangeStats.completed} / ${rangeStats.total} công việc`;

    const dayStats = getTaskStatsForRange('day');
    const weekStats = getTaskStatsForRange('week');

    if (homeTodayPercent) homeTodayPercent.textContent = `${dayStats.percent}%`;
    if (homeTodayCount) homeTodayCount.textContent = `${dayStats.completed} / ${dayStats.total} việc`;
    if (homeWeekPercent) homeWeekPercent.textContent = `${weekStats.percent}%`;
}

// ================================
// QUẢN LÝ KỲ THI (EXAMS)
// ================================

function calculateDaysLeft(targetDateStr) {
    if (!targetDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
}

function formatDateStrDisplay(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function renderExams() {
    renderHomeExams();

    if (activeExamIndex >= exams.length) activeExamIndex = 0;
    const currentExam = exams[activeExamIndex] || defaultExams[0];
    const daysLeft = calculateDaysLeft(currentExam.date);

    const examTitle = document.getElementById("exam-display-title");
    const examDateText = document.getElementById("exam-display-date");
    const examDaysText = document.getElementById("exam-display-days");

    if (examTitle) examTitle.textContent = currentExam.name;
    if (examDateText) examDateText.textContent = `Ngày thi: ${formatDateStrDisplay(currentExam.date)}`;
    if (examDaysText) examDaysText.textContent = daysLeft;

    renderExamTabs();
}

function renderHomeExams() {
    const homeExamsContainer = document.getElementById("home-exams-container");
    if (!homeExamsContainer) return;

    if (exams.length === 0) {
        homeExamsContainer.innerHTML = `<p style="text-align:center; color: var(--text-light); font-size:13px;">Chưa có kỳ thi nào</p>`;
        return;
    }

    homeExamsContainer.innerHTML = exams.map(exam => {
        const daysLeft = calculateDaysLeft(exam.date);
        return `
            <div class="exam-card">
                <div>
                    <p class="exam-sub">KỲ THI SẮP TỚI</p>
                    <h2>${exam.name}</h2>
                </div>
                <div class="countdown">
                    <strong>${daysLeft}</strong>
                    <span>ngày</span>
                </div>
            </div>
        `;
    }).join("");
}

function renderExamTabs() {
    const tabsContainer = document.getElementById("exam-tabs-container");
    if (!tabsContainer) return;

    tabsContainer.innerHTML = "";
    exams.forEach((exam, index) => {
        const btn = document.createElement("button");
        btn.className = `exam-tab-btn ${index === activeExamIndex ? "active" : ""}`;
        btn.textContent = exam.name;
        btn.addEventListener("click", () => {
            activeExamIndex = index;
            saveExams();
            renderExams();
        });
        tabsContainer.appendChild(btn);
    });
}

function saveExams() {
    localStorage.setItem("studyPlannerExams", JSON.stringify(exams));
    localStorage.setItem("studyPlannerActiveExamIndex", activeExamIndex);
}

const btnEditExam = document.getElementById("btn-edit-exam");
if (btnEditExam) {
    btnEditExam.addEventListener("click", () => {
        if (exams.length === 0) return;
        const currentExam = exams[activeExamIndex];
        const newName = prompt("Nhập tên kỳ thi:", currentExam.name);
        if (!newName || newName.trim() === "") return;

        const newDate = prompt("Nhập ngày thi (VD: 2026-12-26):", currentExam.date);
        if (!newDate || newDate.trim() === "") return;

        exams[activeExamIndex] = { name: newName.trim(), date: newDate.trim() };
        saveExams();
        renderExams();
    });
}

const btnAddExam = document.getElementById("btn-add-exam");
if (btnAddExam) {
    btnAddExam.addEventListener("click", () => {
        const newName = prompt("Nhập tên kỳ thi mới:", "Thi Học Kỳ");
        if (!newName || newName.trim() === "") return;

        const newDate = prompt("Nhập ngày thi (VD: 2026-12-26):", "2026-12-26");
        if (!newDate || newDate.trim() === "") return;

        exams.push({ name: newName.trim(), date: newDate.trim() });
        activeExamIndex = exams.length - 1;
        saveExams();
        renderExams();
    });
}

const btnDeleteExam = document.getElementById("btn-delete-exam");
if (btnDeleteExam) {
    btnDeleteExam.addEventListener("click", () => {
        if (exams.length <= 1) {
            alert("Bạn cần giữ lại ít nhất 1 kỳ thi!");
            return;
        }
        if (confirm(`Bạn có chắc muốn xóa kỳ thi "${exams[activeExamIndex].name}"?`)) {
            exams.splice(activeExamIndex, 1);
            activeExamIndex = 0;
            saveExams();
            renderExams();
        }
    });
}

// ================================
// CHUYỂN MÀN HÌNH (NAV BAR)
// ================================

const navItems = document.querySelectorAll(".nav-item");
const screens = document.querySelectorAll(".screen");

navItems.forEach((item) => {
    item.addEventListener("click", () => {
        const screenId = item.dataset.screen;
        navItems.forEach((nav) => nav.classList.remove("active"));
        screens.forEach((screen) => screen.classList.remove("active"));

        item.classList.add("active");
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.add("active");
    });
});

// ================================
// BẢNG THỜI KHÓA BIỂU (SÁNG / CHIỀU)
// ================================

const weeklyTbody = document.getElementById("weekly-tbody");

function renderTimetable() {
    if (!weeklyTbody) return;
    weeklyTbody.innerHTML = "";

    // Header Buổi Sáng
    const trMorningHeader = document.createElement("tr");
    trMorningHeader.className = "timetable-divider";
    trMorningHeader.innerHTML = `<td colspan="7">☀️ BUỔI SÁNG (Tiết 1 - 5)</td>`;
    weeklyTbody.appendChild(trMorningHeader);

    for (let period = 1; period <= 5; period++) {
        createPeriodRow(period);
    }

    // Khoảng trống ngăn cách sáng - chiều
    const trDivider = document.createElement("tr");
    trDivider.className = "timetable-divider";
    trDivider.innerHTML = `<td colspan="7" style="height: 15px; background: var(--bg) !important; border: none;"></td>`;
    weeklyTbody.appendChild(trDivider);

    // Header Buổi Chiều
    const trAfternoonHeader = document.createElement("tr");
    trAfternoonHeader.className = "timetable-divider";
    trAfternoonHeader.innerHTML = `<td colspan="7">🌙 BUỔI CHIỀU (Tiết 6 - 10)</td>`;
    weeklyTbody.appendChild(trAfternoonHeader);

    for (let period = 6; period <= 10; period++) {
        createPeriodRow(period);
    }
}

function createPeriodRow(period) {
    const tr = document.createElement("tr");

    const tdPeriod = document.createElement("td");
    tdPeriod.innerHTML = `<strong>Tiết ${period}</strong>`;
    tr.appendChild(tdPeriod);

    for (let day = 2; day <= 7; day++) {
        const td = document.createElement("td");
        td.className = "cell-editable";
        const key = `${period}_${day}`;
        const subject = schedule[key] || "";
        td.textContent = subject;

        td.addEventListener("click", () => {
            const newSubject = prompt(`Nhập môn học cho Tiết ${period} - Thứ ${day}:`, subject);
            if (newSubject !== null) {
                if (newSubject.trim() === "") delete schedule[key];
                else schedule[key] = newSubject.trim();
                saveSchedule();
                renderTimetable();
            }
        });

        tr.appendChild(td);
    }
    weeklyTbody.appendChild(tr);
}

function saveSchedule() {
    localStorage.setItem("studyPlannerSchedule", JSON.stringify(schedule));
}

const addScheduleButtons = document.querySelectorAll(".add-btn");
addScheduleButtons.forEach((btn) => {
    if (btn.id === "btn-add-extra-class") return;
    
    btn.addEventListener("click", () => {
        const dayInput = prompt("Nhập Thứ (2 đến 7):", "2");
        if (!dayInput) return;
        const day = parseInt(dayInput);
        if (isNaN(day) || day < 2 || day > 7) return alert("Thứ không hợp lệ!");

        const periodInput = prompt("Nhập Tiết học (1 đến 10):", "1");
        if (!periodInput) return;
        const period = parseInt(periodInput);
        if (isNaN(period) || period < 1 || period > 10) return alert("Tiết học không hợp lệ!");

        const key = `${period}_${day}`;
        const subject = prompt(`Nhập tên môn học cho Tiết ${period} - Thứ ${day}:`, schedule[key] || "");
        if (subject !== null) {
            if (subject.trim() === "") delete schedule[key];
            else schedule[key] = subject.trim();
            saveSchedule();
            renderTimetable();
        }
    });
});

// ================================
// QUẢN LÝ LỊCH HỌC THÊM (EXTRA CLASSES)
// ================================

const extraClassTbody = document.getElementById("extra-class-tbody");
const btnAddExtraClass = document.getElementById("btn-add-extra-class");

function renderExtraClasses() {
    if (!extraClassTbody) return;
    extraClassTbody.innerHTML = "";

    if (extraClasses.length === 0) {
        extraClassTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-light); padding: 15px;">Chưa có lịch học thêm nào</td></tr>`;
        return;
    }

    extraClasses.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.day}</td>
            <td>${item.time}</td>
            <td><strong>${item.subject}</strong></td>
            <td>${item.note || ""}</td>
            <td><button class="delete-quote-btn" data-index="${index}">🗑️</button></td>
        `;

        tr.querySelector(".delete-quote-btn").addEventListener("click", () => {
            extraClasses.splice(index, 1);
            saveExtraClasses();
            renderExtraClasses();
        });

        extraClassTbody.appendChild(tr);
    });
}

function saveExtraClasses() {
    localStorage.setItem("studyPlannerExtraClasses", JSON.stringify(extraClasses));
}

if (btnAddExtraClass) {
    btnAddExtraClass.addEventListener("click", () => {
        const day = prompt("Nhập Thứ (VD: Thứ 2, Thứ 3...):", "Thứ 3");
        if (!day) return;

        const time = prompt("Nhập Giờ học (VD: 18:00 - 19:30):", "18:00 - 19:30");
        if (!time) return;

        const subject = prompt("Nhập tên Môn học:", "Toán");
        if (!subject) return;

        const note = prompt("Nhập Ghi chú (nếu có):", "Phòng học thêm...");

        extraClasses.push({ day: day.trim(), time: time.trim(), subject: subject.trim(), note: note ? note.trim() : "" });
        saveExtraClasses();
        renderExtraClasses();
    });
}

// ================================
// GIAO DIỆN SÁNG / TỐI (MOON)
// ================================

const moonBtn = document.querySelector(".moon");
if (moonBtn) {
    moonBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        moonBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
    });
}

// ================================
// KHỞI ĐỘNG APP
// ================================

document.addEventListener("DOMContentLoaded", () => {
    updateRealtimeDates();
    renderTimetable();
    renderExtraClasses();
    renderQuotesList();
    setInterval(updateRealtimeDates, 60000);
    console.log("App Nhớ Em Chưa đã sẵn sàng 💙");
});
