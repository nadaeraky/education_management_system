"use strict";
const API_BASE = "/api/students"; // غيّر ده لرابط الـ API بتاعك
const EDIT_URL_BASE = "/students/edit"; // غيّر ده لمسار صفحة تعديل الطالب
const ADD_STUDENT_URL = "index.html"; // غيّر ده لمسار صفحة إضافة طالب
const EDIT_STUDENT_URL = "/students/edit"; // غيّر ده لمسار صفحة اختيار طالب للتعديل

const DEMO_MODE = true;

const state = {
  all: [],
  filtered: [],
  currentPage: 1,
  pageSize: 10,
  studentPendingDeletion: null,
};

document.addEventListener("DOMContentLoaded", async () => {
  initSidebarToggle();
  initNavButtons();
  initFilters();
  initPagination();
  initRowActions();
  initConfirmModal();
  initSuccessModal();
  initThemeToggle();

  await loadStudents();
});

// Dark mode toggle (preference saved in localStorage)

function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggleBtn");
  const icon = document.getElementById("themeIcon");
  const root = document.documentElement;

  const applyIcon = () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    icon.className = isDark ? "fa-solid fa-moon" : "fa-solid fa-sun";
  };

  applyIcon();

  toggleBtn?.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
    applyIcon();
  });
}

//  * Sidebar / navigation
function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  menuBtn?.addEventListener("click", () =>
    sidebar.classList.toggle("sidebar--open"),
  );
}

function initNavButtons() {
  document.getElementById("backBtn")?.addEventListener("click", () => {
    window.location.href = "/main"; // الصفحة الرئيسية
  });

  document.getElementById("goToAddBtn")?.addEventListener("click", () => {
    window.location.href = "./addStudent.html";
  });

  document.getElementById("goToEditBtn")?.addEventListener("click", () => {
    window.location.href = EDIT_STUDENT_URL; // تعديل طالب
  });
}

// Loading students
async function loadStudents() {
  try {
    state.all = await fetchStudents();
    applyFilters();
  } catch (err) {
    showToast(err.message || "تعذر تحميل بيانات الطلاب", "error");
  }
}

// Filters (search + dropdowns)
function initFilters() {
  const searchInput = document.getElementById("searchInput");
  const departmentSelect = document.getElementById("filterDepartment");
  const levelSelect = document.getElementById("filterLevel");
  const statusSelect = document.getElementById("filterStatus");
  const filterBtn = document.getElementById("filterBtn");

  let debounceTimer;
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.currentPage = 1;
      applyFilters();
    }, 250);
  });

  [departmentSelect, levelSelect, statusSelect].forEach((select) => {
    select?.addEventListener("change", () => {
      state.currentPage = 1;
      applyFilters();
    });
  });

  filterBtn?.addEventListener("click", () => {
    state.currentPage = 1;
    applyFilters();
  });
}

function applyFilters() {
  const search = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const department = document.getElementById("filterDepartment").value;
  const level = document.getElementById("filterLevel").value;
  const status = document.getElementById("filterStatus").value;

  state.filtered = state.all.filter((student) => {
    const matchesSearch =
      !search ||
      student.fullName.toLowerCase().includes(search) ||
      student.studentId.toLowerCase().includes(search);

    const matchesDepartment = !department || student.department === department;
    const matchesLevel = !level || String(student.level) === level;
    const matchesStatus = !status || student.status === status;

    return matchesSearch && matchesDepartment && matchesLevel && matchesStatus;
  });

  renderTable();
  renderPagination();
}

//  Table rendering
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const emptyState = document.getElementById("tableEmpty");

  const start = (state.currentPage - 1) * state.pageSize;
  const pageItems = state.filtered.slice(start, start + state.pageSize);

  tbody.innerHTML = "";

  if (pageItems.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  pageItems.forEach((student, index) => {
    const row = document.createElement("tr");
    row.dataset.id = student.id;

    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${escapeHtml(student.studentId)}</td>
      <td>${escapeHtml(student.fullName)}</td>
      <td>${escapeHtml(student.department)}</td>
      <td>${escapeHtml(String(student.level))}</td>
      <td>
        <span class="badge ${student.status === "active" ? "badge--active" : "badge--inactive"}">
          ${student.status === "active" ? "مُفعل" : "غير مُفعل"}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button class="icon-btn icon-btn--edit" data-edit-id="${student.id}" title="تعديل الطالب" aria-label="تعديل الطالب">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="icon-btn icon-btn--delete" data-delete-id="${student.id}" title="حذف الطالب" aria-label="حذف الطالب">
          <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

//  Pagination
function initPagination() {
  document.getElementById("pageSizeSelect")?.addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value);
    state.currentPage = 1;
    renderTable();
    renderPagination();
  });
}

function renderPagination() {
  const container = document.getElementById("paginationPages");
  const totalPages = Math.max(
    1,
    Math.ceil(state.filtered.length / state.pageSize),
  );

  if (state.currentPage > totalPages) state.currentPage = totalPages;

  container.innerHTML = "";
  container.appendChild(
    createPageButton("‹", state.currentPage - 1, state.currentPage === 1),
  );

  getPageNumbers(state.currentPage, totalPages).forEach((page) => {
    if (page === "...") {
      const dots = document.createElement("span");
      dots.className = "page-btn page-btn--dots";
      dots.textContent = "…";
      container.appendChild(dots);
    } else {
      container.appendChild(
        createPageButton(page, page, false, page === state.currentPage),
      );
    }
  });

  container.appendChild(
    createPageButton(
      "›",
      state.currentPage + 1,
      state.currentPage === totalPages,
    ),
  );
}

