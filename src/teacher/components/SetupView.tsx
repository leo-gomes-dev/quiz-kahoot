import React from "react";

// Definindo a interface da questão para eliminar o any
interface Question {
  id: string;
  text: string;
  block_name: string;
  // Adicione outras propriedades se necessário para manter a consistência
}

interface Props {
  blocks: string[];
  library: Question[]; // 🔥 Tipagem correta aqui
  loading: boolean;
  expandedBlock: string | null;
  setExpandedBlock: (b: string | null) => void;
  onStartQuiz: (name: string) => void;
}

export const SetupView: React.FC<Props> = ({
  blocks,
  library,
  loading,
  expandedBlock,
  setExpandedBlock,
  onStartQuiz,
}) => (
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
                onClick={() => onStartQuiz(block)}
                disabled={loading}
                className="w-full bg-[#10ad59] text-white py-6 rounded-[2rem] font-black text-2xl shadow-[0_6px_0_0_#096132] active:translate-y-1 transition-all"
              >
                {loading ? "PREPARANDO..." : "🚀 COMEÇAR QUIZ AGORA!"}
              </button>
            </div>
          )}
        </div>
      ))
    )}
  </div>
);
