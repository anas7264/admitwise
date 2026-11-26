import { evaluateInstitution, getProfileCompleteness, validateInstitution } from "/core.js";
import { MAJORS, INSTITUTIONS, searchMajors, searchInstitutions, buildDiscoveryRequest } from "/discovery.js";

const DB_NAME = "admitwise-local";
const DB_VERSION = 1;
const PROFILE_KEY = "default";
let db;
let toastTimer;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("profile")) database.createObjectStore("profile");
      if (!database.objectStoreNames.contains("programs")) database.createObjectStore("programs", { keyPath: "id" });
      if (!database.objectStoreNames.contains("preferences")) database.createObjectStore("preferences");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function storeRequest(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let request;
    try { request = action(store); } catch (error) { reject(error); return; }
    if (request) {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } else {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    }
  });
}
const get = (store, key) => storeRequest(store, "readonly", (s) => s.get(key));
const put = (store, value, key) => storeRequest(store, "readwrite", (s) => key === undefined ? s.put(value) : s.put(value, key));
const all = (store) => storeRequest(store, "readonly", (s) => s.getAll());
const remove = (store, key) => storeRequest(store, "readwrite", (s) => s.delete(key));

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function navigate(view) {
  document.querySelectorAll(".view").forEach((section) => section.classList.toggle("active", section.id === `view-${view}`));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  const active = document.querySelector(`[data-view="${view}"]`);
  document.querySelector("#page-title").textContent = active?.textContent.trim() || "ADMITWISE";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function numericProfile(form) {
  const data = {};
  for (const [key, value] of new FormData(form)) data[key] = value.trim() === "" ? null : Number(value);
  return data;
}
function fillProfile(form, profile) {
  for (const [key, value] of Object.entries(profile || {})) {
    const input = form.elements.namedItem(key);
    if (input) input.value = value ?? "";
  }
}
function resultLabel(status) {
  return ({ pass: "يستوفي الشروط المسجلة", fail: "لا يستوفي بعض الشروط", unknown: "النتيجة غير محسومة", no_criteria: "لم تُسجل شروط" })[status] || "غير محسوم";
}
function statusClass(status) { return `status-${status}`; }
function summarize(result) {
  if (result.status === "no_criteria") return "أضف شروط القبول لتفعيل المقارنة.";
  return `${result.passed} مستوفى · ${result.failed} غير مستوفى · ${result.unknown} غير محسوم`;
}

async function refreshDashboard() {
  const profile = await get("profile", PROFILE_KEY) || {};
  const programs = await all("programs");
  const completeness = getProfileCompleteness(profile);
  document.querySelector("#stat-completeness").textContent = `${completeness.percent}%`;
  document.querySelector("#profile-progress").style.width = `${completeness.percent}%`;
  document.querySelector("#stat-programs").textContent = programs.length;
  const results = programs.map((program) => evaluateInstitution(program, profile));
  document.querySelector("#stat-pass").textContent = results.filter((result) => result.status === "pass").length;
  document.querySelector("#stat-unknown").textContent = results.filter((result) => result.status === "unknown").length;
  document.querySelector("#setup-profile").textContent = completeness.filled ? "مكتمل جزئيًا ✓" : "ابدأ ←";
  document.querySelector("#setup-programs").textContent = programs.length ? "تمت الإضافة ✓" : "ابدأ ←";
  document.querySelector("#last-saved").textContent = completeness.filled || programs.length ? "يتم حفظ التغييرات محليًا" : "لم تُحفظ بيانات بعد";
  renderPrograms(programs.slice().sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)), profile, "#recent-programs", true);
  renderPrograms(programs, profile, "#programs-list");
  document.querySelector("#program-count").textContent = `${programs.length} برامج`;
}

