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

    // ── Record professional observations (agree verdict) ───────────────
    // The current flow records advisory observations and promotes the linked
    // assessment to a professional report without changing the risk level.
    await page
      .getByRole("button", { name: "Registrar observaciones" })
      .click();
    await page
      .getByPlaceholder(/Orienté al residente/)
      .fill("E2E: orienté al residente y recomendé inspección formal.");
    // Accept the advisory disclaimer, then save.
    await page.getByRole("checkbox").last().check();
    await page.getByRole("button", { name: "Guardar observaciones" }).click();

    await expect(page.getByText(/Observaciones registradas/)).toBeVisible({
      timeout: 15_000,
    });

    // The linked assessment is now a verified professional report. The risk
    // level is preserved (advisory observations do not override it).
    await expect(async () => {
      const a = await readAssessment(seed.assessmentPublicId);
      expect(a?.report_type).toBe("professional");
      expect(a?.engineer_verdict).toBe("agree");
      expect(a?.risk_level).toBe("yellow");
    }).toPass({ timeout: 15_000 });
  });
});

