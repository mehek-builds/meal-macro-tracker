-- ============================================================
-- Fitness Tracker - Supabase Postgres Schema
-- Stack: Postgres + pgvector (Section 16)
-- All PKs: uuid default uuid_generate_v4()
-- All timestamps: timestamptz default now()
-- ============================================================

create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- ============================================================
-- Section 2 / 6: User Profiles
-- Stores onboarding data, calorie targets, training config,
-- and cycle seed value.
-- ============================================================
create table profiles (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null unique,   -- Supabase Auth UID
    sex                     text not null check (sex in ('female', 'male', 'other')),
    age                     smallint not null,
    height_cm               numeric(5,1) not null,
    weight_kg               numeric(5,2) not null,
    goal                    text not null check (goal in ('build_muscle', 'maintain', 'lose')),
    target_weight_kg        numeric(5,2),
    milestone_weight_kg     numeric(5,2),
    activity_level          text not null check (activity_level in (
                                'sedentary', 'lightly_active', 'moderately_active',
                                'very_active', 'athlete'
                            )),
    training_phase          text check (training_phase in ('phase_1', 'phase_2', 'phase_3')),
    training_mode           text not null default 'muscle_gain'
                                check (training_mode in ('muscle_gain', 'marathon', 'both')),
    net_calorie_mode        text not null default 'fixed'
                                check (net_calorie_mode in ('fixed', 'eat_back', 'net')),
    dietary_restrictions    text[],
    last_period_start       date,           -- cycle seed value from onboarding (Section 6)
    last_recalc_weight_kg   numeric(5,2),   -- weight at last macro recalculation (every 3 kg)
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

-- ============================================================
-- Section 4 / 5 / 16: Food Log Entries
-- Every food logged via photo scan, barcode, text, voice,
-- recipe, or nutrition label scan.
-- ============================================================
create table food_log_entries (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    date                    date not null,
    meal                    text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snacks')),
    food_name               text not null,
    portion_description     text,
    weight_grams            numeric(7,2),
    calories                numeric(7,2) not null,
    protein_g               numeric(6,2) not null,
    carbs_g                 numeric(6,2) not null,
    fat_g                   numeric(6,2) not null,
    -- micros stored sparsely; key nutrients surfaced from here for dashboard display
    micros                  jsonb,
    source                  text not null check (source in (
                                'photo_scan', 'barcode', 'label_ocr',
                                'voice', 'text_search', 'custom_food', 'manual'
                            )),
    confidence              numeric(3,2) check (confidence between 0 and 1),
    hidden_calories_warning text,          -- e.g. "likely cooked with ~1 tsp oil (+40 cal)"
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index food_log_entries_date_idx on food_log_entries (user_id, date);

-- ============================================================
-- Section 8: Custom Foods and Recipes
-- User-created foods saved from corrected scans or built
-- via the recipe builder.
-- ============================================================
create table custom_foods (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    name                    text not null,
    -- per-100g macros
    calories_per_100g       numeric(7,2) not null,
    protein_per_100g        numeric(6,2) not null,
    carbs_per_100g          numeric(6,2) not null,
    fat_per_100g            numeric(6,2) not null,
    -- full micronutrient data stored as jsonb (optional)
    micros                  jsonb,
    is_recipe               boolean not null default false,
    servings                numeric(5,2),       -- number of servings if recipe
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

-- ============================================================
-- Section 7.6 / 8: USDA / IFCT / Open Food Facts RAG Store
-- Pre-embedded food database for vector similarity search.
-- fdc_id is the USDA FoodData Central identifier (or IFCT/OFF
-- equivalent). embedding is text-embedding-3-small (dim 1536).
-- ============================================================
create table foods_usda (
    id                      uuid primary key default uuid_generate_v4(),
    fdc_id                  text unique,        -- USDA FDC id, IFCT code, or OFF barcode
    description             text not null,
    source                  text not null check (source in ('usda', 'ifct', 'off')),
    -- per-100g macros
    calories_per_100g       numeric(7,2),
    protein_per_100g        numeric(6,2),
    carbs_per_100g          numeric(6,2),
    fat_per_100g            numeric(6,2),
    -- full micronutrient payload (iron, calcium, magnesium, zinc, fiber, etc.)
    micros                  jsonb,
    embedding               vector(1536),       -- text-embedding-3-small
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

-- ivfflat index for cosine similarity RAG lookups
create index foods_usda_embedding_idx
    on foods_usda
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- ============================================================
-- Section 9: Exercise Workouts
-- Auto-imported from HealthKit/Google Fit or manually logged.
-- ============================================================
create table exercise_workouts (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    date                    date not null,
    type                    text not null,       -- "Running", "Strength Training", etc.
    start_time              timestamptz,
    end_time                timestamptz,
    duration_minutes        numeric(6,1),
    calories_burned         numeric(7,2),
    avg_heart_rate          numeric(5,1),
    source                  text not null check (source in ('apple_watch', 'iphone', 'manual', 'google_fit')),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index exercise_workouts_date_idx on exercise_workouts (user_id, date);

-- ============================================================
-- Section 10: Water Entries
-- Manual water logs; oz and ml both stored (ml derived on write).
-- ============================================================
create table water_entries (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    logged_at               timestamptz not null default now(),
    oz                      numeric(6,2) not null,
    ml                      numeric(7,2) not null,   -- oz * 29.5735
    created_at              timestamptz not null default now()
);

create index water_entries_logged_at_idx on water_entries (user_id, logged_at);

-- ============================================================
-- Section 12: Supplements
-- Active supplement list with dose, timing, conflict rules,
-- and retest date.
-- ============================================================
create table supplements (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    name                    text not null,
    dose_display            text not null,       -- "10,000 IU", "60mg"
    timing_notes            text,               -- "With fattiest meal", "Empty stomach + vitamin C"
    conflict_supplements    text[],             -- names of conflicting supplements
    conflict_window_hours   numeric(4,2),       -- minimum hours between conflicting doses
    retest_date             date,               -- e.g. mid-July 2026 for Vitamin D
    active                  boolean not null default true,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

-- ============================================================
-- Section 12: Supplement Logs
-- Individual "taken" events per supplement.
-- ============================================================
create table supplement_logs (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    supplement_id           uuid not null references supplements (id) on delete cascade,
    taken_at                timestamptz not null default now(),
    notes                   text,
    created_at              timestamptz not null default now()
);

create index supplement_logs_taken_at_idx on supplement_logs (user_id, taken_at);

-- ============================================================
-- Section 13: Body Measurements
-- Monthly tape measure readings: upper arm, chest, waist,
-- hips, thigh.
-- ============================================================
create table body_measurements (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    date                    date not null,
    upper_arm_cm            numeric(5,2),
    chest_cm                numeric(5,2),
    waist_cm                numeric(5,2),
    hips_cm                 numeric(5,2),
    thigh_cm                numeric(5,2),
    notes                   text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index body_measurements_date_idx on body_measurements (user_id, date);

-- ============================================================
-- Section 14: Bloodwork Results
-- Lab marker values with reference ranges, status flags,
-- and retest scheduling.
-- ============================================================
create table bloodwork_results (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    date                    date not null,
    marker_name             text not null,       -- "Vitamin D (25-OH)", "Ferritin", etc.
    value                   numeric(10,3),
    unit                    text,               -- "ng/mL", "g/dL", "%"
    ref_range_low           numeric(10,3),
    ref_range_high          numeric(10,3),
    status                  text check (status in ('normal', 'low', 'high', 'pending')),
    retest_date             date,
    notes                   text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index bloodwork_results_date_idx on bloodwork_results (user_id, date);
create index bloodwork_results_marker_idx on bloodwork_results (user_id, marker_name);

-- ============================================================
-- Section 11.5: Cycle Overrides
-- Manual cycle day entries when HealthKit has no data.
-- The app calculates cycle day forward from (entry_date, cycle_day).
-- ============================================================
create table cycle_overrides (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    entry_date              date not null,
    cycle_day               smallint not null,
    created_at              timestamptz not null default now()
);

-- ============================================================
-- Section 15.4: Races
-- Race calendar; app activates race-week nutrition overlays
-- 7 days before each race_date.
-- ============================================================
create table races (
    id                      uuid primary key default uuid_generate_v4(),
    user_id                 uuid not null,
    name                    text not null,       -- "Dubai Marathon", "Copenhagen Marathon"
    race_date               date not null,
    status                  text not null default 'registered'
                                check (status in (
                                    'registered', 'conditional', 'lottery_entered',
                                    'ballot_pending', 'completed', 'withdrawn'
                                )),
    notes                   text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create index races_race_date_idx on races (user_id, race_date);
