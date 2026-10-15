-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "prefix" VARCHAR(10),
    "gender" VARCHAR(20),
    "age_band" VARCHAR(20),
    "marital_status" VARCHAR(30),
    "occupation" VARCHAR(80),
    "state" VARCHAR(80),
    "city" VARCHAR(80),
    "pincode" VARCHAR(10),
    "address" VARCHAR(300),
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "referred_by_code" VARCHAR(30),
    "photo_key" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_user_id_key" ON "customer_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

