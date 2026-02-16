# 🚀 Quiz Interativo (Estilo Kahoot)

Um sistema de quiz em tempo real de alta performance, desenvolvido para ambientes educacionais e eventos. O projeto permite que um professor gerencie bibliotecas de questões e controle o fluxo de partidas ao vivo, enquanto os alunos competem instantaneamente.

🔗 **Acesse agora:** [quiz.leogomesdev.com](http://quiz.leogomesdev.com)

---

## ✨ Funcionalidades

### 🍎 Área do Mestre (Restrita)
*   **Autenticação Segura:** Acesso protegido por identificador dinâmico via `.env`.
*   **Gestão de Biblioteca:** Criação, edição e exclusão de questões organizadas por **Blocos de Poder**.
*   **Double Points (2x):** Ativação de pontuação dobrada com feedback visual 🔥.
*   **Painel de Controle:** Início imediato de partidas e reset de salas.

### 🎓 Área do Aluno
*   **Entrada Facilitada:** Acesso via código único de sala.
*   **Interface Gamer:** Design responsivo focado em rapidez de resposta.
*   **Feedback Instantâneo:** Toasts e animações de acerto/erro.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Vite](https://vitejs.dev) |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com), Glassmorphism, Framer Motion |
| **Backend** | [Supabase](https://supabase.com) (PostgreSQL & Real-time Subscriptions) |
| **Infraestrutura** | [Coolify](https://coolify.io), Docker, [Nginx Alpine](https://www.nginx.com) |

---

## 📦 Estrutura de Dados (Supabase)

O sistema utiliza a engine em tempo real do Supabase para sincronizar:
*   `question_library`: Banco de dados persistente de perguntas e blocos.
*   `questions`: Repositório de questões da partida em andamento.
*   `game_status`: Tabela de sincronização de estado (pergunta atual, status da sala).

---

## 🚀 Instalação Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com
   cd quiz-kahoot

   npm install

   npm run dev

