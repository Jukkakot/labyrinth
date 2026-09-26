import { expect, type Page } from "@playwright/test";

/** A quick-play pool unique to one test, so tests never share games. */
export const uniquePool = (name: string) => `e2e-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const board = (page: Page) => page.getByRole("group", { name: "Pelilauta" });

/** Opens the start screen in `pool`, taps Play and waits for the board. */
export async function quickPlay(page: Page, pool: string) {
  await page.goto(`/?pool=${pool}`);
  await page.getByRole("button", { name: "Pelaa" }).click();
  await expect(board(page)).toBeVisible();
}

/** The game id shown in the top bar. */
export async function gameId(page: Page): Promise<string> {
  const label = await page.getByRole("button", { name: /^Peli .* Napauta kopioidaksesi\.$/ }).getAttribute("aria-label");
  return label!.replace(/^Peli (.*)\. Napauta kopioidaksesi\.$/, "$1");
}
