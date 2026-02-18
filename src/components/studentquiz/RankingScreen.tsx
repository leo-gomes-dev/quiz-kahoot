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
    <div className="flex-1 p-6 flex flex-col items-center justify-center animate-in zoom-in duration-500">
      <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mb-8 italic uppercase tracking-tighter drop-shadow-lg text-center">
        Ranking Atual 🏆
      </h2>
      <div className="w-full max-w-md space-y-4">
        {leaderboard.map((user, idx) => {
          const isMe = user.player_name === playerName;
          return (
            <div
              key={`${user.player_name}-${idx}`}
              className={`flex justify-between items-center p-5 md:p-6 rounded-3xl border-b-8 transition-all ${
                isMe
                  ? "bg-yellow-400 text-indigo-900 border-yellow-600 scale-105 z-10"
                  : "bg-white/10 border-black/20 text-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`font-black text-xl ${isMe ? "opacity-100" : "opacity-50"}`}
                >
                  #{idx + 1}
                </span>
                <span className="font-black uppercase text-lg md:text-xl truncate max-w-[150px]">
                  {user.player_name}
                </span>
              </div>
              <span className="font-black text-xl md:text-2xl">
                {user.score}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-indigo-200 font-bold uppercase text-xs animate-pulse">
        Aguardando o professor... ⏳
      </p>
    </div>
  );
};
