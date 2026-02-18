import React, { useState, useEffect } from "react";

interface StudentWaitingProps {
  playerName: string;
  gameCode: string;
  isPreparing?: boolean;
}

const FUN_TIPS = [
  "Dica: Respostas rápidas valem mais pontos!",
  "Dica: Fique atento ao cronômetro sincronizado!",
  "Dica: Algumas perguntas valem 2X pontos! ⚡",
  "Dica: O ranking atualiza em tempo real!",
];

export const StudentWaiting: React.FC<StudentWaitingProps> = ({
  playerName,
  isPreparing = false,
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
    <div className="flex flex-col items-center justify-center w-full animate-in fade-in zoom-in duration-500">
      {/* STATUS INDICATOR - Texto pulsante acima do ícone */}
      <div className="mb-4">
        <span
          className={`text-xs font-black uppercase tracking-[0.3em] ${isPreparing ? "text-green-400" : "text-purple-300"}`}
        >
          {isPreparing ? "🔥 O Jogo vai começar" : "⏳ No aguardo"}
        </span>
      </div>

      {/* ÍCONE DINÂMICO */}
      <div className="relative mb-8">
        <div
          className={`relative z-10 w-28 h-28 ${
            isPreparing
              ? "bg-green-500 text-white rotate-[360deg]"
              : "bg-yellow-400 text-indigo-900"
          } rounded-[2.5rem] flex items-center justify-center shadow-xl transition-all duration-700 ease-in-out ${
            isPreparing
              ? "scale-125 shadow-[0_0_50px_rgba(34,197,94,0.5)]"
              : "shadow-[0_8px_0_0_#b58900] animate-bounce"
          }`}
        >
          <span className="text-5xl">{isPreparing ? "🏁" : "🚀"}</span>
        </div>
        <div
          className={`absolute inset-0 ${isPreparing ? "bg-green-400/40" : "bg-yellow-400/20"} rounded-full blur-3xl animate-pulse -z-10 scale-150`}
        ></div>
      </div>

      {/* CARD CENTRAL */}
      <div
        className={`bg-white rounded-[3rem] p-8 w-full max-w-sm border-b-[12px] transition-colors duration-500 shadow-2xl text-center ${
          isPreparing ? "border-green-600" : "border-gray-300"
        }`}
      >
        <div
          className={`inline-block ${isPreparing ? "bg-green-600" : "bg-indigo-600"} text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 animate-pulse`}
        >
          {isPreparing ? "Iniciando Partida" : "Conectado com Sucesso"}
        </div>

        <h2
          className={`text-4xl font-black ${isPreparing ? "text-green-600" : "text-indigo-900"} italic tracking-tighter uppercase mb-2`}
        >
          {isPreparing ? "OLHO NA TELA!" : "BOA SORTE!"}
        </h2>

        {/* FEEDBACK PARA O ALUNO */}
        <div
          className={`p-5 rounded-[2rem] border-2 mb-6 mt-4 transition-all ${
            isPreparing
              ? "bg-green-50 border-green-100"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">
            Jogador:
          </p>
          <p
            className={`text-2xl font-black uppercase tracking-tight ${isPreparing ? "text-green-700" : "text-indigo-900"}`}
          >
            {playerName}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p
            className={`${isPreparing ? "text-green-800 scale-110" : "text-indigo-950"} font-black italic text-xl uppercase leading-none transition-transform`}
          >
            {isPreparing
              ? "A QUESTÃO VAI APARECER!"
              : `Aguardando Professor${dots}`}
          </p>
        </div>
      </div>

      {/* DICA - Escondemos a dica quando vai começar para focar na partida */}
      {!isPreparing && (
        <div className="mt-8 bg-black/30 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 max-w-xs animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-4 text-left">
            <span className="text-2xl">💡</span>
            <p className="text-sm text-indigo-100 font-bold leading-snug">
              {randomTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
