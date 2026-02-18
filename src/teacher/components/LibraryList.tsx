import React from "react";

// Definindo a interface da Questão para garantir segurança nos dados
interface Question {
  id: string;
  text: string;
  options: { a: string; b: string; c: string; d: string };
  correctOption: string;
  isDouble: boolean;
  block_name: string;
}

interface Props {
  blocks: string[];
  library: Question[]; // Tipagem da lista de questões
  expandedLibBlock: string | null;
  setExpandedLibBlock: (b: string | null) => void;
  onEdit: (q: Question) => void; // Tipagem da função de edição
  onDelete: (id: string) => void;
  confirmDeleteId: string | null;
}

export const LibraryList: React.FC<Props> = ({
  blocks,
  library,
  expandedLibBlock,
  setExpandedLibBlock,
  onEdit,
  onDelete,
  confirmDeleteId,
}) => (
  <div className="space-y-4">
    {blocks.map((block) => (
      <div
        key={block}
        className="bg-white/10 rounded-[2rem] border border-white/10 overflow-hidden"
      >
        <div
          className="p-6 flex justify-between items-center cursor-pointer hover:bg-white/5"
          onClick={() =>
            setExpandedLibBlock(expandedLibBlock === block ? null : block)
          }
        >
          <h4 className="font-black uppercase tracking-widest text-sm">
            {block}
          </h4>
          <span className="opacity-50">
            {expandedLibBlock === block ? "▲" : "▼"}
          </span>
        </div>
        {expandedLibBlock === block && (
          <div className="p-4 space-y-2 bg-black/20">
            {library
              .filter((q) => q.block_name === block)
              .map((q) => (
                <div
                  key={q.id}
                  className="bg-white/5 p-4 rounded-xl flex justify-between items-center group"
                >
                  <div className="flex-1">
                    <p className="font-bold text-sm leading-tight">{q.text}</p>
                    <p className="text-[10px] text-green-400 font-black mt-1 uppercase">
                      {/* Acesso seguro às chaves a, b, c, d via casting de string */}
                      ✓ {q.options[q.correctOption as keyof typeof q.options]}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(q)}
                      className="p-2 hover:bg-yellow-400 hover:text-indigo-900 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(q.id)}
                      className={`p-2 rounded-lg transition-all ${
                        confirmDeleteId === q.id
                          ? "bg-red-500 text-white scale-110"
                          : "hover:bg-red-500 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {confirmDeleteId === q.id ? "CERTO?" : "🗑️"}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    ))}
  </div>
);
