import { expect, test } from "@playwright/test";
import { board, gameId, quickPlay, uniquePool } from "./helpers.ts";

test.describe("show-board", () => {
  test("quick play shows the full board, the spare tile and the game id", async ({ page }) => {
    await quickPlay(page, uniquePool("quick"));

    await expect(board(page).locator("[data-tile-id]")).toHaveCount(49);
    await expect(board(page).locator("[data-fixed]")).toHaveCount(16);
    await expect(page.getByText("Ylimääräinen laatta")).toBeVisible();
    expect(await gameId(page)).toMatch(/^[a-z]+(-[a-z]+)+$/);
    await expect(page.getByRole("img", { name: "Pelaaja 1 (sinä)" })).toBeVisible();
  });

  test("two players in the same game see the same board and both pawns", async ({ browser }) => {
    const pool = uniquePool("two");
    const a = await (await browser.newContext({ ...test.info().project.use })).newPage();
    const b = await (await browser.newContext({ ...test.info().project.use })).newPage();

    await quickPlay(a, pool);
    await quickPlay(b, pool);
    expect(await gameId(b)).toBe(await gameId(a));

    await expect(a.getByRole("img", { name: "Pelaaja 1 (sinä)" })).toBeVisible();
    await expect(a.getByRole("img", { name: "Pelaaja 2" })).toBeVisible();
    await expect(b.getByRole("img", { name: "Pelaaja 2 (sinä)" })).toBeVisible();
    await expect(b.getByRole("img", { name: "Pelaaja 1" })).toBeVisible();

    const tiles = (page: typeof a) =>
      board(page).locator("[data-tile-id]").evaluateAll((els) => els.map((e) => `${e.getAttribute("data-tile-id")}:${e.getAttribute("data-openings")}`));
    expect(await tiles(b)).toEqual(await tiles(a));
  });

  test("reload keeps the game and the seat without tapping Play", async ({ page }) => {
    await quickPlay(page, uniquePool("reload"));
    const id = await gameId(page);

    await page.reload();
    await expect(board(page)).toBeVisible();
    expect(await gameId(page)).toBe(id);
    await expect(page.getByRole("img", { name: "Pelaaja 1 (sinä)" })).toBeVisible();
  });

  test("board and spare fit a 360×780 screen without horizontal scroll", async ({ page }) => {
    await quickPlay(page, uniquePool("fit"));
    const viewport = page.viewportSize()!;
    expect(viewport).toEqual({ width: 360, height: 780 });

    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fits).toBe(true);

    const boardBox = (await board(page).boundingBox())!;
    const spareBox = (await page.getByRole("group", { name: "Ylimääräinen laatta" }).boundingBox())!;
    expect(boardBox.x).toBeGreaterThanOrEqual(0);
    expect(boardBox.x + boardBox.width).toBeLessThanOrEqual(360);
    expect(spareBox.y + spareBox.height).toBeLessThanOrEqual(780);
  });
});
