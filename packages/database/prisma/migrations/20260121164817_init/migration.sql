-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "settings" JSONB,
    "subscription_tier" TEXT NOT NULL DEFAULT 'trial',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "auth_provider_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "case_number" TEXT,
    "jurisdiction" TEXT,
    "venue" TEXT,
    "trial_date" TIMESTAMP(3),
    "case_type" TEXT,
    "plaintiff_name" TEXT,
    "defendant_name" TEXT,
    "our_side" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_facts" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fact_type" TEXT NOT NULL,
    "source" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_arguments" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "argument_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" TEXT,
    "change_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_arguments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_witnesses" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "summary" TEXT,
    "direct_outline" TEXT,
    "cross_outline" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jury_panels" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "panel_date" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "total_jurors" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jury_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jurors" (
    "id" TEXT NOT NULL,
    "panel_id" TEXT NOT NULL,
    "juror_number" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "age" INTEGER,
    "occupation" TEXT,
    "employer" TEXT,
    "city" TEXT,
    "zip_code" TEXT,
    "questionnaire_data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'available',
    "strike_reason" TEXT,
    "keep_priority" INTEGER,
    "strike_priority" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jurors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "attributes" JSONB,
    "signals" JSONB,
    "persuasion_levers" JSONB,
    "pitfalls" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "juror_persona_mappings" (
    "id" TEXT NOT NULL,
    "juror_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "mapping_type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "rationale" TEXT,
    "counterfactual" TEXT,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_by" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "juror_persona_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_artifacts" (
    "id" TEXT NOT NULL,
    "juror_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "retrieved_at" TIMESTAMP(3) NOT NULL,
    "rawContent" TEXT,
    "extracted_snippets" JSONB,
    "signals" JSONB,
    "match_confidence" DECIMAL(3,2),
    "match_rationale" TEXT,
    "user_action" TEXT NOT NULL DEFAULT 'pending',
    "actioned_by" TEXT,
    "actioned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_sessions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "session_type" TEXT NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,
    "session_number" INTEGER,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "audio_file_url" TEXT,
    "transcript_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_timestamps" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "timestamp_ms" BIGINT NOT NULL,
    "event_type" TEXT NOT NULL,
    "label" TEXT,
    "witness_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_timestamps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_segments" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "start_ms" BIGINT NOT NULL,
    "end_ms" BIGINT NOT NULL,
    "speaker_label" TEXT,
    "content" TEXT NOT NULL,
    "confidence" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcript_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_insights" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "segment_id" TEXT,
    "insight_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affected_personas" TEXT[],
    "suggested_action" TEXT,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_group_sessions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "panel_type" TEXT NOT NULL,
    "argument_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_group_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_group_personas" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_group_personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_group_results" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "reaction_summary" TEXT NOT NULL,
    "sentiment_score" DECIMAL(3,2) NOT NULL,
    "concerns" JSONB,
    "questions" JSONB,
    "verdict_lean" TEXT,
    "confidence" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_group_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_group_recommendations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "recommendation_type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affected_personas" TEXT[],
    "is_addressed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_group_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "case_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "cases_organization_id_idx" ON "cases"("organization_id");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "case_facts_case_id_idx" ON "case_facts"("case_id");

-- CreateIndex
CREATE INDEX "case_arguments_case_id_idx" ON "case_arguments"("case_id");

-- CreateIndex
CREATE INDEX "case_arguments_parent_id_idx" ON "case_arguments"("parent_id");

-- CreateIndex
CREATE INDEX "case_witnesses_case_id_idx" ON "case_witnesses"("case_id");

-- CreateIndex
CREATE INDEX "jury_panels_case_id_idx" ON "jury_panels"("case_id");

-- CreateIndex
CREATE INDEX "jurors_panel_id_idx" ON "jurors"("panel_id");

-- CreateIndex
CREATE INDEX "jurors_status_idx" ON "jurors"("status");

-- CreateIndex
CREATE INDEX "personas_organization_id_idx" ON "personas"("organization_id");

-- CreateIndex
CREATE INDEX "personas_source_type_idx" ON "personas"("source_type");

-- CreateIndex
CREATE INDEX "juror_persona_mappings_juror_id_idx" ON "juror_persona_mappings"("juror_id");

-- CreateIndex
CREATE INDEX "juror_persona_mappings_persona_id_idx" ON "juror_persona_mappings"("persona_id");

-- CreateIndex
CREATE INDEX "research_artifacts_juror_id_idx" ON "research_artifacts"("juror_id");

-- CreateIndex
CREATE INDEX "research_artifacts_source_type_idx" ON "research_artifacts"("source_type");

-- CreateIndex
CREATE INDEX "research_artifacts_user_action_idx" ON "research_artifacts"("user_action");

-- CreateIndex
CREATE INDEX "trial_sessions_case_id_idx" ON "trial_sessions"("case_id");

-- CreateIndex
CREATE INDEX "trial_sessions_status_idx" ON "trial_sessions"("status");

-- CreateIndex
CREATE INDEX "session_timestamps_session_id_idx" ON "session_timestamps"("session_id");

-- CreateIndex
CREATE INDEX "transcript_segments_session_id_idx" ON "transcript_segments"("session_id");

-- CreateIndex
CREATE INDEX "session_insights_session_id_idx" ON "session_insights"("session_id");

-- CreateIndex
CREATE INDEX "session_insights_insight_type_idx" ON "session_insights"("insight_type");

-- CreateIndex
CREATE INDEX "focus_group_sessions_case_id_idx" ON "focus_group_sessions"("case_id");

-- CreateIndex
CREATE INDEX "focus_group_sessions_status_idx" ON "focus_group_sessions"("status");

-- CreateIndex
CREATE INDEX "focus_group_personas_session_id_idx" ON "focus_group_personas"("session_id");

-- CreateIndex
CREATE INDEX "focus_group_results_session_id_idx" ON "focus_group_results"("session_id");

-- CreateIndex
CREATE INDEX "focus_group_recommendations_session_id_idx" ON "focus_group_recommendations"("session_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_case_id_idx" ON "audit_logs"("case_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_facts" ADD CONSTRAINT "case_facts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_arguments" ADD CONSTRAINT "case_arguments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_arguments" ADD CONSTRAINT "case_arguments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "case_arguments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_witnesses" ADD CONSTRAINT "case_witnesses_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_panels" ADD CONSTRAINT "jury_panels_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurors" ADD CONSTRAINT "jurors_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "jury_panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "juror_persona_mappings" ADD CONSTRAINT "juror_persona_mappings_juror_id_fkey" FOREIGN KEY ("juror_id") REFERENCES "jurors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "juror_persona_mappings" ADD CONSTRAINT "juror_persona_mappings_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_artifacts" ADD CONSTRAINT "research_artifacts_juror_id_fkey" FOREIGN KEY ("juror_id") REFERENCES "jurors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_sessions" ADD CONSTRAINT "trial_sessions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_timestamps" ADD CONSTRAINT "session_timestamps_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "trial_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "trial_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_insights" ADD CONSTRAINT "session_insights_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "trial_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_insights" ADD CONSTRAINT "session_insights_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "transcript_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_group_sessions" ADD CONSTRAINT "focus_group_sessions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_group_personas" ADD CONSTRAINT "focus_group_personas_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "focus_group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_group_personas" ADD CONSTRAINT "focus_group_personas_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_group_results" ADD CONSTRAINT "focus_group_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "focus_group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_group_recommendations" ADD CONSTRAINT "focus_group_recommendations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "focus_group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
