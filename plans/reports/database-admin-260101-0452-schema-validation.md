# Database Schema Validation Report

**Project ID:** dngnmalbjapetqdafhvg
**Date:** 2026-01-01 04:52 UTC
**Report ID:** database-admin-260101-0452-schema-validation

---

## Executive Summary

The Supabase database schema is well-structured with 6 tables, proper RLS policies on all tables, and appropriate indexing. The schema differs from the expected simple structure (id, title, description, status, repository_url, created_at, updated_at) - it implements a more sophisticated normalized design with separate tables for repositories and story intents.

---

## Tables Overview

| Table | RLS Enabled | Row Count | Primary Key |
|-------|-------------|-----------|-------------|
| profiles | Yes | 2 | id (uuid) |
| api_keys | Yes | 0 | id (bigint) |
| repositories | Yes | 1 | id (bigint) |
| stories | Yes | 0 | id (bigint) |
| story_chapters | Yes | 0 | id (bigint) |
| story_intents | Yes | 0 | id (bigint) |

---

## Detailed Schema

### 1. profiles
User profiles extending Supabase Auth users.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | - |
| email | text | YES | - |
| subscription_tier | text | NO | 'free' |
| usage_quota | integer | NO | 10 |
| preferences | jsonb | NO | '{}' |
| is_superuser | boolean | NO | false |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**Foreign Keys:** id -> auth.users.id

### 2. repositories
Cached repository metadata and analysis results.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | IDENTITY |
| url | text | NO | - (UNIQUE) |
| name | text | NO | - |
| owner | text | NO | - |
| default_branch | text | NO | 'main' |
| description | text | YES | - |
| language | text | YES | - |
| analysis_cache | jsonb | NO | '{}' |
| last_analyzed_at | timestamptz | YES | - |
| created_at | timestamptz | NO | now() |

### 3. stories
Audio narratives generated from code repositories.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | IDENTITY |
| user_id | uuid | NO | - |
| repository_id | bigint | NO | - |
| intent_id | bigint | YES | - |
| title | text | NO | - |
| status | story_status | NO | 'pending' |
| narrative_style | narrative_style | NO | 'educational' |
| focus_areas | jsonb | NO | '[]' |
| error_message | text | YES | - |
| audio_url | text | YES | - |
| transcript | text | YES | - |
| duration_seconds | real | YES | - |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| completed_at | timestamptz | YES | - |

**Foreign Keys:**
- user_id -> auth.users.id
- repository_id -> repositories.id
- intent_id -> story_intents.id

### 4. story_chapters
Individual chapters/segments of an audio story.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | IDENTITY |
| story_id | bigint | NO | - |
| order | integer | NO | - |
| title | text | NO | - |
| script | text | NO | - |
| audio_url | text | YES | - |
| start_time | real | NO | 0.0 |
| duration_seconds | real | YES | - |
| created_at | timestamptz | NO | now() |

**Foreign Keys:** story_id -> stories.id

### 5. story_intents
Tracks conversation history and user intent during story creation.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | IDENTITY |
| user_id | uuid | NO | - |
| repository_url | text | NO | - |
| conversation_history | jsonb | NO | '[]' |
| identified_goals | jsonb | NO | '[]' |
| generated_plan | jsonb | NO | '{}' |
| preferences | jsonb | NO | '{}' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**Foreign Keys:** user_id -> auth.users.id

### 6. api_keys
API keys for programmatic access to Code Story.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | IDENTITY |
| user_id | uuid | NO | - |
| key_hash | text | NO | - (UNIQUE) |
| name | text | NO | - |
| permissions | jsonb | NO | '{}' |
| rate_limit | integer | NO | 100 |
| is_active | boolean | NO | true |
| last_used_at | timestamptz | YES | - |
| expires_at | timestamptz | YES | - |
| created_at | timestamptz | NO | now() |

**Foreign Keys:** user_id -> auth.users.id

---

## Custom Types (Enums)

