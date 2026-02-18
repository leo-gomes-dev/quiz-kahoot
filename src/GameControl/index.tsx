import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import confetti from "canvas-confetti";
import LeoGomesFooter from "../components/footer";
import { QuestionCard } from "./components/QuestionCard";
import { RankingList } from "./components/RankingList";
import { Podium } from "./components/Podium";
import { Header } from "./components/Header";
import { CodeModal } from "../components/Modals/CodeModal";
import { GabaritoModal } from "../components/Modals/GabaritoModal";
import type { GameControlProps, LeaderboardEntry } from "./../types/game";

export default function GameControl({
  questions,
  gameCode,
  onFinish,
  onReset,
}: GameControlProps) {
  const storageKey = `quiz_prof_state_${gameCode}`;
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");

  const [isLobby, setIsLobby] = useState<boolean>(saved.isLobby ?? true);
  const [index, setIndex] = useState<number>(isLobby ? 0 : (saved.index ?? 0));
  const [showPodium, setShowPodium] = useState(false);
  const [isRankingMode, setIsRankingMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showGabaritoModal, setShowGabaritoModal] = useState(false);
  const [preCountdown, setPreCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isBlockTransition, setIsBlockTransition] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [questionDuration, setQuestionDuration] = useState(25);
  const [exitStage, setExitStage] = useState(false); // 🔥 Estado único de saída
  const timerRef = useRef<number | null>(null);

  const fetchRanking = useCallback(async () => {
    const { data } = await supabase
      .from("leaderboard")
      .select("player_name, score")
      .eq("game_code", gameCode)
      .order("score", { ascending: false });
    if (data) setLeaderboard(data as LeaderboardEntry[]);
  }, [gameCode]);

  // 🔥 FUNÇÃO DE SAÍDA CONSOLIDADA (UI/UX + DELETE ALUNOS)
  const handleCleanupAndExit = useCallback(async () => {
    if (!exitStage) {
      setExitStage(true);
      setTimeout(() => setExitStage(false), 4000);
      return;
    }

    if (timerRef.current) window.clearInterval(timerRef.current);

    try {
      // Deleta do banco para deslogar alunos instantaneamente
      await supabase.from("leaderboard").delete().eq("game_code", gameCode);
      await supabase.from("game_status").delete().eq("game_code", gameCode);
      localStorage.removeItem(storageKey);
      onFinish();
    } catch (error) {
      console.error("Erro ao encerrar:", error);
      onFinish();
    }
  }, [gameCode, storageKey, onFinish, exitStage]);

  const handleRestartSameRoom = useCallback(async () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setIndex(0);
    setIsLobby(true);
    setShowPodium(false);
    setIsRankingMode(false);
    setPreCountdown(null);
    setTimeLeft(null);
    setBlockCountdown(null);
    setIsBlockTransition(false);
    localStorage.removeItem(storageKey);
    await supabase
      .from("game_status")
      .update({
        status: "lobby",
        current_question_index: -1,
        expires_at: new Date().toISOString(),
      })
      .eq("game_code", gameCode);
    onReset();
  }, [gameCode, storageKey, onReset]);

  const handleFinish = useCallback(async () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimeLeft(null);
    await supabase
      .from("game_status")
      .update({ status: "finished", expires_at: null })
      .eq("game_code", gameCode);
    await fetchRanking();
    setShowPodium(true);
    void confetti({ particleCount: 150, zIndex: 200, origin: { y: 0.6 } });
  }, [gameCode, fetchRanking]);

  const handleNext = useCallback(async () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimeLeft(null);

    if (index >= questions.length - 1) return handleFinish();

    // 🔥 1. SINALIZA RANKING PARA OS ALUNOS (Eles continuam vendo o ranking)
    await supabase
      .from("game_status")
      .update({
        status: "ranking",
        current_question_index: index,
        expires_at: null,
      })
      .eq("game_code", gameCode);

    // 🔥 2. ATUALIZA DADOS MAS NÃO MUDA A TELA DO PROFESSOR
    void fetchRanking();
    // setIsRankingMode(true); <--- REMOVA OU COMENTE ESTA LINHA

    const nextIdx = index + 1;
    setIndex(nextIdx);

    // 3. DECIDE SE VAI PARA BLOCO OU CONTAGEM REGRESSIVA
    if (nextIdx > 0 && nextIdx % 5 === 0) {
      setIsBlockTransition(true);
      setBlockCountdown(5);
    } else {
      setPreCountdown(5);
    }
  }, [index, questions.length, gameCode, handleFinish, fetchRanking]);

  const executeSkip = useCallback(async () => {
    setPreCountdown(null);
    setBlockCountdown(null);
    setIsBlockTransition(false);
    setIsRankingMode(false);

    const targetIdx = index < 0 ? 0 : index;
    if (targetIdx >= questions.length) return handleFinish();

    setIndex(targetIdx);
    if (isLobby) setIsLobby(false);

    const expiresAt = new Date(
      Date.now() + (questionDuration + 2) * 1000,
    ).toISOString();

    await supabase
      .from("game_status")
      .update({
        current_question_index: targetIdx,
        status: "playing",
        expires_at: expiresAt,
      })
      .eq("game_code", gameCode);

    setIsRankingMode(false);

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(diff);
      if (diff <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        void handleNext();
      }
    }, 1000);
  }, [
    gameCode,
    index,
    isLobby,
    questionDuration,
    handleNext,
    questions.length,
    handleFinish,
  ]);

  useEffect(() => {
    const init = async () => {
      localStorage.removeItem(storageKey);
      setIndex(0);
      setIsLobby(true);
      await supabase
        .from("game_status")
        .update({
          status: "lobby",
          current_question_index: -1,
          expires_at: null,
        })
        .eq("game_code", gameCode);
    };
    init();
  }, [gameCode, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ index, isLobby }));
  }, [index, isLobby, storageKey]);

  useEffect(() => {
    if (blockCountdown === null) return;
    const t = window.setInterval(() => {
      setBlockCountdown((bc) => {
        if (bc !== null && bc <= 1) {
          window.clearInterval(t);
          void executeSkip();
          return 0;
        }
        return bc !== null ? bc - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [blockCountdown, executeSkip]);

  useEffect(() => {
    if (preCountdown === null) return;
    void supabase
      .from("game_status")
      .update({ status: "started" })
      .eq("game_code", gameCode);
    const t = window.setInterval(() => {
      setPreCountdown((pc) => {
        if (pc !== null && pc <= 1) {
          window.clearInterval(t);
          void executeSkip();
          return 0;
        }
        return pc !== null ? pc - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [preCountdown, executeSkip, gameCode]);

  if (showPodium)
    return (
      <Podium
        winners={leaderboard.slice(0, 3)}
        onReset={handleRestartSameRoom}
        onFinish={handleCleanupAndExit}
        exitStage={exitStage} // Adicione esta linha (assumindo que o nome do seu estado é exitStage)
      />
    );

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col relative overflow-hidden">
      {isBlockTransition && (
        <div className="fixed inset-0 z-50 bg-indigo-950/95 flex items-center justify-center p-6 text-center text-indigo-900">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-lg shadow-2xl border-b-[12px] border-gray-300">
            <h2 className="text-indigo-400 font-black uppercase mb-2">
              Próximo Bloco em:
            </h2>
            <div className="text-[12rem] font-black leading-none mb-8 animate-pulse">
              {blockCountdown}
            </div>
            <button
              onClick={() => void executeSkip()}
              className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-2xl shadow-[0_6px_0_0_#15803d]"
            >
              INICIAR AGORA 🚀
            </button>
          </div>
        </div>
      )}
      {isLobby ? (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center text-indigo-900">
          <div className="bg-white rounded-[4rem] p-10 w-full max-w-2xl shadow-2xl border-b-[12px] border-gray-300">
            <h1 className="text-indigo-400 font-black uppercase mb-2">
              Código da Sala:
            </h1>
            <div className="bg-indigo-900 text-yellow-400 py-8 rounded-[2.5rem] mb-6 text-7xl font-black border-4 border-indigo-800">
              {gameCode}
            </div>
            <div className="mb-6 flex flex-col items-center">
              <label className="text-indigo-900 font-black mb-2 uppercase text-sm">
                Tempo por Questão (s):
              </label>
              <input
                type="number"
                value={questionDuration}
                onChange={(e) => setQuestionDuration(Number(e.target.value))}
                className="w-32 text-center text-3xl font-black p-3 rounded-2xl border-4 border-indigo-100 text-indigo-900 outline-none"
              />
            </div>
            <button
              onClick={() => {
                setIsLobby(false);
                setPreCountdown(5);
              }}
              className="w-full py-6 bg-green-500 text-white rounded-[2rem] font-black text-2xl shadow-[0_8px_0_0_#15803d] uppercase"
            >
              🚀 Abrir Arena
            </button>
          </div>
        </main>
      ) : (
        <main className="flex-1 p-6 flex flex-col items-center relative z-10">
          <div className="w-full max-w-4xl">
            <Header
              index={index}
              totalQuestions={questions.length}
              isRankingMode={isRankingMode}
              onShowCode={() => setShowCodeModal(true)}
              onToggleRanking={() => setIsRankingMode(!isRankingMode)}
              onShowGabarito={() => setShowGabaritoModal(true)}
              onExit={handleCleanupAndExit}
              exitStage={exitStage}
            />
            {!isRankingMode && timeLeft !== null && preCountdown === null && (
              <div className="flex justify-center mb-6">
                <div className="px-12 py-4 rounded-3xl font-black text-4xl bg-yellow-400 text-indigo-900 border-b-[8px] border-yellow-600 animate-bounce">
                  ⏱️ {timeLeft}s
                </div>
              </div>
            )}
            <div className="relative w-full">
              {preCountdown !== null ? (
                <div className="bg-white p-12 rounded-[4rem] text-center shadow-2xl border-b-[12px] border-gray-300 text-indigo-900">
                  <p className="font-black uppercase mb-4 text-indigo-400">
                    Preparem-se!
                  </p>
                  <h2 className="text-[10rem] font-black leading-none mb-8">
                    {preCountdown}
                  </h2>
                  <button
                    onClick={() => void executeSkip()}
                    className="w-full py-4 bg-yellow-400 rounded-2xl font-black shadow-[0_4px_0_0_#b58900] uppercase"
                  >
                    PULAR ⚡
                  </button>
                </div>
              ) : isRankingMode ? (
                <RankingList
                  leaderboard={leaderboard}
                  onBack={() => setIsRankingMode(false)}
                />
              ) : questions[index] ? (
                <QuestionCard
                  question={questions[index]}
                  index={index}
                  total={questions.length}
                  onNext={() => void handleNext()}
                  isLast={index === questions.length - 1}
                />
              ) : null}
            </div>
          </div>
        </main>
      )}
      <CodeModal
        isOpen={showCodeModal}
        gameCode={gameCode}
        onClose={() => setShowCodeModal(false)}
        onCopy={() => {
          navigator.clipboard.writeText(gameCode);
          setToast("Copiado!");
          setTimeout(() => setToast(null), 2000);
        }}
      />
      <GabaritoModal
        isOpen={showGabaritoModal}
        question={questions[index]}
        onClose={() => setShowGabaritoModal(false)}
      />
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-green-500 p-4 rounded-xl font-bold">
          {toast}
        </div>
      )}
      <LeoGomesFooter />
    </div>
  );
}
