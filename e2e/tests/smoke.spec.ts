import { expect, test } from "@playwright/test";
import { board, gameId, quickPlay, uniquePool } from "./helpers.ts";

/** Smoke: the app starts against a real server and Play shows the whole board on a Galaxy S24. */
test("app starts and quick play shows the board", async ({ page }) => {
  await quickPlay(page, uniquePool("smoke"));

  await expect(board(page).locator("[data-tile-id]")).toHaveCount(49);
  await expect(page.getByText("Ylimääräinen laatta")).toBeVisible();
  await expect(page.getByRole("img", { name: "Pelaaja 1 (sinä)" })).toBeVisible();
  expect(await gameId(page)).toMatch(/^[a-z]+(-[a-z]+)+$/);

  // board-view › Board fits a phone screen (360×780, no horizontal scroll).
  expect(page.viewportSize()).toEqual({ width: 360, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const boardBox = (await board(page).boundingBox())!;
  const spareBox = (await page.getByRole("group", { name: "Ylimääräinen laatta" }).boundingBox())!;
  expect(boardBox.x + boardBox.width).toBeLessThanOrEqual(360);
  expect(spareBox.y + spareBox.height).toBeLessThanOrEqual(780);
});
