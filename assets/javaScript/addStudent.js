"use strict";

const API_ENDPOINT = "/api/students";

const DEMO_MODE = true;

document.addEventListener("DOMContentLoaded", () => {
  initSidebarToggle();
  initThemeToggle();
  initConditionalFields();
  initWizard();
});

function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggleBtn");
  const icon = document.getElementById("themeIcon");
  const root = document.documentElement;

  const applyIcon = () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
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

// Sidebar toggle (mobile)
function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");

  menuBtn?.addEventListener("click", () => {
    sidebar?.classList.toggle("sidebar--open");
  });
}

function initConditionalFields() {
  const idType = document.getElementById("idType");
  const idNumberField = document.getElementById("idNumberField");
  const idNumberLabel = document.getElementById("idNumberLabel");
  const idNumberInput = document.getElementById("idNumber");

  idType?.addEventListener("change", () => {
    const value = idType.value;
    if (!value) {
      idNumberField.hidden = true;
      return;
    }
    idNumberField.hidden = false;
    if (value === "national") {
      idNumberLabel.textContent = "رقم قومي";
      idNumberInput.placeholder = "أدخل الرقم القومي (14 رقم)";
      idNumberInput.maxLength = 14;
    } else {
      idNumberLabel.textContent = "رقم جواز السفر";
      idNumberInput.placeholder = "أدخل رقم جواز السفر";
      idNumberInput.removeAttribute("maxlength");
    }
    idNumberInput.value = "";
    clearFieldError(idNumberInput);
  });

  const isFatherDeceased = document.getElementById("isFatherDeceased");
  const guardianSection = document.getElementById("guardianSection");

  isFatherDeceased?.addEventListener("change", () => {
    guardianSection.hidden = !isFatherDeceased.checked;
    if (!isFatherDeceased.checked) {
      guardianSection.querySelectorAll("input, select").forEach((el) => {
        el.value = "";
        clearFieldError(el);
      });
    }
  });
}

const TOTAL_STEPS = 3;
let currentStep = 1;

