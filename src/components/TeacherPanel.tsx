import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

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

  // Solução para o erro de setState: manter a lógica isolada
  const refreshLibrary = useCallback(async () => {
    const { data, error } = await supabase
      .from("question_library")
      .select("*")
      .returns<QuestionLibraryRow[]>();

    if (error) return;
    if (data) {
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

  // UseEffect corrigido para evitar cascading renders
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) await refreshLibrary();
    };
    load();
    return () => {
      active = false;
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
    setBlockName(q.block_name || "Meu Bloco 🚀");
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
    } else {
      setToast("Erro no banco ❌");
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
        { game_code: gameCode, status: "playing", current_question_index: 0 },
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
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white/10 p-6 rounded-[2rem] border-b-8 border-black/20">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-white/10 p-3 rounded-2xl hover:bg-red-500 font-black text-[10px]"
            >
              SAIR
            </button>
            <h1 className="text-3xl font-black italic text-yellow-400">
              TEACHER PANEL 🍎
            </h1>
          </div>
          <div className="flex bg-black/20 p-2 rounded-3xl">
            <button
              onClick={() => setView("setup")}
              className={`px-8 py-3 rounded-2xl font-black transition-all ${view === "setup" ? "bg-yellow-400 text-indigo-900 shadow-[0_4px_0_0_#b58900]" : ""}`}
            >
              JOGAR
            </button>
            <button
              onClick={() => setView("library")}
              className={`px-8 py-3 rounded-2xl font-black transition-all ${view === "library" ? "bg-pink-500 text-white shadow-[0_4px_0_0_#9d174d]" : ""}`}
            >
              QUESTÕES
            </button>
          </div>
        </header>

        {view === "setup" ? (
          <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
            {blocks.length === 0 ? (
              <div className="text-center p-10 opacity-50 font-bold border-4 border-dashed border-white/10 rounded-[2rem]">
                CARREGANDO BIBLIOTECAS... 📦
              </div>
            ) : (
              blocks.map((block) => (
                <div
                  key={block}
                  className="bg-white rounded-[2.5rem] text-indigo-900 border-b-8 border-gray-300 overflow-hidden transition-all shadow-2xl mb-4"
                >
                  <div
                    className="p-8 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      setExpandedBlock(expandedBlock === block ? null : block)
                    }
                  >
                    <div className="flex items-center gap-6">
                      <div className="bg-indigo-100 w-16 h-16 rounded-3xl flex items-center justify-center text-3xl">
                        📦
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">
                          {block}
                        </h3>
                        <p className="text-sm font-bold text-indigo-400">
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
                    <div className="px-8 pb-8 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6 opacity-60">
                        {library
                          .filter((q) => q.block_name === block)
                          .map((q, i) => (
                            <div
                              key={q.id}
                              className="text-xs font-bold bg-gray-100 p-2 rounded-lg"
                            >
                              #{i + 1} {q.text}
                            </div>
                          ))}
                      </div>
                      <button
                        onClick={() => startQuiz(block)}
                        disabled={loading}
                        className="w-full bg-[#10ad59] text-white py-6 rounded-[2rem] font-black text-2xl shadow-[0_6px_0_0_#096132] active:translate-y-1 active:shadow-none transition-all"
                      >
                        {loading ? "PREPARANDO..." : "🚀 COMEÇAR QUIZ AGORA!"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* FORMULÁRIO COM TIPAGEM CORRETA */}
            <div
              ref={inputRef}
              className="bg-white p-8 rounded-[3rem] border-b-8 border-gray-300 text-indigo-900 lg:sticky lg:top-10 h-fit shadow-2xl"
            >
              <h3 className="font-black text-2xl mb-6">
                {editingId ? "✏️ EDITANDO" : "➕ NOVA QUESTÃO"}
              </h3>
              <div className="space-y-4">
                <input
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  placeholder="Nome do Bloco"
                  className="w-full bg-indigo-50 border-2 p-4 rounded-2xl font-bold outline-none"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Pergunta"
                  className="w-full bg-indigo-50 border-2 p-4 rounded-2xl font-bold h-24 outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["a", "b", "c", "d"] as const).map((l) => (
                    <div
                      key={l}
                      onClick={() => setCorrect(l)}
                      className={`relative cursor-pointer p-4 rounded-2xl border-4 ${correct === l ? "border-green-500 bg-green-50" : "border-indigo-50 bg-indigo-50"}`}
                    >
                      <input
                        value={opts[l]}
                        onChange={(e) =>
                          setOpts({ ...opts, [l]: e.target.value })
                        }
                        onClick={(e) => e.stopPropagation()}
                        placeholder={`Opção ${l.toUpperCase()}`}
                        className="w-full bg-transparent font-bold outline-none"
                      />
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-3 p-4 bg-yellow-100 rounded-2xl cursor-pointer border-2 border-yellow-200">
                  <input
                    type="checkbox"
                    checked={isDouble}
                    onChange={(e) => setIsDouble(e.target.checked)}
                    className="w-6 h-6 accent-orange-600"
                  />
                  <span className="font-black text-orange-700 uppercase text-xs tracking-widest">
                    🔥 Valer Dobro (2x)
                  </span>
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-purple-600 text-white p-5 rounded-[2rem] font-black text-xl shadow-[0_6px_0_0_#4c1d95] active:translate-y-1"
                  >
                    SALVAR
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="px-8 bg-gray-200 rounded-[2rem] font-black text-gray-500"
                    >
                      X
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* LISTA DE BIBLIOTECA */}
            <div className="space-y-4">
              {blocks.map((block) => (
                <div
                  key={block}
                  className="bg-white/10 rounded-[2rem] border border-white/10 overflow-hidden"
                >
                  <div
                    className="p-6 flex justify-between items-center cursor-pointer hover:bg-white/5"
                    onClick={() =>
                      setExpandedLibBlock(
                        expandedLibBlock === block ? null : block,
                      )
                    }
                  >
                    <span className="font-black text-yellow-400 uppercase">
                      {block}
                    </span>
                    <span className="text-xs font-bold opacity-50">
                      {library.filter((q) => q.block_name === block).length}{" "}
                      questões {expandedLibBlock === block ? "▲" : "▼"}
                    </span>
                  </div>
                  {expandedLibBlock === block && (
                    <div className="p-4 space-y-3 bg-black/10 animate-in slide-in-from-top-2">
                      {library
                        .filter((q) => q.block_name === block)
                        .map((q) => (
                          <div
                            key={q.id}
                            className="bg-white/5 p-4 rounded-xl flex justify-between items-center group"
                          >
                            <p className="font-bold text-sm leading-tight flex-1 mr-4">
                              {q.isDouble && "🔥 "}
                              {q.text}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditQuestion(q)}
                                className="p-2 bg-yellow-400 text-indigo-900 rounded-lg text-xs font-bold transition-all hover:scale-110"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteSingleQuestion(q.id)}
                                className={`p-2 rounded-lg text-xs font-bold transition-all ${confirmDeleteId === q.id ? "bg-red-500 text-white" : "bg-white/10"}`}
                              >
                                {confirmDeleteId === q.id ? "OK?" : "🗑️"}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
