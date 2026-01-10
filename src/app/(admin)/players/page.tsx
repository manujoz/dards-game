import { getPlayers } from "@/app/actions/players";
import { PlayerList } from "@/components/admin/PlayerList";

export default async function PlayersPage() {
    const result = await getPlayers();
    const players = result.success && result.data ? result.data : [];

    return <PlayerList initialPlayers={players} />;
}
