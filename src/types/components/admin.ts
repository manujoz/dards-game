import type { Player } from "@prisma/client";

import type { Scoreboard } from "@/types/models/darts";

export interface PlayerListProps {
    initialPlayers: Player[];
}

export interface CreatePlayerDialogProps {
    className?: string;
}

export interface EditPlayerDialogProps {
    player: Player;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface DeletePlayerDialogProps {
    player: Player;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface PlayerRowActionsProps {
    player: Player;
}

export interface MatchRowActionsProps {
    matchId: string;
    status: string;
    detailsHref: string;
}

export interface AbortedMatchRowActionsProps {
    matchId: string;
    detailsHref: string;
}

export interface MatchDetailsHeaderPlayer {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
}

export interface MatchDetailsHeaderProps {
    matchId: string;
    gameLabel: string;
    statusLabel: string;
    status: string;
    startedAt: Date;
    endedAt?: Date | null;
    lastActivityAt?: Date | null;
    players: MatchDetailsHeaderPlayer[];
    winnerName?: string;
    winnerAvatarUrl?: string | null;
    backHref: string;
}

export interface MatchDetailsActionsProps {
    matchId: string;
    status: string;
}

export interface MatchDetailsScoreboardProps {
    scoreboard: Scoreboard;
}

export interface MatchDetailsThrowItem {
    id: string;
    participantId: string;
    playerId: string;
    playerName: string;
    roundIndex: number;
    displayRoundIndex: number;
    throwIndex: number;
    segment: number;
    multiplier: number;
    points: number;
    isBust: boolean;
    isWin: boolean;
    isValid: boolean;
    timestamp: Date;
}

export interface MatchDetailsThrowsRound {
    roundIndex: number;
    displayRoundIndex: number;
    throws: MatchDetailsThrowItem[];
}

export interface MatchDetailsThrowsProps {
    rounds: MatchDetailsThrowsRound[];
    isZeroBasedRounds: boolean;
}

export interface AdminSidebarProps {
    title?: string;
}
