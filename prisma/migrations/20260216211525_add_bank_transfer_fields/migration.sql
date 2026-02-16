-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "depositorName" TEXT,
ADD COLUMN     "paymentMethod" TEXT DEFAULT 'TOSS',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
