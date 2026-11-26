import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRule, evaluateGroup, evaluateInstitution, validateInstitution } from "../public/core.js";

const profile = { bagrutAverage: 103, physicsUnits: 5, physicsGrade: 72, psychometricTotal: null };

test("numeric threshold passes and fails correctly", () => {
  assert.equal(evaluateRule({ field: "bagrutAverage", operator: "gte", value: 100 }, profile).status, "pass");
  assert.equal(evaluateRule({ field: "bagrutAverage", operator: "gte", value: 105 }, profile).status, "fail");
});

test("missing profile data is unknown rather than failed", () => {
  assert.equal(evaluateRule({ field: "psychometricTotal", operator: "gte", value: 550 }, profile).status, "unknown");
});

test("AND group requires every criterion", () => {
  const group = { mode: "all", rules: [
    { field: "physicsUnits", operator: "gte", value: 5 },
    { field: "physicsGrade", operator: "gte", value: 80 }
  ] };
  assert.equal(evaluateGroup(group, profile).status, "fail");
});

test("OR group accepts one fulfilled alternative", () => {
  const group = { mode: "any", rules: [
    { field: "physicsGrade", operator: "gte", value: 80 },
    { field: "physicsUnits", operator: "gte", value: 5 }
  ] };
  assert.equal(evaluateGroup(group, profile).status, "pass");
});

test("OR group remains unknown when an unfilled alternative could change outcome", () => {
  const group = { mode: "any", rules: [
    { field: "psychometricTotal", operator: "gte", value: 600 },
    { field: "psychometricQuant", operator: "gte", value: 120 }
  ] };
  assert.equal(evaluateGroup(group, profile).status, "unknown");
});

test("institution requires all groups and identifies incomplete criteria", () => {
  const record = { groups: [
    { mode: "all", name: "Base", rules: [{ field: "bagrutAverage", operator: "gte", value: 100 }] },
    { mode: "any", name: "Physics", rules: [
      { field: "physicsUnits", operator: "gte", value: 5 },
      { field: "physicsGrade", operator: "gte", value: 80 }
    ] }
  ] };
  assert.equal(evaluateInstitution(record, profile).status, "pass");
});

test("institution fails when a required group fails", () => {
  const record = { groups: [
    { mode: "all", rules: [{ field: "bagrutAverage", operator: "gte", value: 110 }] }
  ] };
  assert.equal(evaluateInstitution(record, profile).status, "fail");
});

test("record validator rejects invalid fields and unsafe source URLs", () => {
  const record = {
    institution: "Example College", program: "Electrical Engineering", year: 2027,
    groups: [{ mode: "all", rules: [{ field: "unknownField", operator: "gte", value: 80 }] }],
    sourceUrl: "javascript:alert(1)"
  };
  assert.ok(validateInstitution(record).length >= 2);
});

test("validator rejects inherited object properties as field or operator names", () => {
  const record = {
    institution: "Example", program: "EE", year: 2027, sourceUrl: "",
    groups: [{ mode: "all", rules: [{ field: "toString", operator: "constructor", value: 5 }] }]
  };
  assert.ok(validateInstitution(record).some((error) => error.includes("الحقل")));
  assert.ok(validateInstitution(record).some((error) => error.includes("عملية المقارنة")));
});
