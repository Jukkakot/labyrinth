import { GameScreen } from "./screens/GameScreen.tsx";
import { StartScreen } from "./screens/StartScreen.tsx";
import { useServerWake } from "./session/serverWake.ts";
import { useGameSession } from "./session/useGameSession.ts";

export default function App() {
  // Started before anything else, so a sleeping server wakes while the player reads the start screen.
  const wake = useServerWake();
  const session = useGameSession();
  if (session.status === "playing" && session.view) return <GameScreen view={session.view} session={session} />;
  return <StartScreen session={session} wake={wake} />;
}
