import React, { useState } from "react";

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
  // Estado para controlar o feedback visual
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    // Volta ao estado original após 2 segundos
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 text-center border-b-[12px] md:border-b-[20px] border-gray-300 max-w-4xl w-full animate-in zoom-in duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-indigo-400 font-black uppercase tracking-[0.3em] mb-4 text-lg md:text-2xl italic">
          {copied ? "Copiado com sucesso! ✅" : "Entre no Jogo! 🎮"}
        </p>

        <h2
          className={`md:text-[10rem] text-[3.5rem] leading-none font-black tracking-tighter mb-10 select-all cursor-pointer transition-all active:opacity-70 ${
            copied
              ? "text-green-500 scale-105"
              : "text-indigo-900 hover:scale-105"
          }`}
          onClick={handleCopy}
          title="Clique para copiar"
        >
          {gameCode}
        </h2>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            className={`${
              copied
                ? "bg-green-500 shadow-[0_6px_0_0_#15803d]"
                : "bg-yellow-400 shadow-[0_6px_0_0_#b58900]"
            } text-indigo-900 px-10 py-6 rounded-[2rem] font-black text-xl md:text-2xl active:translate-y-1 transition-all flex items-center justify-center gap-3`}
            onClick={handleCopy}
          >
            <span>{copied ? "✅" : "📋"}</span>
            {copied ? "COPIADO!" : "COPIAR CÓDIGO"}
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
