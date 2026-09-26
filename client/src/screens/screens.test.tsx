// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../i18n";
import { GameIdBadge } from "../game/GameIdBadge.tsx";
import { StartScreen } from "./StartScreen.tsx";

describe("board-view › Game identifier badge", () => {
  it("Copy for a bug report: copies id, local date and time and version, then confirms", async () => {
    const copy = vi.fn(async (_text: string) => {});
    render(<GameIdBadge roomId="brave-otters-sing" copy={copy} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /brave-otters-sing/ }));
    });

    expect(copy).toHaveBeenCalledTimes(1);
    expect(copy.mock.calls[0]![0]).toMatch(/^Peli brave-otters-sing · \d{1,2}\.\d{1,2}\.\d{4} \d{2}\.\d{2} · v dev$/);
    expect(screen.getByRole("status").textContent).toBe("Kopioitu");
  });

  it("shows the line selectable when copying is not possible", async () => {
    const copy = vi.fn(async () => Promise.reject(new Error("denied")));
    render(<GameIdBadge roomId="brave-otters-sing" copy={copy} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /brave-otters-sing/ }));
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toContain("brave-otters-sing");
    expect(input.readOnly).toBe(true);
  });
});

describe("game-session › Quick play (start screen)", () => {
  it("offers a single Play action", () => {
    const play = vi.fn();
    render(<StartScreen session={{ status: "idle", slow: false, play }} />);
    fireEvent.click(screen.getByRole("button", { name: "Pelaa" }));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("Slow server: connecting state with the waking-up hint", () => {
    render(<StartScreen session={{ status: "connecting", slow: true, play: vi.fn() }} />);
    expect(screen.getByRole("status").textContent).toContain("Yhdistetään palvelimeen");
    expect(screen.getByText(/saattaa olla heräämässä/)).toBeTruthy();
  });

  it("Join fails: calm message and retry, no technical details", () => {
    const play = vi.fn();
    render(<StartScreen session={{ status: "error", slow: false, play }} />);
    expect(screen.getByRole("alert").textContent).toContain("Peliin ei päästy");
    fireEvent.click(screen.getByRole("button", { name: "Yritä uudelleen" }));
    expect(play).toHaveBeenCalledTimes(1);
  });
});
