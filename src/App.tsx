import { useState } from "react";
import { supabase } from "./lib/supabase";
import Home from "./components/Home";
import TeacherPanel from "./components/TeacherPanel";
import StudentJoin from "./components/StudentJoin";
import GameControl from "./components/GameControl";
import StudentQuiz from "./components/StudentQuiz";

// --- DEFINIÇÃO DE TIPOS ---
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
  const [screen, setScreen] = useState<ScreenNames>("home");
  const [gameCode, setGameCode] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  // --- ESTADOS DE AUTENTICAÇÃO & UI ---
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // BUSCA O VALOR DO .ENV (Vite)
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin-padrao";

  const handleTeacherMode = () => {
    if (isAuthenticated) {
      generateGameAndGo();
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

    // Validação robusta contra espaços e letras maiúsculas
    const inputClean = emailInput.trim().toLowerCase();
    const adminClean = ADMIN_EMAIL.trim().toLowerCase();

    if (inputClean === adminClean) {
      setIsAuthenticated(true);
      generateGameAndGo();
    } else {
      setError("Identificação inválida. Acesso negado.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleStartGame = async (questions: Question[]) => {
    setQuizQuestions(questions);
    const { error } = await supabase.from("game_status").upsert(
      {
        game_code: gameCode,
        status: "started",
        current_question_index: 0,
      },
      { onConflict: "game_code" },
    );

    if (error) {
      console.error("Erro ao iniciar jogo:", error.message);
      return;
    }
    setScreen("game-control");
  };

  const handleFinishGame = () => {
    setScreen("home");
    setGameCode("");
    setQuizQuestions([]);
    setPlayerName("");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 font-nunito text-white selection:bg-pink-500/30">
      {/* TELA DE LOGIN DO PROFESSOR */}
      {screen === "admin-auth" && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-xl border border-white/20 w-full max-w-md shadow-2xl shadow-black/40">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-500/20 mb-4 border border-pink-500/30 shadow-inner">
                <svg
                  className="w-8 h-8 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Painel Administrativo
              </h2>
              <p className="text-indigo-200/70 mt-2 font-medium text-sm">
                Insira seu identificador de mestre
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div className="relative group">
                <input
                  type="text" // Alterado para text para aceitar 'leogomes'
                  placeholder="Identificador do Professor"
                  className={`w-full p-4 rounded-xl bg-black/30 border-2 ${error ? "border-red-500 shadow-lg shadow-red-500/10" : "border-white/10"} focus:outline-none focus:border-pink-500/50 transition-all text-white placeholder:text-white/20`}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  autoFocus
                />
                {error && (
                  <p className="text-red-400 text-xs mt-3 ml-1 font-bold animate-pulse uppercase tracking-wider">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 active:scale-[0.98] transition-all p-4 rounded-xl font-black text-lg tracking-wide shadow-xl shadow-pink-900/40"
              >
                AUTENTICAR
              </button>

              <button
                type="button"
                onClick={() => setScreen("home")}
                className="w-full text-white/40 hover:text-white text-xs font-bold transition-colors py-2 uppercase tracking-tighter"
              >
                Voltar para a página inicial
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO DAS TELAS PRINCIPAIS */}
      <main className="h-full w-full">
        {screen === "home" && (
          <Home
            onSelectMode={(mode: string) => {
              if (mode === "teacher") handleTeacherMode();
              else setScreen(mode as ScreenNames);
            }}
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
            onJoin={(name: string, code: string) => {
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
          <StudentQuiz gameCode={gameCode} playerName={playerName} />
        )}
      </main>
    </div>
  );
}
