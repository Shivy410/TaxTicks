-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "ppsn" TEXT,
    "prsi_class" TEXT NOT NULL DEFAULT 'S1',
    "annual_tax_credits" DOUBLE PRECISION NOT NULL DEFAULT 4000,
    "standard_rate_cut_off" DOUBLE PRECISION NOT NULL DEFAULT 44000,
    "start_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_director" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "pay_period" TEXT NOT NULL,
    "gross_pay" DOUBLE PRECISION NOT NULL,
    "paye" DOUBLE PRECISION NOT NULL,
    "usc" DOUBLE PRECISION NOT NULL,
    "prsi" DOUBLE PRECISION NOT NULL,
    "total_deductions" DOUBLE PRECISION NOT NULL,
    "net_pay" DOUBLE PRECISION NOT NULL,
    "ytd_gross" DOUBLE PRECISION NOT NULL,
    "ytd_paye" DOUBLE PRECISION NOT NULL,
    "ytd_usc" DOUBLE PRECISION NOT NULL,
    "ytd_prsi" DOUBLE PRECISION NOT NULL,
    "pdf_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslip_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employees_user_id_idx" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "payslip_records_user_id_idx" ON "payslip_records"("user_id");

-- CreateIndex
CREATE INDEX "payslip_records_employee_id_idx" ON "payslip_records"("employee_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_records" ADD CONSTRAINT "payslip_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_records" ADD CONSTRAINT "payslip_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
