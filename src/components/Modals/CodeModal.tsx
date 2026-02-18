import React from "react";

interface CodeModalProps {
  gameCode: string;
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({
  gameCode,
  isOpen,
  onClose,
  onCopy,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 text-center border-b-[12px] md:border-b-[20px] border-gray-300 max-w-4xl w-full animate-in zoom-in duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar dentro
      >
        <p className="text-indigo-400 font-black uppercase tracking-[0.3em] mb-4 text-lg md:text-2xl italic">
          Entre no Jogo! 🎮
        </p>

        <h2
          className="md:text-[10rem] text-[3.5rem] leading-none font-black text-indigo-900 tracking-tighter mb-10 select-all cursor-pointer hover:scale-105 transition-transform active:opacity-70"
          onClick={onCopy}
          title="Clique para copiar"
        >
          {gameCode}
        </h2>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            className="bg-yellow-400 text-indigo-900 px-10 py-6 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_6px_0_0_#b58900] active:translate-y-1 transition-all flex items-center justify-center gap-3"
            onClick={onCopy}
          >
            <span>📋</span> COPIAR CÓDIGO
          </button>
          <button
            className="bg-[#e21b3c] text-white px-10 py-6 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_6px_0_0_#a0132b] active:translate-y-1 transition-all"
            onClick={onClose}
          >
            FECHAR [X]
          </button>
        </div>
      </div>
    </div>
  );
};
