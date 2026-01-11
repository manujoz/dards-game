import type { GameState } from "@/types/models/darts";

export interface CheckoutBustOverlayProps {
    open: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

export type GameHudLayout = "landscape" | "portrait";

export interface GameScoreboardProps {
    gameState: GameState;
    layout: GameHudLayout;
    isPaused: boolean;
    onOpenCricketMarks?: () => void;
}

export interface CricketMarksOverlayProps {
    open: boolean;
    gameState: GameState;
    onClose: () => void;
}

export interface HiddenTopBarProps {
    defaultShowNewGame?: boolean;
    canRestartSameConfig?: boolean;
    onRestartSameConfig?: () => void;
}
