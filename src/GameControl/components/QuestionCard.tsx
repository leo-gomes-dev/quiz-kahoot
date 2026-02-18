import React from "react";
import type { Question } from "./../types/game";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  onNext: () => void;
  isLast: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onNext,
  isLast,
}) => (
  <div className="bg-white text-indigo-900 p-6 md:p-10 rounded-[3rem] border-b-8 border-gray-300 shadow-2xl relative animate-in fade-in duration-500">
    {question.isDouble && (
      <div className="absolute -top-4 -right-4 bg-yellow-400 text-indigo-900 px-6 py-2 rounded-2xl font-black text-xs shadow-lg animate-pulse rotate-12 z-10">
        ⚡ 2X
      </div>
    )}
    <h2 className="text-2xl md:text-4xl font-black mb-10 leading-tight text-center italic">
      "{question.text}"
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
      {Object.entries(question.options).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center gap-4 p-5 rounded-3xl border-2 border-indigo-50 bg-indigo-50/30"
        >
          {/* ADICIONADO flex-shrink-0 PARA O BADGE NÃO ESPREMER */}
          <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
            {key.toUpperCase()}
          </span>
          <span className="font-bold text-xl text-indigo-900 leading-tight">
            {value}
          </span>
        </div>
      ))}
    </div>
    <button
      onClick={onNext}
      className={`w-full py-8 text-white rounded-[2rem] font-black text-2xl md:text-3xl uppercase transition-all shadow-lg active:translate-y-1 ${isLast ? "bg-pink-500 shadow-[#9d174d]" : "bg-[#10ad59] shadow-[#096132]"}`}
    >
      {isLast ? "VER PÓDIO FINAL 🏆" : "PRÓXIMA PERGUNTA →"}
    </button>
  </div>
);
