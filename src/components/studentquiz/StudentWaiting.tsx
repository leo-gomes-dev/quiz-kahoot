import React, { useState, useEffect } from "react";

interface StudentWaitingProps {
  playerName: string;
  gameCode: string;
  isPreparing?: boolean;
  onExit: () => void; // Nova prop obrigatória para o botão sair
}

const FUN_TIPS = [
  "Dica: Respostas rápidas valem mais pontos!",
  "Dica: Fique atento ao cronômetro sincronizado!",
  "Dica: Algumas perguntas valem 2X pontos! ⚡",
  "Dica: O ranking atualiza em tempo real!",
];

export const StudentWaiting: React.FC<StudentWaitingProps> = ({
  playerName,
  gameCode,
  isPreparing = false,
  onExit,
}) => {
  const [dots, setDots] = useState("");
  const [randomTip] = useState(
    () => FUN_TIPS[Math.floor(Math.random() * FUN_TIPS.length)],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-700 ${
        isPreparing ? "bg-[#10ad59]" : "bg-[#46178f]"
      } text-white font-nunito flex flex-col overflow-x-hidden`}
    >
      {/* HEADER INTEGRADO NO TOPO - NÃO FLUTUANTE */}
      <div className="w-full p-4 flex justify-between items-center max-w-4xl mx-auto z-50">
        <button
          onClick={onExit}
          className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase border-b-4 border-red-800 transition-all active:translate-y-1 shadow-lg flex items-center gap-2"
        >
          SAIR 🚪
        </button>
        <span className="bg-black/20 px-4 py-2 rounded-full font-black text-[10px] text-yellow-400 border border-white/10 uppercase">
          SALA: {gameCode}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        {/* ÍCONE DINÂMICO */}
        <div className="relative mb-12 animate-in zoom-in duration-700">
          <div
            className={`relative z-10 w-32 h-32 ${
              isPreparing ? "bg-white text-[#10ad59]" : "bg-yellow-400"
            } rounded-[2.5rem] flex items-center justify-center shadow-xl transition-all duration-500 ${
              isPreparing
                ? "scale-110 shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                : "shadow-[0_12px_0_0_#b58900] animate-bounce"
            }`}
          >
            <span className="text-6xl">{isPreparing ? "🔥" : "🚀"}</span>
          </div>
          <div
            className={`absolute inset-0 ${
              isPreparing ? "bg-white/40" : "bg-yellow-400/30"
            } rounded-full blur-3xl animate-pulse -z-10 scale-150`}
          ></div>
        </div>

        <div className="bg-white rounded-[3.5rem] p-8 md:p-12 w-full max-w-md border-b-[12px] border-gray-300 shadow-2xl text-center">
          <div
            className={`inline-block ${
              isPreparing ? "bg-green-600" : "bg-indigo-600"
            } text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 animate-pulse`}
          >
            {isPreparing ? "Arena Iniciando" : "Conectado"}
          </div>

          <h2
            className={`text-4xl font-black ${
              isPreparing ? "text-green-600" : "text-indigo-900"
            } italic tracking-tighter uppercase mb-2`}
          >
            {isPreparing ? "PREPARE-SE!" : "BOA SORTE!"}
          </h2>

          <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-gray-100 mb-6 mt-4">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
              Jogador:
            </p>
            <p className="text-3xl text-indigo-900 font-black uppercase tracking-tight">
              {playerName || "Viajante"}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p
              className={`${
                isPreparing
                  ? "text-green-700 animate-bounce"
                  : "text-indigo-950"
              } font-black italic text-xl uppercase leading-none`}
            >
              {isPreparing
                ? "A PARTIDA VAI COMEÇAR!"
                : `Aguardando o Professor${dots}`}
            </p>
          </div>
        </div>

        {!isPreparing && (
          <div className="mt-10 bg-black/30 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/10 max-w-sm animate-in fade-in">
            <div className="flex items-start gap-4 text-left">
              <span className="text-2xl flex-shrink-0">💡</span>
              <p className="text-sm text-indigo-100 font-bold leading-snug">
                {randomTip}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
