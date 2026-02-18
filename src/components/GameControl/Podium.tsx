import React from "react";
import type { LeaderboardEntry } from "./../../types/game";

interface PodiumStepProps {
  player: string;
  points: number;
  position: 1 | 2 | 3;
  delay: string;
}

const PodiumStep: React.FC<PodiumStepProps> = ({
  player,
  points,
  position,
  delay,
}) => {
  const configs = {
    1: {
      color: "bg-yellow-400",
      border: "border-yellow-600",
      h: "h-48 md:h-64",
      icon: "🥇",
      text: "text-yellow-800",
    },
    2: {
      color: "bg-slate-300",
      border: "border-slate-400",
      h: "h-32 md:h-44",
      icon: "🥈",
      text: "text-slate-600",
    },
    3: {
      color: "bg-orange-300",
      border: "border-orange-400",
      h: "h-24 md:h-32",
      icon: "🥉",
      text: "text-orange-700",
    },
  };

  const { color, border, h, icon, text } = configs[position];

  return (
    <div
      className={`flex flex-col items-center w-1/3 animate-in slide-in-from-bottom duration-700 ${delay}`}
    >
      <span
        className={`text-[10px] md:text-sm font-black uppercase truncate w-full text-center mb-2 ${position === 1 ? "text-white" : "text-indigo-200"}`}
      >
        {player}
      </span>
      <div
        className={`${color} w-full ${h} rounded-t-[2rem] border-b-8 ${border} flex flex-col items-center justify-center shadow-lg relative`}
      >
        <span className="text-3xl md:text-6xl">{icon}</span>
        <span className={`font-black text-[10px] md:text-lg mt-2 ${text}`}>
          {points} pts
        </span>
      </div>
    </div>
  );
};

export const Podium: React.FC<{
  winners: LeaderboardEntry[];
  onReset: () => void;
  onFinish: () => void;
}> = ({ winners, onReset, onFinish }) => (
  // Adicionamos o fundo roxo aqui para garantir visibilidade total
  <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-4 md:p-6 font-nunito">
    <div className="w-full max-w-4xl bg-white rounded-[3rem] md:rounded-[5rem] p-8 md:p-16 border-b-[12px] border-gray-300 text-center shadow-2xl animate-in zoom-in duration-700">
      <div className="text-6xl md:text-8xl mb-6 animate-bounce">🏆</div>
      <h1 className="text-4xl md:text-7xl font-black text-indigo-900 mb-12 uppercase italic tracking-tighter">
        Pódio Final
      </h1>

      <div className="flex items-end justify-center gap-2 md:gap-6 mb-16 h-64 md:h-80">
        {/* 2º Lugar */}
        {winners.length >= 2 && (
          <PodiumStep
            player={winners[1].player_name}
            points={winners[1].score}
            position={2}
            delay="delay-300"
          />
        )}

        {/* 1º Lugar */}
        {winners.length >= 1 ? (
          <PodiumStep
            player={winners[0].player_name}
            points={winners[0].score}
            position={1}
            delay="delay-0"
          />
        ) : (
          <p className="text-indigo-900/30 font-black italic">
            Ninguém pontuou...
          </p>
        )}

        {/* 3º Lugar */}
        {winners.length >= 3 && (
          <PodiumStep
            player={winners[2].player_name}
            points={winners[2].score}
            position={3}
            delay="delay-500"
          />
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button
          onClick={onReset}
          className="flex-1 bg-[#10ad59] text-white px-10 py-6 rounded-[2rem] font-black text-xl shadow-[0_6px_0_0_#096132] active:translate-y-1 transition-all"
        >
          NOVO JOGO
        </button>
        <button
          onClick={onFinish}
          className="flex-1 bg-gray-200 text-indigo-900 px-10 py-6 rounded-[2rem] font-black text-xl shadow-[0_6px_0_0_#cbd5e0] active:translate-y-1 transition-all"
        >
          SAIR
        </button>
      </div>
    </div>
  </div>
);
