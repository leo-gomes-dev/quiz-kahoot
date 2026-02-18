import React from "react";

interface Props {
  view: "setup" | "library";
  setView: (v: "setup" | "library") => void;
  confirmExit: boolean;
  onExit: () => void;
}

export const TeacherHeader: React.FC<Props> = ({
  view,
  setView,
  confirmExit,
  onExit,
}) => (
  <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white/10 p-6 rounded-[2rem] border-b-8 border-black/20">
    <div className="flex items-center gap-4">
      <button
        onClick={onExit}
        className={`p-3 px-6 rounded-2xl font-black text-[12px] transition-all uppercase shadow-lg ${
          confirmExit
            ? "bg-yellow-400 text-indigo-900 animate-pulse shadow-[0_4px_0_0_#b58900]"
            : "bg-white/10 hover:bg-red-500 text-white"
        }`}
      >
        {confirmExit ? "CONFIRMAR SAÍDA?" : "SAIR"}
      </button>
      <h1 className="text-3xl font-black italic text-yellow-400 tracking-tighter">
        TEACHER PANEL 🍎
      </h1>
    </div>
    <div className="flex bg-black/20 p-2 rounded-3xl">
      <button
        onClick={() => setView("setup")}
        className={`px-8 py-3 rounded-2xl font-black transition-all ${view === "setup" ? "bg-yellow-400 text-indigo-900 shadow-[0_4px_0_0_#b58900]" : ""}`}
      >
        JOGAR
      </button>
      <button
        onClick={() => setView("library")}
        className={`px-8 py-3 rounded-2xl font-black transition-all ${view === "library" ? "bg-pink-500 text-white shadow-[0_4px_0_0_#9d174d]" : ""}`}
      >
        QUESTÕES
      </button>
    </div>
  </header>
);
