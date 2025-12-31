-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "predictedPaymentDate" TIMESTAMP(3),
ADD COLUMN     "predictedPaymentDays" DOUBLE PRECISION,
ADD COLUMN     "predictionConfidence" DOUBLE PRECISION;
