import { useState } from "react";
import { GameScreen } from "./screens/GameScreen.tsx";
import { StartScreen } from "./screens/StartScreen.tsx";
import { WaitingRoomScreen } from "./screens/WaitingRoomScreen.tsx";
import { dropInviteFromUrl, inviteFromUrl } from "./session/inviteLink.ts";
import { useServerWake } from "./session/serverWake.ts";
import { loadToken } from "./session/sessionToken.ts";
import { quickPlayPool, useGameSession } from "./session/useGameSession.ts";
import { useOpenGames } from "./session/useOpenGames.ts";

/** Read once at load: a stored reconnection token wins over an invite link (a reload rejoins the tab's game). */
function initialInvite(): string | undefined {
  const invite = loadToken() ? undefined : inviteFromUrl();
  if (!invite) dropInviteFromUrl();
  return invite;
}

const pool = quickPlayPool() ?? "";

export default function App() {
  // Started before anything else, so a sleeping server wakes while the player reads the start screen.
  const wake = useServerWake();
  const session = useGameSession();
  const [invite, setInvite] = useState(initialInvite);
  const inGame = session.status === "playing" && session.view !== undefined;
  const openGames = useOpenGames(pool, !inGame && !invite && wake.state !== "waking");

  if (inGame && session.view!.phase === "waiting") return <WaitingRoomScreen view={session.view!} session={session} />;
  if (inGame) return <GameScreen view={session.view!} session={session} />;
  return (
    <StartScreen
      session={session}
      wake={wake}
      openGames={openGames}
      invite={invite}
      onInviteDone={() => {
        setInvite(undefined);
        dropInviteFromUrl();
      }}
    />
  );
}
