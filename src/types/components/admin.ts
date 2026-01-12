import type { Player } from "@prisma/client";

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
}

export interface AdminSidebarProps {
    title?: string;
}
