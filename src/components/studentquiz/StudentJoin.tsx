import { useState } from "react";
import { supabase } from "../../lib/supabase"; // Certifique-se de que o caminho está correto

interface StudentJoinProps {
  onBack: () => void;
  onJoin: (name: string, code: string) => void;
}

export default function StudentJoin({ onBack, onJoin }: StudentJoinProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Novo: para evitar cliques duplos

  const handleJoin = async () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedName.length < 3) {
      return alert("Ei! Seu nome precisa de pelo menos 3 letras! 👤");
    }
    if (trimmedCode.length !== 6) {
      return alert("O código da sala tem exatamente 6 caracteres! 🔑");
    }

    setIsLoading(true);

    try {
      // CORREÇÃO CRÍTICA: Inserir o aluno no banco para o contador do professor subir
      const { error } = await supabase.from("leaderboard").insert({
        game_code: trimmedCode,
        player_name: trimmedName,
        score: 0,
      });

      if (error) {
        // Se der erro, provavelmente a sala não existe ou o nome já está em uso
        console.error("Erro ao entrar:", error.message);
        alert("Erro ao entrar na sala. Verifique o código! ❌");
      } else {
        // Se deu certo, aí sim chamamos a função para mudar de tela
        onJoin(trimmedName, trimmedCode);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col selection:bg-yellow-400 selection:text-indigo-900">
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all font-black text-[10px] tracking-widest border border-white/10 uppercase"
        >
          ← Voltar
        </button>

        <div className="bg-white rounded-[3rem] p-10 w-full max-w-md border-b-8 border-gray-300 shadow-2xl animate-in zoom-in duration-300">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 drop-shadow-sm">🎮</div>
            <h2 className="text-4xl font-black text-indigo-900 italic tracking-tighter uppercase">
              Entrar no Jogo
            </h2>
            <p className="text-indigo-300 font-bold text-sm uppercase tracking-widest mt-2">
              Prepare-se para o desafio!
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-indigo-300 ml-2 tracking-widest">
                Como quer ser chamado?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu Apelido..."
                maxLength={20}
                className="w-full bg-indigo-50 border-4 border-indigo-100 text-indigo-900 font-bold rounded-2xl p-5 mt-1 outline-none focus:border-indigo-400 transition-all placeholder:text-indigo-200"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-indigo-300 ml-2 tracking-widest">
                Código da Sala
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="------"
                className="w-full bg-indigo-50 border-4 border-indigo-100 text-indigo-900 text-center text-4xl font-black tracking-[0.3em] rounded-2xl p-5 mt-1 outline-none focus:border-yellow-400 transition-all uppercase placeholder:text-indigo-100"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={
                isLoading || name.trim().length < 3 || code.trim().length < 6
              }
              className="w-full mt-4 bg-[#10ad59] hover:bg-[#0d8c48] py-6 rounded-[2rem] font-black text-2xl text-white shadow-[0_6px_0_0_#096132] active:translate-y-1 transition-all disabled:opacity-40"
            >
              {isLoading ? "CONECTANDO..." : "ENTRAR NA BATALHA! 🚀"}
            </button>
          </div>
        </div>
      </div>
      {/* ... footer mantido ... */}
    </div>
  );
}
