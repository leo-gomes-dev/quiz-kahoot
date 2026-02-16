// --- INTERFACE DAS PROPS ---
interface StudentWaitingProps {
  playerName: string;
  gameCode: string;
}

export default function StudentWaiting({
  playerName,
  gameCode,
}: StudentWaitingProps) {
  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col selection:bg-yellow-400 selection:text-indigo-900">
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
        {/* ÍCONE ANIMADO COM BRILHO */}
        <div className="relative mb-8 animate-in zoom-in duration-500">
          <div className="text-8xl animate-bounce drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]">
            ⏳
          </div>
          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl animate-pulse -z-10"></div>
        </div>

        {/* CARD DE STATUS DO ALUNO */}
        <div className="bg-white rounded-[3rem] p-10 w-full max-w-md border-b-8 border-gray-300 shadow-2xl text-center animate-in slide-in-from-bottom-10 duration-700">
          <h2 className="text-4xl font-black text-indigo-900 italic tracking-tighter uppercase mb-4">
            Você está no jogo!
          </h2>

          <div className="bg-indigo-50 px-6 py-4 rounded-3xl border-4 border-indigo-100 mb-6">
            <p className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.2em] mb-1">
              Seu nome na arena:
            </p>
            <p className="text-3xl text-indigo-600 font-black uppercase tracking-tight">
              {playerName || "Viajante"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 bg-[#46178f] text-white px-5 py-2 rounded-full w-fit mx-auto mb-8 shadow-lg">
            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">
              Sala:
            </span>
            <span className="font-black text-yellow-400">{gameCode}</span>
          </div>

          <p className="text-indigo-400 font-extrabold text-lg leading-tight">
            O professor está preparando as perguntas... <br />
            <span className="text-indigo-950 uppercase italic text-xl">
              Fique atento! 🚀
            </span>
          </p>

          {/* LOADING SPINNER CUSTOMIZADO */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-indigo-50 border-t-[#10ad59] rounded-full animate-spin"></div>
            </div>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] animate-pulse">
              Aguardando início
            </p>
          </div>
        </div>

        {/* DICA DIVERTIDA */}
        <div className="mt-8 bg-black/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 max-w-xs animate-in fade-in duration-1000 delay-500">
          <p className="text-sm text-purple-200 font-bold flex items-center gap-3">
            <span className="text-xl">💡</span>
            Dica: Respostas rápidas valem mais pontos no ranking!
          </p>
        </div>
      </div>

      {/* FOOTER LEO GOMES DEV */}
      <footer className="w-full bg-black/40 backdrop-blur-md p-8 border-t-4 border-white/5 text-center flex flex-col items-center gap-4 mt-auto">
        <p className="font-black text-white/40 uppercase tracking-[0.3em] text-[10px]">
          Crafted with 💜 by
        </p>
        <a
          href="https://leogomesdev.com"
          target="_blank"
          rel="noreferrer"
          className="text-2xl font-black italic tracking-tighter text-white hover:text-yellow-400 transition-all hover:scale-110"
        >
          LEO GOMES <span className="text-yellow-400">DEV</span>
        </a>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <a
            href="https://www.mercadopago.com.br"
            target="_blank"
            rel="noreferrer"
            className="bg-yellow-400 text-indigo-900 px-6 py-3 rounded-2xl font-black text-sm shadow-[0_4px_0_0_#b58900] hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-2"
          >
            ☕ PAGAR UM CAFÉ
          </a>
          <a
            href="https://leogomesdev.com"
            target="_blank"
            rel="noreferrer"
            className="bg-white/10 px-6 py-3 rounded-2xl font-black text-sm border border-white/10 hover:bg-white/20 transition-all tracking-widest"
          >
            SITE 🌐
          </a>
        </div>
        <p className="text-[10px] font-bold text-white/20 mt-4 uppercase tracking-widest">
          © 2024 - Projeto Quiz Battle
        </p>
      </footer>
    </div>
  );
}
