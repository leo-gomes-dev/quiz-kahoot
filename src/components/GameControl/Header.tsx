import React from "react";

interface HeaderProps {
  index: number;
  totalQuestions: number;
  isRankingMode: boolean;
  exitStage: boolean;
  onShowCode: () => void;
  onToggleRanking: () => void;
  onShowGabarito: () => void;
  onExit: (e: React.MouseEvent) => void;
}

export const Header: React.FC<HeaderProps> = ({
  index,
  totalQuestions,
  isRankingMode,
  exitStage,
  onShowCode,
  onToggleRanking,
  onShowGabarito,
  onExit,
}) => {
  return (
    <header className="relative z-50 flex flex-wrap justify-between items-center mb-10 bg-white/10 p-4 md:p-6 rounded-3xl border-b-4 border-black/20 w-full gap-3 text-white">
      {/* LADO ESQUERDO: SALA E RANKING */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowCode();
          }}
          className="bg-yellow-400 text-indigo-900 px-3 py-2 rounded-xl font-black text-xs shadow-[0_4px_0_0_#b58900] active:translate-y-1 cursor-pointer"
        >
          📺 SALA
        </button>
        <button
          onClick={onToggleRanking}
          className={`px-3 py-2 rounded-xl font-black text-xs transition-all shadow-[0_4px_0_0_#1e1b4b] active:translate-y-1 cursor-pointer ${
            isRankingMode
              ? "bg-indigo-600 text-white"
              : "bg-yellow-400 text-indigo-900"
          }`}
        >
          📊 RANKING
        </button>
      </div>

      {/* CENTRO: GABARITO */}
      <button
        onClick={onShowGabarito}
        className="bg-black/40 text-yellow-400 px-4 py-2 rounded-xl font-black text-xs border border-yellow-400/20 active:translate-y-1 cursor-pointer flex items-center gap-2"
      >
        <span>👁️</span> GABARITO
      </button>

      {/* LADO DIREITO: QUESTÃO E SAIR */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[10px] font-black opacity-50 uppercase tracking-tighter">
            Questão
          </p>
          <p className="text-sm font-black leading-none">
            {index + 1}/{totalQuestions}
          </p>
        </div>

        {/* BOTÃO SAIR COM UI/UX DE CONFIRMAÇÃO */}
        <button
          onClick={onExit}
          className={`px-5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer border-b-4 active:translate-y-1 active:border-b-0 uppercase ${
            exitStage
              ? "bg-yellow-400 text-indigo-900 animate-pulse border-yellow-600 shadow-[0_4px_0_0_#b58900]"
              : "bg-[#e21b3c] text-white border-[#a0132b] shadow-[0_4px_0_0_#a0132b]"
          }`}
        >
          {exitStage ? "CONFIRMAR?" : "SAIR"}
        </button>
      </div>
    </header>
  );
};
