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

  const triggerVictory = (): void => {
    const end = Date.now() + 5000;
    const interval: number = window.setInterval(() => {
      if (Date.now() > end) return window.clearInterval(interval);
      void confetti({
        particleCount: 40,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        zIndex: 999,
      });
    }, 250);
  };

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
      if (index < 0) return;
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
        setQuestionDuration(q.timer || 10);
        setTimeLeft(
          expiresAt
            ? Math.max(
                0,
                Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
              )
            : q.timer || 10,
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
          if (payload.eventType === "DELETE") return setShowProfessorLeft(true);
          const newData = payload.new as GameStatusRow;
          if (!newData) return;
          if (newData.status === "playing") {
            setIsPreparing(false);
            void fetchQuestionData(
              Number(newData.current_question_index),
              newData.expires_at,
            );
            return;
          }
          if (newData.status === "lobby") {
            setView("loading");
            setAnswered(false);
            setIsPreparing(false);
            return;
          }
          if (newData.status === "finished") {
            await fetchMyScore();
            setView("gameover");
            triggerVictory();
            return;
          }
          if (newData.status === "ranking" || newData.status === "started") {
            setIsPreparing(true);
            await fetchRanking();
            setView("ranking");
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
      if (!data) return onExit();
      if (data.status === "playing")
        void fetchQuestionData(data.current_question_index, data.expires_at);
      else if (data.status === "finished") {
        await fetchMyScore();
        setView("gameover");
        triggerVictory();
      } else if (data.status === "ranking" || data.status === "started") {
        await fetchRanking();
        setView("ranking");
      } else if (data.status === "lobby") setView("loading");
    };
    void init();
    const watchdog = window.setInterval(async () => {
      const { data } = await supabase
        .from("game_status")
        .select("status, current_question_index, expires_at")
        .eq("game_code", gameCode)
        .maybeSingle();
      if (!data && view !== "gameover") setShowProfessorLeft(true);
      if (
        data &&
        data.status === "playing" &&
        (currentIndex !== data.current_question_index || view !== "question")
      )
        void fetchQuestionData(data.current_question_index, data.expires_at);
      if (data?.status === "finished" && view !== "gameover") {
        await fetchMyScore();
        setView("gameover");
        triggerVictory();
      }
    }, 2500);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(watchdog);
    };
  }, [
    gameCode,
    onExit,
    fetchQuestionData,
    fetchRanking,
    fetchMyScore,
    view,
    currentIndex,
  ]);

  useEffect(() => {
    let timer: number | undefined;
    if (view === "question" && timeLeft > 0 && !answered)
      timer = window.setInterval(
        () => setTimeLeft((p) => (p > 0 ? p - 1 : 0)),
        1000,
      );
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [view, timeLeft, answered]);

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col relative">
      {showProfessorLeft && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center text-indigo-900 shadow-2xl">
            <h3 className="text-2xl font-black uppercase mb-4">
              Sala Encerrada
            </h3>
            <button
              onClick={onExit}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black"
            >
              VOLTAR AO INÍCIO
            </button>
          </div>
        </div>
      )}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center text-indigo-900 shadow-2xl">
            <h3 className="text-2xl font-black mb-4 uppercase">
              Sair do Jogo?
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={onExit}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase"
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 flex flex-col items-center justify-center">
        {view === "loading" && (
          <StudentWaiting
            playerName={playerName}
            gameCode={gameCode}
            isPreparing={isPreparing}
            onExit={() => setShowExitConfirm(true)}
          />
        )}
        {view === "ranking" && (
          <RankingScreen leaderboard={leaderboard} playerName={playerName} />
        )}
        {view === "question" && currentQuestion && (
          <QuestionScreen
            key={`q-${currentIndex}`}
            question={currentQuestion}
            gameCode={gameCode}
            playerScore={playerScore}
            answered={answered}
            isCorrect={isCorrect}
            selectedChoice={selectedChoice}
            onAnswer={async (c) => {
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
            onExitClick={() => setShowExitConfirm(true)}
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
