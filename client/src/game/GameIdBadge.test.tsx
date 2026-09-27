// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../i18n";
import { GameIdBadge } from "./GameIdBadge.tsx";

describe("board-view › Game identifier badge (games on the device)", () => {
  it("Daily puzzle label: shows Päivän pulma and copies the full id", async () => {
    const copy = vi.fn(async (_text: string) => {});
    render(<GameIdBadge roomId="local-daily-mujxitgji577" copy={copy} />);

    const badge = screen.getByRole("button", { name: /Päivän pulma/ });
    expect(badge.textContent).toBe("Päivän pulma");

    await act(async () => {
      fireEvent.click(badge);
    });
    expect(copy.mock.calls[0]![0]).toMatch(/^Peli local-daily-mujxitgji577 · /);
  });

  it("Other game on the device: shows Oma peli", () => {
    render(<GameIdBadge roomId="local-abc123" />);
    expect(screen.getByRole("button", { name: /Oma peli/ }).textContent).toBe("Oma peli");
  });

  it("a server game keeps its readable id", () => {
    render(<GameIdBadge roomId="brave-otters-sing" />);
    expect(screen.getByRole("button", { name: /brave-otters-sing/ }).textContent).toBe("brave-otters-sing");
  });
});
