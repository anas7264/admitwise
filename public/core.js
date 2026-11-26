export const FIELD_LABELS = {
  bagrutAverage: "معدل البجروت",
  psychometricTotal: "البسيخومتري الكلي",
  psychometricQuant: "البسيخومتري الكمي (כמותי)",
  yael: "علامة יעל / יעלנט",
  amirnet: "علامة AMIRNET",
  mathUnits: "وحدات الرياضيات",
  mathGrade: "علامة الرياضيات",
  englishUnits: "وحدات الإنجليزية",
  englishGrade: "علامة الإنجليزية",
  physicsUnits: "وحدات الفيزياء",
  physicsGrade: "علامة الفيزياء"
};

export const OPERATORS = {
  gte: "على الأقل",
  gt: "أكبر من",
  lte: "على الأكثر",
  lt: "أقل من",
  eq: "يساوي"
};

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

export function evaluateRule(rule, profile) {
  const actual = profile?.[rule.field];
  if (!isFiniteNumber(actual) || !isFiniteNumber(rule.value)) {
    return { status: "unknown", actual: null, expected: rule.value, reason: "لا توجد علامة مدخلة لهذا البند." };
  }

  const checks = {
    gte: actual >= rule.value,
    gt: actual > rule.value,
    lte: actual <= rule.value,
    lt: actual < rule.value,
    eq: actual === rule.value
  };
  if (!Object.hasOwn(checks, rule.operator)) {
    return { status: "unknown", actual, expected: rule.value, reason: "نوع المقارنة غير معروف." };
  }
  const passed = checks[rule.operator];
  return {
    status: passed ? "pass" : "fail",
    actual,
    expected: rule.value,
    reason: passed ? "النتيجة تحقق هذا الشرط." : "النتيجة لا تحقق الحد المطلوب."
  };
}

export function evaluateGroup(group, profile) {
  const results = (Array.isArray(group.rules) ? group.rules : []).map((rule) => ({ rule, ...evaluateRule(rule, profile) }));
  if (!results.length) return { status: "unknown", results, reason: "لم تتم إضافة شروط لهذه المجموعة." };

  const statuses = results.map((item) => item.status);
  let status;
  if (group.mode === "any") {
    status = statuses.includes("pass") ? "pass" : statuses.includes("unknown") ? "unknown" : "fail";
  } else {
    status = statuses.includes("fail") ? "fail" : statuses.includes("unknown") ? "unknown" : "pass";
  }
  return { status, results, reason: group.mode === "any" ? "يكفي تحقق شرط واحد من البدائل." : "يجب تحقق جميع الشروط في هذه المجموعة." };
}

export function evaluateInstitution(institution, profile) {
  const groups = (Array.isArray(institution.groups) ? institution.groups : []).map((group) => ({ group, ...evaluateGroup(group, profile) }));
  if (!groups.length) return { status: "no_criteria", groups, passed: 0, failed: 0, unknown: 0, total: 0 };

  const status = groups.some((item) => item.status === "fail")
    ? "fail"
    : groups.some((item) => item.status === "unknown")
      ? "unknown"
      : "pass";

  const allRules = groups.flatMap((item) => item.results);
  return {
    status,
    groups,
    passed: allRules.filter((item) => item.status === "pass").length,
    failed: allRules.filter((item) => item.status === "fail").length,
    unknown: allRules.filter((item) => item.status === "unknown").length,
    total: allRules.length
  };
}

export function validateInstitution(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["يجب أن يكون سجل البرنامج كائنًا صالحًا."];
  if (!String(record.institution || "").trim()) errors.push("اسم المؤسسة مطلوب.");
  if (!String(record.program || "").trim()) errors.push("اسم التخصص مطلوب.");
  if (!Number.isInteger(Number(record.year)) || Number(record.year) < 2024 || Number(record.year) > 2100) errors.push("سنة القبول غير صالحة.");
  if (!Array.isArray(record.groups)) errors.push("مجموعات الشروط غير صالحة.");

  for (const [groupIndex, group] of (record.groups || []).entries()) {
    if (!group || !["all", "any"].includes(group.mode)) errors.push(`طريقة المجموعة ${groupIndex + 1} غير صالحة.`);
    if (!Array.isArray(group?.rules)) errors.push(`قواعد المجموعة ${groupIndex + 1} غير صالحة.`);
    for (const [ruleIndex, rule] of (group.rules || []).entries()) {
      if (!Object.hasOwn(FIELD_LABELS, rule.field)) errors.push(`الحقل في المجموعة ${groupIndex + 1}، الشرط ${ruleIndex + 1} غير معروف.`);
      if (!Object.hasOwn(OPERATORS, rule.operator)) errors.push(`عملية المقارنة في المجموعة ${groupIndex + 1}، الشرط ${ruleIndex + 1} غير معروفة.`);
      if (rule.value === null || rule.value === "" || typeof rule.value === "boolean" || !Number.isFinite(Number(rule.value))) errors.push(`قيمة الشرط ${groupIndex + 1}، ${ruleIndex + 1} يجب أن تكون رقمًا.`);
    }
  }
  if (record.sourceUrl) {
    try {
      const url = new URL(record.sourceUrl);
      if (!["http:", "https:"].includes(url.protocol)) errors.push("رابط المصدر يجب أن يبدأ بـ http أو https.");
    } catch {
      errors.push("رابط المصدر غير صالح.");
    }
  }
  return errors;
}

export function getProfileCompleteness(profile) {
  const fields = Object.keys(FIELD_LABELS);
  const filled = fields.filter((field) => isFiniteNumber(profile?.[field])).length;
  return { filled, total: fields.length, percent: Math.round((filled / fields.length) * 100) };
}
