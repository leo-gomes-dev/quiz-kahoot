import React from "react";

interface TimerBarProps {
  duration: number;
  timeLeft: number;
  paused: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  duration,
  timeLeft,
  paused,
}) => {
  // Evita divisão por zero e garante que a barra reflita o progresso real
  const safeDuration = duration > 0 ? duration : 10;
  const percentage = (timeLeft / safeDuration) * 100;

  return (
    <div className="w-full mb-6 animate-in fade-in duration-500">
      <div className="flex justify-between mb-2 px-2">
        <span className="font-black text-yellow-400 italic text-[10px] md:text-xs tracking-widest uppercase">
          {paused ? "RESPOSTA ENVIADA" : "TEMPO RESTANTE"}
        </span>
        {/* REMOVIDO: O span com {timeLeft}s que ficava aqui em cima */}
      </div>
      <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeLeft <= 5 ? "bg-red-500 animate-pulse" : "bg-yellow-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
