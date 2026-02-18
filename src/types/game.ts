// Verifique se a palavra 'export' está presente em todas
export interface LeaderboardEntry {
  player_name: string;
  score: number;
  game_code: string;
}

export interface Question {
  id: string;
  text: string;
  options: { a: string; b: string; c: string; d: string };
  correctOption: string;
  isDouble: boolean;
}

export interface GameControlProps {
  questions: Question[];
  gameCode: string;
  onFinish: () => void;
  onReset: () => void;
}

export interface GameStatus {
  status: "waiting" | "playing" | "ranking" | "finished" | "started";
  current_question_index: number;
  game_code: string;
}

export type OptionKey = "a" | "b" | "c" | "d";
export type OptionsType = { [key in OptionKey]: string };
