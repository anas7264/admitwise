import { test, expect } from "@playwright/test";

test("student can save a profile, compare a programme, and retain it after reload", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-view="profile"]').click();

  const profile = {
    bagrutAverage: "105",
    mathUnits: "4",
    mathGrade: "92",
    englishUnits: "4",
    englishGrade: "82",
    physicsUnits: "5",
    physicsGrade: "85",
    psychometricTotal: "600",
    psychometricQuant: "120",
    yael: "110",
    amirnet: "95"
  };
  for (const [field, value] of Object.entries(profile)) {
    await page.locator(`#profile-form [name="${field}"]`).fill(value);
  }
  await page.locator('#profile-form button[type="submit"]').click();
  await expect(page.locator("#toast")).toContainText("تم حفظ");

  await page.locator('[data-view="programs"]').click();
  await page.locator("#new-program-btn").click();
  await page.locator('#program-form [name="institution"]').fill("جامعة تجريبية");
  await page.locator('#program-form [name="program"]').fill("هندسة كهرباء");
  await page.locator('#program-form [name="year"]').fill("2027");

  const groups = page.locator("#groups-container .criteria-group");
  await groups.nth(0).locator(".group-name").fill("المعدل");
  await groups.nth(0).locator(".rule-field").selectOption("bagrutAverage");
  await groups.nth(0).locator(".rule-operator").selectOption("gte");
  await groups.nth(0).locator(".rule-value").fill("100");

  await page.locator("#add-group").click();
  await groups.nth(1).locator(".group-name").fill("الفيزياء");
  await groups.nth(1).locator(".rule-field").selectOption("physicsUnits");
  await groups.nth(1).locator(".rule-operator").selectOption("gte");
  await groups.nth(1).locator(".rule-value").fill("5");

  await page.locator('#program-form button[type="submit"]').click();
  const card = page.locator("#programs-list .program-card").first();
  await expect(card.locator(".status-pill")).toHaveClass(/status-pass/);
  await expect(card).toContainText("جامعة تجريبية");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-btn").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^admitwise-backup-.*\.json$/);

  await page.reload();
  await page.locator('[data-view="programs"]').click();
  await expect(page.locator("#programs-list .program-card")).toHaveCount(1);
  await expect(page.locator("#programs-list .status-pass")).toBeVisible();
});

test("incomplete academic data is not classified as a failure", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-view="programs"]').click();
  await page.locator("#new-program-btn").click();
  await page.locator('#program-form [name="institution"]').fill("مؤسسة اختبار");
  await page.locator('#program-form [name="program"]').fill("برنامج تجريبي");
  await page.locator('#program-form [name="year"]').fill("2027");
  await page.locator("#groups-container .rule-value").fill("500");
  await page.locator('#program-form button[type="submit"]').click();
  await expect(page.locator("#programs-list .status-unknown")).toBeVisible();
});
