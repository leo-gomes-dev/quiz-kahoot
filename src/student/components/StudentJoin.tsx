import { useState } from "react";
import { supabase } from "../../lib/supabase";

interface StudentJoinProps {
  onBack: () => void;
  onJoin: (name: string, code: string) => void;
}

export default function StudentJoin({ onBack, onJoin }: StudentJoinProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedName.length < 3)
      return alert("Seu nome precisa de pelo menos 3 letras! 👤");
    if (trimmedCode.length !== 6)
      return alert("O código da sala tem 6 caracteres! 🔑");

    setIsLoading(true);

    try {
      // 1. VERIFICAÇÃO FLEXÍVEL: Permite entrar no lobby OU se a partida acabou de começar
      const { data: game, error: gameError } = await supabase
        .from("game_status")
        .select("status")
        .eq("game_code", trimmedCode)
        .maybeSingle();

      if (gameError || !game) {
        setIsLoading(false);
        return alert("Sala não encontrada! Verifique o código. ❌");
      }

      // CORREÇÃO: Adicionado 'started' e 'ranking' para permitir entrada se o prof já clicou em iniciar
      const allowedStatuses = ["lobby", "started", "ranking"];
      if (!allowedStatuses.includes(game.status)) {
        setIsLoading(false);
        return alert(
          "Esta partida já está em andamento e não aceita novos jogadores! 🔐",
        );
      }

      // 2. INSERE NO RANKING (Leaderboard)
      const { error: joinError } = await supabase.from("leaderboard").insert({
        game_code: trimmedCode,
        player_name: trimmedName,
        score: 0,
      });

      if (joinError) {
        console.error("Erro ao entrar:", joinError.message);
        if (joinError.code === "23505") {
          alert("Este nome já está sendo usado nesta sala! Escolha outro. 👤");
        } else {
          alert("Erro ao conectar. Tente novamente! ❌");
        }
      } else {
        // Sucesso total - o StudentQuiz vai detectar o status atual e sincronizar
        onJoin(trimmedName, trimmedCode);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Erro de conexão. Verifique sua internet! 🌐");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all font-black text-[10px] border border-white/10 uppercase"
        >
          ← Voltar
        </button>

        <div className="bg-white rounded-[3rem] p-10 w-full max-w-md border-b-8 border-gray-300 shadow-2xl animate-in zoom-in duration-300">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-4xl font-black text-indigo-900 italic tracking-tighter uppercase">
              Entrar no Jogo
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-indigo-300 ml-2 tracking-widest">
                Seu Apelido
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: LeoGomes"
                maxLength={20}
                className="w-full bg-indigo-50 border-4 border-indigo-100 text-indigo-900 font-bold rounded-2xl p-5 mt-1 outline-none focus:border-indigo-400 transition-all"
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
                placeholder="000000"
                className="w-full bg-indigo-50 border-4 border-indigo-100 text-indigo-900 text-center text-4xl font-black tracking-[0.2em] rounded-2xl p-5 mt-1 outline-none focus:border-yellow-400 transition-all uppercase"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={
                isLoading || name.trim().length < 3 || code.trim().length < 6
              }
              className="w-full mt-4 bg-[#10ad59] hover:bg-[#0d8c48] py-6 rounded-[2rem] font-black text-2xl text-white shadow-[0_6px_0_0_#096132] active:translate-y-1 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
            >
              {isLoading ? "CONECTANDO..." : "ENTRAR AGORA! 🚀"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
