import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import Collections from "@/pages/Collections";
import UpdateLogPage from "@/pages/UpdateLogPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/updates" element={<UpdateLogPage />} />
      </Routes>
    </BrowserRouter>
  );
}
