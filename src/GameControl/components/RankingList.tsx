import React from "react";
import type { LeaderboardEntry } from "../../types/game";

interface RankingListProps {
  leaderboard: LeaderboardEntry[];
  onBack: () => void;
}

export const RankingList: React.FC<RankingListProps> = ({
  leaderboard,
  onBack,
}) => {
  // Pegamos apenas os 5 melhores para manter o foco e a fluidez na tela do professor
  const topPlayers = leaderboard.slice(0, 5);

  return (
    <div className="bg-white text-indigo-900 p-8 md:p-10 rounded-[3rem] border-b-8 border-gray-300 animate-in zoom-in duration-300 shadow-2xl w-full">
      <h2 className="text-3xl md:text-4xl font-black text-center mb-8 uppercase italic tracking-tighter text-indigo-900">
        Ranking Parcial 📊
      </h2>

      <div className="space-y-3 mb-10">
        {topPlayers.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-bold text-indigo-900/30 text-lg uppercase italic">
              Ninguém pontuou ainda... 🧐
            </p>
            <div className="w-16 h-1 bg-indigo-50 mx-auto mt-4 rounded-full" />
          </div>
        ) : (
          topPlayers.map((player, i) => (
            <div
              key={`${player.player_name}-${i}`}
              className="flex justify-between items-center p-5 bg-indigo-50 rounded-2xl border-b-2 border-indigo-100 hover:scale-[1.02] transition-transform duration-200"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`
                  w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm
                  ${i === 0 ? "bg-yellow-400 text-yellow-900" : "bg-indigo-600 text-white"}
                `}
                >
                  {i + 1}
                </span>
                <span className="font-black text-lg text-indigo-900 truncate max-w-[150px] md:max-w-full">
                  {player.player_name}
                </span>
              </div>
              <span className="font-black text-indigo-500 text-lg whitespace-nowrap">
                {player.score.toLocaleString()}{" "}
                <span className="text-[10px] uppercase opacity-60">pts</span>
              </span>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full py-6 bg-gray-200 text-indigo-900 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_6px_0_0_#cbd5e0] active:translate-y-1 hover:bg-gray-300 transition-all uppercase flex items-center justify-center gap-2"
      >
        <span>⬅</span> VOLTAR PARA PERGUNTA
      </button>
    </div>
  );
};