const STEP_VALIDATORS = {
  1: {
    arabFullName: (v) =>
      v.trim().split(/\s+/).filter(Boolean).length >= 4 ||
      "من فضلك أدخل الاسم رباعي كامل",
    phone: (v) => /^01[0-2,5]\d{8}$/.test(v) || "من فضلك أدخل رقم هاتف صحيح",
    governorate: (v) => !!v || "من فضلك اختر المحافظة",
    gender: (v) => !!v || "من فضلك اختر النوع",
    dob: (v) => !!v || "من فضلك أدخل تاريخ الميلاد",
    idType: (v) => !!v || "من فضلك اختر نوع الهوية",
    idNumber: (v, form) => {
      const idType = form.elements["idType"]?.value;
      if (idType === "national")
        return /^\d{14}$/.test(v) || "الرقم القومي لازم يكون 14 رقم";
      if (idType === "passport")
        return v.trim().length >= 4 || "من فضلك أدخل رقم جواز سفر صحيح";
      return true;
    },
  },
  2: {
    englishFullName: (v) =>
      v.trim().split(/\s+/).filter(Boolean).length >= 4 ||
      "من فضلك أدخل الاسم رباعي بالإنجليزي",
    address: (v) => v.trim().length >= 5 || "من فضلك أدخل عنوان صحيح",
    country: (v) => !!v.trim() || "من فضلك أدخل الدولة",
    maritalStatus: (v) => !!v || "من فضلك اختر الحالة الاجتماعية",
    religion: (v) => !!v || "من فضلك اختر الديانة",
    cardIssuePlace: (v) => !!v.trim() || "من فضلك أدخل جهة صدور البطاقة",
    dataEntryDate: (v) => !!v || "من فضلك أدخل تاريخ إدخال البيانات",
    oneChanceStudent: (v) => !!v || "من فضلك اختر إجابة",
    studyType: (v) => !!v || "من فضلك اختر نظام الدراسة",
    qualification: (v) => !!v || "من فضلك اختر المؤهل",
    qualificationYear: (v) => !!v || "من فضلك أدخل سنة الحصول على المؤهل",
    schoolName: (v) => !!v.trim() || "من فضلك أدخل اسم المدرسة",
    total: (v) => !!v || "من فضلك أدخل المجموع",
    seatNumber: (v) => !!v.trim() || "من فضلك أدخل رقم الجلوس",
    enrollmentStatus: (v) => !!v || "من فضلك اختر حالة القيد",
    enrollmentType: (v) => !!v || "من فضلك اختر نوع القيد",
    coordinationNumber: (v) => !!v.trim() || "من فضلك أدخل رقم كشف التنسيق",
  },
  3: {
    fatherName: (v) => !!v.trim() || "من فضلك أدخل اسم الأب",
    motherName: (v) => !!v.trim() || "من فضلك أدخل اسم الأم",
    fatherJob: (v) => !!v.trim() || "من فضلك أدخل مهنة الأب",
    motherJob: (v) => !!v.trim() || "من فضلك أدخل مهنة الأم",
    fatherWorkplace: (v) => !!v.trim() || "من فضلك أدخل جهة عمل الأب",
    motherWorkplace: (v) => !!v.trim() || "من فضلك أدخل جهة عمل الأم",
    fatherPhone: (v) =>
      /^01[0-2,5]\d{8}$/.test(v) || "من فضلك أدخل رقم هاتف صحيح",
    motherPhone: (v) =>
      /^01[0-2,5]\d{8}$/.test(v) || "من فضلك أدخل رقم هاتف صحيح",

    guardianName: (v, form) =>
      !isGuardianRequired(form) || !!v.trim() || "من فضلك أدخل اسم ولي الأمر",
    guardianRelation: (v, form) =>
      !isGuardianRequired(form) || !!v.trim() || "من فضلك أدخل درجة القرابة",
    guardianWorkplace: (v, form) =>
      !isGuardianRequired(form) ||
      !!v.trim() ||
      "من فضلك أدخل جهة عمل ولي الأمر",
    guardianPhone: (v, form) =>
      !isGuardianRequired(form) ||
      /^01[0-2,5]\d{8}$/.test(v) ||
      "من فضلك أدخل رقم هاتف صحيح",
    guardianAddress: (v, form) =>
      !isGuardianRequired(form) || !!v.trim() || "من فضلك أدخل عنوان ولي الأمر",
  },
};

function isGuardianRequired(form) {
  return !!form.elements["isFatherDeceased"]?.checked;
}

function initWizard() {
  const form = document.getElementById("studentForm");
  const continueBtn = document.getElementById("continueBtn");
  const backStepBtn = document.getElementById("backStepBtn");
  const saveBtn = document.getElementById("saveBtn");

  if (!form) return;

  form.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => clearFieldError(el));
    el.addEventListener("change", () => clearFieldError(el));
  });

  goToStep(1);

  continueBtn?.addEventListener("click", () => {
    if (!validateStep(form, currentStep)) {
      showToast("يرجى التأكد من صحة البيانات", "error");
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    }
  });

  backStepBtn?.addEventListener("click", () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let allValid = true;
    for (let step = 1; step <= currentStep; step++) {
      if (!validateStep(form, step)) allValid = false;
    }

    if (!allValid) {
      showToast("يرجى التأكد من صحة البيانات", "error");
      return;
    }

    const payload = collectPayload(form);

    setLoading(saveBtn, true);
    try {
      await submitStudent(payload);
      showSuccessModal();
      form.reset();
      resetConditionalFields();
      goToStep(1);
    } catch (err) {
      showToast(err.message || "حدث خطأ أثناء الحفظ، حاول مرة أخرى", "error");
    } finally {
      setLoading(saveBtn, false);
    }
  });

  initSuccessModal();
}