### story_status
- pending
- analyzing
- generating
- synthesizing
- complete
- failed

### narrative_style
- technical
- storytelling
- educational
- casual
- executive

---

## Indexes

| Table | Index Name | Definition |
|-------|------------|------------|
| api_keys | api_keys_pkey | UNIQUE btree (id) |
| api_keys | api_keys_key_hash_key | UNIQUE btree (key_hash) |
| api_keys | idx_api_keys_key_hash | btree (key_hash) |
| api_keys | idx_api_keys_user_id | btree (user_id) |
| profiles | profiles_pkey | UNIQUE btree (id) |
| repositories | repositories_pkey | UNIQUE btree (id) |
| repositories | repositories_url_key | UNIQUE btree (url) |
| repositories | idx_repositories_url | btree (url) |
| stories | stories_pkey | UNIQUE btree (id) |
| stories | idx_stories_user_id | btree (user_id) |
| stories | idx_stories_repository_id | btree (repository_id) |
| stories | idx_stories_intent_id | btree (intent_id) |
| stories | idx_stories_status | btree (status) |
| story_chapters | story_chapters_pkey | UNIQUE btree (id) |
| story_chapters | idx_story_chapters_story_id | btree (story_id) |
| story_chapters | idx_story_chapters_order | btree (order) |
| story_intents | story_intents_pkey | UNIQUE btree (id) |
| story_intents | idx_story_intents_user_id | btree (user_id) |

---

## RLS Policies

All 6 tables have RLS enabled with proper user-scoped policies:

### profiles
- Users can view own profile (SELECT)
- Users can insert own profile (INSERT)
- Users can update own profile (UPDATE)

### api_keys
- Users can view/create/update/delete own API keys (all operations)

### repositories
- Authenticated users can view/create/update repositories (shared resource)

### stories
- Users can view/create/update/delete own stories

### story_chapters
- Users can view/create/update/delete chapters of own stories (via story_id join)

### story_intents
- Users can view/create/update/delete own intents

---

## Security Advisors

**Warning Found:**
- **Leaked Password Protection Disabled** (WARN level)
  - Supabase Auth can check passwords against HaveIBeenPwned.org
  - Recommendation: Enable this feature for enhanced security
  - Reference: https://supabase.com/docs/guides/auth/password-security

---

## Schema vs Expected Structure Analysis

The task mentioned expecting: `stories table with: id, title, description, status, repository_url, created_at, updated_at`

**Actual Implementation Differences:**

| Expected Column | Actual Implementation |
|-----------------|----------------------|
| id | Present (bigint IDENTITY) |
| title | Present |
| description | NOT PRESENT - stories have no description field |
| status | Present (story_status enum) |
| repository_url | Normalized to repository_id FK -> repositories.url |
| created_at | Present |
| updated_at | Present |

**Additional columns in stories table:**
- user_id (required FK to auth.users)
- intent_id (optional FK to story_intents)
- narrative_style (enum)
- focus_areas (jsonb)
- error_message (for failed stories)
- audio_url, transcript, duration_seconds (output fields)
- completed_at

---

## Recommendations

1. **Missing `description` column**: If the backend expects a `description` field on stories, it needs to be added or the backend code updated to not require it.

2. **Repository URL access**: The backend must join `stories` with `repositories` to get the URL, or use `story_intents.repository_url` directly.

3. **Enable leaked password protection**: Address the security warning by enabling this feature in Supabase Auth settings.

4. **Redundant index**: `idx_api_keys_key_hash` duplicates the unique constraint index `api_keys_key_hash_key`. Consider removing the redundant index.

5. **Redundant index**: `idx_repositories_url` duplicates the unique constraint index `repositories_url_key`. Consider removing the redundant index.

---

## Unresolved Questions

1. Does the backend code expect a `description` field on stories? If so, a migration is needed.
2. How does the backend access repository URLs - via join or does it expect `repository_url` directly on stories?
3. Should the redundant indexes be removed to reduce storage overhead?
