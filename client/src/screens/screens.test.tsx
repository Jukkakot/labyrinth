// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../i18n";
import { GameIdBadge } from "../game/GameIdBadge.tsx";
import { clientVersion } from "../logging/logger.ts";
import type { ServerWake } from "../session/serverWake.ts";
import { BuildInfo } from "./BuildInfo.tsx";
import { StartScreen } from "./StartScreen.tsx";

const ready: ServerWake = { state: "ready", slow: false, server: { builtAt: null } };

describe("board-view › Game identifier badge", () => {
  it("Copy for a bug report: copies id, local date and time and version, then confirms", async () => {
    const copy = vi.fn(async (_text: string) => {});
    render(<GameIdBadge roomId="brave-otters-sing" copy={copy} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /brave-otters-sing/ }));
    });

    expect(copy).toHaveBeenCalledTimes(1);
    // Version comes from the build (a commit id in CI, "dev" locally); the time separator depends on ICU.
    const line = copy.mock.calls[0]![0];
    expect(line).toMatch(/^Peli brave-otters-sing · \d{1,2}\.\d{1,2}\.\d{4} \d{2}[.:]\d{2} · v \S+$/);
    expect(line.endsWith("v " + clientVersion())).toBe(true);
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
    render(<StartScreen session={{ status: "idle", slow: false, play }} wake={ready} />);
    fireEvent.click(screen.getByRole("button", { name: "Pelaa" }));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("Slow server: connecting state with the waking-up hint", () => {
    render(<StartScreen session={{ status: "connecting", slow: true, play: vi.fn() }} wake={ready} />);
    expect(screen.getByRole("status").textContent).toContain("Yhdistetään palvelimeen");
    expect(screen.getByText(/saattaa olla heräämässä/)).toBeTruthy();
  });

  it("Join fails: calm message and retry, no technical details", () => {
    const play = vi.fn();
    render(<StartScreen session={{ status: "error", slow: false, play }} wake={ready} />);
    expect(screen.getByRole("alert").textContent).toContain("Peliin ei päästy");
    fireEvent.click(screen.getByRole("button", { name: "Yritä uudelleen" }));
    expect(play).toHaveBeenCalledTimes(1);
  });
});

describe("game-session › Quick play (early wake-up)", () => {
  const idle = { status: "idle" as const, slow: false, play: vi.fn() };
  const playButton = () => screen.getByRole("button", { name: "Pelaa" }) as HTMLButtonElement;

  it("Sleeping server is woken on open: Play disabled and the screen says so", () => {
    render(<StartScreen session={idle} wake={{ state: "waking", slow: false }} />);
    expect(playButton().disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("Herätetään palvelinta…");
  });

  it("adds that waking can take about a minute once it is slow", () => {
    render(<StartScreen session={idle} wake={{ state: "waking", slow: true }} />);
    expect(screen.getByRole("status").textContent).toContain("noin minuutin");
  });

  it("Server wakes up: the message goes away and Play can be tapped", () => {
    const play = vi.fn();
    const { rerender } = render(<StartScreen session={{ ...idle, play }} wake={{ state: "waking", slow: true }} />);
    rerender(<StartScreen session={{ ...idle, play }} wake={ready} />);
    expect(screen.getByRole("status").textContent).toBe("");
    fireEvent.click(playButton());
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("Server does not answer: Play enabled with a calm note", () => {
    const play = vi.fn();
    render(<StartScreen session={{ ...idle, play }} wake={{ state: "failed", slow: true }} />);
    expect(screen.getByRole("status").textContent).toBe("Palvelin ei vastannut vielä – voit silti yrittää.");
    fireEvent.click(playButton());
    expect(play).toHaveBeenCalledTimes(1);
  });
});

describe("observability › Build times on the start screen", () => {
  // Expected text in the test's own time zone, formatted like the component.
  const local = (iso: string) => {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat("fi", { day: "numeric", month: "numeric", year: "numeric" }).format(d);
    const time = new Intl.DateTimeFormat("fi", { hour: "2-digit", minute: "2-digit" }).format(d);
    return `${date} ${time}`;
  };

  it("Fresh deploy is visible: client and server build times in local time", () => {
    render(
      <BuildInfo
        clientBuilt="2026-09-26T15:40:00.000Z"
        wake={{ state: "ready", slow: false, server: { builtAt: "2026-09-26T15:35:00.000Z" } }}
      />,
    );
    expect(screen.getByText(`Client ${local("2026-09-26T15:40:00.000Z")}`)).toBeTruthy();
    expect(screen.getByText(`Server ${local("2026-09-26T15:35:00.000Z")}`)).toBeTruthy();
  });

  it("Server still waking: client time shown, server line says it is being woken", () => {
    render(<BuildInfo clientBuilt="2026-09-26T15:40:00.000Z" wake={{ state: "waking", slow: false }} />);
    expect(screen.getByText(/^Client \d/)).toBeTruthy();
    expect(screen.getByText("Server: herätetään…")).toBeTruthy();
  });

  it("Server does not answer: server line says so", () => {
    render(<BuildInfo clientBuilt={null} wake={{ state: "failed", slow: true }} />);
    expect(screen.getByText("Server: ei vastannut")).toBeTruthy();
  });

  it("Local development: dev instead of a time; an unknown server time is ?", () => {
    const { rerender } = render(<BuildInfo clientBuilt={null} wake={ready} />);
    expect(screen.getByText("Client dev")).toBeTruthy();
    expect(screen.getByText("Server dev")).toBeTruthy();
    rerender(<BuildInfo clientBuilt={null} wake={{ state: "ready", slow: false, server: {} }} />);
    expect(screen.getByText("Server ?")).toBeTruthy();
  });

  it("the start screen footer shows both lines", () => {
    render(<StartScreen session={{ status: "idle", slow: false, play: vi.fn() }} wake={ready} />);
    expect(screen.getByText("Client dev")).toBeTruthy();
    expect(screen.getByText("Server dev")).toBeTruthy();
  });
});

describe("game-session › Kicked player informed", () => {
  it("Kicked: the start screen explains why, and Play is available", () => {
    const play = vi.fn();
    render(<StartScreen session={{ status: "idle", slow: false, play, endReason: "kicked" }} wake={ready} />);
    expect(screen.getByRole("status").textContent).toContain("Sinut poistettiin pelistä, koska vuorosi aika loppui.");
    fireEvent.click(screen.getByRole("button", { name: "Pelaa" }));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("no message without a reason", () => {
    render(<StartScreen session={{ status: "idle", slow: false, play: vi.fn() }} wake={ready} />);
    expect(screen.queryByText(/Sinut poistettiin/)).toBeNull();
  });
});