// popUP
function initSuccessModal() {
  const overlay = document.getElementById("successModal");
  const closeBtn = document.getElementById("successModalCloseBtn");

  closeBtn?.addEventListener("click", hideSuccessModal);
  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) hideSuccessModal();
  });
}

function showSuccessModal() {
  const overlay = document.getElementById("successModal");
  if (!overlay) return;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("modal-overlay--visible"));
}

function hideSuccessModal() {
  const overlay = document.getElementById("successModal");
  if (!overlay) return;
  overlay.classList.remove("modal-overlay--visible");
  setTimeout(() => {
    overlay.hidden = true;
  }, 200);
}

function resetConditionalFields() {
  const idNumberField = document.getElementById("idNumberField");
  if (idNumberField) idNumberField.hidden = true;
  const guardianSection = document.getElementById("guardianSection");
  if (guardianSection) guardianSection.hidden = true;
}

function goToStep(step) {
  currentStep = step;

  document.querySelectorAll(".wizard-step").forEach((section) => {
    section.classList.toggle(
      "wizard-step--active",
      Number(section.dataset.step) === step,
    );
  });

  document.querySelectorAll("[data-step-indicator]").forEach((item) => {
    const itemStep = Number(item.dataset.stepIndicator);
    item.classList.toggle("wizard-steps__item--active", itemStep === step);
    item.classList.toggle("wizard-steps__item--done", itemStep < step);
  });

  const continueBtn = document.getElementById("continueBtn");
  const backStepBtn = document.getElementById("backStepBtn");

  if (continueBtn) continueBtn.hidden = step === TOTAL_STEPS;
  if (backStepBtn) backStepBtn.hidden = step === 1;

  document
    .querySelector(".page")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function validateStep(form, step) {
  const validators = STEP_VALIDATORS[step];
  if (!validators) return true;

  let isValid = true;

  Object.entries(validators).forEach(([fieldName, validate]) => {
    const field = form.elements[fieldName];
    if (!field) return;

    // الحقل المخفي رقم الهوية
    const wrapper = field.closest(".field");
    if (wrapper && wrapper.hidden) return;
    if (wrapper && wrapper.closest("[hidden]")) return;

    const value = (field.value || "").toString();
    const result = validate(value, form);

    if (result !== true) {
      isValid = false;
      setFieldError(field, result);
    }
  });

  return isValid;
}

function collectPayload(form) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.isFatherDeceased = !!form.elements["isFatherDeceased"]?.checked;
  return payload;
}

function setFieldError(field, message) {
  if (!field) return;
  const wrapper = field.closest(".field");
  const errorEl = wrapper?.querySelector(".field__error");

  wrapper?.classList.add("field--invalid");
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(field) {
  const wrapper = field.closest(".field");
  const errorEl = wrapper?.querySelector(".field__error");

  wrapper?.classList.remove("field--invalid");
  if (errorEl) errorEl.textContent = "";
}

function setLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  const label = button.querySelector(".btn__label");
  if (label) label.textContent = isLoading ? "جاري الحفظ..." : "إرسال";
}

/*  Backend integration point  */

/**
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
async function submitStudent(payload) {
  if (DEMO_MODE) {
    // محاكاة تأخير الشبكة، وبترجع نجاح دايمًا
    await new Promise((resolve) => setTimeout(resolve, 700));
    console.info("[وضع تجريبي] بيانات كانت هتتبعت للسيرفر:", payload);
    return { success: true, demo: true };
  }

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "تعذر حفظ بيانات الطالب";
    try {
      const errorBody = await response.json();
      message = errorBody.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  return response.json();
}

/*  Toast notifications  */
let toastTimeout;

function showToast(message, type = "default") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.className = "toast toast--visible";
  if (type === "success") toast.classList.add("toast--success");
  if (type === "error") toast.classList.add("toast--error");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 3200);
}
