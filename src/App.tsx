import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import UpdateLogPage from "@/pages/UpdateLogPage";
import Settings from "@/pages/Settings";
import CoopZone from "@/pages/CoopZone";
import { useGamepadBridge } from "@/hooks/useGamepad";

export default function App() {
  useGamepadBridge();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/coop" element={<CoopZone />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/updates" element={<UpdateLogPage />} />
      </Routes>
    </BrowserRouter>
  );
}
