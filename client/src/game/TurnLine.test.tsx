// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import i18n from "../i18n";
import { noticeKey } from "../session/useGameSession.ts";
import { Notice } from "../ui/Notice.tsx";
import { TurnLine } from "./TurnLine.tsx";

describe("board-view › Whose turn is shown", () => {
  it("Own turn: says it is your turn and to push a tile", () => {
    render(<TurnLine view={{ turnSeat: 1, isMyTurn: true }} />);
    expect(screen.getByText("Sinun vuorosi – työnnä laatta")).toBeTruthy();
  });

  it("Other player's turn: names player 2 with their pawn shape", () => {
    const { container } = render(<TurnLine view={{ turnSeat: 2, isMyTurn: false }} />);
    expect(screen.getByText("Pelaaja 2 työntää")).toBeTruthy();
    expect(container.querySelector("[data-seat='2']")).not.toBeNull();
    expect(container.querySelector("[data-me]")).toBeNull();
  });

  it("shows nothing before anybody holds the turn", () => {
    const { container } = render(<TurnLine view={{ turnSeat: 0, isMyTurn: false }} />);
    expect(container.textContent).toBe("");
  });
});

describe("board-view › Rejected command message", () => {
  it("REVERSE_PUSH_FORBIDDEN is explained without technical details", () => {
    render(<Notice message={i18n.t(noticeKey("REVERSE_PUSH_FORBIDDEN"))} />);
    expect(screen.getByRole("status").textContent).toBe("Et voi työntää laattaa takaisin samasta kohdasta");
  });

  it("Server says not your turn", () => {
    render(<Notice message={i18n.t(noticeKey("NOT_YOUR_TURN"))} />);
    expect(screen.getByRole("status").textContent).toBe("Ei ole sinun vuorosi");
  });

  it("unknown codes get the generic message; the live region stays when empty", () => {
    expect(noticeKey("INVALID_COMMAND")).toBe("errors.generic");
    render(<Notice />);
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
