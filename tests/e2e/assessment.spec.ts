import { test, expect } from "@playwright/test";

/**
 * Full resident journey: Property info -> Checklist -> AI analysis -> Result.
 *
 * This drives the real UI and the real AI analysis server function (no mocks),
 * so it doubles as a smoke test that the end-to-end pipeline works. The happy
 * path uses an undamaged, modern, low-rise building and expects to land on a
 * shareable result page (/a/:publicId) with a risk badge.
 */
test("resident completes a full assessment and reaches a result", async ({
  page,
}) => {
  // ── Step 1: Property info ────────────────────────────────────────────
  await page.goto("/assess/property");

  // Select estado (this also stops geolocation from overriding the choice).
  await page.locator("#estado").selectOption("Miranda");
  // Municipio dropdown enables once a state is chosen.
  await expect(page.locator("#municipio")).toBeEnabled();
  await page.locator("#municipio").selectOption("Baruta");

  // Building type, then age. Floors defaults to 1, which is valid.
  await page.getByRole("button", { name: "Apartamento", exact: true }).click();
  await page
    .getByRole("button", { name: "Después de 2000", exact: true })
    .click();

  // Continue to the checklist.
  await page.getByRole("button", { name: /Continuar/ }).click();

  // ── Step 2: Checklist ────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/assess\/checklist/);

  // Answer "No" on every required structural item (7 cards visible initially).
  const noButtons = page.getByRole("button", { name: "No", exact: true });
  const count = await noButtons.count();
  expect(count).toBeGreaterThanOrEqual(7);
  for (let i = 0; i < count; i++) {
    await noButtons.nth(i).click();
  }

  // Progress should show all required items answered, enabling analysis.
  const analyzeBtn = page.getByRole("button", { name: "Analizar daños" });
  await expect(analyzeBtn).toBeEnabled();
  await analyzeBtn.click();

  // ── Step 3: AI analysis (real call) -> Step 4: Result ────────────────
  await expect(page).toHaveURL(/\/assess\/analyze/);

  // Wait for the pipeline to finish and route to the shareable result page.
  // Allow plenty of time for the real AI call on a slow connection.
  await page.waitForURL(/\/a\/[A-Za-z0-9_-]+/, { timeout: 120_000 });

  // A risk badge with one of the four levels should be present.
  await expect(
    page.getByText(
      /Riesgo bajo|Precaución|Riesgo moderado|Riesgo alto|Low risk|Caution|Moderate risk|High risk/i,
    ).first(),
  ).toBeVisible({ timeout: 20_000 });
});
