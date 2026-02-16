import { useState, useEffect, useCallback, useRef } from "react"; // Adicionado useRef aqui
import { supabase } from "../lib/supabase";

// --- INTERFACES ESTRITAS (SEM ANY) ---
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

export default function TeacherPanel({
  gameCode,
  onBack,
  onStartGame,
}: TeacherPanelProps) {
  const [view, setView] = useState<"setup" | "library">("setup");
  const [library, setLibrary] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null); // Para clique duplo genérico

  const [editingId, setEditingId] = useState<string | null>(null);
  const [blockName, setBlockName] = useState("Meu Bloco 🚀");
  const [text, setText] = useState("");
  const [opts, setOpts] = useState({ a: "", b: "", c: "", d: "" });
  const [correct, setCorrect] = useState("a");

  const inputRef = useRef<HTMLDivElement>(null);

  const refreshLibrary = useCallback(async () => {
    const { data, error } = await supabase
      .from("question_library")
      .select("*")
      .returns<QuestionLibraryRow[]>();

    if (error) return;

    if (data) {
      setLibrary(
        data.map((q: QuestionLibraryRow) => ({
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
      const { data, error } = await supabase
        .from("question_library")
        .select("*");
      if (error) return;
      if (isMounted && data) {
        setLibrary(
          data.map((q: QuestionLibraryRow) => ({
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
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [gameCode]);

  const resetForm = () => {
    setEditingId(null);
    setText("");
    setOpts({ a: "", b: "", c: "", d: "" });
    setCorrect("a");
  };

  const handleEditQuestion = (q: Question) => {
    setEditingId(q.id);
    setText(q.text);
    setOpts(q.options);
    setCorrect(q.correctOption);
    setBlockName(q.block_name || "Meu Bloco 🚀");

    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSave = async () => {
    if (!text || !opts.a || !opts.b) {
      setToast("Preencha a pergunta e ao menos duas opções! 📝");
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
    };

    const { error } = editingId
      ? await supabase
          .from("question_library")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("question_library").insert([payload]);

    if (!error) {
      setToast(editingId ? "Questão atualizada! ✨" : "Questão salva! ✅");
      resetForm();
      await refreshLibrary();
    } else {
      setToast("Erro ao salvar no banco ❌");
    }
    setTimeout(() => setToast(null), 3000);
  };

  const deleteBlock = async (name: string) => {
    if (confirmDeleteId !== name) {
      setConfirmDeleteId(name);
      setToast(`Clique novamente para apagar o bloco "${name}" ⚠️`);
      setTimeout(() => setConfirmDeleteId(null), 4000);
      return;
    }
    await supabase.from("question_library").delete().eq("block_name", name);
    setToast("Bloco deletado! 🗑️");
    setConfirmDeleteId(null);
    refreshLibrary();
    setTimeout(() => setToast(null), 3000);
  };

  const deleteSingleQuestion = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setToast("Clique novamente para excluir esta questão! ⚠️");
      setTimeout(() => setConfirmDeleteId(null), 4000);
      return;
    }
    await supabase.from("question_library").delete().eq("id", id);
    setToast("Questão removida! 🗑️");
    setConfirmDeleteId(null);
    refreshLibrary();
    setTimeout(() => setToast(null), 3000);
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
    }));
    await supabase.from("questions").insert(formatted);
    const { error } = await supabase
      .from("game_status")
      .upsert(
        { game_code: gameCode, status: "playing", current_question_index: 0 },
        { onConflict: "game_code" },
      );
    if (!error) onStartGame(questionsToPlay);
    setLoading(false);
  };

  const blocks = Array.from(new Set(library.map((q) => q.block_name)));

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col selection:bg-yellow-400 selection:text-indigo-900">
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-300 text-center w-full max-w-md px-4">
          <div className="bg-[#10ad59] text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 border-b-4 border-[#096132]">
            <span>✨</span> {toast}
          </div>
        </div>
      )}

      <div className="flex-1 p-4 md:p-10 pb-32 max-w-6xl mx-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white/10 p-6 rounded-[2rem] border-b-8 border-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-white/10 p-3 rounded-2xl hover:bg-red-500 transition-all font-black uppercase text-[10px] tracking-widest"
            >
              SAIR
            </button>
            <h1 className="text-3xl font-black italic tracking-tighter text-yellow-400 drop-shadow-lg">
              TEACHER PANEL 🍎
            </h1>
          </div>
          <div className="flex bg-black/20 p-2 rounded-3xl border border-white/10">
            <button
              onClick={() => setView("setup")}
              className={`px-8 py-3 rounded-2xl font-black transition-all ${view === "setup" ? "bg-yellow-400 text-indigo-900 translate-y-[-2px] shadow-[0_4px_0_0_#b58900]" : "hover:text-yellow-400"}`}
            >
              JOGAR
            </button>
            <button
              onClick={() => setView("library")}
              className={`px-8 py-3 rounded-2xl font-black transition-all ${view === "library" ? "bg-pink-500 text-white translate-y-[-2px] shadow-[0_4px_0_0_#9d174d]" : "hover:text-pink-400"}`}
            >
              QUESTÕES
            </button>
          </div>
        </header>

        {view === "setup" ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
            <h2 className="text-center text-2xl font-black uppercase tracking-widest text-white/70">
              Escolha o seu Bloco de Poder! ✨
            </h2>
            {blocks.map((block) => (
              <div
                key={block}
                className="bg-white rounded-[2.5rem] text-indigo-900 border-b-8 border-gray-300 overflow-hidden transition-all"
              >
                <div
                  className="p-8 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setExpandedBlock(expandedBlock === block ? null : block)
                  }
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-indigo-100 w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
                      📦
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase leading-none mb-1">
                        {block}
                      </h3>
                      <p className="text-sm font-extrabold text-indigo-400 uppercase tracking-widest">
                        {library.filter((q) => q.block_name === block).length}{" "}
                        Questões
                      </p>
                    </div>
                  </div>
                  <span className="text-3xl opacity-30">
                    {expandedBlock === block ? "▲" : "▼"}
                  </span>
                </div>
                {expandedBlock === block && (
                  <div className="px-8 pb-8 pt-4 border-t-2 border-gray-100 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                      {library
                        .filter((q) => q.block_name === block)
                        .map((q, i) => (
                          <div
                            key={q.id}
                            className="bg-indigo-50 p-4 rounded-2xl text-sm font-bold border border-indigo-100 flex gap-3"
                          >
                            <span className="text-indigo-300">#{i + 1}</span>{" "}
                            {q.text}
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() => startQuiz(block)}
                      disabled={loading}
                      className="w-full bg-[#10ad59] hover:bg-[#0d8c48] text-white py-6 rounded-[2rem] font-black text-2xl shadow-[0_6px_0_0_#096132] active:translate-y-1 transition-all"
                    >
                      {loading ? "PREPARANDO..." : "🚀 COMEÇAR QUIZ AGORA!"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div
              ref={inputRef}
              className="bg-white p-8 rounded-[3rem] border-b-8 border-gray-300 text-indigo-900 lg:sticky lg:top-10 z-20 shadow-2xl scroll-mt-10"
            >
              <h3 className="font-black text-2xl mb-8 flex items-center gap-2">
                {editingId ? "✏️ EDITANDO" : "➕ NOVA QUESTÃO"}
              </h3>
              <div className="space-y-4">
                <input
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  placeholder="Nome do Bloco"
                  className="w-full bg-indigo-50 border-2 border-indigo-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-400 transition"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Pergunta"
                  className="w-full bg-indigo-50 border-2 border-indigo-100 p-4 rounded-2xl font-bold h-24 outline-none focus:border-indigo-400 transition"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["a", "b", "c", "d"].map((l) => (
                    <div
                      key={l}
                      onClick={() => setCorrect(l)}
                      className="relative cursor-pointer transition-all"
                    >
                      <input
                        value={opts[l as keyof typeof opts]}
                        onChange={(e) =>
                          setOpts({ ...opts, [l]: e.target.value })
                        }
                        placeholder={`Opção ${l.toUpperCase()}`}
                        className={`w-full bg-indigo-50 border-4 p-4 rounded-2xl font-bold text-sm outline-none transition ${correct === l ? "border-green-500 bg-green-50" : "border-indigo-100"}`}
                      />
                      <div
                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 ${correct === l ? "bg-green-500 border-white" : "border-indigo-200"}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white p-5 rounded-[2rem] font-black text-xl shadow-[0_6px_0_0_#4c1d95] active:translate-y-1 active:shadow-none transition-all"
                  >
                    SALVAR
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="px-8 bg-gray-200 rounded-[2rem] font-black text-gray-500 hover:bg-gray-300 transition-all uppercase text-[10px]"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {blocks.map((block) => (
                <div
                  key={block}
                  className="bg-black/20 rounded-[2.5rem] p-6 border border-white/10 backdrop-blur-sm"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-yellow-400 uppercase italic tracking-tighter">
                      {block}
                    </h3>
                    <button
                      onClick={() => deleteBlock(block)}
                      className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all ${confirmDeleteId === block ? "bg-red-500 animate-pulse text-white shadow-none" : "bg-white/10 text-white hover:bg-red-500"}`}
                    >
                      {confirmDeleteId === block
                        ? "CONFIRMAR?"
                        : "APAGAR BLOCO"}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {library
                      .filter((q) => q.block_name === block)
                      .map((q) => (
                        <div
                          key={q.id}
                          className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-sm opacity-80 text-white truncate max-w-[200px]">
                              {q.text}
                            </span>
                            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest mt-1 italic">
                              Gabarito: {q.correctOption}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="bg-yellow-400 text-indigo-900 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-[0_2px_0_0_#b58900] active:translate-y-[1px]"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteSingleQuestion(q.id)}
                              className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:translate-y-[1px] ${confirmDeleteId === q.id ? "bg-red-500 animate-pulse text-white" : "bg-white/10 text-white hover:bg-red-500"}`}
                            >
                              {confirmDeleteId === q.id ? "OK?" : "🗑️"}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
