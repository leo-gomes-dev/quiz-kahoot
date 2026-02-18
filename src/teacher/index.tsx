import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import LeoGomesFooter from "../components/footer";

// Importação dos subcomponentes refatorados
import { TeacherHeader } from "./components/TeacherHeader";
import { QuestionForm } from "./components/QuestionForm";
import { SetupView } from "./components/SetupView";
import { LibraryList } from "./components/LibraryList";

// --- INTERFACES ---
interface Question {
  id: string;
  text: string;
  options: { a: string; b: string; c: string; d: string };
  correctOption: string;
  isDouble: boolean;
  block_name: string;
}

interface QuestionLibraryRow {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  block_name: string;
  is_double: boolean;
}

interface TeacherPanelProps {
  gameCode: string;
  onBack: () => void;
  onStartGame: (questions: Question[]) => void;
}

type OptionKey = "a" | "b" | "c" | "d";

export default function TeacherPanel({
  gameCode,
  onBack,
  onStartGame,
}: TeacherPanelProps) {
  const [view, setView] = useState<"setup" | "library">("setup");
  const [library, setLibrary] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [expandedLibBlock, setExpandedLibBlock] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [blockName, setBlockName] = useState("Meu Bloco 🚀");
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<{ [key in OptionKey]: string }>({
    a: "",
    b: "",
    c: "",
    d: "",
  });
  const [correct, setCorrect] = useState("a");
  const [isDouble, setIsDouble] = useState(false);

  const inputRef = useRef<HTMLDivElement>(null);

  const refreshLibrary = useCallback(async () => {
    const { data, error } = await supabase
      .from("question_library")
      .select("*")
      .returns<QuestionLibraryRow[]>();

    if (!error && data) {
      setLibrary(
        data.map((q) => ({
          id: q.id,
          text: q.text,
          correctOption: q.correct_option,
          isDouble: q.is_double || false,
          block_name: q.block_name || "Geral",
          options: {
            a: q.option_a,
            b: q.option_b,
            c: q.option_c,
            d: q.option_d,
          },
        })),
      );
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await refreshLibrary();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [refreshLibrary]);

  const resetForm = () => {
    setEditingId(null);
    setText("");
    setOpts({ a: "", b: "", c: "", d: "" });
    setCorrect("a");
    setIsDouble(false);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingId(q.id);
    setText(q.text);
    setOpts(q.options as { [key in OptionKey]: string });
    setCorrect(q.correctOption);
    setBlockName(q.block_name);
    setIsDouble(q.isDouble);
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    if (!text || !opts.a || !opts.b) {
      setToast("Preencha tudo! 📝");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const payload = {
      text,
      option_a: opts.a,
      option_b: opts.b,
      option_c: opts.c,
      option_d: opts.d,
      correct_option: correct,
      block_name: blockName,
      is_double: isDouble,
    };

    const { error } = editingId
      ? await supabase
          .from("question_library")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("question_library").insert([payload]);

    if (!error) {
      setToast(editingId ? "Atualizado! ✨" : "Salvo! ✅");
      resetForm();
      refreshLibrary();
    }
    setTimeout(() => setToast(null), 3000);
  };

  const deleteSingleQuestion = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    await supabase.from("question_library").delete().eq("id", id);
    setConfirmDeleteId(null);
    refreshLibrary();
  };

  const handleConfirmedExit = async () => {
    if (!confirmExit) {
      setConfirmExit(true);
      setTimeout(() => setConfirmExit(false), 3000);
    } else {
      await supabase.from("game_status").delete().eq("game_code", gameCode);
      onBack();
    }
  };

  const startQuiz = async (name: string) => {
    setLoading(true);
    const questionsToPlay = library.filter((q) => q.block_name === name);
    await supabase.from("questions").delete().eq("game_code", gameCode);

    const formatted = questionsToPlay.map((q) => ({
      game_code: gameCode,
      text: q.text,
      option_a: q.options.a,
      option_b: q.options.b,
      option_c: q.options.c,
      option_d: q.options.d,
      correct_option: q.correctOption,
      is_double: q.isDouble,
    }));

    await supabase.from("questions").insert(formatted);
    await supabase
      .from("game_status")
      .upsert(
        { game_code: gameCode, status: "lobby", current_question_index: -1 },
        { onConflict: "game_code" },
      );
    onStartGame(questionsToPlay);
    setLoading(false);
  };

  const blocks = Array.from(new Set(library.map((q) => q.block_name)));

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col">
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-[#10ad59] px-8 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-top-10">
          {toast}
        </div>
      )}

      <div className="flex-1 p-4 md:p-10 pb-32 max-w-7xl mx-auto w-full">
        <TeacherHeader
          view={view}
          setView={setView}
          confirmExit={confirmExit}
          onExit={handleConfirmedExit}
        />

        {view === "setup" ? (
          <SetupView
            blocks={blocks}
            library={library}
            loading={loading}
            expandedBlock={expandedBlock}
            setExpandedBlock={setExpandedBlock}
            onStartQuiz={startQuiz}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <QuestionForm
              editingId={editingId}
              blockName={blockName}
              setBlockName={setBlockName}
              text={text}
              setText={setText}
              opts={opts}
              setOpts={setOpts}
              correct={correct}
              setCorrect={setCorrect}
              isDouble={isDouble}
              setIsDouble={setIsDouble}
              handleSave={handleSave}
              resetForm={resetForm}
              inputRef={inputRef}
            />
            <LibraryList
              blocks={blocks}
              library={library}
              expandedLibBlock={expandedLibBlock}
              setExpandedLibBlock={setExpandedLibBlock}
              onEdit={handleEditQuestion}
              onDelete={deleteSingleQuestion}
              confirmDeleteId={confirmDeleteId}
            />
          </div>
        )}
      </div>
      <LeoGomesFooter />
    </div>
  );
}
