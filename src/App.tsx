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
  | "student-quiz";

interface Question {
  id: string;
  text: string;
  options: { a: string; b: string; c: string; d: string };
  isDouble: boolean;
  correctOption: string; // Removi o '?' para bater com o GameControl
}

export default function App() {
  // Estado tipado para evitar o uso de 'any'
  const [screen, setScreen] = useState<ScreenNames>("home");
  const [gameCode, setGameCode] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  // --- FUNÇÕES DE TRANSIÇÃO ---
  const handleTeacherMode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(code);
    setScreen("teacher");
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
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 font-nunito text-white">
      {screen === "home" && (
        <Home
          onSelectMode={(mode: string) => {
            if (mode === "teacher") {
              handleTeacherMode();
            } else {
              setScreen(mode as ScreenNames);
            }
          }}
        />
      )}

      {screen === "teacher" && (
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
    </div>
  );
}
