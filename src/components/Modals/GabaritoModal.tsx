import React from "react";
import type { Question } from "./../../types/game";

interface GabaritoModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GabaritoModal: React.FC<GabaritoModalProps> = ({
  question,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-indigo-950/90 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl border-b-8 border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-indigo-900 uppercase italic">
            Gabarito da Questão 👁️‍🗨️
          </h3>
        </div>

        <p className="text-gray-600 font-bold mb-8 text-lg leading-tight italic">
          "{question.text}"
        </p>

        <div className="grid gap-3 mb-8">
          {Object.entries(question.options).map(([key, value]) => {
            const isCorrect =
              key.toLowerCase() === question.correctOption.toLowerCase();

            return (
              <div
                key={key}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  isCorrect
                    ? "border-green-500 bg-green-50 shadow-[0_4px_0_0_#22c55e]"
                    : "border-gray-100 bg-gray-50 opacity-60"
                }`}
              >
                <span
                  className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg
                  ${isCorrect ? "bg-green-500 text-white" : "bg-gray-300 text-white"}
                `}
                >
                  {key.toUpperCase()}
                </span>
                <span
                  className={`font-bold text-lg ${isCorrect ? "text-green-700" : "text-gray-400"}`}
                >
                  {value}
                </span>
                {isCorrect && (
                  <span className="ml-auto text-green-500 text-2xl">✅</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          className="w-full py-5 bg-indigo-900 text-white rounded-2xl font-black text-xl shadow-[0_6px_0_0_#1e1b4b] active:translate-y-1 transition-all uppercase"
          onClick={onClose}
        >
          FECHAR CONFERÊNCIA
        </button>
      </div>
    </div>
  );
};
