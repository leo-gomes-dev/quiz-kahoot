import React from "react";
import type { LeaderboardEntry } from "./../../types/game";

interface PodiumStepProps {
  player: string;
  points: number;
  position: 1 | 2 | 3;
}

const PodiumStep: React.FC<PodiumStepProps> = ({
  player,
  points,
  position,
}) => {
  const configs = {
    1: {
      color: "bg-gradient-to-b from-yellow-300 to-yellow-500",
      border: "border-yellow-600",
      h: "h-56 md:h-72",
      icon: "👑",
      medal: "🥇",
      delay: "delay-[200ms]",
      size: "w-[40%]",
      glow: "shadow-[0_0_50px_rgba(234,179,8,0.4)]",
    },
    2: {
      color: "bg-gradient-to-b from-slate-200 to-slate-400",
      border: "border-slate-500",
      h: "h-40 md:h-52",
      icon: "🥈",
      medal: "🥈",
      delay: "delay-0",
      size: "w-[30%]",
      glow: "",
    },
    3: {
      color: "bg-gradient-to-b from-orange-300 to-orange-500",
      border: "border-orange-600",
      h: "h-28 md:h-40",
      icon: "🥉",
      medal: "🥉",
      delay: "delay-[400ms]",
      size: "w-[30%]",
      glow: "",
    },
  };

  const { color, border, h, icon, delay, size, glow, medal } =
    configs[position];

  return (
    <div
      className={`flex flex-col items-center self-end ${size} animate-in slide-in-from-bottom-full duration-1000 ${delay}`}
    >
      {/* NOME E MEDALHA FLUTUANTE */}
      <div
        className={`flex flex-col items-center mb-4 ${position === 1 ? "animate-bounce" : ""}`}
      >
        <span className="text-4xl md:text-6xl mb-1">{icon}</span>
        <div className="bg-black/80 backdrop-blur-sm px-4 py-1 rounded-full border border-white/20 shadow-xl max-w-full">
          <p className="text-[10px] md:text-sm font-black text-white uppercase truncate text-center tracking-tighter">
            {player}
          </p>
        </div>
      </div>

      {/* BLOCO DO PÓDIO */}
      <div
        className={`relative ${color} w-full ${h} rounded-t-3xl border-x-4 border-t-4 ${border} ${glow} flex flex-col items-center justify-start pt-6 overflow-hidden`}
      >
        {/* REFLEXO DE BRILHO */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 -skew-y-12 translate-y-[-50%]"></div>

        <span className="text-4xl md:text-7xl font-black text-black/20 absolute bottom-4 select-none">
          {position}º
        </span>

        <div className="z-10 flex flex-col items-center">
          <span className="text-2xl md:text-4xl mb-1">{medal}</span>
          <div className="bg-black/10 px-3 py-1 rounded-lg backdrop-blur-sm">
            <span className="font-black text-xs md:text-xl text-black/70">
              {points.toLocaleString()}{" "}
              <span className="text-[8px] md:text-xs uppercase">pts</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Podium: React.FC<{
  winners: LeaderboardEntry[];
  onReset: () => void;
  onFinish: () => void;
}> = ({ winners, onReset, onFinish }) => (
  <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-4 font-nunito overflow-hidden relative">
    {/* EFEITOS DE FUNDO */}
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>

    <div className="w-full max-w-5xl flex flex-col items-center z-10">
      {/* TÍTULO IMPACTANTE */}
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
        <div className="inline-block bg-yellow-400 text-yellow-900 px-6 py-1 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-4 shadow-xl">
          Partida Finalizada
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_8px_0_rgba(0,0,0,0.2)]">
          Pódio Final <span className="text-yellow-400">🏆</span>
        </h1>
      </div>

      {/* ÁREA DO PÓDIO */}
      <div className="w-full flex items-end justify-center gap-1 md:gap-4 mb-16 h-[400px] md:h-[550px] px-2">
        {/* 2º Lugar */}
        {winners.length >= 2 && (
          <PodiumStep
            player={winners[1].player_name}
            points={winners[1].score}
            position={2}
          />
        )}

        {/* 1º Lugar */}
        {winners.length >= 1 ? (
          <PodiumStep
            player={winners[0].player_name}
            points={winners[0].score}
            position={1}
          />
        ) : (
          <div className="text-white/20 font-black italic text-2xl animate-pulse">
            Sem jogadores no ranking...
          </div>
        )}

        {/* 3º Lugar */}
        {winners.length >= 3 && (
          <PodiumStep
            player={winners[2].player_name}
            points={winners[2].score}
            position={3}
          />
        )}
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-700">
        <button
          onClick={onReset}
          className="group flex-1 bg-[#10ad59] hover:bg-[#0d8c48] text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-[0_8px_0_0_#096132] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
        >
          <span>🔄</span> RECOMEÇAR
        </button>
        <button
          onClick={onFinish}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-6 rounded-[2.5rem] font-black text-2xl border-2 border-white/10 backdrop-blur-md transition-all flex items-center justify-center gap-3"
        >
          <span>🚪</span> SAIR
        </button>
      </div>
    </div>
  </div>
);
