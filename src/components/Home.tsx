// --- INTERFACE DAS PROPS ---
interface HomeProps {
  onSelectMode: (mode: "teacher" | "student-join") => void;
}

export default function Home({ onSelectMode }: HomeProps) {
  return (
    <div className="min-h-screen bg-[#46178f] text-white font-nunito flex flex-col selection:bg-yellow-400 selection:text-indigo-900">
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
        {/* TÍTULO COM ESTILO DE LOGO DE JOGO */}
        <div className="text-center mb-12 animate-in slide-in-from-top-10 duration-700">
          <div className="text-8xl mb-4 drop-shadow-[0_8px_0_rgba(0,0,0,0.2)] animate-bounce">
            🎯
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase text-yellow-400 drop-shadow-[0_8px_0_#b58900]">
            Quiz <span className="text-white">Battle</span>
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 font-black uppercase tracking-[0.3em] mt-4 opacity-80">
            A arena do conhecimento
          </p>
        </div>

        {/* BOX DE SELEÇÃO */}
        <div className="w-full max-w-md space-y-6 animate-in zoom-in duration-500 delay-200">
          {/* BOTÃO PROFESSOR (VERDE) */}
          <button
            onClick={() => onSelectMode("teacher")}
            className="w-full group bg-[#10ad59] hover:bg-[#0d8c48] text-white text-2xl font-black py-6 px-8 rounded-[2rem] shadow-[0_8px_0_0_#096132] active:translate-y-1 active:shadow-none transition-all duration-150 flex items-center justify-center gap-4"
          >
            <span className="text-3xl group-hover:rotate-12 transition-transform">
              👨‍🏫
            </span>
            SOU PROFESSOR(A)
          </button>

          {/* BOTÃO ALUNO (AZUL) */}
          <button
            onClick={() => onSelectMode("student-join")}
            className="w-full group bg-[#1368ce] hover:bg-[#1059b0] text-white text-2xl font-black py-6 px-8 rounded-[2rem] shadow-[0_8px_0_0_#0a3d7a] active:translate-y-1 active:shadow-none transition-all duration-150 flex items-center justify-center gap-4"
          >
            <span className="text-3xl group-hover:scale-125 transition-transform">
              🎓
            </span>
            SOU ALUNO(A)
          </button>

          <p className="text-center text-white/30 font-bold uppercase text-[10px] tracking-widest pt-4">
            Escolha seu papel para entrar na arena
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
          {/* Link do Café Atualizado para o seu Checkout do Mercado Pago */}
          <a
            href="https://www.mercadopago.com.br"
            target="_blank"
            rel="noreferrer"
            className="bg-yellow-400 text-indigo-900 px-6 py-3 rounded-2xl font-black text-sm shadow-[0_4px_0_0_#b58900] hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-2"
          >
            ☕ APOIAR PROJETO
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
