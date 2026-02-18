import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Home from "./home";
import TeacherPanel from "./teacher";
import StudentJoin from "./student/components/StudentJoin";
import GameControl from "./GameControl";
import StudentQuiz from "./student";

type ScreenNames =
  | "home"
  | "teacher"
  | "student-join"
  | "game-control"
  | "student-quiz"
  | "admin-auth";

interface Question {
  id: string;
  text: string;
  options: { a: string; b: string; c: string; d: string };
  isDouble: boolean;
  correctOption: string;
}

export default function App() {
  // --- CARREGAMENTO INICIAL DO LOCALSTORAGE ---
  const [screen, setScreen] = useState<ScreenNames>(
    () => (localStorage.getItem("quiz_screen") as ScreenNames) || "home",
  );
  const [gameCode, setGameCode] = useState<string>(
    () => localStorage.getItem("quiz_gameCode") || "",
  );
  const [playerName, setPlayerName] = useState<string>(
    () => localStorage.getItem("quiz_playerName") || "",
  );
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem("quiz_questions");
    return saved ? JSON.parse(saved) : [];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem("quiz_auth") === "true",
  );

  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin-padrao";

  // --- PERSISTÊNCIA: SALVA SEMPRE QUE MUDA ---
  useEffect(() => {
    localStorage.setItem("quiz_screen", screen);
    localStorage.setItem("quiz_gameCode", gameCode);
    localStorage.setItem("quiz_playerName", playerName);
    localStorage.setItem("quiz_auth", String(isAuthenticated));
    localStorage.setItem("quiz_questions", JSON.stringify(quizQuestions));
  }, [screen, gameCode, playerName, isAuthenticated, quizQuestions]);

  const handleTeacherMode = () => {
    if (isAuthenticated) {
      if (gameCode)
        setScreen("teacher"); // Se já tem código, volta pra sala
      else generateGameAndGo();
    } else {
      setScreen("admin-auth");
    }
  };

  const generateGameAndGo = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(code);
    setScreen("teacher");
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (emailInput.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase()) {
      setIsAuthenticated(true);
      generateGameAndGo();
    } else {
      setError("Identificação inválida.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleStartGame = async (questions: Question[]) => {
    setQuizQuestions(questions);
    const { error: supabaseError } = await supabase.from("game_status").upsert(
      {
        game_code: gameCode,
        status: "lobby",
        current_question_index: -1,
      },
      { onConflict: "game_code" },
    );

    if (supabaseError) {
      console.error("Erro ao iniciar jogo no banco:", supabaseError.message);
      return;
    }

    setScreen("game-control");

    if (!error) setScreen("game-control");
  };

  const handleFinishGame = () => {
    // LIMPA TUDO AO TERMINAR
    localStorage.clear();
    setScreen("home");
    setGameCode("");
    setQuizQuestions([]);
    setPlayerName("");
    setIsAuthenticated(true); // Mantém logado se quiser, ou false para logout total
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 font-nunito text-white">
      {screen === "admin-auth" && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black">
          {/* EFEITO DE LUZ DE FUNDO */}
          <div className="absolute w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] animate-pulse" />

          <div className="relative bg-white/5 p-8 md:p-12 rounded-[3rem] backdrop-blur-2xl border-2 border-white/10 w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* DECORAÇÃO GAMER (LINHAS LATERAIS) */}
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-pink-500 to-indigo-500 opacity-50" />

            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 mb-6 shadow-[0_0_30px_rgba(219,39,119,0.4)] rotate-3 animate-bounce-slow">
                <svg
                  className="w-12 h-12 text-white drop-shadow-lg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>

              <h2 className="text-4xl font-[900] tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-200 to-indigo-200 uppercase italic">
                Modo Mestre
              </h2>
              <p className="text-indigo-300/60 mt-2 font-black text-xs uppercase tracking-[0.3em]">
                Identify to Control the Arena
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="relative group">
                <label className="text-[10px] font-black text-pink-500 uppercase ml-4 mb-2 block tracking-widest opacity-70">
                  Acesso Restrito
                </label>
                <input
                  type="text"
                  placeholder="DIGITE SEU TOKEN..."
                  className={`w-full p-5 rounded-2xl bg-black/40 border-2 ${error ? "border-red-500 animate-shake" : "border-white/10"} focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all text-white font-black text-center text-xl placeholder:text-white/10 uppercase tracking-widest`}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  autoFocus
                />
                {error && (
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-tighter bg-red-500/10 py-1 rounded-lg border border-red-500/20">
                      ⚠️ {error}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="group relative w-full overflow-hidden rounded-2xl p-5 font-black text-xl uppercase tracking-tighter transition-all active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 transition-all group-hover:scale-110" />
                <span className="relative flex items-center justify-center gap-3">
                  Entrar na Arena
                  <svg
                    className="w-6 h-6 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </span>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20" />
              </button>

              <button
                type="button"
                onClick={() => setScreen("home")}
                className="w-full text-indigo-300/40 hover:text-pink-400 text-[10px] font-black py-2 uppercase tracking-widest transition-colors"
              >
                ← Abortar Missão
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="h-full w-full">
        {screen === "home" && (
          <Home
            onSelectMode={(mode) =>
              mode === "teacher"
                ? handleTeacherMode()
                : setScreen(mode as ScreenNames)
            }
          />
        )}

        {screen === "teacher" && isAuthenticated && (
          <TeacherPanel
            gameCode={gameCode}
            onBack={() => setScreen("home")}
            onStartGame={handleStartGame}
          />
        )}

        {screen === "student-join" && (
          <StudentJoin
            onBack={() => setScreen("home")}
            onJoin={(name, code) => {
              setPlayerName(name);
              setGameCode(code);
              setScreen("student-quiz");
            }}
          />
        )}

        {screen === "game-control" && (
          <GameControl
            questions={quizQuestions}
            gameCode={gameCode}
            onFinish={handleFinishGame}
            onReset={() => setScreen("teacher")}
          />
        )}

        {screen === "student-quiz" && (
          <StudentQuiz
            gameCode={gameCode}
            playerName={playerName}
            onExit={handleFinishGame}
          />
        )}
      </main>
    </div>
  );
}
