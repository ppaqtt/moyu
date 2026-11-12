import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import UpdateLogPage from "@/pages/UpdateLogPage";
import Multiplayer from "@/pages/Multiplayer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/updates" element={<UpdateLogPage />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
      </Routes>
    </BrowserRouter>
  );
}
