-- AlterTable
ALTER TABLE "jurors" ADD COLUMN     "capture_id" TEXT,
ADD COLUMN     "search_completed_at" TIMESTAMP(3),
ADD COLUMN     "search_started_at" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "venue_id" TEXT;

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "court_type" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "voter_record_count" INTEGER NOT NULL DEFAULT 0,
    "fec_donation_count" INTEGER NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voter_records" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "registration_id" TEXT,
    "full_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "name_metaphone" TEXT NOT NULL,
    "birth_year" INTEGER,
    "age" INTEGER,
    "gender" CHAR(1),
    "party" TEXT,
    "address" TEXT,
    "city" TEXT,
    "zip_code" TEXT,
    "registration_date" TIMESTAMP(3),
    "voting_history" JSONB,
    "precinct" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voter_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fec_donations" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT,
    "fec_id" TEXT NOT NULL,
    "donor_name" TEXT NOT NULL,
    "donor_name_first" TEXT,
    "donor_name_last" TEXT,
    "name_metaphone" TEXT,
    "donor_city" TEXT,
    "donor_state" CHAR(2),
    "donor_zip_code" TEXT,
    "donor_employer" TEXT,
    "donor_occupation" TEXT,
    "recipient_name" TEXT NOT NULL,
    "recipient_party" TEXT,
    "recipient_office" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "election_cycle" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fec_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "juror_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_record_id" TEXT,
    "full_name" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "middle_name" TEXT,
    "age" INTEGER,
    "birth_year" INTEGER,
    "occupation" TEXT,
    "employer" TEXT,
    "city" TEXT,
    "state" CHAR(2),
    "zip_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "confidence_score" INTEGER NOT NULL,
    "score_factors" JSONB NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_by" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "is_rejected" BOOLEAN NOT NULL DEFAULT false,
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "profile" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_sources" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_record_id" TEXT,
    "match_strength" INTEGER NOT NULL,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_jobs" (
    "id" TEXT NOT NULL,
    "juror_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "search_query" JSONB NOT NULL,
    "sources_searched" TEXT[],
    "candidate_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "captures" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ocr_provider" TEXT,
    "ocr_request_id" TEXT,
    "raw_ocr_result" JSONB,
    "extracted_jurors" JSONB NOT NULL DEFAULT '[]',
    "juror_count" INTEGER NOT NULL DEFAULT 0,
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "confidence" INTEGER,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "captures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "venues_county_state_idx" ON "venues"("county", "state");

-- CreateIndex
CREATE INDEX "venues_is_active_idx" ON "venues"("is_active");

-- CreateIndex
CREATE INDEX "voter_records_venue_id_idx" ON "voter_records"("venue_id");

-- CreateIndex
CREATE INDEX "voter_records_name_metaphone_idx" ON "voter_records"("name_metaphone");

-- CreateIndex
CREATE INDEX "voter_records_last_name_first_name_idx" ON "voter_records"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "voter_records_birth_year_idx" ON "voter_records"("birth_year");

-- CreateIndex
CREATE INDEX "voter_records_zip_code_idx" ON "voter_records"("zip_code");

-- CreateIndex
CREATE UNIQUE INDEX "fec_donations_fec_id_key" ON "fec_donations"("fec_id");

-- CreateIndex
CREATE INDEX "fec_donations_venue_id_idx" ON "fec_donations"("venue_id");

-- CreateIndex
CREATE INDEX "fec_donations_name_metaphone_idx" ON "fec_donations"("name_metaphone");

-- CreateIndex
CREATE INDEX "fec_donations_donor_name_last_donor_name_first_idx" ON "fec_donations"("donor_name_last", "donor_name_first");

-- CreateIndex
CREATE INDEX "fec_donations_donor_zip_code_idx" ON "fec_donations"("donor_zip_code");

-- CreateIndex
CREATE INDEX "fec_donations_election_cycle_idx" ON "fec_donations"("election_cycle");

-- CreateIndex
CREATE INDEX "candidates_juror_id_idx" ON "candidates"("juror_id");

-- CreateIndex
CREATE INDEX "candidates_confidence_score_idx" ON "candidates"("confidence_score");

-- CreateIndex
CREATE INDEX "candidates_is_confirmed_idx" ON "candidates"("is_confirmed");

-- CreateIndex
CREATE INDEX "candidate_sources_candidate_id_idx" ON "candidate_sources"("candidate_id");

-- CreateIndex
CREATE INDEX "candidate_sources_source_type_idx" ON "candidate_sources"("source_type");

-- CreateIndex
CREATE INDEX "search_jobs_juror_id_idx" ON "search_jobs"("juror_id");

-- CreateIndex
CREATE INDEX "search_jobs_status_idx" ON "search_jobs"("status");

-- CreateIndex
CREATE INDEX "search_jobs_created_at_idx" ON "search_jobs"("created_at");

-- CreateIndex
CREATE INDEX "captures_case_id_idx" ON "captures"("case_id");

-- CreateIndex
CREATE INDEX "captures_status_idx" ON "captures"("status");

-- CreateIndex
CREATE INDEX "captures_uploaded_by_idx" ON "captures"("uploaded_by");

-- CreateIndex
CREATE INDEX "jurors_venue_id_idx" ON "jurors"("venue_id");

-- AddForeignKey
ALTER TABLE "jurors" ADD CONSTRAINT "jurors_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurors" ADD CONSTRAINT "jurors_capture_id_fkey" FOREIGN KEY ("capture_id") REFERENCES "captures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voter_records" ADD CONSTRAINT "voter_records_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fec_donations" ADD CONSTRAINT "fec_donations_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_juror_id_fkey" FOREIGN KEY ("juror_id") REFERENCES "jurors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_sources" ADD CONSTRAINT "candidate_sources_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_jobs" ADD CONSTRAINT "search_jobs_juror_id_fkey" FOREIGN KEY ("juror_id") REFERENCES "jurors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
