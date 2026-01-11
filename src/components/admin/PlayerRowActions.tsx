"use client";

import type { PlayerRowActionsProps } from "@/types/components";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DeletePlayerDialog } from "./DeletePlayerDialog";
import { EditPlayerDialog } from "./EditPlayerDialog";

export function PlayerRowActions({ player, admins }: PlayerRowActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const canDelete = useMemo(() => admins.some((p) => p.admin) && !player.admin, [admins, player.admin]);

    async function handleCopyId() {
        try {
            await navigator.clipboard.writeText(player.id);
        } catch {
            // Clipboard may be unavailable depending on browser permissions.
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleCopyId}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => setDeleteOpen(true)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
                        disabled={!canDelete}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditPlayerDialog player={player} open={editOpen} onOpenChange={setEditOpen} />
            <DeletePlayerDialog player={player} admins={admins} open={deleteOpen} onOpenChange={setDeleteOpen} />
        </>
    );
}
