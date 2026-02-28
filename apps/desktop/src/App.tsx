import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import "./App.css";
import ActiveSession from "./components/ActiveSession";
import DebugTools from "./components/DebugTools";
import GameList from "./components/GameList";
import SessionHistory from "./components/SessionHistory";
import { GameSession } from "./types";

function App() {
  const [sessions, setSessions] = useState<GameSession[]>([]);

  useEffect(() => {
    // Listen for session updates from Rust backend
    const unlistenPromise = listen<GameSession[]>("session-update", (event) => {
      setSessions(event.payload);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className="app-container">
      <DebugTools />
      <div className="hero">
        <h1>Game Detection</h1>
        <p>Your unified library of installed games</p>
      </div>
      <GameList />
      <div className="main-content">
        <SessionHistory sessions={sessions} />
      </div>
      <ActiveSession sessions={sessions} />
    </div>
  );
}

export default App;
