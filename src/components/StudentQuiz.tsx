import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import confetti from "canvas-confetti";

// --- INTERFACES ---
interface Question {
  id: string;
  text: string;
  options: { a: string; b: string; c: string; d: string };
  correctOption: string;
  isDouble: boolean;
}

interface GameStatus {
  status: "waiting" | "playing" | "ranking" | "finished" | "started";
  current_question_index: number;
}

interface LeaderboardEntry {
  player_name: string;
  score: number;
}

interface StudentQuizProps {
  gameCode: string;
  playerName: string;
}

export default function StudentQuiz({
  gameCode,
  playerName,
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

  const fetchCurrentQuestion = useCallback(
    async (index: number) => {
      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("game_code", gameCode)
        .order("created_at", { ascending: true });

      if (data && data[index]) {
        const q = data[index];
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

        // RESETAR ESTADOS PARA A NOVA PERGUNTA
        setAnswered(false);
        setIsCorrect(null);
        setSelectedChoice(null); // <--- ADICIONE ISSO PARA LIMPAR AS CORES DA RODADA ANTERIOR
        setView("question");
        await fetchMyScore();
      }
    },
    [gameCode, fetchMyScore],
  );

  useEffect(() => {
    // Canal com ID único para evitar conflitos e TIMEOUT
    const channelId = `room_${gameCode}_${Math.random().toString(36).substring(7)}`;

    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // Foca no update que é o que muda a pergunta
          schema: "public",
          table: "game_status",
          filter: `game_code=eq.${gameCode}`,
        },
        async (payload) => {
          const newData = payload.new as GameStatus;
          if (!newData || !newData.status) return;

          if (newData.status === "playing" || newData.status === "started") {
            // Busca a pergunta baseada no novo index enviado pelo professor
            await fetchCurrentQuestion(newData.current_question_index);
          } else if (newData.status === "ranking") {
            await fetchRanking();
            setView("ranking");
          } else if (newData.status === "finished") {
            setView("gameover");
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#46178f", "#facc15", "#e21b3c"],
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "TIMED_OUT") {
          console.warn("Reconectando canal...");
          setTimeout(() => channel.subscribe(), 2000);
        }
      });

    const init = async () => {
      await fetchMyScore();
      const { data } = await supabase
        .from("game_status")
        .select("*")
        .eq("game_code", gameCode)
        .maybeSingle();

      if (data) {
        if (data.status === "playing" || data.status === "started") {
          await fetchCurrentQuestion(data.current_question_index);
        } else if (data.status === "ranking") {
          await fetchRanking();
          setView("ranking");
        } else if (data.status === "finished") {
          setView("gameover");
        }
      }
    };

    init();

    return () => {
      supabase.removeChannel(channel);
    };
    // REMOVIDO fetchCurrentQuestion e fetchRanking das dependências para evitar loop de Timeout
  }, [gameCode]);

  const handleAnswer = async (choice: string) => {
    if (answered || !currentQuestion) return;

    setSelectedChoice(choice); // Armazena a escolha para o visual
    const correct = choice === currentQuestion.correctOption;
    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      const points = currentQuestion.isDouble ? 2000 : 1000;
      setPlayerScore((prev) => prev + points);

      await supabase.rpc("increment_score", {
        p_game_code: gameCode,
        p_player_name: playerName,
        p_amount: points,
      });
    }
  };

  // --- RENDERS ---

  if (view === "loading")
    return (
      <div className="flex h-screen items-center justify-center bg-[#46178f] text-white font-black text-2xl animate-pulse">
        CARREGANDO...
      </div>
    );

  if (view === "ranking")
    return (
      <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-black text-yellow-400 mb-8 italic uppercase tracking-tighter drop-shadow-lg">
            Ranking Atual 🏆
          </h2>
          <div className="w-full max-w-md space-y-4">
            {leaderboard.map((user, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center p-6 rounded-3xl border-b-8 transition-all ${user.player_name === playerName ? "bg-yellow-400 text-indigo-900 border-yellow-600 scale-105" : "bg-white/10 border-black/20 text-white"}`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-black text-2xl opacity-50">
                    #{idx + 1}
                  </span>
                  <span className="font-black uppercase text-xl">
                    {user.player_name}
                  </span>
                </div>
                <span className="font-black text-2xl">{user.score}</span>
              </div>
            ))}
          </div>
        </div>
        <LeoGomesFooter />
      </div>
    );

  if (view === "question" && currentQuestion)
    return (
      <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col">
        <div className="p-6 pb-32 max-w-3xl mx-auto w-full flex-1">
          <div className="flex justify-between items-center mb-10">
            <span className="bg-black/20 px-6 py-2 rounded-full font-black text-xs text-yellow-400 border border-white/10 uppercase tracking-widest">
              SALA: {gameCode}
            </span>
            <span className="bg-white/10 px-6 py-2 rounded-full font-black text-xl border-b-4 border-black/20">
              {playerScore} PTS
            </span>
          </div>

          <div className="bg-white p-10 rounded-[3rem] mb-10 border-b-8 border-gray-300 shadow-2xl">
            <h2 className="text-3xl font-black text-center text-indigo-900 italic leading-tight">
              "{currentQuestion.text}"
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(currentQuestion.options).map(([key, val]) => {
              const isCorrectChoice = key === currentQuestion.correctOption;
              const isSelected = selectedChoice === key;

              return (
                <button
                  key={key}
                  disabled={answered}
                  onClick={() => handleAnswer(key)}
                  className={`p-8 rounded-[2rem] font-black text-left text-xl transition-all border-b-8 shadow-xl active:translate-y-1
        ${
          !answered
            ? "bg-white text-indigo-900 border-gray-300 hover:bg-gray-50"
            : isCorrectChoice
              ? "bg-[#10ad59] text-white border-[#096132] scale-105 z-10" // VERDE PARA A CORRETA
              : isSelected
                ? "bg-[#e21b3c] text-white border-[#a0132b] opacity-50" // VERMELHO SE ERROU
                : "bg-gray-100 text-gray-400 border-gray-200 opacity-30" // CINZA PARA AS OUTRAS
        }
      `}
                >
                  <span className="flex items-center gap-4">
                    <span className="bg-black/10 w-10 h-10 rounded-full flex items-center justify-center text-sm">
                      {key.toUpperCase()}
                    </span>
                    {val}
                  </span>
                </button>
              );
            })}
          </div>

          {answered && (
            <div
              className={`mt-12 p-8 rounded-[2.5rem] text-center animate-bounce border-b-8 shadow-2xl ${isCorrect ? "bg-[#10ad59] border-[#096132]" : "bg-[#e21b3c] border-[#a0132b]"}`}
            >
              <p className="text-3xl font-black uppercase italic tracking-tighter">
                {isCorrect ? "✨ MANDOU BEM!" : "❌ OPS! ERROU..."}
              </p>
              <p className="text-sm font-bold opacity-80 mt-2 uppercase">
                Olhe para o telão do professor!
              </p>
            </div>
          )}
        </div>
        <LeoGomesFooter />
      </div>
    );
  if (view === "gameover") {
    return (
      <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white text-indigo-900 p-10 rounded-[3rem] shadow-2xl border-b-8 border-gray-300 max-w-md w-full animate-in zoom-in duration-500">
          <span className="text-6xl mb-4 block">🏆</span>
          <h2 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">
            Fim de Jogo!
          </h2>
          <p className="text-indigo-500 font-bold mb-8">
            Parabéns pelo seu desempenho, {playerName}!
          </p>

          <div className="space-y-4">
            {/* BOTÃO PARA VOLTAR AO INÍCIO */}
            <button
              onClick={() => window.location.reload()} // Forma mais simples de resetar tudo
              className="w-full py-5 bg-[#10ad59] text-white rounded-2xl font-black text-xl shadow-[0_5px_0_0_#096132] active:translate-y-1 active:shadow-none transition-all uppercase"
            >
              🎮 NOVA PARTIDA
            </button>

            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">
              SALA ENCERRADA: {gameCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function LeoGomesFooter() {
  return (
    <footer className="w-full bg-black/40 backdrop-blur-md p-8 border-t-4 border-white/5 text-center flex flex-col items-center gap-4">
      <p className="font-black text-white/40 uppercase tracking-[0.3em] text-[10px]">
        Crafted with 💜 by
      </p>
      <a
        href="https://leogomesdev.com"
        target="_blank"
        rel="noreferrer"
        className="text-2xl font-black italic tracking-tighter text-white hover:text-yellow-400 transition-all hover:scale-110"
      >
        LEO GOMES <span className="text-yellow-400">DEV</span>
      </a>
    </footer>
  );
}
