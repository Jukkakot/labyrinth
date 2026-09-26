import { GameScreen } from "./screens/GameScreen.tsx";
import { StartScreen } from "./screens/StartScreen.tsx";
import { useGameSession } from "./session/useGameSession.ts";

export default function App() {
  const session = useGameSession();
  if (session.status === "playing" && session.view) return <GameScreen view={session.view} />;
  return <StartScreen session={session} />;
}
