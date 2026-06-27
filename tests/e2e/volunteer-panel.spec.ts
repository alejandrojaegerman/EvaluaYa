import { test, expect } from "@playwright/test";

import {
  seedVolunteer,
  teardownVolunteer,
  readAssessment,
  readRequest,
  type VolunteerSeed,
} from "./fixtures/volunteer-seed";

/**
 * Engineer panel journey (Spanish UI):
 *   claim → progress (contacted → visited) → professional verdict (adjust).
 *
 * Drives the real panel against a freshly-seeded engineer + open request and
 * asserts both the UI feedback and the resulting database state (request
 * progress + the linked assessment getting promoted to a verified
 * professional report).
 */
test.describe("engineer panel", () => {
  let seed: VolunteerSeed;

  test.beforeAll(async () => {
    seed = await seedVolunteer();
  });

  test.afterAll(async () => {
    if (seed) await teardownVolunteer(seed);
  });

  test("engineer claims, tracks progress, and submits a verdict", async ({
    page,
  }) => {
    await page.goto(`/voluntarios/panel/${seed.token}`);

    // Panel loads for the seeded engineer and shows the open request.
    await expect(page.getByText(/E2E-VOLUNTEER Engineer/)).toBeVisible({
      timeout: 20_000,
    });
    const requestCard = page.locator("li", {
      hasText: "E2E-VOLUNTEER please help",
    });
    await expect(requestCard).toBeVisible({ timeout: 15_000 });

    // ── Claim ──────────────────────────────────────────────────────────
    await requestCard
      .getByRole("button", { name: "Estoy disponible" })
      .click();

    // After claiming, the progress actions appear (panel reloads internally).
    const contactedBtn = page.getByRole("button", { name: "Marcar: contacté" });
    await expect(contactedBtn).toBeVisible({ timeout: 15_000 });

    await expect(async () => {
      const r = await readRequest(seed.requestId);
      expect(r?.status).toBe("claimed");
      expect(r?.claimed_by).toBe(seed.engineerId);
    }).toPass({ timeout: 15_000 });

    // ── Progress: contacted ────────────────────────────────────────────
    await contactedBtn.click();
    await expect(page.getByText("Progreso actualizado.")).toBeVisible({
      timeout: 15_000,
    });
    await expect(async () => {
      const r = await readRequest(seed.requestId);
      expect(r?.progress_stage).toBe("contacted");
    }).toPass({ timeout: 15_000 });

    // ── Progress: visited ──────────────────────────────────────────────
    await page.getByRole("button", { name: "Marcar: visité" }).click();
    await expect(async () => {
      const r = await readRequest(seed.requestId);
      expect(r?.progress_stage).toBe("visited");
    }).toPass({ timeout: 15_000 });

    // ── Verdict: adjust to red ─────────────────────────────────────────
    await page
      .getByRole("button", { name: "Validar la evaluación de la app" })
      .click();
    await page.getByRole("button", { name: "Ajustar nivel" }).click();
    await page.getByRole("button", { name: "Riesgo alto", exact: true }).click();
    await page.getByRole("button", { name: "Guardar verdicto" }).click();

    await expect(page.getByText(/Verdicto guardado/)).toBeVisible({
      timeout: 15_000,
    });

    // The linked assessment is now a verified professional report at red,
    // preserving the original AI level as prior_risk_level.
    await expect(async () => {
      const a = await readAssessment(seed.assessmentPublicId);
      expect(a?.report_type).toBe("professional");
      expect(a?.engineer_verdict).toBe("adjust");
      expect(a?.risk_level).toBe("red");
      expect(a?.prior_risk_level).toBe("yellow");
    }).toPass({ timeout: 15_000 });
  });
});
