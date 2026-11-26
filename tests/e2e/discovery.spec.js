import { test, expect } from "@playwright/test";

test("discovery setup enforces five institutions and persists only the selected scope", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-view="discovery"]').click();

  await page.locator("#major-search").fill("هندسة الكهرباء");
  await page.locator("#major-select").selectOption("electrical-engineering");

  const options = page.locator('#institution-options input[type="checkbox"]');
  for (let index = 0; index < 5; index += 1) {
    await options.nth(index).check();
  }

  await expect(page.locator("#institution-selection-count")).toHaveText("5 / 5");
  await expect(options.nth(5)).toBeDisabled();

  await page.locator("#save-discovery").click();
  await expect(page.locator("#discovery-validation")).toContainText("تم حفظ نطاق البحث");

  await page.reload();
  await page.locator('[data-view="discovery"]').click();
  await expect(page.locator("#institution-selection-count")).toHaveText("5 / 5");
  await expect(page.locator("#major-select")).toHaveValue("electrical-engineering");
});
