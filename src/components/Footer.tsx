export default function LeoGomesFooter() {
  return (
    <footer className="w-full bg-black/40 backdrop-blur-md p-8 border-t-4 border-white/5 text-center flex flex-col items-center gap-4">
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
    </footer>
  );
}