function renderPrograms(programs, profile, target, compact = false) {
  const container = document.querySelector(target);
  if (!programs.length) {
    container.className = "program-list empty-state";
    container.textContent = compact ? "لا توجد برامج بعد. أضف أول برنامج لمشاهدة المقارنة هنا." : "لم تضف أي برنامج بعد.";
    return;
  }
  container.className = "program-list";
  const search = target === "#programs-list" ? document.querySelector("#program-search").value.trim().toLowerCase() : "";
  const visible = programs.filter((item) => `${item.institution} ${item.program}`.toLowerCase().includes(search));
  if (!visible.length) { container.className = "program-list empty-state"; container.textContent = "لا توجد نتائج مطابقة."; return; }
  container.innerHTML = visible.map((program) => {
    const result = evaluateInstitution(program, profile);
    const meta = [program.year, program.degree, program.region, program.language].filter(Boolean).map(escapeHtml).join(" · ");
    const source = program.sourceUrl ? `<a href="${escapeHtml(program.sourceUrl)}" target="_blank" rel="noopener noreferrer">المصدر الرسمي ↗</a>` : "لم يحدد مصدر";
    return `<article class="program-card"><div class="program-card-head"><div><h3>${escapeHtml(program.institution)} — ${escapeHtml(program.program)}</h3><p>${escapeHtml(meta)}</p></div><span class="status-pill ${statusClass(result.status)}">${resultLabel(result.status)}</span></div><div class="program-card-foot"><span class="result-detail">${escapeHtml(summarize(result))} · ${source}</span>${compact ? "" : `<div class="card-actions"><button data-edit="${escapeHtml(program.id)}">تعديل</button><button class="delete" data-delete="${escapeHtml(program.id)}">حذف</button></div>`}</div></article>`;
  }).join("");
}

function addGroup(data = null) {
  const fragment = document.querySelector("#group-template").content.cloneNode(true);
  const group = fragment.querySelector(".criteria-group");
  if (data) {
    group.querySelector(".group-name").value = data.name || "";
    group.querySelector(".group-mode").value = data.mode || "all";
  }
  document.querySelector("#groups-container").append(fragment);
  const current = document.querySelector("#groups-container").lastElementChild;
  (data?.rules?.length ? data.rules : [null]).forEach((rule) => addRule(current, rule));
}
function addRule(group, data = null) {
  const fragment = document.querySelector("#rule-template").content.cloneNode(true);
  const row = fragment.querySelector(".rule-row");
  if (data) {
    row.querySelector(".rule-field").value = data.field;
    row.querySelector(".rule-operator").value = data.operator;
    row.querySelector(".rule-value").value = data.value;
  }
  group.querySelector(".rules-list").append(fragment);
}
function resetProgramForm() {
  const form = document.querySelector("#program-form");
  form.reset();
  form.elements.namedItem("id").value = "";
  form.elements.namedItem("year").value = "2027";
  document.querySelector("#groups-container").innerHTML = "";
  addGroup({ name: "الشروط الأساسية", mode: "all", rules: [] });
  document.querySelector("#editor-title").textContent = "إضافة برنامج أكاديمي";
}
function openEditor(program = null) {
  resetProgramForm();
  const form = document.querySelector("#program-form");
  if (program) {
    for (const key of ["id", "institution", "program", "year", "degree", "region", "language", "sourceUrl", "notes"]) {
      if (form.elements.namedItem(key)) form.elements.namedItem(key).value = program[key] ?? "";
    }
    document.querySelector("#groups-container").innerHTML = "";
    (program.groups || []).forEach(addGroup);
    document.querySelector("#editor-title").textContent = "تعديل البرنامج";
  }
  document.querySelector("#program-editor").classList.remove("hidden");
  document.querySelector("#program-editor").scrollIntoView({ behavior: "smooth", block: "start" });
}
function collectProgram(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.year = Number(data.year);
  data.groups = [...document.querySelectorAll("#groups-container .criteria-group")].map((group) => ({
    name: group.querySelector(".group-name").value.trim(),
    mode: group.querySelector(".group-mode").value,
    rules: [...group.querySelectorAll(".rule-row")].map((row) => ({
      field: row.querySelector(".rule-field").value,
      operator: row.querySelector(".rule-operator").value,
      value: Number(row.querySelector(".rule-value").value)
    }))
  }));
  return data;
}

