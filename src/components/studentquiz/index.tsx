import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
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
  const [confirmExit, setConfirmExit] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questionDuration, setQuestionDuration] = useState<number>(10);
  const [showProfessorLeft, setShowProfessorLeft] = useState(false);
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(null);

  const lastSyncRef = useRef({ status: "", index: -1 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncRef = useRef<(data: GameStatusRow) => void>(() => {});

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
      if (index < 0) {
        setView("loading");
        return;
      }
      setAnswered(false);
      setIsCorrect(null);
      setSelectedChoice(null);
      setCurrentIndex(index);
      setCurrentExpiresAt(expiresAt || null);

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
                Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
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

  const syncGameState = useCallback(
    async (data: GameStatusRow) => {
      if (!data) return;
      if (
        data.status === lastSyncRef.current.status &&
        Number(data.current_question_index) === lastSyncRef.current.index
      )
        return;
      lastSyncRef.current = {
        status: data.status,
        index: Number(data.current_question_index),
      };

      switch (data.status) {
        case "playing":
          setIsPreparing(false);
          void fetchQuestionData(
            Number(data.current_question_index),
            data.expires_at,
          );
          break;
        case "ranking":
          setIsPreparing(false);
          await fetchRanking();
          setView("ranking");
          break;
        case "finished":
          await fetchMyScore();
          setView("gameover");
          triggerVictory();
          break;
        default:
          setView("loading");
          setIsPreparing(data.status === "started");
          break;
      }
    },
    [fetchQuestionData, fetchRanking, fetchMyScore, triggerVictory],
  );

  // Sincroniza a Ref da função
  useEffect(() => {
    syncRef.current = syncGameState;
  }, [syncGameState]);

  // CRONÔMETRO
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (view === "question" && currentExpiresAt) {
      timerRef.current = setInterval(() => {
        const diff = Math.max(
          0,
          Math.ceil((new Date(currentExpiresAt).getTime() - Date.now()) / 1000),
        );
        setTimeLeft(diff);
        if (diff <= 0 && timerRef.current) clearInterval(timerRef.current);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, currentExpiresAt]);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupChannel = () => {
      // 🔥 Forçamos um nome único com timestamp para evitar cache de canal morto
      channel = supabase
        .channel(`game_room_${gameCode}_${Date.now()}`)
        .on<GameStatusRow>(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "game_status",
            filter: `game_code=eq.${gameCode}`,
          },
          (payload) => {
            console.log("Sinal recebido!", payload.eventType);
            if (payload.eventType === "DELETE") {
              setShowProfessorLeft(true);
            } else if (payload.new) {
              syncRef.current(payload.new);
            }
          },
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            console.log("Conectado com sucesso!");
            // Após conectar, buscamos o estado atual para garantir sincronia
            const { data } = await supabase
              .from("game_status")
              .select("*")
              .eq("game_code", gameCode)
              .maybeSingle();
            if (data) syncRef.current(data);
            else if (status === "SUBSCRIBED") {
              // Se não existe data e estamos inscritos, a sala pode ter caído
              // mas vamos dar um tempo antes de expulsar
            }
          }
        });
    };

    setupChannel();

    return () => {
      if (channel) {
        console.log("Limpando canal...");
        void supabase.removeChannel(channel);
      }
    };
  }, [gameCode, onExit]); // Dependências mínimas

  return (
    <div className="min-h-screen bg-[#46178f] text-white flex flex-col relative overflow-hidden font-nunito">
      <header className="w-full p-4 flex justify-between items-center bg-black/40 backdrop-blur-md z-40 sticky top-0 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center font-black border-2 border-white/20">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase text-purple-300 opacity-70">
              Jogador
            </span>
            <span className="text-lg font-black leading-tight">
              {playerName}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            if (!confirmExit) {
              setConfirmExit(true);
              setTimeout(() => setConfirmExit(false), 3000);
            } else onExit();
          }}
          className={`px-6 py-2 rounded-xl font-black text-sm transition-all border-2 uppercase ${
            confirmExit
              ? "bg-yellow-400 text-indigo-900 border-yellow-600 animate-pulse shadow-[0_4px_0_0_#b58900]"
              : "bg-red-500/20 text-red-200 border-red-500/50"
          }`}
        >
          {confirmExit ? "CONFIRMAR?" : "Sair"}
        </button>
      </header>

      {showProfessorLeft && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center text-indigo-900 shadow-2xl">
            <h3 className="text-2xl font-black uppercase mb-4 text-red-600 tracking-tighter">
              A sala foi encerrada!
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
            key={`q-${currentIndex}`}
            question={currentQuestion}
            gameCode={gameCode}
            playerScore={playerScore}
            answered={answered}
            isCorrect={isCorrect}
            selectedChoice={selectedChoice}
            timeLeft={timeLeft}
            duration={questionDuration}
            onAnswer={async (choice) => {
              if (answered || timeLeft <= 0) return;
              setAnswered(true);
              setSelectedChoice(choice);
              if (choice === currentQuestion.correctOption) {
                setIsCorrect(true);
                await supabase.rpc("increment_score", {
                  p_game_code: gameCode,
                  p_player_name: playerName,
                  p_amount: currentQuestion.isDouble ? 2000 : 1000,
                });
                void fetchMyScore();
              } else setIsCorrect(false);
            }}
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
