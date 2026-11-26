import test from "node:test";
import assert from "node:assert/strict";
import {
  INSTITUTIONS, MAJORS, searchMajors, searchInstitutions,
  buildDiscoveryRequest, validateDiscoveryRequest,
  validateAdmissionEvidence, isEvidenceEvaluable
} from "../public/discovery.js";

test("major search matches Hebrew, Arabic, English and aliases", () => {
  assert.equal(searchMajors("חשמל")[0].id, "electrical-engineering");
  assert.equal(searchMajors("هندسة الكهرباء")[0].id, "electrical-engineering");
  assert.equal(searchMajors("electronics engineering")[0].id, "electrical-engineering");
});

test("institution search supports text and type filtering", () => {
  assert.ok(searchInstitutions("هندسة", "college").length > 0);
  assert.ok(searchInstitutions("", "university").every((item) => item.type === "university"));
});

test("discovery request accepts one to five known institutions", () => {
  const request = buildDiscoveryRequest({
    majorId: MAJORS[0].id,
    institutionIds: INSTITUTIONS.slice(0, 5).map((item) => item.id),
    academicYear: 2027
  });
  assert.equal(request.institutionIds.length, 5);
  assert.equal(request.sourcePolicy, "official_only");
});

test("discovery request rejects no institutions, more than five, duplicates and unknown IDs", () => {
  const base = { majorId: MAJORS[0].id, academicYear: 2027 };
  assert.ok(validateDiscoveryRequest({ ...base, institutionIds: [] }).length);
  assert.ok(validateDiscoveryRequest({ ...base, institutionIds: INSTITUTIONS.slice(0, 6).map((item) => item.id) }).length);
  assert.ok(validateDiscoveryRequest({ ...base, institutionIds: ["tau", "tau"] }).length);
  assert.ok(validateDiscoveryRequest({ ...base, institutionIds: ["not-in-catalog"] }).length);
});

test("discovery request rejects unknown major and invalid academic year", () => {
  assert.ok(validateDiscoveryRequest({ majorId: "invented", institutionIds: ["tau"], academicYear: 2027 }).length);
  assert.ok(validateDiscoveryRequest({ majorId: MAJORS[0].id, institutionIds: ["tau"], academicYear: "2027" }).length);
});

const validEvidence = () => ({
  id: "criterion-1", institutionId: "tau", majorId: "electrical-engineering",
  academicYear: 2027, label: "5 יחידות מתמטיקה", sourceUrl: "https://www.example.ac.il/admissions",
  sourceTitle: "Admission requirements", sourceExcerpt: "Official excerpt supporting this requirement.",
  sourceType: "official_page", retrievedAt: "2026-11-26T10:00:00.000Z",
  confidence: 0.98, reviewStatus: "verified", officialDomainMatched: true,
  verifiedAt: "2026-11-26T10:05:00.000Z"
});

test("verified evidence requires source provenance, year, confidence and official-domain review", () => {
  assert.deepEqual(validateAdmissionEvidence(validEvidence()), []);
  const invalid = validEvidence();
  invalid.officialDomainMatched = false;
  assert.ok(validateAdmissionEvidence(invalid).length);
});

test("only verified evidence from the requested academic year can enter comparison", () => {
  assert.equal(isEvidenceEvaluable(validEvidence(), 2027), true);
  const pending = validEvidence();
  pending.reviewStatus = "pending_review";
  assert.equal(isEvidenceEvaluable(pending, 2027), false);
  assert.equal(isEvidenceEvaluable(validEvidence(), 2028), false);
  const rejected = validEvidence();
  rejected.reviewStatus = "rejected";
  assert.equal(isEvidenceEvaluable(rejected, 2027), false);
});
