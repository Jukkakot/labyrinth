// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "../i18n";
import { getSettings, reloadSettings } from "./settings.ts";
import { SettingsScreen } from "./SettingsScreen.tsx";

afterEach(() => {
  localStorage.clear();
  reloadSettings();
});

describe("settings › settings screen", () => {
  it("toggles and the theme apply at once and are remembered; vibration is disabled where unsupported; Takaisin closes", () => {
    const onClose = vi.fn();
    render(<SettingsScreen onClose={onClose} />);

    const sounds = screen.getByRole("switch", { name: /^Äänet/ });
    expect((sounds as HTMLInputElement).checked).toBe(true);
    fireEvent.click(sounds);
    expect(getSettings().sounds).toBe(false);
    expect(JSON.parse(localStorage.getItem("labyrinth.settings")!)).toMatchObject({ sounds: false });

    fireEvent.click(screen.getByRole("button", { name: "Tumma" }));
    expect(getSettings().theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Tumma" }).getAttribute("aria-pressed")).toBe("true");

    const vibration = screen.getByRole("switch", { name: /^Värinä/ }) as HTMLInputElement;
    expect(vibration.disabled).toBe(true);
    expect(screen.getByText("Tämä laite ei tue värinää.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Takaisin" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("how-to-play › Rules screen reachable before and during a game", () => {
  it("During a game: the settings open the rules, Takaisin returns to the settings", () => {
    const onClose = vi.fn();
    render(<SettingsScreen onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Näin pelaat" }));
    expect(screen.getByRole("heading", { level: 1, name: "Näin pelaat" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Takaisin" }));
    expect(screen.getByRole("heading", { level: 1, name: "Asetukset" })).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
