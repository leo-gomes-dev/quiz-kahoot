import React from "react";
import type { LeaderboardEntry } from "../../types/game";

interface RankingScreenProps {
  leaderboard: LeaderboardEntry[];
  playerName: string;
}

export const RankingScreen: React.FC<RankingScreenProps> = ({
  leaderboard,
  playerName,
}) => {
  return (
    <div className="flex-1 w-full max-w-2xl mx-auto p-6 flex flex-col items-center justify-center animate-in zoom-in fade-in duration-500">
      {/* TÍTULO COM SOMBRA PARA DESTAQUE */}
      <h2 className="text-3xl md:text-5xl font-black text-yellow-400 mb-10 italic uppercase tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] text-center">
        Ranking Atual 🏆
      </h2>

      <div className="w-full max-w-md space-y-4">
        {leaderboard.length === 0 ? (
          /* FEEDBACK CASO O BANCO DEMORE A RESPONDER */
          <div className="text-center p-12 bg-black/20 rounded-[3rem] border-4 border-dashed border-white/10 animate-pulse">
            <p className="text-xl font-black uppercase text-purple-200 opacity-50">
              Calculando Posições... 📊
            </p>
          </div>
        ) : (
          /* MAPEAMENTO DO RANKING */
          leaderboard.map((user, idx) => {
            const isMe = user.player_name === playerName;
            return (
              <div
                key={`${user.player_name}-${idx}`}
                className={`flex justify-between items-center p-5 md:p-6 rounded-[2rem] border-b-8 transition-all duration-300 ${
                  isMe
                    ? "bg-yellow-400 text-indigo-900 border-yellow-600 scale-105 shadow-[0_15px_30px_-10px_rgba(234,179,8,0.4)] z-10"
                    : "bg-white/10 border-black/30 text-white hover:bg-white/15"
                }`}
              >
                <div className="flex items-center gap-5">
                  <span
                    className={`font-black text-2xl w-8 ${
                      isMe ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    {idx + 1}º
                  </span>
                  <div className="flex flex-col">
                    {isMe && (
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">
                        Você
                      </span>
                    )}
                    <span className="font-black uppercase text-lg md:text-xl truncate max-w-[160px] leading-tight">
                      {user.player_name}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-black text-2xl md:text-3xl tracking-tighter">
                    {user.score.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase opacity-40 ${isMe ? "text-indigo-900" : "text-white"}`}
                  >
                    Pontos
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER DE ESPERA */}
      <div className="mt-12 flex flex-col items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
        </div>
        <p className="text-indigo-200 font-black uppercase text-[10px] tracking-[0.3em] opacity-70">
          Aguardando o professor avançar
        </p>
      </div>
    </div>
  );
};
