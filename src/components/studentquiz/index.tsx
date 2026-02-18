import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import confetti from "canvas-confetti";
import LeoGomesFooter from "../footer";
import { QuestionScreen } from "./QuestionScreen";
import { RankingScreen } from "./RankingScreen";
import { GameOverScreen } from "./GameOverScreen";
import { StudentWaiting } from "./StudentWaiting";
import type { Question, LeaderboardEntry } from "../../types/game";

interface GameStatusRow {
  status: string;
  current_question_index: number;
  game_code: string;
  expires_at?: string | null;
}

export default function StudentQuiz({
  gameCode,
  playerName,
  onExit,
}: {
  gameCode: string;
  playerName: string;
  onExit: () => void;
}) {
  const [view, setView] = useState<
    "loading" | "question" | "ranking" | "gameover"
  >("loading");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questionDuration, setQuestionDuration] = useState<number>(10);
  const [showProfessorLeft, setShowProfessorLeft] = useState(false);

  const triggerVictory = useCallback((): void => {
    const end = Date.now() + 5000;
    const interval = window.setInterval(() => {
      if (Date.now() > end) return window.clearInterval(interval);
      void confetti({
        particleCount: 40,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        zIndex: 999,
      });
    }, 250);
  }, []);

  const fetchMyScore = useCallback(async () => {
    const { data } = await supabase
      .from("leaderboard")
      .select("score")
      .eq("game_code", gameCode)
      .eq("player_name", playerName)
      .maybeSingle();
    if (data) setPlayerScore(data.score);
  }, [gameCode, playerName]);

  const fetchRanking = useCallback(async () => {
    const { data } = await supabase
      .from("leaderboard")
      .select("player_name, score")
      .eq("game_code", gameCode)
      .order("score", { ascending: false })
      .limit(5);
    if (data) setLeaderboard(data as LeaderboardEntry[]);
  }, [gameCode]);

  const fetchQuestionData = useCallback(
    async (index: number, expiresAt?: string | null) => {
      // 🔥 CORREÇÃO EXTRA: Se for lobby ou reset, não carrega pergunta
      if (index < 0) {
        setView("loading");
        setCurrentQuestion(null);
        return;
      }

      setAnswered(false);
      setIsCorrect(null);
      setSelectedChoice(null);
      setCurrentIndex(index);

      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("game_code", gameCode)
        .order("created_at", { ascending: true });

      if (data && data[index]) {
        const q = data[index];
        const duration = q.timer || 10;
        setQuestionDuration(duration);
        setTimeLeft(
          expiresAt
            ? Math.max(
                0,
                Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
              )
            : duration,
        );
        setCurrentQuestion({
          id: q.id,
          text: q.text,
          options: {
            a: q.option_a,
            b: q.option_b,
            c: q.option_c,
            d: q.option_d,
          },
          correctOption: q.correct_option,
          isDouble: q.is_double || false,
        });
        setView("question");
        void fetchMyScore();
      }
    },
    [gameCode, fetchMyScore],
  );

  useEffect(() => {
    const channel = supabase
      .channel(`room_${gameCode}`)
      .on<GameStatusRow>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_status",
          filter: `game_code=eq.${gameCode}`,
        },
        async (payload: RealtimePostgresChangesPayload<GameStatusRow>) => {
          if (payload.eventType === "DELETE") {
            setShowProfessorLeft(true);
            return;
          }

          const newData = payload.new as GameStatusRow;
          if (!newData) return;

          switch (newData.status) {
            case "lobby":
              setView("loading");
              setIsPreparing(false);
              break;

            case "ranking":
              setIsPreparing(false);
              await fetchRanking();
              setView("ranking");
              break;

            case "started":
              // Apenas feedback visual
              setIsPreparing(true);
              setView("loading");
              break;

            case "playing": {
              setIsPreparing(false);

              const newIndex = Number(newData.current_question_index);

              // 🔥 Só atualiza se realmente mudou de pergunta
              if (newIndex !== currentIndex) {
                void fetchQuestionData(newIndex, newData.expires_at);
              }

              break;
            }

            case "finished":
              await fetchMyScore();
              setView("gameover");
              triggerVictory();
              break;
          }
        },
      )
      .subscribe();

    const init = async () => {
      const { data } = await supabase
        .from("game_status")
        .select("*")
        .eq("game_code", gameCode)
        .maybeSingle();

      if (!data) {
        onExit();
        return;
      }

      switch (data.status) {
        case "playing":
          void fetchQuestionData(data.current_question_index, data.expires_at);
          break;

        case "ranking":
          await fetchRanking();
          setView("ranking");
          break;

        case "finished":
          await fetchMyScore();
          setView("gameover");
          triggerVictory();
          break;

        case "started":
          setIsPreparing(true);
          setView("loading");
          break;

        default:
          setView("loading");
          setIsPreparing(false);
      }
    };

    void init();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    gameCode,
    currentIndex, // 🔥 IMPORTANTE
    onExit,
    fetchQuestionData,
    fetchRanking,
    fetchMyScore,
    triggerVictory,
  ]);

  useEffect(() => {
    let timer: number | undefined;
    if (view === "question" && timeLeft > 0 && !answered) {
      timer = window.setInterval(
        () => setTimeLeft((p) => (p > 0 ? p - 1 : 0)),
        1000,
      );
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [view, timeLeft, answered]);

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col relative overflow-hidden">
      <header className="w-full p-4 flex justify-between items-center bg-black/40 backdrop-blur-md z-40 sticky top-0 border-b border-white/10">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center font-black border-2 border-white/20 shadow-lg">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-purple-300 tracking-widest leading-none opacity-70">
              Jogador
            </span>
            <span className="text-lg font-black leading-tight text-white">
              {playerName}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowExitConfirm(true)}
          className="px-6 py-2 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-xl font-black text-sm transition-all border-2 border-red-500/50 uppercase"
        >
          Sair
        </button>
      </header>

      {/* MODAL PROFESSOR SAIU */}
      {showProfessorLeft && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center text-indigo-900 shadow-2xl">
            <h3 className="text-2xl font-black uppercase mb-4 leading-tight">
              O professor encerrou a sala!
            </h3>
            <button
              onClick={onExit}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-[0_6px_0_0_#312e81]"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )}

      {/* MODAL SAIR CONFIRMAÇÃO */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center text-indigo-900 shadow-2xl">
            <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter">
              Deseja sair da partida?
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={onExit}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase shadow-[0_4px_0_0_#991b1b]"
              >
                Sim, Sair
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-black uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {view === "loading" && (
          <StudentWaiting
            playerName={playerName}
            gameCode={gameCode}
            isPreparing={isPreparing}
          />
        )}

        {view === "ranking" && (
          <RankingScreen leaderboard={leaderboard} playerName={playerName} />
        )}

        {view === "question" && currentQuestion && (
          <QuestionScreen
            key={`q-${currentIndex}`} // FIM DA NECESSIDADE DE F5
            question={currentQuestion}
            gameCode={gameCode}
            playerScore={playerScore}
            answered={answered}
            isCorrect={isCorrect}
            selectedChoice={selectedChoice}
            onAnswer={async (c: string) => {
              if (answered) return;
              setAnswered(true);
              setSelectedChoice(c);
              if (c === currentQuestion.correctOption) {
                setIsCorrect(true);
                await supabase.rpc("increment_score", {
                  p_game_code: gameCode,
                  p_player_name: playerName,
                  p_amount: currentQuestion.isDouble ? 2000 : 1000,
                });
                void fetchMyScore();
              } else setIsCorrect(false);
            }}
            timeLeft={timeLeft}
            duration={questionDuration}
          />
        )}

        {view === "gameover" && (
          <GameOverScreen
            playerName={playerName}
            gameCode={gameCode}
            playerScore={playerScore}
          />
        )}
      </main>

      <LeoGomesFooter />
    </div>
  );
}
