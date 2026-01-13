-- Rankings (ELO por modo/variante + stats agregadas + resultados por match)

-- CreateTable
CREATE TABLE "player_mode_stats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "dartsValid" INTEGER NOT NULL DEFAULT 0,
    "pointsValid" INTEGER NOT NULL DEFAULT 0,
    "marks" INTEGER,
    "roundsPlayed" INTEGER NOT NULL DEFAULT 0,
    "lastMatchAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_mode_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_mode_ratings" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "ratingElo" INTEGER NOT NULL DEFAULT 1500,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "lastMatchAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_mode_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_results" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "isWin" BOOLEAN NOT NULL DEFAULT false,
    "dartsValid" INTEGER NOT NULL DEFAULT 0,
    "pointsValid" INTEGER NOT NULL DEFAULT 0,
    "marks" INTEGER,
    "roundsPlayed" INTEGER NOT NULL DEFAULT 0,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- Indexes y uniques (idempotencia y rendimiento)
CREATE INDEX "player_mode_stats_gameId_variantKey_idx" ON "player_mode_stats"("gameId", "variantKey");
CREATE INDEX "player_mode_stats_playerId_idx" ON "player_mode_stats"("playerId");
CREATE UNIQUE INDEX "player_mode_stats_playerId_gameId_variantKey_key" ON "player_mode_stats"("playerId", "gameId", "variantKey");

CREATE INDEX "player_mode_ratings_gameId_variantKey_idx" ON "player_mode_ratings"("gameId", "variantKey");
CREATE INDEX "player_mode_ratings_playerId_idx" ON "player_mode_ratings"("playerId");
CREATE UNIQUE INDEX "player_mode_ratings_playerId_gameId_variantKey_key" ON "player_mode_ratings"("playerId", "gameId", "variantKey");

CREATE INDEX "match_results_gameId_variantKey_idx" ON "match_results"("gameId", "variantKey");
CREATE INDEX "match_results_playerId_idx" ON "match_results"("playerId");
CREATE INDEX "match_results_matchId_idx" ON "match_results"("matchId");
CREATE UNIQUE INDEX "match_results_matchId_participantId_key" ON "match_results"("matchId", "participantId");

-- Foreign keys
ALTER TABLE "player_mode_stats" ADD CONSTRAINT "player_mode_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_mode_ratings" ADD CONSTRAINT "player_mode_ratings_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "match_results" ADD CONSTRAINT "match_results_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "match_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
