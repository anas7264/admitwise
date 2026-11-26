export const MAX_SELECTED_INSTITUTIONS = 5;

export const INSTITUTIONS = [
  { id: "technion", name: "הטכניון — מכון טכנולוגי לישראל", nameAr: "التخنيون", type: "university" },
  { id: "tau", name: "אוניברסיטת תל אביב", nameAr: "جامعة تل أبيب", type: "university" },
  { id: "huji", name: "האוניברסיטה העברית בירושלים", nameAr: "الجامعة العبرية في القدس", type: "university" },
  { id: "bgu", name: "אוניברסיטת בן-גוריון בנגב", nameAr: "جامعة بن غوريون", type: "university" },
  { id: "haifa", name: "אוניברסיטת חיפה", nameAr: "جامعة حيفا", type: "university" },
  { id: "biu", name: "אוניברסיטת בר-אילן", nameAr: "جامعة بار إيلان", type: "university" },
  { id: "ariel", name: "אוניברסיטת אריאל", nameAr: "جامعة أريئيل", type: "university" },
  { id: "openu", name: "האוניברסיטה הפתוחה", nameAr: "الجامعة المفتوحة", type: "university" },
  { id: "afeka", name: "אפקה — המכללה האקדמית להנדסה בתל אביב", nameAr: "أفيكا — الكلية الأكاديمية للهندسة", type: "college" },
  { id: "braude", name: "המכללה האקדמית להנדסה בראודה", nameAr: "كلية براودة الأكاديمية للهندسة", type: "college" },
  { id: "hit", name: "HIT — מכון טכנולוגי חולון", nameAr: "معهد حولون التكنولوجي", type: "college" },
  { id: "shenkar", name: "שנקר — הנדסה. עיצוב. אמנות.", nameAr: "شنكار — هندسة وتصميم وفنون", type: "college" },
  { id: "azrieli", name: "עזריאלי — מכללה אקדמית להנדסה ירושלים", nameAr: "عزريئيلي — كلية القدس الأكاديمية للهندسة", type: "college" },
  { id: "kinneret", name: "המכללה האקדמית כנרת", nameAr: "كلية كينيريت الأكاديمية", type: "college" },
  { id: "sce", name: "SCE — המכללה האקדמית להנדסה ע״ש סמי שמעון", nameAr: "كلية سامي شمعون الأكاديمية للهندسة", type: "college" },
  { id: "ruppin", name: "המרכז האקדמי רופין", nameAr: "المركز الأكاديمي روبين", type: "college" }
];

export const MAJORS = [
  { id: "electrical-engineering", name: "הנדסת חשמל ואלקטרוניקה", nameAr: "هندسة الكهرباء والإلكترونיקה", aliases: ["הנדסת חשמל", "הנדסת אלקטרוניקה", "electrical engineering", "electronics engineering"] },
  { id: "mechanical-engineering", name: "הנדסת מכונות", nameAr: "الهندسة الميكانيكية", aliases: ["mechanical engineering"] },
  { id: "computer-engineering", name: "הנדסת מחשבים", nameAr: "هندسة الحاسوب", aliases: ["computer engineering"] },
  { id: "software-engineering", name: "הנדסת תוכנה", nameAr: "هندسة البرمجيات", aliases: ["software engineering"] },
  { id: "civil-engineering", name: "הנדסה אזרחית", nameAr: "الهندسة المدنية", aliases: ["הנדסת בניין", "civil engineering"] },
  { id: "chemical-engineering", name: "הנדסה כימית", nameAr: "الهندسة الكيميائية", aliases: ["chemical engineering"] },
  { id: "industrial-engineering", name: "הנדסת תעשייה וניהול", nameAr: "هندسة الصناعة والإدارة", aliases: ["industrial engineering", "הנדסת מערכות מידע"] },
  { id: "biomedical-engineering", name: "הנדסה ביו-רפואית", nameAr: "الهندسة الطبية الحيوية", aliases: ["biomedical engineering"] },
  { id: "materials-engineering", name: "הנדסת חומרים", nameAr: "هندسة المواد", aliases: ["materials engineering"] },
  { id: "architecture", name: "אדריכלות", nameAr: "الهندسة المعمارية", aliases: ["architecture"] },
  { id: "computer-science", name: "מדעי המחשב", nameAr: "علوم الحاسوب", aliases: ["computer science", "מדעי המחשב והמתמטיקה"] },
  { id: "mathematics", name: "מתמטיקה", nameAr: "الرياضيات", aliases: ["mathematics"] },
  { id: "physics", name: "פיזיקה", nameAr: "الفيزياء", aliases: ["physics"] },
  { id: "chemistry", name: "כימיה", nameAr: "الكيمياء", aliases: ["chemistry"] },
  { id: "biology", name: "ביולוגיה", nameAr: "علم الأحياء", aliases: ["biology"] },
  { id: "nursing", name: "סיעוד", nameAr: "التمريض", aliases: ["nursing"] },
  { id: "economics", name: "כלכלה", nameAr: "الاقتصاد", aliases: ["economics"] },
  { id: "accounting", name: "חשבונאות", nameAr: "المحاسبة", aliases: ["accounting"] },
  { id: "law", name: "משפטים", nameAr: "القانون", aliases: ["law"] },
  { id: "psychology", name: "פסיכולוגיה", nameAr: "علم النفس", aliases: ["psychology"] }
];

