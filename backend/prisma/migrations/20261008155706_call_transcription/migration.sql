-- AlterTable
ALTER TABLE "consultation_sessions" ADD COLUMN     "stt_agent_id" VARCHAR(64),
ADD COLUMN     "stt_started_at" TIMESTAMPTZ(6),
ADD COLUMN     "stt_stopped_at" TIMESTAMPTZ(6),
ADD COLUMN     "stt_token" VARCHAR(255);

