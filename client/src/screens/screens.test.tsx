// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../i18n";
import { GameIdBadge } from "../game/GameIdBadge.tsx";
import { clientVersion } from "../logging/logger.ts";
import type { ServerWake } from "../session/serverWake.ts";
import { BuildInfo } from "./BuildInfo.tsx";
import { StartScreen, type StartScreenProps } from "./StartScreen.tsx";

const ready: ServerWake = { state: "ready", slow: false, server: { builtAt: null } };

/** A start-screen session: idle unless overridden, every action a spy. */
function sessionOf(overrides: Partial<StartScreenProps["session"]> = {}): StartScreenProps["session"] {
  return {
    status: "idle",
    slow: false,
    play: vi.fn(),
    createPrivate: vi.fn(),
    joinById: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

// A returning player: the remembered nickname makes the join actions available.
beforeEach(() => localStorage.setItem("labyrinth.nickname", "Maija"));
afterEach(() => localStorage.clear());

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
    render(<StartScreen session={sessionOf({ status: "idle", slow: false, play })} wake={ready} />);
    fireEvent.click(screen.getByRole("button", { name: "Pelaa" }));
    expect(play).toHaveBeenCalledExactlyOnceWith("Maija");
  });

  it("Slow server: connecting state with the waking-up hint", () => {
    render(<StartScreen session={sessionOf({ status: "connecting", slow: true, play: vi.fn() })} wake={ready} />);
    expect(screen.getByRole("status").textContent).toContain("Yhdistetään palvelimeen");
    expect(screen.getByText(/saattaa olla heräämässä/)).toBeTruthy();
  });

  it("Join fails: calm message and retry, no technical details", () => {
    const retry = vi.fn();
    render(<StartScreen session={sessionOf({ status: "error", slow: false, retry })} wake={ready} />);
    expect(screen.getByRole("alert").textContent).toContain("Peliin ei päästy");
    fireEvent.click(screen.getByRole("button", { name: "Yritä uudelleen" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe("game-session › Quick play (early wake-up)", () => {
  const idle = { status: "idle" as const, slow: false, play: vi.fn() };
  const playButton = () => screen.getByRole("button", { name: "Pelaa" }) as HTMLButtonElement;

  it("Sleeping server is woken on open: Play disabled and the screen says so", () => {
    render(<StartScreen session={sessionOf(idle)} wake={{ state: "waking", slow: false }} />);
    expect(playButton().disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("Herätetään palvelinta…");
  });

  it("adds that waking can take about a minute once it is slow", () => {
    render(<StartScreen session={sessionOf(idle)} wake={{ state: "waking", slow: true }} />);
    expect(screen.getByRole("status").textContent).toContain("noin minuutin");
  });

  it("Server wakes up: the message goes away and Play can be tapped", () => {
    const play = vi.fn();
    const { rerender } = render(<StartScreen session={sessionOf({ ...idle, play })} wake={{ state: "waking", slow: true }} />);
    rerender(<StartScreen session={sessionOf({ ...idle, play })} wake={ready} />);
    expect(screen.getByRole("status").textContent).toBe("");
    fireEvent.click(playButton());
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("Server does not answer: Play enabled with a calm note", () => {
    const play = vi.fn();
    render(<StartScreen session={sessionOf({ ...idle, play })} wake={{ state: "failed", slow: true }} />);
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
    render(<StartScreen session={sessionOf({ status: "idle", slow: false, play: vi.fn() })} wake={ready} />);
    expect(screen.getByText("Client dev")).toBeTruthy();
    expect(screen.getByText("Server dev")).toBeTruthy();
  });
});

describe("game-session › Kicked player informed", () => {
  it("Kicked: the start screen explains why, and Play is available", () => {
    const play = vi.fn();
    render(<StartScreen session={sessionOf({ status: "idle", slow: false, play, startNotice: "kicked" })} wake={ready} />);
    expect(screen.getByRole("status").textContent).toContain("Sinut poistettiin pelistä, koska vuorosi aika loppui.");
    fireEvent.click(screen.getByRole("button", { name: "Pelaa" }));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("no message without a reason", () => {
    render(<StartScreen session={sessionOf({ status: "idle", slow: false, play: vi.fn() })} wake={ready} />);
    expect(screen.queryByText(/Sinut poistettiin/)).toBeNull();
  });
});

describe("lobby › Nickname", () => {
  const field = () => screen.getByRole("textbox", { name: "Nimimerkki" }) as HTMLInputElement;
  const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;

  it("Remembered nickname: the field is prefilled", () => {
    render(<StartScreen session={sessionOf()} wake={ready} />);
    expect(field().value).toBe("Maija");
  });

  it("Valid nickname: trimmed, and the actions become available", () => {
    localStorage.clear();
    const play = vi.fn();
    render(<StartScreen session={sessionOf({ play })} wake={ready} />);
    expect(button("Pelaa").disabled).toBe(true);
    fireEvent.change(field(), { target: { value: "  Pekka  " } });
    expect(button("Pelaa").disabled).toBe(false);
    fireEvent.click(button("Pelaa"));
    expect(play).toHaveBeenCalledExactlyOnceWith("Pekka");
  });

  it("Too short: every join and create action is disabled and a hint says 2–16 characters", () => {
    render(<StartScreen session={sessionOf()} wake={ready} openGames={{ status: "ready", games: [{ roomId: "a-b-c", host: "Liisa", clients: 1 }] }} />);
    fireEvent.change(field(), { target: { value: "M" } });
    expect(button("Pelaa").disabled).toBe(true);
    expect(button("Luo yksityinen peli").disabled).toBe(true);
    expect(button("Liity peliin: Liisa, 1/4 pelaajaa").disabled).toBe(true);
    expect(screen.getByText("Nimimerkissä pitää olla 2–16 merkkiä")).toBeTruthy();
    expect(field().getAttribute("aria-invalid")).toBe("true");
  });

  it("control characters get their own hint", () => {
    render(<StartScreen session={sessionOf()} wake={ready} />);
    fireEvent.change(field(), { target: { value: "Ma\u0007ija" } });
    expect(screen.getByText("Nimimerkissä on merkkejä, joita ei voi käyttää")).toBeTruthy();
  });
});

describe("lobby › Open games list and private game", () => {
  const games = { status: "ready" as const, games: [{ roomId: "brave-otters-sing", host: "Liisa", clients: 2 }] };

  it("Join from the list: an entry shows the host and seats, and tapping it joins that game", () => {
    const joinById = vi.fn();
    render(<StartScreen session={sessionOf({ joinById })} wake={ready} openGames={games} />);
    const entry = screen.getByRole("button", { name: "Liity peliin: Liisa, 2/4 pelaajaa" });
    expect(entry.textContent).toBe("Liisa· 2/4");
    fireEvent.click(entry);
    expect(joinById).toHaveBeenCalledExactlyOnceWith("brave-otters-sing", "Maija");
  });

  it("no open games: says so briefly", () => {
    render(<StartScreen session={sessionOf()} wake={ready} openGames={{ status: "ready", games: [] }} />);
    expect(screen.getByText("Ei avoimia pelejä juuri nyt")).toBeTruthy();
  });

  it("the list could not be loaded: a quiet note, Play still works", () => {
    render(<StartScreen session={sessionOf()} wake={ready} openGames={{ status: "failed", games: [] }} />);
    expect(screen.getByText(/Pelilistaa ei saatu/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Pelaa" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("Create a private game", () => {
    const createPrivate = vi.fn();
    render(<StartScreen session={sessionOf({ createPrivate })} wake={ready} />);
    fireEvent.click(screen.getByRole("button", { name: "Luo yksityinen peli" }));
    expect(createPrivate).toHaveBeenCalledExactlyOnceWith("Maija");
  });

  it.each([
    ["notOpen", "Peli ei ole enää avoinna"],
    ["hostLeft", "Pelin luoja poistui, joten peli suljettiin"],
    ["serverFull", "Palvelin on täynnä – yritä hetken päästä uudelleen"],
  ] as const)("start notice %s is shown in the status line", (startNotice, text) => {
    render(<StartScreen session={sessionOf({ startNotice })} wake={ready} />);
    expect(screen.getByRole("status").textContent).toBe(text);
  });
});

describe("lobby › Invite mode", () => {
  it("Join by invite link: the invite message, Liity peliin joins that game, and the invite is done", () => {
    const joinById = vi.fn();
    const onInviteDone = vi.fn();
    render(<StartScreen session={sessionOf({ joinById })} wake={ready} invite="calm-foxes-jump" onInviteDone={onInviteDone} />);
    expect(screen.getByText("Sinut on kutsuttu peliin")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pelaa" })).toBeNull();
    expect(screen.queryByText("Avoimet pelit")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Liity peliin" }));
    expect(joinById).toHaveBeenCalledExactlyOnceWith("calm-foxes-jump", "Maija");
    expect(onInviteDone).toHaveBeenCalledTimes(1);
  });

  it("Muut pelit leaves invite mode without joining", () => {
    const joinById = vi.fn();
    const onInviteDone = vi.fn();
    render(<StartScreen session={sessionOf({ joinById })} wake={ready} invite="calm-foxes-jump" onInviteDone={onInviteDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Muut pelit" }));
    expect(onInviteDone).toHaveBeenCalledTimes(1);
    expect(joinById).not.toHaveBeenCalled();
  });
});
