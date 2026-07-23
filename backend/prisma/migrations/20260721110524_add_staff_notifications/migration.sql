-- CreateEnum
CREATE TYPE "StaffNotificationType" AS ENUM ('APPOINTMENT_TODAY', 'APPOINTMENT_TOMORROW', 'APPOINTMENT_CANCELLED', 'INVOICE_UNPAID', 'BACKUP_SUCCESS', 'BACKUP_FAILURE');

-- CreateTable
CREATE TABLE "StaffNotification" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "type" "StaffNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffNotification_doctorId_isRead_idx" ON "StaffNotification"("doctorId", "isRead");

-- CreateIndex
CREATE INDEX "StaffNotification_doctorId_createdAt_idx" ON "StaffNotification"("doctorId", "createdAt");
