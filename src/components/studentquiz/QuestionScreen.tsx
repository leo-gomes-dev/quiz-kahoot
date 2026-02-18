import React, { useState } from "react"; // Mudamos para useState
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
  onExitClick: () => void;
  duration: number;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  playerScore,
  gameCode,
  answered,
  isCorrect,
  selectedChoice,
  onAnswer,
  timeLeft,
  onExitClick,
}) => {
  // Inicializamos a duração total apenas uma vez quando o componente monta.
  // Isso define o "100%" da barra de progresso.
  const [totalDuration] = useState<number>(timeLeft ?? 25);

  const correctOptionText =
    question.options[question.correctOption as keyof typeof question.options];

  return (
    <div className="p-6 pb-32 max-w-3xl mx-auto w-full flex-1 animate-in fade-in">
      {/* HEADER INTEGRADO */}
      <div className="flex justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onExitClick}
            className="bg-red-600 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase border-b-4 border-red-800 transition-all active:translate-y-1 shadow-lg"
          >
            SAIR 🚪
          </button>
          <span className="bg-black/20 px-4 py-2 rounded-full font-black text-[10px] text-yellow-400 border border-white/10 uppercase">
            SALA: {gameCode}
          </span>
        </div>

        {!answered && timeLeft !== null && (
          <div className="bg-yellow-400 text-indigo-900 px-4 py-1 rounded-full font-black text-xl border-b-4 border-yellow-600 animate-pulse shadow-md">
            ⏱️ {timeLeft}s
          </div>
        )}

        <span className="bg-white/10 px-6 py-2 rounded-full font-black text-xl border-b-4 border-black/20">
          {playerScore} PTS
        </span>
      </div>

      {/* BARRA DE TEMPO SINCRONIZADA */}
      {!answered ? (
        <TimerBar
          duration={totalDuration} // Agora usamos o estado estável
          timeLeft={timeLeft ?? 0}
          paused={answered}
        />
      ) : (
        <div className="h-2 w-full bg-white/5 rounded-full mb-8" />
      )}

      {/* CARD DA PERGUNTA */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] mb-8 border-b-8 border-gray-300 shadow-2xl relative">
        {question.isDouble && (
          <span className="absolute -top-4 -right-4 bg-pink-500 text-white px-4 py-1 rounded-xl font-black text-xs rotate-12 animate-pulse shadow-lg">
            ⚡ 2X
          </span>
        )}
        <h2 className="text-2xl md:text-3xl font-black text-center text-indigo-900 italic leading-tight">
          "{question.text}"
        </h2>
      </div>

      {/* OPÇÕES OU RESULTADO */}
      {!answered ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(question.options).map(([key, val]) => (
            <button
              key={key}
              onClick={() => onAnswer(key)}
              className="p-6 md:p-8 rounded-[2rem] bg-white text-indigo-900 border-gray-300 font-black text-left text-lg md:text-xl transition-all border-b-8 shadow-xl active:translate-y-1 hover:bg-gray-100"
            >
              <span className="flex items-center gap-4">
                <span className="bg-black/10 w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {key.toUpperCase()}
                </span>
                <span className="leading-tight">{val}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div
          className={`p-10 rounded-[3rem] text-center border-b-8 shadow-2xl ${
            selectedChoice === "timeout"
              ? "bg-orange-500 border-orange-700"
              : isCorrect
                ? "bg-[#10ad59] border-[#096132]"
                : "bg-[#e21b3c] border-[#a0132b]"
          }`}
        >
          <div className="text-6xl mb-4">
            {selectedChoice === "timeout" ? "⏰" : isCorrect ? "✨" : "❌"}
          </div>
          <p className="text-3xl font-black uppercase text-white">
            {selectedChoice === "timeout"
              ? "TEMPO ESGOTADO!"
              : isCorrect
                ? "MANDOU BEM!"
                : "OPS! ERROU..."}
          </p>
          <div className="mt-6 p-5 bg-black/20 rounded-[2rem] inline-block border border-white/10 w-full max-w-sm text-white">
            <p className="text-[10px] font-black uppercase opacity-60 mb-2">
              Resposta Correta:
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="bg-yellow-400 text-indigo-900 w-10 h-10 rounded-full flex items-center justify-center font-black">
                {question.correctOption.toUpperCase()}
              </span>
              <p className="text-lg font-black uppercase leading-tight">
                {correctOptionText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
