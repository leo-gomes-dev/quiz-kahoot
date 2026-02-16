##🚀 Quiz Interativo (Estilo Kahoot)
Um sistema de quiz em tempo real de alta performance, desenvolvido para ambientes educacionais e eventos. O projeto permite que um professor gerencie bibliotecas de questões e controle o fluxo de partidas ao vivo, enquanto os alunos competem instantaneamente.
🔗 Acesse agora: quiz.leogomesdev.com
📸 Preview


##✨ Funcionalidades
##🍎 Área do Mestre (Restrita)
Autenticação Segura: Acesso protegido por identificador dinâmico via .env.
Gestão de Biblioteca: Criação, edição e exclusão de questões organizadas por Blocos de Poder.
Double Points (2x): Ativação de pontuação dobrada com feedback visual 🔥.
Painel de Controle: Início imediato de partidas e reset de salas.

##🎓 Área do Aluno
Entrada Facilitada: Acesso via código único de sala.
Interface Gamer: Design responsivo focado em rapidez de resposta.
Feedback Instantâneo: Toasts e animações de acerto/erro.

##🛠️ Tecnologias Utilizadas
Camada	Tecnologia
Frontend	React 19, TypeScript, Vite
Estilização	Tailwind CSS, Glassmorphism, Framer Motion
Backend	Supabase (PostgreSQL & Real-time Subscriptions)
Infraestrutura	Coolify, Docker, Nginx (Alpine)

##📦 Estrutura de Dados (Supabase)
O sistema utiliza a engine em tempo real do Supabase para sincronizar:
question_library: Banco de dados persistente de perguntas e blocos.
questions: Repositório de questões da partida em andamento.
game_status: Tabela de sincronização de estado (pergunta atual, status da sala).

##🚀 Instalação Local

Clone o repositório:
git clone https://github.com
cd quiz-kahoot

Instale as dependências:
npm install

Configuração de Ambiente (.env):
env
VITE_SUPABASE_URL=seu_projeto_url
VITE_SUPABASE_ANON_KEY=sua_chave_anon
VITE_ADMIN_EMAIL=leogomes

Execução:
npm run dev

##🎨 UI/UX Design
O projeto utiliza uma estética moderna com Glassmorphism, paleta de cores vibrantes (Indigo, Purple, Pink)
e foco total em acessibilidade e responsividade, garantindo uma experiência fluida tanto em dispositivos móveis quanto em desktops.

Desenvolvido com 💜 por Leo Gomes
🌐 leogomesdev.com | 🐙 GitHub
