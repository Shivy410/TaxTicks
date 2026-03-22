-- AlterTable
ALTER TABLE "payslip_records"
ADD COLUMN "salary_transaction_id" UUID,
ADD COLUMN "liability_transaction_id" UUID;

-- CreateIndex
CREATE INDEX "payslip_records_salary_transaction_id_idx" ON "payslip_records"("salary_transaction_id");

-- CreateIndex
CREATE INDEX "payslip_records_liability_transaction_id_idx" ON "payslip_records"("liability_transaction_id");