function createPageButton(label, targetPage, disabled, isActive) {
  const btn = document.createElement("button");
  btn.className = "page-btn" + (isActive ? " page-btn--active" : "");
  btn.textContent = label;
  btn.disabled = disabled;
  btn.addEventListener("click", () => {
    state.currentPage = targetPage;
    renderTable();
    renderPagination();
  });
  return btn;
}

function getPageNumbers(current, total) {
  const pages = [];
  const window = 1;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= window) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
}

// Row actions: edit → navigate, delete → confirm popup
function initRowActions() {
  const tableBody = document.getElementById("tableBody");

  tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit-id]");
    if (editBtn) {
      window.location.href = `${EDIT_URL_BASE}/${editBtn.dataset.editId}`;
      return;
    }

    const deleteBtn = e.target.closest("[data-delete-id]");
    if (deleteBtn) {
      const student = state.all.find(
        (s) => String(s.id) === String(deleteBtn.dataset.deleteId),
      );
      if (student) openConfirmModal(student);
    }
  });
}

//  Confirm-delete popup
function initConfirmModal() {
  const overlay = document.getElementById("confirmOverlay");
  const closeBtn = document.getElementById("confirmClose");
  const cancelBtn = document.getElementById("cancelDeleteBtn");
  const confirmBtn = document.getElementById("confirmDeleteBtn");

  const close = () => {
    overlay.hidden = true;
    state.studentPendingDeletion = null;
  };

  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  confirmBtn.addEventListener("click", async () => {
    const student = state.studentPendingDeletion;
    if (!student) return;

    setButtonLoading(confirmBtn, true, "جاري الحذف...");
    try {
      await deleteStudentRequest(student.id);

      state.all = state.all.filter((s) => s.id !== student.id);
      close();
      applyFilters();
      showSuccessModal(
        `تم حذف الطالب "${student.fullName}" نهائيًا من قاعدة البيانات.`,
      );
    } catch (err) {
      showToast(err.message || "تعذر حذف الطالب، حاول مرة اخري", "error");
    } finally {
      setButtonLoading(confirmBtn, false);
    }
  });
}

function openConfirmModal(student) {
  state.studentPendingDeletion = student;
  document.getElementById("confirmStudentName").textContent = student.fullName;
  document.getElementById("confirmOverlay").hidden = false;
}

function setButtonLoading(button, isLoading, loadingText) {
  button.disabled = isLoading;
  button.dataset.originalHtml ??= button.innerHTML;
  button.innerHTML = isLoading ? loadingText : button.dataset.originalHtml;
}

//  Success popup
function initSuccessModal() {
  const overlay = document.getElementById("successOverlay");
  const closeBtn = document.getElementById("successClose");
  const okBtn = document.getElementById("successOkBtn");

  const close = () => {
    overlay.hidden = true;
  };

  closeBtn.addEventListener("click", close);
  okBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
}

function showSuccessModal(message) {
  document.getElementById("successMessage").textContent = message;
  document.getElementById("successOverlay").hidden = false;
}

// Toast (errors)
let toastTimeout;
function showToast(message, type = "default") {
  const toast = document.getElementById("toast");
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.className =
    "toast toast--visible" + (type === "error" ? " toast--error" : "");
  toastTimeout = setTimeout(
    () => toast.classList.remove("toast--visible"),
    3200,
  );
}

// Backend integration points
/**
 * @returns {Promise<Array>}
 */
async function fetchStudents() {
  return generateMockStudents(50);
}

/**
 * @param {number|string} id
 */
async function deleteStudentRequest(id) {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return;
  }

  const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });

  if (!response.ok) {
    let message = "تعذر حذف الطالب";
    try {
      const body = await response.json();
      message = body.message || message;
    } catch (_) {}
    throw new Error(message);
  }
}

// Mock data generator (هتتشال بعد ربط الـ API الحقيقي)
function generateMockStudents(count) {
  const firstNames = [
    "Ahmed",
    "Mohamed",
    "Omar",
    "Sara",
    "Nada",
    "Mostafa",
    "Youssef",
    "Mariam",
    "Ali",
    "Hana",
    "Karim",
    "Laila",
    "Khaled",
    "Rana",
    "Tarek",
  ];
  const lastNames = [
    "Mohamed Ali",
    "Refaat",
    "Hassan",
    "Mahmoud",
    "Ahmed",
    "Ibrahim",
    "Fathy",
    "El-Sayed",
    "Kamal",
    "Abdelrahman",
  ];
  const departments = [
    "Computer Science",
    "Information Systems",
    "Software Engineering",
    "Information Technology",
  ];

  const students = [];
  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    students.push({
      id: i,
      studentId: `STD-2025-${String(157 + i).padStart(4, "0")}`,
      fullName: `${firstName} ${lastName}`,
      department: departments[i % departments.length],
      level: (i % 4) + 1,
      status: i % 5 === 0 ? "inactive" : "active",
    });
  }
  return students;
}
