import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import confetti from "canvas-confetti";
import LeoGomesFooter from "../footer";
import { QuestionCard } from "./QuestionCard";
import { RankingList } from "./RankingList";
import { Podium } from "./Podium";
import { Header } from "./Header";
import { CodeModal } from "./Modals/CodeModal";
import { GabaritoModal } from "./Modals/GabaritoModal";
import type { GameControlProps, LeaderboardEntry } from "../../types/game";

export default function GameControl({
  questions,
  gameCode,
  onFinish,
  onReset,
}: GameControlProps) {
  const storageKey = `quiz_prof_state_${gameCode}`;
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");

  const [index, setIndex] = useState<number>(saved.index ?? 0);
  const [isLobby, setIsLobby] = useState<boolean>(saved.isLobby ?? true);
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
  const timerRef = useRef<number | null>(null);

  const fetchRanking = useCallback(async () => {
    const { data } = await supabase
      .from("leaderboard")
      .select("player_name, score")
      .eq("game_code", gameCode)
      .order("score", { ascending: false });
    if (data) setLeaderboard(data as LeaderboardEntry[]);
  }, [gameCode]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFinish = useCallback(async () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimeLeft(null);
    localStorage.removeItem(storageKey);
    await supabase
      .from("game_status")
      .update({ status: "finished", expires_at: null })
      .eq("game_code", gameCode);
    await fetchRanking();
    void confetti({ particleCount: 150, zIndex: 200 });
    setShowPodium(true);
  }, [gameCode, fetchRanking, storageKey]);

  const handleNext = useCallback(async () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimeLeft(null);

    const nextIndex = index + 1;

    // 1. Se chegou ao fim, chama o finish e para aqui
    if (nextIndex >= questions.length) {
      return handleFinish();
    }

    // 2. Atualiza o índice LOCAL do professor
    setIndex(nextIndex);

    // 3. ATUALIZAÇÃO NO BANCO:
    // O status "ranking" deve manter o índice da pergunta que ACABOU de passar (index)
    // ou apenas sinalizar a transição.
    await supabase
      .from("game_status")
      .update({
        status: "ranking",
        current_question_index: index, // Mantém a referência da questão encerrada
        expires_at: null,
      })
      .eq("game_code", gameCode);

    // 4. OBRIGATÓRIO: Busca o ranking atualizado do banco para o estado do Professor
    void fetchRanking();

    // 5. Lógica de blocos ou contagem regressiva
    if (nextIndex > 0 && nextIndex % 5 === 0) {
      setIsBlockTransition(true);
      setBlockCountdown(5);
    } else {
      setPreCountdown(5);
    }
  }, [index, questions.length, gameCode, handleFinish, fetchRanking]); // Adicionado fetchRanking nas dependências

  const executeSkip = useCallback(async () => {
    setPreCountdown(null);
    setBlockCountdown(null);
    setIsBlockTransition(false);

    const nextIdx = isLobby ? 0 : index;
    const expiresAt = new Date(
      Date.now() + questionDuration * 1000,
    ).toISOString();

    const { error } = await supabase
      .from("game_status")
      .update({
        current_question_index: nextIdx,
        status: "playing",
        expires_at: expiresAt,
      })
      .eq("game_code", gameCode);

    if (!error) {
      if (isLobby) setIsLobby(false);
      setIsRankingMode(false);

      if (timerRef.current) window.clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const end = new Date(expiresAt).getTime();
        const diff = Math.max(0, Math.floor((end - now) / 1000));

        setTimeLeft(diff);

        if (diff <= 0) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          handleNext();
        }
      }, 1000);
    }
  }, [gameCode, index, isLobby, questionDuration, handleNext]);

  useEffect(() => {
    const init = async () => {
      const { data: existing } = await supabase
        .from("game_status")
        .select("game_code")
        .eq("game_code", gameCode)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("game_status")
          .update({
            status: "lobby",
            current_question_index: -1,
            expires_at: null,
          })
          .eq("game_code", gameCode);
      } else {
        await supabase.from("game_status").insert({
          game_code: gameCode,
          status: "lobby",
          current_question_index: -1,
        });
      }
      void fetchRanking();
    };
    void init();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [gameCode, fetchRanking]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ index, isLobby }));
  }, [index, isLobby, storageKey]);

  useEffect(() => {
    if (blockCountdown === null) return;
    const timer = window.setInterval(() => {
      setBlockCountdown((bc) => {
        if (bc !== null && bc <= 1) {
          window.clearInterval(timer);
          void executeSkip();
          return 0;
        }
        return bc !== null ? bc - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [blockCountdown, executeSkip]);

  useEffect(() => {
    if (preCountdown === null) return;
    // Avisa o aluno que começou a contagem de preparação
    void supabase
      .from("game_status")
      .update({ status: "started" })
      .eq("game_code", gameCode);

    const timer = window.setInterval(() => {
      setPreCountdown((pc) => {
        if (pc !== null && pc <= 1) {
          window.clearInterval(timer);
          void executeSkip();
          return 0;
        }
        return pc !== null ? pc - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [preCountdown, executeSkip, gameCode]);

  if (showPodium)
    return (
      <Podium winners={leaderboard} onReset={onReset} onFinish={onFinish} />
    );

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col relative overflow-hidden">
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[150] bg-green-500 p-4 rounded-xl font-bold">
          {toast}
        </div>
      )}

      {isBlockTransition && (
        <div className="fixed inset-0 z-[120] bg-indigo-950/95 flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-[4rem] p-12 w-full max-w-lg shadow-2xl border-b-[12px] border-gray-300 text-indigo-900">
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
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] p-10 w-full max-w-2xl shadow-2xl border-b-[12px] border-gray-300 text-center">
            <h1 className="text-indigo-400 font-black uppercase mb-2">
              Código da Sala:
            </h1>
            <div className="bg-indigo-900 text-yellow-400 py-8 rounded-[2.5rem] mb-6 text-7xl font-black border-4 border-indigo-800">
              {gameCode}
            </div>
            <div className="mb-6 flex flex-col items-center">
              <label className="text-indigo-900 font-black mb-2 uppercase text-sm">
                Tempo por Questão (segundos):
              </label>
              <input
                type="number"
                value={questionDuration}
                onChange={(e) => setQuestionDuration(Number(e.target.value))}
                className="w-32 text-center text-3xl font-black p-3 rounded-2xl border-4 border-indigo-100 text-indigo-900 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsLobby(false);
                  setPreCountdown(5);
                }}
                className="w-full py-6 bg-green-500 text-white rounded-[2rem] font-black text-2xl shadow-[0_8px_0_0_#15803d] active:translate-y-1 uppercase"
              >
                🚀 Abrir Arena
              </button>
              <button
                onClick={onFinish}
                className="w-full py-4 bg-gray-200 text-gray-500 rounded-[1.5rem] font-black text-xl shadow-[0_6px_0_0_#cbd5e1] active:translate-y-1 uppercase text-center"
              >
                Sair
              </button>
            </div>
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
              onExit={onFinish}
              exitStage={false}
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
              ) : (
                <QuestionCard
                  question={questions[index]}
                  index={index}
                  total={questions.length}
                  onNext={() => void handleNext()}
                  isLast={index === questions.length - 1}
                />
              )}
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
          showToast("Copiado! 📋");
        }}
      />
      <GabaritoModal
        isOpen={showGabaritoModal}
        question={questions[index]}
        onClose={() => setShowGabaritoModal(false)}
      />
      <LeoGomesFooter />
    </div>
  );
}
