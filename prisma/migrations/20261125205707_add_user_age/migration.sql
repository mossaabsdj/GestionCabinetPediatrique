-- AlterTable
ALTER TABLE "public"."Cabinet" ADD COLUMN     "defaultConsultationPrice" DOUBLE PRECISION DEFAULT 2000;

-- AlterTable
ALTER TABLE "public"."Consultation" ADD COLUMN     "prix" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."Versement" (
    "id" SERIAL NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "patientId" INTEGER NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Versement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Depense" (
    "id" SERIAL NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Versement_patientId_idx" ON "public"."Versement"("patientId");

-- CreateIndex
CREATE INDEX "Versement_consultationId_idx" ON "public"."Versement"("consultationId");

-- CreateIndex
CREATE INDEX "Versement_date_idx" ON "public"."Versement"("date");

-- CreateIndex
CREATE INDEX "Depense_date_idx" ON "public"."Depense"("date");

-- AddForeignKey
ALTER TABLE "public"."Versement" ADD CONSTRAINT "Versement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Versement" ADD CONSTRAINT "Versement_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "public"."Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
