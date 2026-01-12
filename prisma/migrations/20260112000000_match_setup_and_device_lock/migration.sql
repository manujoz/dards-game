-- AlterTable
ALTER TABLE "matches" ADD COLUMN "controllerDeviceId" TEXT;
ALTER TABLE "matches" ADD COLUMN "controllerLeaseUntil" TIMESTAMP(3);
ALTER TABLE "matches" ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "matches_controllerDeviceId_idx" ON "matches"("controllerDeviceId");

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- DropTable
DROP TABLE "device_configs";

-- CreateTable
CREATE TABLE "device_configs" (
    "deviceId" TEXT NOT NULL,
    "calibration" TEXT NOT NULL DEFAULT '{}',
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_configs_pkey" PRIMARY KEY ("deviceId")
);