async function saveProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const profile = numericProfile(form);
  for (const [key, value] of Object.entries(profile)) {
    if (value !== null && !Number.isFinite(value)) { showToast("تحقق من القيم المدخلة."); return; }
    const input = form.elements.namedItem(key);
    if (value !== null && (value < Number(input.min || -Infinity) || value > Number(input.max || Infinity))) {
      showToast(`القيمة خارج النطاق في: ${input.previousElementSibling?.textContent || key}`); return;
    }
  }
  await put("profile", profile, PROFILE_KEY);
  showToast("تم حفظ ملفك الأكاديمي على هذا الجهاز.");
  await refreshDashboard();
}
async function saveProgram(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const record = collectProgram(form);
  const errors = validateInstitution(record);
  if (errors.length) { showToast(errors[0]); return; }
  const existing = record.id ? await get("programs", record.id) : null;
  record.id = record.id || crypto.randomUUID();
  record.createdAt = existing?.createdAt || Date.now();
  record.updatedAt = Date.now();
  await put("programs", record);
  document.querySelector("#program-editor").classList.add("hidden");
  showToast("تم حفظ البرنامج محليًا.");
  await refreshDashboard();
}
async function exportBackup() {
  const data = { application: "ADMITWISE", schemaVersion: 1, exportedAt: new Date().toISOString(), profile: await get("profile", PROFILE_KEY) || {}, institutions: await all("programs") };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `admitwise-backup-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("تم إنشاء النسخة الاحتياطية.");
}
async function importBackup(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.application !== "ADMITWISE" || data.schemaVersion !== 1 || !data.profile || !Array.isArray(data.institutions)) throw new Error("صيغة النسخة الاحتياطية غير مدعومة.");
    const invalid = data.institutions.find((item) => validateInstitution(item).length);
    if (invalid) throw new Error(`سجل غير صالح: ${invalid.institution || "برنامج"}`);
    if (!confirm("سيتم استبدال الملف الأكاديمي وقائمة البرامج الحالية. هل تريد المتابعة؟")) return;
    await put("profile", data.profile, PROFILE_KEY);
    for (const item of await all("programs")) await remove("programs", item.id);
    for (const item of data.institutions) await put("programs", item);
    await refreshDashboard();
    showToast("تم استيراد النسخة الاحتياطية.");
  } catch (error) { showToast(error.message || "تعذر قراءة النسخة الاحتياطية."); }
}


let selectedInstitutionIds = [];

function renderMajorOptions() {
  const query = document.querySelector("#major-search").value;
  const select = document.querySelector("#major-select");
  const previous = select.value;
  const options = searchMajors(query);
  select.innerHTML = '<option value="">اختر التخصص</option>' + options.map((major) =>
    `<option value="${escapeHtml(major.id)}">${escapeHtml(major.nameAr)} — ${escapeHtml(major.name)}</option>`
  ).join("");
  if (options.some((major) => major.id === previous)) select.value = previous;
}

function renderInstitutionOptions() {
  const query = document.querySelector("#institution-search").value;
  const type = document.querySelector("#institution-type").value;
  const visible = searchInstitutions(query, type);
  const container = document.querySelector("#institution-options");
  container.innerHTML = visible.map((institution) => {
    const checked = selectedInstitutionIds.includes(institution.id);
    const disabled = !checked && selectedInstitutionIds.length >= 5;
    return `<label class="institution-option ${checked ? "selected" : ""}">
      <input type="checkbox" value="${escapeHtml(institution.id)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
      <span><b>${escapeHtml(institution.nameAr)}</b><small>${escapeHtml(institution.name)}</small></span>
      <i>${checked ? "✓" : "+"}</i>
    </label>`;
  }).join("");
  if (!visible.length) container.innerHTML = '<div class="empty-state">لا توجد مؤسسة مطابقة للبحث.</div>';
  document.querySelector("#institution-selection-count").textContent = `${selectedInstitutionIds.length} / 5`;
}

async function initializeDiscovery() {
  const saved = await get("preferences", "discovery");
  if (saved && Array.isArray(saved.institutionIds)) {
    selectedInstitutionIds = saved.institutionIds.filter((id) => INSTITUTIONS.some((item) => item.id === id)).slice(0, 5);
    if (MAJORS.some((major) => major.id === saved.majorId)) document.querySelector("#major-select").value = saved.majorId;
    if ([2027, 2028, 2029].includes(saved.academicYear)) document.querySelector("#discovery-year").value = String(saved.academicYear);
  }
  renderMajorOptions();
  if (saved?.majorId) document.querySelector("#major-select").value = saved.majorId;
  renderInstitutionOptions();
}

function bindDiscoveryControls() {
  document.querySelector("#major-search").addEventListener("input", renderMajorOptions);
  document.querySelector("#institution-search").addEventListener("input", renderInstitutionOptions);
  document.querySelector("#institution-type").addEventListener("change", renderInstitutionOptions);
  document.querySelector("#institution-options").addEventListener("change", (event) => {
    const checkbox = event.target.closest('input[type="checkbox"]');
    if (!checkbox) return;
    if (checkbox.checked && selectedInstitutionIds.length < 5) selectedInstitutionIds.push(checkbox.value);
    else if (!checkbox.checked) selectedInstitutionIds = selectedInstitutionIds.filter((id) => id !== checkbox.value);
    renderInstitutionOptions();
  });
  document.querySelector("#save-discovery").addEventListener("click", async () => {
    try {
      const request = buildDiscoveryRequest({
        majorId: document.querySelector("#major-select").value,
        institutionIds: selectedInstitutionIds,
        academicYear: Number(document.querySelector("#discovery-year").value)
      });
      await put("preferences", {
        majorId: request.majorId,
        institutionIds: [...request.institutionIds],
        academicYear: request.academicYear,
        sourcePolicy: request.sourcePolicy,
        updatedAt: Date.now()
      }, "discovery");
      document.querySelector("#discovery-validation").textContent = "تم حفظ نطاق البحث محليًا. لم يبدأ جلب الشروط بعد.";
      document.querySelector("#discovery-validation").classList.add("success");
      showToast("تم حفظ التخصص والمؤسسات المختارة محليًا.");
    } catch (error) {
      document.querySelector("#discovery-validation").textContent = error.validationErrors?.join(" ") || error.message;
      document.querySelector("#discovery-validation").classList.remove("success");
    }
  });
}

async function init() {
  try { db = await openDatabase(); }
  catch (error) {
    console.error("IndexedDB unavailable", error);
    showToast("تعذر تشغيل التخزين المحلي في هذا المتصفح.");
    return;
  }
  const profile = await get("profile", PROFILE_KEY) || {};
  fillProfile(document.querySelector("#profile-form"), profile);
  resetProgramForm();
  await initializeDiscovery();
  await refreshDashboard();

  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); navigate(button.dataset.go); }));
  document.querySelector("#profile-form").addEventListener("submit", saveProfile);
  bindDiscoveryControls();
  document.querySelector("#new-program-btn").addEventListener("click", () => openEditor());
  document.querySelector("#close-editor").addEventListener("click", () => document.querySelector("#program-editor").classList.add("hidden"));
  document.querySelector("#cancel-program").addEventListener("click", () => document.querySelector("#program-editor").classList.add("hidden"));
  document.querySelector("#program-form").addEventListener("submit", saveProgram);
  document.querySelector("#add-group").addEventListener("click", () => addGroup());
  document.querySelector("#groups-container").addEventListener("click", (event) => {
    const group = event.target.closest(".criteria-group");
    if (event.target.closest(".add-rule")) addRule(group);
    if (event.target.closest(".remove-rule")) event.target.closest(".rule-row").remove();
    if (event.target.closest(".remove-group")) group.remove();
  });
  document.querySelector("#programs-list").addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit]");
    const del = event.target.closest("[data-delete]");
    if (edit) openEditor(await get("programs", edit.dataset.edit));
    if (del && confirm("هل تريد حذف هذا البرنامج؟")) { await remove("programs", del.dataset.delete); await refreshDashboard(); showToast("تم حذف البرنامج."); }
  });
  document.querySelector("#program-search").addEventListener("input", refreshDashboard);
  document.querySelector("#export-btn").addEventListener("click", exportBackup);
  const importInput = document.createElement("input");
  importInput.type = "file"; importInput.accept = "application/json"; importInput.hidden = true;
  document.body.append(importInput);
  importInput.addEventListener("change", () => importBackup(importInput.files[0]));
  const importButton = document.createElement("button");
  importButton.className = "button button-quiet"; importButton.textContent = "استيراد نسخة";
  importButton.addEventListener("click", () => importInput.click());
  document.querySelector(".top-actions").append(importButton);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("Service worker registration failed", error));
}

init();
