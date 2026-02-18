import React from "react";
// 🔥 Correção do import de tipos aqui:
import type { Dispatch, SetStateAction } from "react";

type OptionKey = "a" | "b" | "c" | "d";
type OptionsType = { [key in OptionKey]: string };

interface Props {
  editingId: string | null;
  blockName: string;
  setBlockName: Dispatch<SetStateAction<string>>;
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  opts: OptionsType;
  setOpts: Dispatch<SetStateAction<OptionsType>>;
  correct: string;
  setCorrect: Dispatch<SetStateAction<string>>;
  isDouble: boolean;
  setIsDouble: Dispatch<SetStateAction<boolean>>;
  handleSave: () => void;
  resetForm: () => void;
  inputRef: React.RefObject<HTMLDivElement | null>;
}

export const QuestionForm: React.FC<Props> = ({
  editingId,
  blockName,
  setBlockName,
  text,
  setText,
  opts,
  setOpts,
  correct,
  setCorrect,
  isDouble,
  setIsDouble,
  handleSave,
  resetForm,
  inputRef,
}) => (
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
              onChange={(e) => setOpts({ ...opts, [l]: e.target.value })}
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
            className="px-8 bg-gray-200 rounded-[2rem] font-black text-gray-500 font-black"
          >
            CANCELAR
          </button>
        )}
      </div>
    </div>
  </div>
);