function normalizeSearchText(value) {
  return String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase();
}

export function searchMajors(query, catalog = MAJORS) {
  const term = normalizeSearchText(query);
  if (!term) return [...catalog];
  return catalog.filter((major) =>
    [major.name, major.nameAr, major.id, ...(major.aliases || [])]
      .some((candidate) => normalizeSearchText(candidate).includes(term))
  );
}

export function searchInstitutions(query, type = "all", catalog = INSTITUTIONS) {
  const term = normalizeSearchText(query);
  return catalog.filter((institution) => {
    const matchesType = type === "all" || institution.type === type;
    const matchesTerm = !term || [institution.name, institution.nameAr, institution.id]
      .some((candidate) => normalizeSearchText(candidate).includes(term));
    return matchesType && matchesTerm;
  });
}

export function validateDiscoveryRequest(request) {
  const errors = [];
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    return ["بيانات البحث غير صالحة."];
  }
  if (!MAJORS.some((major) => major.id === request.majorId)) errors.push("يجب اختيار تخصص من القائمة المعتمدة.");
  if (!Array.isArray(request.institutionIds)) {
    errors.push("يجب اختيار مؤسسة واحدة على الأقل.");
  } else {
    if (request.institutionIds.length < 1) errors.push("يجب اختيار مؤسسة واحدة على الأقل.");
    if (request.institutionIds.length > MAX_SELECTED_INSTITUTIONS) errors.push("يمكن اختيار خمس مؤسسات كحد أقصى.");
    if (new Set(request.institutionIds).size !== request.institutionIds.length) errors.push("لا يمكن تكرار المؤسسة نفسها.");
    const allowed = new Set(INSTITUTIONS.map((institution) => institution.id));
    if (request.institutionIds.some((id) => !allowed.has(id))) errors.push("تتضمن القائمة مؤسسة غير معتمدة.");
  }
  if (!Number.isInteger(request.academicYear) || request.academicYear < 2024 || request.academicYear > 2100) {
    errors.push("سنة القبول غير صالحة.");
  }
  return errors;
}

export function buildDiscoveryRequest({ majorId, institutionIds, academicYear }) {
  const request = { majorId, institutionIds: Array.isArray(institutionIds) ? [...institutionIds] : institutionIds, academicYear };
  const errors = validateDiscoveryRequest(request);
  if (errors.length) {
    const error = new Error(errors[0]);
    error.validationErrors = errors;
    throw error;
  }
  return Object.freeze({
    majorId: request.majorId,
    institutionIds: Object.freeze([...request.institutionIds]),
    academicYear: request.academicYear,
    sourcePolicy: "official_only"
  });
}

export function validateAdmissionEvidence(record) {
  const errors = [];
  if (!record || typeof record !== "object" || Array.isArray(record)) return ["سجل الشرط غير صالح."];
  if (!String(record.id || "").trim()) errors.push("معرّف الشرط مطلوب.");
  if (!String(record.institutionId || "").trim()) errors.push("معرّف المؤسسة مطلوب.");
  if (!String(record.majorId || "").trim()) errors.push("معرّف التخصص مطلوب.");
  if (!Number.isInteger(record.academicYear)) errors.push("يجب تحديد سنة القبول للشرط.");
  if (!String(record.label || "").trim()) errors.push("وصف الشرط مطلوب.");
  if (!String(record.sourceExcerpt || "").trim()) errors.push("المقتطف الداعم من المصدر مطلوب.");
  if (!String(record.sourceTitle || "").trim()) errors.push("عنوان المصدر مطلوب.");
  try {
    const source = new URL(record.sourceUrl);
    if (source.protocol !== "https:") errors.push("يجب أن يكون رابط المصدر الرسمي آمنًا (HTTPS).");
  } catch {
    errors.push("رابط المصدر غير صالح.");
  }
  if (!Number.isFinite(record.confidence) || record.confidence < 0 || record.confidence > 1) errors.push("درجة الثقة يجب أن تكون بين 0 و1.");
  if (!["pending_review", "verified", "rejected"].includes(record.reviewStatus)) errors.push("حالة مراجعة الشرط غير صالحة.");
  if (!["official_page", "official_pdf"].includes(record.sourceType)) errors.push("نوع المصدر يجب أن يكون صفحة أو ملف PDF رسميًا.");
  if (!record.retrievedAt || Number.isNaN(Date.parse(record.retrievedAt))) errors.push("تاريخ جلب المصدر غير صالح.");
  if (record.reviewStatus === "verified" && (record.officialDomainMatched !== true || !record.verifiedAt)) {
    errors.push("لا يمكن اعتماد الشرط قبل التحقق من النطاق الرسمي وتسجيل وقت المراجعة.");
  }
  return errors;
}

export function isEvidenceEvaluable(record, requestedAcademicYear) {
  return validateAdmissionEvidence(record).length === 0
    && record.reviewStatus === "verified"
    && record.officialDomainMatched === true
    && record.academicYear === requestedAcademicYear;
}
