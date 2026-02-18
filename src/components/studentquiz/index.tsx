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
  status: "waiting" | "started" | "playing" | "ranking" | "finished" | "lobby";
  current_question_index: number;
  game_code: string;
  expires_at?: string | null;
}

interface StudentQuizProps {
  gameCode: string;
  playerName: string;
  onExit: () => void;
}

export default function StudentQuiz({
  gameCode,
  playerName,
  onExit,
}: StudentQuizProps) {
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
      // Reseta estados para garantir que a tela limpe antes da nova pergunta
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
        const baseTimer = q.timer || 10;
        setQuestionDuration(baseTimer);

        if (expiresAt) {
          const end = new Date(expiresAt).getTime();
          const now = Date.now();
          const diff = Math.max(0, Math.ceil((end - now) / 1000));
          setTimeLeft(diff);
        } else {
          setTimeLeft(baseTimer);
        }

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
          event: "UPDATE",
          schema: "public",
          table: "game_status",
          filter: `game_code=eq.${gameCode}`,
        },
        // NO STUDENTQUIZ.TSX - Dentro do useEffect do channel.on
        (payload: RealtimePostgresChangesPayload<GameStatusRow>) => {
          const newData = payload.new as GameStatusRow;
          if (!newData) return;

          const { status, current_question_index, expires_at } = newData;

          switch (status) {
            case "playing":
              setIsPreparing(false);
              void fetchQuestionData(
                Number(current_question_index),
                expires_at,
              );
              break;

            case "ranking":
              setIsPreparing(false);
              void fetchRanking();
              void fetchMyScore();
              setView("ranking");
              break;

            case "finished": // <--- ADICIONE ESTE CASE
              setIsPreparing(false);
              // Busca a pontuação final antes de mudar a tela
              void fetchMyScore().then(() => {
                setView("gameover");
                // DISPARA O CONFETE NO DISPOSITIVO DO ALUNO
                void confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  zIndex: 999,
                });
              });
              break;

            case "started":
              setIsPreparing(true);
              setView("loading");
              break;
          }
        },
      )
      .subscribe();

    // Verificação Inicial
    const init = async () => {
      const { data } = await supabase
        .from("game_status")
        .select("*")
        .eq("game_code", gameCode)
        .maybeSingle();
      if (!data) return onExit();
      const gameData = data as GameStatusRow;
      if (gameData.status === "playing") {
        void fetchQuestionData(
          gameData.current_question_index,
          gameData.expires_at,
        );
      } else if (gameData.status === "ranking") {
        void fetchRanking();
        setView("ranking");
      }
    };
    void init();

    // Watchdog: Força sincronia se o Realtime falhar
    const watchdog = window.setInterval(async () => {
      const { data } = await supabase
        .from("game_status")
        .select("status, current_question_index, expires_at")
        .eq("game_code", gameCode)
        .maybeSingle();

      if (data) {
        if (
          data.status === "playing" &&
          (currentIndex !== data.current_question_index || view !== "question")
        ) {
          void fetchQuestionData(data.current_question_index, data.expires_at);
        } else if (data.status === "ranking" && view === "question") {
          void fetchRanking();
          setView("ranking");
        }
        // NOVO: Se o banco diz que acabou e o aluno ainda está na questão/ranking
        else if (data.status === "finished" && view !== "gameover") {
          void fetchMyScore().then(() => setView("gameover"));
        }
      }
    }, 3000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(watchdog);
    };
  }, [
    gameCode,
    onExit,
    fetchQuestionData,
    fetchRanking,
    fetchMyScore,
    currentIndex,
    view,
  ]);

  useEffect(() => {
    let timer: number | undefined;
    if (view === "question" && timeLeft > 0 && !answered) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [view, timeLeft, answered]);

  const handleAnswer = async (choice: string) => {
    if (answered || !currentQuestion) return;
    setAnswered(true);
    setSelectedChoice(choice);
    if (choice === "timeout") {
      setIsCorrect(false);
      return;
    }
    if (choice === currentQuestion.correctOption) {
      setIsCorrect(true);
      await supabase.rpc("increment_score", {
        p_game_code: gameCode,
        p_player_name: playerName,
        p_amount: currentQuestion.isDouble ? 2000 : 1000,
      });
      void fetchMyScore();
    } else {
      setIsCorrect(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col relative">
      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center">
            <h3 className="text-2xl font-black text-indigo-900 mb-2 uppercase">
              Sair do Jogo?
            </h3>
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={onExit}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase border-b-4 border-red-800"
              >
                Confirmar e Sair
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
            onExit={onExit}
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
            onAnswer={handleAnswer}
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
