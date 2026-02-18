import React from "react";

interface GameOverScreenProps {
  playerName: string;
  gameCode: string;
  playerScore: number;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  playerName,
  gameCode,
  playerScore,
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in bounce-in duration-700">
      <div className="bg-white text-indigo-900 p-10 rounded-[3rem] shadow-2xl border-b-8 border-gray-300 max-w-md w-full">
        <span className="text-7xl mb-4 block animate-bounce">🏆</span>
        <h2 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">
          Fim de Jogo!
        </h2>
        <p className="text-indigo-500 font-bold mb-4">
          Parabéns, {playerName}!
        </p>

        <div className="bg-indigo-50 py-4 px-6 rounded-2xl mb-8 border-2 border-indigo-100">
          <p className="text-gray-400 text-[10px] font-black uppercase">
            Sua Pontuação Final
          </p>
          <p className="text-4xl font-black text-indigo-900">
            {playerScore} PTS
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleReload}
            className="w-full py-5 bg-[#10ad59] text-white rounded-2xl font-black text-xl shadow-[0_5px_0_0_#096132] active:translate-y-1 transition-all uppercase"
          >
            🎮 NOVA PARTIDA
          </button>

          <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">
            SALA ENCERRADA: {gameCode}
          </p>
        </div>
      </div>
    </div>
  );
};
