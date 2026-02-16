import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import confetti from "canvas-confetti";
// import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// --- INTERFACES ---
interface LeaderboardEntry {
  player_name: string;
  score: number;
  game_code: string;
}

interface Question {
  id: string;
  text: string;
  options: { a: string; b: string; c: string; d: string };
  correctOption: string;
  isDouble: boolean;
}

interface GameControlProps {
  questions: Question[];
  gameCode: string;
  onFinish: () => Promise<void> | void;
  onReset: () => void;
}

export default function GameControl({
  questions,
  gameCode,
  onFinish,
  onReset,
}: GameControlProps) {
  const [index, setIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  const [isRankingMode, setIsRankingMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showGabaritoModal, setShowGabaritoModal] = useState(false);
  const [exitStage, setExitStage] = useState(false);

  const handleExit = () => {
    if (!exitStage) {
      // Primeiro clique: Ativa o modo de segurança
      setExitStage(true);
      setToast("Clique novamente em SAIR para confirmar! 🚪");

      // Se o professor não clicar de novo em 4 segundos, reseta a segurança
      setTimeout(() => {
        setExitStage(false);
        setToast(null);
      }, 4000);
    } else {
      // Segundo clique: Sai de verdade
      setToast("Saindo da sala...");
      setTimeout(() => {
        onFinish(); // Volta para a home
      }, 1000);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameCode);
    setToast("Código copiado! 📋");

    // Esconde o toast após 3 segundos
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRanking = useCallback(async () => {
    const { data } = await supabase
      .from("leaderboard")
      .select("player_name, score, game_code")
      .eq("game_code", gameCode)
      .order("score", { ascending: false });

    if (data) setLeaderboard(data as LeaderboardEntry[]);
  }, [gameCode]);

  useEffect(() => {
    const channel = supabase
      .channel(`ranking-sync-${gameCode}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Escuta INSERT e UPDATE (pontos novos)
          schema: "public",
          table: "leaderboard",
          filter: `game_code=eq.${gameCode}`,
        },
        () => {
          fetchRanking(); // Recarrega a lista do professor em tempo real
        },
      )
      .subscribe();

    fetchRanking();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode, fetchRanking]);

  const fireConfetti = (): void => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    const randomInRange = (min: number, max: number): number =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      // 1. Finaliza o status do jogo
      await supabase
        .from("game_status")
        .update({ status: "finished" })
        .eq("game_code", gameCode);

      // 2. BUSCA O RANKING ATUALIZADO (Isso garante que pegamos as somas mais recentes)
      const { data: finalRanking } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("game_code", gameCode)
        .order("score", { ascending: false });

      if (finalRanking) {
        setLeaderboard(finalRanking); // Atualiza o estado com as somas reais
      }

      setToast("Partida finalizada com sucesso! 🏆");
      fireConfetti();

      // 3. O delay de 1s ajuda a garantir que a transição visual seja fluida
      setTimeout(() => {
        setToast(null);
        setShowPodium(true);
      }, 1000);
    } catch (err) {
      console.error("Erro ao finalizar:", err);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleShowRanking = async (): Promise<void> => {
    const { error } = await supabase
      .from("game_status")
      .update({ status: "ranking" })
      .eq("game_code", gameCode);

    if (error) {
      console.error("Erro ao mudar status:", error.message);
      return;
    }

    const { data, error: rankError } = await supabase
      .from("leaderboard")
      .select("player_name, score, game_code")
      .eq("game_code", gameCode)
      .order("score", { ascending: false })
      .limit(5);

    if (rankError) {
      console.error("Erro ao buscar ranking:", rankError.message);
      return;
    }

    // Garante que o estado receba os dados ou um array vazio
    setLeaderboard((data as LeaderboardEntry[]) || []);
    setIsRankingMode(true);
  };

  const handleNextQuestion = async () => {
    const nextIndex = index + 1;
    // Primeiro, mostramos o ranking (isso avisa os alunos)
    // Depois, ao clicar em avançar no ranking, enviamos o novo index
    await supabase
      .from("game_status")
      .update({
        current_question_index: nextIndex,
        status: "playing",
      })
      .eq("game_code", gameCode);

    setIndex(nextIndex);
    setIsRankingMode(false);
  };

  const currentQ = questions[index];
  const getCorrectText = () => {
    if (!currentQ || !currentQ.correctOption) return "";
    const key = currentQ.correctOption.toLowerCase() as "a" | "b" | "c" | "d";
    return currentQ.options[key] || "";
  };

  // --- RENDER PÓDIO FINAL ---

  if (showPodium)
    return (
      <div className="min-h-screen bg-[#46178f] flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-1000 font-nunito overflow-hidden">
        <div className="w-full max-w-4xl bg-white rounded-[3rem] md:rounded-[5rem] p-8 md:p-16 border-b-[12px] border-gray-300 text-center shadow-2xl relative z-10">
          <div className="text-6xl md:text-8xl mb-6 animate-bounce">🏆</div>
          <h1 className="text-5xl md:text-7xl font-black text-indigo-900 mb-2 italic tracking-tighter uppercase">
            Pódio Final
          </h1>
          {/* <span className="text-xs md:text-xl font-black uppercase truncate w-full block text-indigo-900 px-2">
            {leaderboard[0]?.player_name}
          </span> */}

          {/* VERIFICAÇÃO DE FALLBACK: PÓDIO VAZIO */}
          {!leaderboard || leaderboard.length === 0 ? (
            <div className="py-20 animate-in zoom-in duration-500">
              <p className="text-2xl font-black text-indigo-900/30 uppercase italic">
                Nenhum jogador pontuou nesta partida... 🧐
              </p>
              <div className="w-20 h-1 bg-indigo-50 mx-auto mt-4 rounded-full" />
            </div>
          ) : (
            <div className="flex items-end justify-center gap-2 md:gap-6 mb-16 h-64 md:h-80">
              {/* 2º LUGAR - CORRIGIDO ÍNDICE PARA [1] */}
              {leaderboard && leaderboard.length >= 2 && (
                <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom duration-700 delay-300">
                  <span className="text-xs md:text-sm font-black uppercase truncate w-full block text-indigo-400 px-2 text-center">
                    {leaderboard[1]?.player_name}
                  </span>
                  <div className="bg-slate-300 w-full h-32 md:h-40 rounded-t-[2rem] border-b-8 border-slate-400 flex flex-col items-center justify-center shadow-lg relative">
                    <span className="text-3xl md:text-5xl">🥈</span>
                    <span className="font-black text-slate-600 text-[10px] md:text-lg mt-2">
                      {leaderboard[1]?.score} pts
                    </span>
                  </div>
                </div>
              )}

              {/* 1º LUGAR - SEMPRE CENTRALIZADO */}
              {leaderboard && leaderboard.length >= 1 && (
                <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom duration-1000">
                  <div className="relative mb-2 w-full text-center">
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl animate-pulse">
                      👑
                    </span>
                    <span className="text-xs md:text-xl font-black uppercase truncate w-full block text-indigo-900 px-2">
                      {leaderboard[0]?.player_name}
                    </span>
                  </div>
                  <div className="bg-yellow-400 w-full h-48 md:h-64 rounded-t-[2rem] border-b-8 border-yellow-600 flex flex-col items-center justify-center shadow-2xl relative">
                    <span className="text-5xl md:text-7xl">🥇</span>
                    <span className="font-black text-yellow-800 text-sm md:text-2xl mt-2">
                      {leaderboard[0]?.score} pts
                    </span>
                  </div>
                </div>
              )}

              {/* 3º LUGAR - CORRIGIDO ÍNDICE PARA [2] */}
              {leaderboard && leaderboard.length >= 3 && (
                <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom duration-700 delay-500">
                  <span className="text-[10px] md:text-sm font-black mb-2 uppercase truncate w-full px-2 text-indigo-400 text-center">
                    {leaderboard[2]?.player_name}
                  </span>
                  <div className="bg-orange-300 w-full h-24 md:h-28 rounded-t-[2rem] border-b-8 border-orange-400 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-2xl md:text-4xl">🥉</span>
                    <span className="font-black text-orange-700 text-[10px] md:text-lg mt-1">
                      {leaderboard[2]?.score} pts
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BOTÕES DE AÇÃO SEMPRE VISÍVEIS */}
          <div className="flex flex-col md:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <button
              onClick={onReset}
              className="flex-1 bg-[#10ad59] hover:scale-105 text-white px-10 py-6 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_6px_0_0_#096132] active:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <span>📝</span> NOVO JOGO
            </button>
            <button
              onClick={onFinish}
              className="flex-1 bg-gray-200 hover:scale-105 text-indigo-900 px-10 py-6 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_6px_0_0_#cbd5e0] active:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <span>🚪</span> SAIR
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col relative overflow-x-hidden">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-300">
          <div className="bg-[#10ad59] text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 border-b-4 border-[#096132]">
            <span className="text-xl">✨</span>
            {toast}
          </div>
        </div>
      )}

      {/* MODAL GIGANTE DO CÓDIGO */}
      {showCodeModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setShowCodeModal(false)}
        >
          <div
            className="bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 text-center border-b-[12px] md:border-b-[20px] border-gray-300 max-w-4xl w-full animate-in zoom-in duration-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-indigo-400 font-black uppercase tracking-[0.3em] mb-4 text-lg md:text-2xl italic">
              Entre no Jogo!
            </p>
            <h2
              className="md:text-[10rem] text-[3.5rem] leading-none font-black text-indigo-900 tracking-tighter mb-10 select-all cursor-pointer hover:scale-105 transition-transform"
              onClick={copyToClipboard}
            >
              {gameCode}
            </h2>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                className="bg-yellow-400 text-indigo-900 px-10 py-6 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_6px_0_0_#b58900] active:translate-y-1 transition-all flex items-center justify-center gap-3"
                onClick={copyToClipboard}
              >
                <span>📋</span> COPIAR CÓDIGO
              </button>
              <button
                className="bg-[#e21b3c] text-white px-10 py-6 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_6px_0_0_#a0132b] active:translate-y-1 transition-all"
                onClick={() => setShowCodeModal(false)}
              >
                FECHAR [X]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GABARITO */}
      {showGabaritoModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowGabaritoModal(false)}
        >
          <div
            className="bg-white rounded-[3rem] p-10 max-w-lg w-full border-b-[12px] border-gray-300 animate-in zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-3xl font-black text-indigo-900 text-center mb-2 italic">
              GABARITO 🔑
            </h3>

            {/* ADICIONE ISSO AQUI PARA USAR A FUNÇÃO E SUMIR O ERRO: */}
            <p className="text-center text-green-600 font-black uppercase text-xs mb-8 tracking-widest">
              CORRETA: {currentQ?.correctOption} - {getCorrectText()}
            </p>

            <div className="space-y-4 mb-8">
              {currentQ?.options &&
                Object.entries(currentQ.options).map(([key, value]) => {
                  const isCorrect =
                    currentQ.correctOption?.toLowerCase() === key.toLowerCase();
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${
                        isCorrect
                          ? "bg-green-50 border-green-500 shadow-md"
                          : "bg-gray-50 border-gray-100 opacity-40"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${isCorrect ? "bg-green-500 text-white" : "bg-gray-300 text-white"}`}
                      >
                        {key.toUpperCase()}
                      </span>
                      <span
                        className={`font-bold ${isCorrect ? "text-green-700" : "text-gray-400"}`}
                      >
                        {value}
                      </span>
                    </div>
                  );
                })}
            </div>
            <button
              className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-black shadow-[0_4px_0_0_#1e1b4b] active:translate-y-1 transition-all"
              onClick={() => setShowGabaritoModal(false)}
            >
              FECHAR [X]
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 flex flex-col items-center pb-32">
        <div className="w-full max-w-3xl">
          {/* HEADER */}
          <header className="flex flex-wrap justify-between items-center mb-10 bg-white/10 p-4 md:p-6 rounded-3xl border-b-4 border-black/20 w-full gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCodeModal(true)}
                className="bg-yellow-400 text-indigo-900 px-3 py-2 rounded-xl font-black text-[10px] md:text-xs shadow-[0_4px_0_0_#b58900] active:translate-y-1 transition-all"
              >
                📺 SALA
              </button>
              <button
                onClick={async () => {
                  if (isRankingMode) {
                    await supabase
                      .from("game_status")
                      .update({ status: "playing" })
                      .eq("game_code", gameCode);
                    setIsRankingMode(false);
                  } else {
                    handleShowRanking();
                  }
                }}
                className={`px-3 py-2 rounded-xl font-black text-[10px] md:text-xs transition-all flex items-center gap-1 ${isRankingMode ? "bg-indigo-600 text-white shadow-none translate-y-1" : "bg-yellow-400 text-indigo-900 shadow-[0_4px_0_0_#b58900]"}`}
              >
                <span>📊</span> {isRankingMode ? "VOLTAR" : "RANKING"}
              </button>
            </div>

            <div className="flex items-center order-3 md:order-2 w-full md:w-auto justify-center">
              <button
                onClick={() => setShowGabaritoModal(true)}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 px-6 py-2 rounded-xl border border-yellow-400/30 transition-all"
              >
                <span className="text-lg">👁️‍🗨️</span>
                <span className="text-[10px] md:text-xs font-black text-yellow-400 uppercase tracking-widest">
                  Ver Gabarito
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 order-2 md:order-3 ml-auto md:ml-0">
              <div className="text-right mr-2">
                <p className="text-[9px] font-black opacity-40 uppercase leading-none">
                  Questão
                </p>
                <p className="text-xs font-black">
                  {index + 1}/{questions.length}
                </p>
              </div>
              <button
                onClick={handleExit}
                className={`px-3 py-2 rounded-xl font-black text-[10px] md:text-xs transition-all shadow-[0_4px_0_0_#a0132b] active:translate-y-1
    ${
      exitStage
        ? "bg-yellow-400 text-indigo-900 animate-pulse" // Cor de alerta no 1º clique
        : "bg-[#e21b3c] text-white" // Cor padrão
    }
  `}
              >
                {exitStage ? "CONFIRMAR?" : "SAIR"}
              </button>
            </div>
          </header>

          {/* CONTEÚDO */}
          {isRankingMode ? (
            <div className="bg-white text-indigo-900 p-10 rounded-[3rem] border-b-8 border-gray-300 animate-in zoom-in duration-300 shadow-2xl">
              <h2 className="text-4xl font-black text-center mb-8 uppercase italic tracking-tighter text-indigo-900">
                Ranking Parcial 📊
              </h2>
              <div className="space-y-3 mb-10">
                {!leaderboard || leaderboard.length === 0 ? (
                  <p className="text-center font-bold opacity-30 py-4">
                    Ninguém pontuou ainda...
                  </p>
                ) : (
                  leaderboard.slice(0, 5).map((p, i) => (
                    <div
                      key={p.player_name || i}
                      className="flex justify-between p-5 bg-indigo-50 rounded-2xl border-b-2 border-indigo-100"
                    >
                      <span className="font-black text-lg text-indigo-900">
                        #{i + 1} {p.player_name}
                      </span>
                      <span className="font-black text-indigo-500">
                        {p.score} pts
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={async () => {
                  await supabase
                    .from("game_status")
                    .update({ status: "playing" })
                    .eq("game_code", gameCode);
                  setIsRankingMode(false);
                }}
                className="w-full py-6 bg-gray-200 text-indigo-900 rounded-[2rem] font-black text-2xl shadow-[0_6px_0_0_#cbd5e0] active:translate-y-1 uppercase"
              >
                ⬅ VOLTAR PARA PERGUNTA
              </button>
            </div>
          ) : (
            <div className="bg-white text-indigo-900 p-10 rounded-[3.5rem] border-b-8 border-gray-300 shadow-2xl relative animate-in fade-in duration-500">
              {currentQ?.isDouble && (
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-indigo-900 px-6 py-2 rounded-2xl font-black text-xs shadow-lg animate-pulse rotate-12 z-10">
                  ⚡ 2X
                </div>
              )}
              <h2 className="text-2xl md:text-4xl font-black mb-10 leading-tight tracking-tight italic text-center text-indigo-900">
                "{currentQ?.text || "Carregando..."}"
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {currentQ?.options &&
                  Object.entries(currentQ.options).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-4 p-5 rounded-3xl border-2 border-indigo-50 bg-indigo-50/30"
                    >
                      <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                        {key.toUpperCase()}
                      </span>
                      <span className="font-bold text-xl text-indigo-900">
                        {value}
                      </span>
                    </div>
                  ))}
              </div>
              <button
                onClick={
                  index < questions.length - 1
                    ? handleNextQuestion
                    : handleFinish
                }
                className={`w-full py-8 text-white rounded-[2rem] font-black text-3xl uppercase transition-all ${index < questions.length - 1 ? "bg-[#10ad59] shadow-[0_8px_0_0_#096132]" : "bg-pink-500 shadow-[0_8px_0_0_#9d174d]"} active:translate-y-1`}
              >
                {index < questions.length - 1
                  ? "PRÓXIMA PERGUNTA →"
                  : "VER PÓDIO FINAL 🏆"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
