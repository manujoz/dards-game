import type { GameState, Hit } from "@/types/models/darts";

export interface GameControllerProps {
    initialState: GameState | null;
}

export interface CalibrationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getBoardRect: () => DOMRect | null;
}

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
    getBoardRect?: () => DOMRect | null;
}

export interface DartboardCanvasThrowCoordinates {
    x: number;
    y: number;
}

export interface DartboardCanvasMarker {
    x: number;
    y: number;
}

export interface DartboardCanvasProps {
    onThrow: (hit: Hit, coordinates: DartboardCanvasThrowCoordinates) => boolean;
    disabled?: boolean;
}
