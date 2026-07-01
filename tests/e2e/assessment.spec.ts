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

  // Dismiss the blocking legal + data-consent gate (both checkboxes required).
  const gate = page.getByRole("dialog");
  await expect(gate).toBeVisible({ timeout: 15_000 });
  const consents = gate.getByRole("checkbox");
  await consents.nth(0).check();
  await consents.nth(1).check();
  await gate.getByRole("button", { name: "Aceptar y continuar" }).click();
  await expect(gate).toBeHidden({ timeout: 10_000 });

  // Select estado. Retry until it "sticks" — the controlled <select> only keeps
  // the value once React has hydrated, which can lag the initial SSR paint.

  await expect(async () => {
    await page.locator("#estado").selectOption("Miranda");
    await expect(page.locator("#municipio")).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
  await page.locator("#municipio").selectOption("Baruta");

  // Building type, then age. Floors defaults to 1, which is valid.
  await page.getByRole("button", { name: "Apartamento", exact: true }).click();
  await page
    .getByRole("button", { name: /Después de 2000/ })
    .click();

  // Continue to the checklist.
  await page.getByRole("button", { name: /Continuar/ }).click();

  // ── Step 2: Checklist ────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/assess\/checklist/);

  // Answer "No" on every required structural item (7 cards visible initially).
  const noButtons = page.getByRole("button", { name: "No", exact: true });
  await expect(noButtons.first()).toBeVisible({ timeout: 15_000 });
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

  // A findings badge with one of the four levels should be present. Copy is
  // findings-based (no verdicts): "Hallazgos leves/moderados/serios/severos".
  await expect(
    page.getByText(
      /Hallazgos (leves|moderados|serios|severos)|(Minor|Moderate|Serious|Severe) findings/i,
    ).first(),
  ).toBeVisible({ timeout: 20_000 });
});
