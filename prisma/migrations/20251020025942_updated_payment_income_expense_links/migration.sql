-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "expenseLogId" TEXT,
ADD COLUMN     "incomeLogId" TEXT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_incomeLogId_fkey" FOREIGN KEY ("incomeLogId") REFERENCES "income_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_expenseLogId_fkey" FOREIGN KEY ("expenseLogId") REFERENCES "expense_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
