import { Badge } from "@/components/ui/badge";

export type Difficulty = "easy" | "medium" | "hard";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  points: number;
  className?: string;
}

const difficultyConfig = {
  easy: {
    label: "Easy",
    className: "bg-easy/20 text-easy border-easy/50"
  },
  medium: {
    label: "Medium", 
    className: "bg-medium/20 text-medium border-medium/50"
  },
  hard: {
    label: "Hard",
    className: "bg-hard/20 text-hard border-hard/50"
  }
};

export function DifficultyBadge({ difficulty, points, className }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];

  return (
    <Badge variant="outline" className={`${config.className} ${className}`}>
      {config.label} • {points}pts
    </Badge>
  );
}