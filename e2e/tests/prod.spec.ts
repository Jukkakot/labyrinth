import { expect, test } from "@playwright/test";
import { board, uniquePool } from "./helpers.ts";

/**
 * Production smoke, run by the prod-smoke workflow after a deploy (config `playwright.prod.config.ts`):
 * on the live site a player wakes the server, starts a 1v1 quick game against a bot, sees the
 * board, leaves, and stays on the start screen after a reload.
 */
test("live site: quick game against a bot, then leave", async ({ page }) => {
  const pool = uniquePool("prod");
  await page.goto(`./?pool=${pool}`);

  // A sleeping server takes up to about a minute; the quick-game buttons wait for it.
  const oneBot = page.getByRole("button", { name: "Pikapeli: sinä ja 1 botti" });
  await expect(oneBot).toBeEnabled({ timeout: 120_000 });
  await page.getByRole("textbox", { name: "Nimimerkki" }).fill("Savutesti");
  await oneBot.click();

  await expect(board(page).locator("[data-tile-id]")).toHaveCount(49, { timeout: 30_000 });
  await expect(page.getByText("Robo, botti", { exact: false })).toBeAttached();

  await page.getByRole("button", { name: "Poistu pelistä" }).click();
  await page.getByRole("button", { name: "Poistu", exact: true }).click();
  await expect(oneBot).toBeVisible();

  // Left for good: a reload does not bring the game back.
  await page.reload();
  await expect(oneBot).toBeVisible({ timeout: 30_000 });
  await expect(board(page)).toHaveCount(0);
});
