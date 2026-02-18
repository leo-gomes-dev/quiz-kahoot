import React, { useState } from "react";
import { TimerBar } from "./TimerBar";
import type { Question } from "../../types/game";

interface QuestionScreenProps {
  question: Question;
  gameCode: string;
  playerScore: number;
  answered: boolean;
  isCorrect: boolean | null;
  selectedChoice: string | null;
  onAnswer: (choice: string) => void;
  timeLeft: number | null;
  // onExitClick removido pois o Header principal já cuida disso
  duration: number;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  playerScore,
  answered,
  isCorrect,
  selectedChoice,
  onAnswer,
  timeLeft,
}) => {
  const [totalDuration] = useState<number>(timeLeft ?? 25);

  const correctOptionText =
    question.options[question.correctOption as keyof typeof question.options];

  return (
    <div className="p-4 pb-32 max-w-3xl mx-auto w-full flex-1 animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER DA QUESTÃO (Limpamos o Sair e o PIN daqui, pois já estão no topo) */}
      <div className="flex justify-between items-end mb-4 px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-purple-300 tracking-widest opacity-70">
            Sua Pontuação
          </span>
          <span className="text-2xl font-black text-white drop-shadow-md">
            {playerScore.toLocaleString()}{" "}
            <span className="text-xs opacity-50">PTS</span>
          </span>
        </div>

        {!answered && timeLeft !== null && (
          <div className="bg-yellow-400 text-indigo-900 px-6 py-2 rounded-2xl font-black text-2xl border-b-4 border-yellow-600 animate-pulse shadow-xl flex items-center gap-2">
            <span className="text-sm">⏱️</span> {timeLeft}s
          </div>
        )}
      </div>

      {/* BARRA DE TEMPO */}
      {!answered ? (
        <div className="mb-8">
          <TimerBar
            duration={totalDuration}
            timeLeft={timeLeft ?? 0}
            paused={answered}
          />
        </div>
      ) : (
        <div className="h-2 w-full bg-white/5 rounded-full mb-8" />
      )}

      {/* CARD DA PERGUNTA */}
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] mb-8 border-b-[10px] border-gray-300 shadow-2xl relative overflow-hidden">
        {question.isDouble && (
          <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500 to-purple-600 text-white px-6 py-2 rounded-bl-3xl font-black text-sm animate-pulse shadow-lg">
            ⚡ PONTOS DUPLOS
          </div>
        )}
        <h2 className="text-2xl md:text-4xl font-black text-center text-indigo-900 italic leading-tight">
          {question.text}
        </h2>
      </div>

      {/* OPÇÕES OU RESULTADO */}
      {!answered ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(question.options).map(([key, val]) => (
            <button
              key={key}
              onClick={() => onAnswer(key)}
              className="group p-6 md:p-8 rounded-[2rem] bg-white text-indigo-900 border-gray-300 font-black text-left text-lg md:text-xl transition-all border-b-8 shadow-xl active:translate-y-1 active:border-b-0 hover:bg-purple-50"
            >
              <div className="flex items-center gap-4">
                <span className="bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 transition-colors">
                  {key.toUpperCase()}
                </span>
                <span className="leading-tight">{val}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div
          className={`p-10 rounded-[3rem] text-center border-b-8 shadow-2xl animate-in zoom-in-95 duration-300 ${
            selectedChoice === "timeout"
              ? "bg-orange-500 border-orange-700"
              : isCorrect
                ? "bg-[#10ad59] border-[#096132]"
                : "bg-[#e21b3c] border-[#a0132b]"
          }`}
        >
          <div className="text-7xl mb-4 drop-shadow-lg">
            {selectedChoice === "timeout" ? "⏰" : isCorrect ? "✅" : "❌"}
          </div>
          <h3 className="text-4xl font-black uppercase text-white mb-6">
            {selectedChoice === "timeout"
              ? "ACABOU O TEMPO!"
              : isCorrect
                ? "EXCELENTE!"
                : "FOI QUASE!"}
          </h3>

          <div className="p-6 bg-black/20 rounded-[2rem] border border-white/10 w-full max-w-sm mx-auto text-white">
            <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">
              Gabarito:
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="bg-yellow-400 text-indigo-900 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                {question.correctOption.toUpperCase()}
              </span>
              <p className="text-xl font-black uppercase leading-tight text-left">
                {correctOptionText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
