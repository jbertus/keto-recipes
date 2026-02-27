
create table "public"."app_events" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "user_id" uuid,
    "event_type" text not null,
    "severity" text,
    "source" text not null,
    "reason" text,
    "access_allowed" boolean,
    "metadata" jsonb
);


alter table "public"."app_events" enable row level security;

create table "public"."api_keys" (
    "id" uuid not null default gen_random_uuid(),
    "key_name" text not null,
    "key_value" text not null,
    "is_active" boolean,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid default auth.uid()
);


alter table "public"."api_keys" enable row level security;

create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "action" text not null,
    "target_email" text,
    "promoted_by" uuid,
    "timestamp" timestamp with time zone default now(),
    "details" jsonb
);


alter table "public"."audit_logs" enable row level security;

create table "public"."credit_events" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "event_type" text not null,
    "units_delta" integer not null,
    "purpose" text,
    "success" boolean,
    "error_code" text,
    "meta" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."credit_events" enable row level security;

create table "public"."entitlements" (
    "user_id" uuid not null,
    "plan" text not null,
    "paid_started_at" timestamp with time zone,
    "next_reset_at" timestamp with time zone,
    "weekly_unit_allowance" integer not null default 0,
    "weekly_units_remaining" integer not null default 0,
    "priority_allowance" integer not null default 0,
    "priority_remaining" integer not null default 0,
    "trial_expires_at" timestamp with time zone,
    "trial_units_remaining" integer not null default 0,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."entitlements" enable row level security;

create table "public"."feature_toggles" (
    "user_id" uuid not null,
    "build_my_week" boolean default false,
    "macro_auto_balancer" boolean default false,
    "family_mode" boolean default false,
    "batch_cook_mode" boolean default false,
    "prep_day_checklist" boolean default false,
    "micronutrients" boolean default false,
    "deficiency_flags" boolean default false,
    "strict_protocol_programs" boolean default false,
    "priority_recipe_requests" boolean default false,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."feature_toggles" enable row level security;

create table "public"."meal_templates" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "items" jsonb not null,
    "total_macros" jsonb not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."meal_templates" enable row level security;

create table "public"."personal_recipes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "meal_type" text,
    "difficulty" text,
    "protein_level" text,
    "dish_type" text,
    "protein_type" text,
    "appliance_type" text,
    "default_meal_slot" text,
    "cuisine_type" text,
    "estimated_total_time_min" integer,
    "image_path" text,
    "recipe_name" text,
    "servings_per_batch" numeric,
    "calories_per_serving_g" numeric,
    "net_carbs_per_serving_g" numeric,
    "protein_per_serving_g" numeric,
    "fat_per_serving_g" numeric,
    "ingredients_block" text,
    "prep_notes_block" text,
    "time_bucket_10min" text,
    "is_high_protein_25g_plus" boolean,
    "ingredients_norm" text,
    "tags" text[],
    "is_hidden" boolean default false
);


alter table "public"."personal_recipes" enable row level security;

create table "public"."profiles" (
    "user_id" uuid not null,
    "email" text,
    "role" text default 'user'::text,
    "timezone" text default 'America/New_York'::text,
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "ever_had_founders" boolean default false,
    "inactive" boolean default false,
    "inactive_expires_at" timestamp with time zone,
    "trial_attempt_count" integer default 0,
    "hard_delete_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "ai_opt_in" boolean default false
);


alter table "public"."profiles" enable row level security;

create table "public"."user_progress" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "date" date not null,
    "weight" numeric,
    "glucose" numeric,
    "energy_level" integer,
    "ketones" numeric,
    "notes" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_progress" enable row level security;

create table "public"."weekly_plans" (
    "user_id" uuid not null,
    "plan_data" jsonb,
    "updated_at" timestamp with time zone default now(),
    "week_start" date not null,
    "cleared_at" timestamp with time zone
);


alter table "public"."weekly_plans" enable row level security;

create table "public"."ai_audit_log" (
    "id" uuid not null default gen_random_uuid(),
    "provider" text,
    "model" text,
    "purpose" text,
    "payload_hash" text,
    "user_id" uuid,
    "timestamp" timestamp with time zone default now(),
    "token_count" integer,
    "cost_estimate" numeric
);


alter table "public"."ai_audit_log" enable row level security;

create table "public"."ai_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "provider" text,
    "model" text,
    "purpose" text,
    "status" text,
    "input_metadata" jsonb,
    "output_metadata" jsonb,
    "token_count" integer,
    "cost_estimate" numeric,
    "created_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone
);


alter table "public"."ai_jobs" enable row level security;

create table "public"."ai_providers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "provider_type" text not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."ai_providers" enable row level security;

create table "public"."admin_inbox" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "email" text,
    "category" text,
    "subject" text,
    "message" text,
    "meta" jsonb,
    "status" text default 'new'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."admin_inbox" enable row level security;

create table "public"."clients" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "first_name" text not null,
    "last_name" text not null,
    "email" text,
    "phone" text,
    "age" integer,
    "height_cm" numeric,
    "weight_kg" numeric,
    "activity_level" text,
    "goal" text,
    "target_calories" integer,
    "target_protein" integer,
    "target_fat" integer,
    "target_carbs" integer,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."clients" enable row level security;

create table "public"."client_meal_plans" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "week_start_date" date not null,
    "plan_data" jsonb not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."client_meal_plans" enable row level security;

create table "public"."favorite_recipes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "recipe_id" text not null,
    "recipe_name" text not null,
    "recipe_data" jsonb,
    "created_at" timestamp with time zone default now(),
    "rating" integer,
    "prep_time" integer,
    "difficulty" text,
    "tags" text[]
);


alter table "public"."favorite_recipes" enable row level security;

create table "public"."ingredient_canonical" (
    "id" uuid not null default gen_random_uuid(),
    "raw_name" text,
    "fdc_id" integer,
    "canonical_name" text
);


alter table "public"."ingredient_canonical" enable row level security;

create table "public"."ingredient_prices" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "avg_cost_per_unit" numeric
);


alter table "public"."ingredient_prices" enable row level security;

create table "public"."pantry_items" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "category" text,
    "quantity" text,
    "expiry_date" date,
    "created_at" timestamp with time zone default now()
);


alter table "public"."pantry_items" enable row level security;

create table "public"."recipe_guidance" (
    "recipe_id" text not null,
    "cooking_instructions" jsonb,
    "prep_guidance" text,
    "storage_guidance" text,
    "reheat_guidance" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."recipe_guidance" enable row level security;

create table "public"."recipe_micronutrients" (
    "recipe_id" text not null,
    "status" text,
    "per_serving" jsonb,
    "per_batch" jsonb,
    "deficiency_flags" jsonb,
    "computed_at" timestamp with time zone
);


alter table "public"."recipe_micronutrients" enable row level security;

create table "public"."recipe_notes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "recipe_id" text not null,
    "note" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."recipe_notes" enable row level security;

create table "public"."shopping_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "items" jsonb not null,
    "completed_at" timestamp with time zone default now()
);


alter table "public"."shopping_history" enable row level security;

create table "public"."shopping_list_items" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "category" text,
    "quantity" text,
    "checked" boolean default false,
    "is_manual" boolean default false,
    "created_at" timestamp with time zone default now(),
    "is_purchased" boolean default false,
    "recipe_source" text[],
    "use_pantry" boolean default false
);


alter table "public"."shopping_list_items" enable row level security;

CREATE UNIQUE INDEX api_keys_key_value_key ON public.api_keys USING btree (key_value);

CREATE UNIQUE INDEX api_keys_pkey ON public.api_keys USING btree (id);

CREATE UNIQUE INDEX app_events_pkey ON public.app_events USING btree (id);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (id);

CREATE UNIQUE INDEX client_meal_plans_client_id_week_start_date_key ON public.client_meal_plans USING btree (client_id, week_start_date);

CREATE UNIQUE INDEX client_meal_plans_pkey ON public.client_meal_plans USING btree (id);

CREATE UNIQUE INDEX credit_events_pkey ON public.credit_events USING btree (id);

CREATE UNIQUE INDEX entitlements_pkey ON public.entitlements USING btree (user_id);

CREATE UNIQUE INDEX favorite_recipes_pkey ON public.favorite_recipes USING btree (id);

CREATE UNIQUE INDEX favorite_recipes_user_id_recipe_id_key ON public.favorite_recipes USING btree (user_id, recipe_id);

CREATE UNIQUE INDEX feature_toggles_pkey ON public.feature_toggles USING btree (user_id);

CREATE UNIQUE INDEX ingredient_canonical_pkey ON public.ingredient_canonical USING btree (id);

CREATE UNIQUE INDEX ingredient_prices_name_key ON public.ingredient_prices USING btree (name);

CREATE UNIQUE INDEX ingredient_prices_pkey ON public.ingredient_prices USING btree (id);

CREATE UNIQUE INDEX meal_templates_pkey ON public.meal_templates USING btree (id);

CREATE UNIQUE INDEX pantry_items_pkey ON public.pantry_items USING btree (id);

CREATE UNIQUE INDEX personal_recipes_pkey ON public.personal_recipes USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX recipe_guidance_pkey ON public.recipe_guidance USING btree (recipe_id);

CREATE UNIQUE INDEX recipe_micronutrients_pkey ON public.recipe_micronutrients USING btree (recipe_id);

CREATE UNIQUE INDEX recipe_notes_pkey ON public.recipe_notes USING btree (id);

CREATE UNIQUE INDEX recipe_notes_user_id_recipe_id_key ON public.recipe_notes USING btree (user_id, recipe_id);

CREATE UNIQUE INDEX shopping_history_pkey ON public.shopping_history USING btree (id);

CREATE UNIQUE INDEX shopping_list_items_pkey ON public.shopping_list_items USING btree (id);

CREATE UNIQUE INDEX user_progress_pkey ON public.user_progress USING btree (id);

CREATE UNIQUE INDEX user_progress_user_id_date_key ON public.user_progress USING btree (user_id, date);

CREATE UNIQUE INDEX weekly_plans_pkey ON public.weekly_plans USING btree (user_id, week_start);

alter table "public"."app_events" add CONSTRAINT "app_events_pkey" PRIMARY KEY using index "app_events_pkey";

alter table "public"."api_keys" add CONSTRAINT "api_keys_pkey" PRIMARY KEY using index "api_keys_pkey";

alter table "public"."audit_logs" add CONSTRAINT "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."clients" add CONSTRAINT "clients_pkey" PRIMARY KEY using index "clients_pkey";

alter table "public"."client_meal_plans" add CONSTRAINT "client_meal_plans_pkey" PRIMARY KEY using index "client_meal_plans_pkey";

alter table "public"."credit_events" add CONSTRAINT "credit_events_pkey" PRIMARY KEY using index "credit_events_pkey";

alter table "public"."entitlements" add CONSTRAINT "entitlements_pkey" PRIMARY KEY using index "entitlements_pkey";

alter table "public"."feature_toggles" add CONSTRAINT "feature_toggles_pkey" PRIMARY KEY using index "feature_toggles_pkey";

alter table "public"."meal_templates" add CONSTRAINT "meal_templates_pkey" PRIMARY KEY using index "meal_templates_pkey";

alter table "public"."pantry_items" add CONSTRAINT "pantry_items_pkey" PRIMARY KEY using index "pantry_items_pkey";

alter table "public"."personal_recipes" add CONSTRAINT "personal_recipes_pkey" PRIMARY KEY using index "personal_recipes_pkey";

alter table "public"."profiles" add CONSTRAINT "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."recipe_guidance" add CONSTRAINT "recipe_guidance_pkey" PRIMARY KEY using index "recipe_guidance_pkey";

alter table "public"."recipe_micronutrients" add CONSTRAINT "recipe_micronutrients_pkey" PRIMARY KEY using index "recipe_micronutrients_pkey";

alter table "public"."recipe_notes" add CONSTRAINT "recipe_notes_pkey" PRIMARY KEY using index "recipe_notes_pkey";

alter table "public"."shopping_history" add CONSTRAINT "shopping_history_pkey" PRIMARY KEY using index "shopping_history_pkey";

alter table "public"."shopping_list_items" add CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY using index "shopping_list_items_pkey";

alter table "public"."user_progress" add CONSTRAINT "user_progress_pkey" PRIMARY KEY using index "user_progress_pkey";

alter table "public"."weekly_plans" add CONSTRAINT "weekly_plans_pkey" PRIMARY KEY using index "weekly_plans_pkey";

alter table "public"."ai_audit_log" add CONSTRAINT "ai_audit_log_id_key" UNIQUE using index "ai_audit_log_id_key";

alter table "public"."ai_audit_log" add CONSTRAINT "ai_audit_log_pkey" PRIMARY KEY using index "ai_audit_log_id_key";

alter table "public"."ai_jobs" add CONSTRAINT "ai_jobs_id_key" UNIQUE using index "ai_jobs_id_key";

alter table "public"."ai_jobs" add CONSTRAINT "ai_jobs_pkey" PRIMARY KEY using index "ai_jobs_id_key";

alter table "public"."ai_providers" add CONSTRAINT "ai_providers_id_key" UNIQUE using index "ai_providers_id_key";

alter table "public"."ai_providers" add CONSTRAINT "ai_providers_pkey" PRIMARY KEY using index "ai_providers_id_key";

alter table "public"."admin_inbox" add CONSTRAINT "admin_inbox_id_key" UNIQUE using index "admin_inbox_id_key";

alter table "public"."admin_inbox" add CONSTRAINT "admin_inbox_pkey" PRIMARY KEY using index "admin_inbox_id_key";

alter table "public"."api_keys" add CONSTRAINT "api_keys_key_value_key" UNIQUE using index "api_keys_key_value_key";

alter table "public"."api_keys" add CONSTRAINT "public_api_keys_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."api_keys" validate CONSTRAINT "public_api_keys_created_by_fkey";

alter table "public"."app_events" add CONSTRAINT "public_app_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."app_events" validate CONSTRAINT "public_app_events_user_id_fkey";

alter table "public"."audit_logs" add CONSTRAINT "audit_logs_promoted_by_fkey" FOREIGN KEY (promoted_by) REFERENCES auth.users(id) not valid;

alter table "public"."audit_logs" validate CONSTRAINT "audit_logs_promoted_by_fkey";

alter table "public"."client_meal_plans" add CONSTRAINT "client_meal_plans_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE not valid;

alter table "public"."client_meal_plans" validate CONSTRAINT "client_meal_plans_client_id_fkey";

alter table "public"."client_meal_plans" add CONSTRAINT "client_meal_plans_client_id_week_start_date_key" UNIQUE using index "client_meal_plans_client_id_week_start_date_key";

alter table "public"."clients" add CONSTRAINT "clients_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."clients" validate CONSTRAINT "clients_user_id_fkey";

alter table "public"."credit_events" add CONSTRAINT "public_credit_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."credit_events" validate CONSTRAINT "public_credit_events_user_id_fkey";

alter table "public"."entitlements" add CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."entitlements" validate CONSTRAINT "entitlements_user_id_fkey";

alter table "public"."feature_toggles" add CONSTRAINT "feature_toggles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."feature_toggles" validate CONSTRAINT "feature_toggles_user_id_fkey";

alter table "public"."favorite_recipes" add CONSTRAINT "favorite_recipes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."favorite_recipes" validate CONSTRAINT "favorite_recipes_user_id_fkey";

alter table "public"."favorite_recipes" add CONSTRAINT "favorite_recipes_user_id_recipe_id_key" UNIQUE using index "favorite_recipes_user_id_recipe_id_key";

alter table "public"."meal_templates" add CONSTRAINT "meal_templates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."meal_templates" validate CONSTRAINT "meal_templates_user_id_fkey";

alter table "public"."pantry_items" add CONSTRAINT "pantry_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."pantry_items" validate CONSTRAINT "pantry_items_user_id_fkey";

alter table "public"."personal_recipes" add CONSTRAINT "personal_recipes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."personal_recipes" validate CONSTRAINT "personal_recipes_user_id_fkey";

alter table "public"."profiles" add CONSTRAINT "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate CONSTRAINT "profiles_user_id_fkey";

alter table "public"."recipe_notes" add CONSTRAINT "recipe_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."recipe_notes" validate CONSTRAINT "recipe_notes_user_id_fkey";

alter table "public"."recipe_notes" add CONSTRAINT "recipe_notes_user_id_recipe_id_key" UNIQUE using index "recipe_notes_user_id_recipe_id_key";

alter table "public"."shopping_history" add CONSTRAINT "shopping_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."shopping_history" validate CONSTRAINT "shopping_history_user_id_fkey";

alter table "public"."shopping_list_items" add CONSTRAINT "shopping_list_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."shopping_list_items" validate CONSTRAINT "shopping_list_items_user_id_fkey";

alter table "public"."user_progress" add CONSTRAINT "user_progress_user_id_date_key" UNIQUE using index "user_progress_user_id_date_key";

alter table "public"."user_progress" add CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_progress" validate CONSTRAINT "public_user_progress_user_id_fkey";

alter table "public"."weekly_plans" add CONSTRAINT "weekly_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."weekly_plans" validate CONSTRAINT "weekly_plans_user_id_fkey";

alter table "public"."weekly_plans" add CONSTRAINT "weekly_plans_user_id_week_start_key" UNIQUE using index "weekly_plans_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id uuid, p_new_role text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$\nDECLARE\n  v_valid_roles text[] := ARRAY['admin', 'user', 'coach'];\n  v_old_role text;\n  v_updated_role text;\n  v_executing_user_id uuid;\n  v_is_admin boolean;\nBEGIN\n  v_executing_user_id := auth.uid();\n\n  -- Verify caller is authenticated\n  IF v_executing_user_id IS NULL THEN\n     RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');\n  END IF;\n
  -- Verify caller is admin
  v_is_admin := public.is_admin();
  
  IF NOT v_is_admin THEN
     RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions: Admin access required');
  END IF;

  -- Validate the new role
  IF NOT (p_new_role = ANY(v_valid_roles)) THEN
     RETURN jsonb_build_object('success', false, 'error', 'Invalid role: ' || p_new_role || '. Must be one of: ' || array_to_string(v_valid_roles, ', '));
  END IF;

  -- Verify target user exists and get current role
  SELECT role INTO v_old_role FROM public.profiles WHERE user_id = p_user_id;
  
  -- Handle case where profile might be missing
  IF v_old_role IS NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Target user profile not found');
  END IF;

  -- Perform the update
  UPDATE public.profiles 
  SET role = p_new_role, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING role INTO v_updated_role;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'User role updated successfully.',
    'previous_role', COALESCE(v_old_role, 'none'),
    'new_role', v_updated_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_priority_request(p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$\nDECLARE\n  v_user_id uuid;\n  v_entitlements record;\nBEGIN\n  v_user_id := auth.uid();\n  
  -- Lock the row
  SELECT * INTO v_entitlements 
  FROM entitlements 
  WHERE user_id = v_user_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entitlements not found for user';
  END IF;

  -- Check Priority Balance
  IF v_entitlements.priority_remaining IS NULL OR v_entitlements.priority_remaining <= 0 THEN
      -- Log failure
      INSERT INTO credit_events (user_id, event_type, units_delta, purpose, success, error_code, meta)
      VALUES (v_user_id, 'consume_priority', 0, 'request_recipe', false, 'INSUFFICIENT_PRIORITY_CREDITS', p_meta);
      
      RAISE EXCEPTION 'Insufficient priority request credits';
  END IF;

  -- Decrement
  UPDATE entitlements 
  SET priority_remaining = priority_remaining - 1
  WHERE user_id = v_user_id;

  -- Log Success
  INSERT INTO credit_events (user_id, event_type, units_delta, purpose, success, meta)
  VALUES (v_user_id, 'consume_priority', -1, 'request_recipe', true, p_meta);

  RETURN jsonb_build_object(
    'success', true, 
    'remaining', v_entitlements.priority_remaining - 1
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_units(p_purpose text, p_units integer, p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$\nDECLARE\n  v_user_id uuid;\n  v_entitlements record;\n  v_new_remaining integer;\n  v_is_trial boolean;\n  v_reset_needed boolean;\n  v_next_reset timestamp with time zone;\n  v_timezone text;\nBEGIN\n  v_user_id := auth.uid();\n  
  -- Lock the row
  SELECT * INTO v_entitlements 
  FROM entitlements 
  WHERE user_id = v_user_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entitlements not found for user';
  END IF;\n
  -- Get user timezone for reset calculation
  SELECT timezone INTO v_timezone FROM profiles WHERE user_id = v_user_id;
  IF v_timezone IS NULL THEN v_timezone := 'UTC'; END IF;

  -- Check for weekly reset
  IF v_entitlements.next_reset_at IS NULL OR now() >= v_entitlements.next_reset_at THEN
    v_reset_needed := true;
    -- Calculate next reset: Start of next week in user timezone
    -- Simplified for SQL: +7 days from now, truncated to day
    -- In production, rigorous timezone math is better done in JS or specialized SQL
    v_next_reset := (now() AT TIME ZONE v_timezone + interval '7 days')::date AT TIME ZONE v_timezone;
  ELSE
    v_reset_needed := false;
    v_next_reset := v_entitlements.next_reset_at;
  END IF;

  -- Logic Branch: Trial vs Paid
  v_is_trial := (v_entitlements.plan = 'trial');

  IF v_reset_needed AND NOT v_is_trial THEN
    -- Reset paid user to full allowance
    UPDATE entitlements 
    SET weekly_units_remaining = weekly_unit_allowance,
        next_reset_at = v_next_reset
    WHERE user_id = v_user_id;
    
    -- Refresh variable
    v_entitlements.weekly_units_remaining := v_entitlements.weekly_unit_allowance;
    
    -- Log reset event
    INSERT INTO credit_events (user_id, event_type, units_delta, purpose, success)
    VALUES (v_user_id, 'reset', v_entitlements.weekly_unit_allowance, 'weekly_reset', true);
  END IF;

  -- Check Balance
  IF v_is_trial THEN
    IF v_entitlements.trial_units_remaining < p_units THEN
      INSERT INTO credit_events (user_id, event_type, units_delta, purpose, success, error_code)
      VALUES (v_user_id, 'consume', 0, p_purpose, false, 'INSUFFICIENT_TRIAL_CREDITS');
      RAISE EXCEPTION 'Insufficient trial credits';
    END IF;
    v_new_remaining := v_entitlements.trial_units_remaining - p_units;
    
    UPDATE entitlements SET trial_units_remaining = v_new_remaining WHERE user_id = v_user_id;
  ELSE
    IF v_entitlements.weekly_units_remaining < p_units THEN
       INSERT INTO credit_events (user_id, event_type, units_delta, purpose, success, error_code)
      VALUES (v_user_id, 'consume', 0, p_purpose, false, 'INSUFFICIENT_WEEKLY_CREDITS');
      RAISE EXCEPTION 'Insufficient weekly credits';
    END IF;
    v_new_remaining := v_entitlements.weekly_units_remaining - p_units;
    
    UPDATE entitlements SET weekly_units_remaining = v_new_remaining WHERE user_id = v_user_id;
  END IF;

  -- Log Success
  INSERT INTO credit_events (user_id, event_type, units_delta, purpose, success, meta)
  VALUES (v_user_id, 'consume', -p_units, p_purpose, true, p_meta);

  RETURN jsonb_build_object(
    'success', true,
    'remaining', v_new_remaining,
    'is_trial', v_is_trial,
    'next_reset', v_next_reset
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_account_access_state()
 RETURNS TABLE(access_allowed boolean, reason text, billing_provider text, update_payment_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$\nDECLARE\n    v_user_id uuid;\n    v_role text;\n    v_inactive boolean;\nBEGIN\n    v_user_id := auth.uid();\n    
    -- Admin Bypass
    SELECT role INTO v_role FROM profiles WHERE user_id = v_user_id;\n    IF v_role = 'admin' THEN
        RETURN QUERY SELECT true, 'admin_bypass'::text, ''::text, ''::text;
        RETURN;
    END IF;

    -- Existing Logic for Non-Admins
    -- Checks if profile is marked inactive
    SELECT inactive INTO v_inactive FROM profiles WHERE user_id = v_user_id;\n    
    IF v_inactive THEN
         RETURN QUERY SELECT false, 'account_inactive'::text, 'stripe'::text, ''::text;
    ELSE
         RETURN QUERY SELECT true, 'active'::text, 'stripe'::text, ''::text;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$\nBEGIN\n  INSERT INTO public.profiles (user_id, email, role, timezone)\n  VALUES (new.id, new.email, 'user', 'America/New_York')\n  ON CONFLICT (user_id) DO NOTHING;\n  
  INSERT INTO public.entitlements (user_id, plan, trial_expires_at, trial_units_remaining, weekly_unit_allowance)\n  VALUES (new.id, 'trial', now() + interval '7 days', 10, 0)\n  ON CONFLICT (user_id) DO NOTHING;\n  
  INSERT INTO public.feature_toggles (user_id)\n  VALUES (new.id)\n  ON CONFLICT (user_id) DO NOTHING;\n\n  RETURN new;\nEND;\n$function$;

CREATE OR REPLACE FUNCTION public.initialize_user_entitlements(p_user_id uuid, p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$\nBEGIN\n  -- Create Profile if missing\n  INSERT INTO profiles (user_id, email, role, timezone)\n  VALUES (p_user_id, p_email, 'user', 'America/New_York')\n  ON CONFLICT (user_id) DO NOTHING;\n\n  -- Create Entitlements if missing (Default Trial)\n  INSERT INTO entitlements (\n    user_id, \n    plan, \n    trial_expires_at, \n    trial_units_remaining, \n    weekly_unit_allowance\n  )\n  VALUES (\n    p_user_id, \n    'trial', \n    now() + interval '7 days', \n    10, -- 1 search = 10 units\n    0\n  )\n  ON CONFLICT (user_id) DO NOTHING;\n\n  -- Create Feature Toggles if missing\n  INSERT INTO feature_toggles (user_id)\n  VALUES (p_user_id)\n  ON CONFLICT (user_id) DO NOTHING;\nEND;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$\nBEGIN\n  RETURN EXISTS (\n    SELECT 1\n    FROM profiles\n    WHERE user_id = auth.uid()\n    AND role = 'admin'\n  );\nEND;\n$function$;

CREATE OR REPLACE FUNCTION public.purge_app_events(retain_days integer DEFAULT 90)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$\nBEGIN\n    DELETE FROM public.app_events\n    WHERE created_at < now() - (retain_days || ' days')::interval;\nEND;\n$function$;

CREATE OR REPLACE FUNCTION public.refund_units(p_target_user_id uuid, p_units integer, p_reason text, p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$\nDECLARE\n  v_admin_id uuid;\n  v_is_admin boolean;\n  v_entitlements record;\n  v_is_trial boolean;\nBEGIN\n  v_admin_id := auth.uid();\n  
  -- Verify Admin
  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = v_admin_id AND role = 'admin') INTO v_is_admin;\n  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access Denied: Admin only';
  END IF;

  SELECT * INTO v_entitlements FROM entitlements WHERE user_id = p_target_user_id FOR UPDATE;\n  
  v_is_trial := (v_entitlements.plan = 'trial');

  IF v_is_trial THEN
    UPDATE entitlements 
    SET trial_units_remaining = trial_units_remaining + p_units
    WHERE user_id = p_target_user_id;
  ELSE
    UPDATE entitlements 
    SET weekly_units_remaining = weekly_units_remaining + p_units
    WHERE user_id = p_target_user_id;
  END IF;

  INSERT INTO credit_events (user_id, event_type, units_delta, purpose, success, meta)
  VALUES (p_target_user_id, 'refund', p_units, p_reason, true, p_meta);

  RETURN jsonb_build_object('success', true, 'refunded', p_units);
END;
$function$;

create policy "Admins select all events"
on "public"."app_events"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Users insert own events"
on "public"."app_events"
as permissive
for insert
to authenticated
with check (true);


create policy "Users select own events"
on "public"."app_events"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can update own keys"
on "public"."api_keys"
as permissive
for update
to authenticated
using (((auth.uid() = created_by) OR is_admin()))
with check (((auth.uid() = created_by) OR is_admin()));


create policy "Users can insert own keys"
on "public"."api_keys"
as permissive
for insert
to authenticated
with check (true);


create policy "Users can view own keys"
on "public"."api_keys"
as permissive
for select
to authenticated
using (((auth.uid() = created_by) OR is_admin()));


create policy "Users can delete own keys"
on "public"."api_keys"
as permissive
for delete
to authenticated
using (((auth.uid() = created_by) OR is_admin()));


create policy "Admins can read audit logs"
on "public"."audit_logs"
as permissive
for select
to authenticated
using (is_admin());


create policy "Service role can insert logs"
on "public"."audit_logs"
as permissive
for insert
to service_role
with check (true);


create policy "Users read own events"
on "public"."credit_events"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Admins read all events"
on "public"."credit_events"
as permissive
for select
to authenticated
using (is_admin());


create policy "Users insert own entitlements"
on "public"."entitlements"
as permissive
for insert
to authenticated
with check (true);


create policy "Users view own entitlements"
on "public"."entitlements"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Admins all entitlements"
on "public"."entitlements"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Users update own entitlements"
on "public"."entitlements"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Admins manage toggles"
on "public"."feature_toggles"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Users read own toggles"
on "public"."feature_toggles"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can manage their own templates"
on "public"."meal_templates"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can manage their own personal recipes"
on "public"."personal_recipes"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Admins can read all profiles"
on "public"."profiles"
as permissive
for select
to authenticated
using (is_admin());


create policy "Admins can update user roles"
on "public"."profiles"
as permissive
for update
to authenticated
using (is_admin())
with check (is_admin());


create policy "Users can update own profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can insert own profile"
on "public"."profiles"
as permissive
for insert
to authenticated
with check (true);


create policy "Users can read own profile"
on "public"."profiles"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can manage their own progress"
on "public"."user_progress"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can manage their own weekly plans"
on "public"."weekly_plans"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users read own ai_jobs"
on "public"."ai_jobs"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Admins read all ai_jobs"
on "public"."ai_jobs"
as permissive
for select
to authenticated
using (is_admin());


create policy "Admins read ai_audit_log"
on "public"."ai_audit_log"
as permissive
for select
to authenticated
using (is_admin());


create policy "Admins full access ai_providers"
on "public"."ai_providers"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Users insert own messages"
on "public"."admin_inbox"
as permissive
for insert
to authenticated
with check (true);


create policy "Admins update messages"
on "public"."admin_inbox"
as permissive
for update
to authenticated
using (is_admin())
with check (is_admin());


create policy "Admins read all messages"
on "public"."admin_inbox"
as permissive
for select
to authenticated
using (is_admin());


create policy "Users can manage meal plans for their own clients"
on "public"."client_meal_plans"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = client_meal_plans.client_id) AND (clients.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = client_meal_plans.client_id) AND (clients.user_id = auth.uid())))));


create policy "Users can manage their own clients"
on "public"."clients"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can manage their own favorites"
on "public"."favorite_recipes"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can manage their own pantry"
on "public"."pantry_items"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Admins write guidance"
on "public"."recipe_guidance"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Public read guidance"
on "public"."recipe_guidance"
as permissive
for select
to public
using (true);


create policy "Admins write micros"
on "public"."recipe_micronutrients"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Public read micros"
on "public"."recipe_micronutrients"
as permissive
for select
to public
using (true);


create policy "Users can manage their own notes"
on "public"."recipe_notes"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can manage their own shopping history"
on "public"."shopping_history"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can manage their own shopping list"
on "public"."shopping_list_items"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create table "public"."admin_alerts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "window_start" timestamp with time zone not null,
    "window_end" timestamp with time zone not null,
    "error_count" integer not null,
    "resolved_at" timestamp with time zone,
    "metadata" jsonb
);


alter table "public"."admin_alerts" enable row level security;

create table "public"."admin_messages" (
    "id" uuid not null default gen_random_uuid(),
    "alert_id" uuid not null,
    "author_id" uuid,
    "author_role" text not null,
    "message" text not null,
    "action_type" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."admin_messages" enable row level security;

create table "public"."admin_settings" (
    "id" uuid not null default gen_random_uuid(),
    "enable_admin_alerts" boolean default false,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."admin_settings" enable row level security;

alter table "public"."admin_alerts" add CONSTRAINT "admin_alerts_pkey" PRIMARY KEY using index "admin_alerts_pkey";

alter table "public"."admin_messages" add CONSTRAINT "admin_messages_pkey" PRIMARY KEY using index "admin_messages_pkey";

alter table "public"."admin_settings" add CONSTRAINT "admin_settings_pkey" PRIMARY KEY using index "admin_settings_pkey";

alter table "public"."admin_messages" add CONSTRAINT "admin_messages_alert_id_fkey" FOREIGN KEY (alert_id) REFERENCES public.admin_alerts(id) ON DELETE CASCADE not valid;

alter table "public"."admin_messages" validate CONSTRAINT "admin_messages_alert_id_fkey";

create policy "Admins insert alerts"
on "public"."admin_alerts"
as permissive
for insert
to authenticated
with check (true);


create policy "Admins select all alerts"
on "public"."admin_alerts"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Admins manage settings"
on "public"."admin_settings"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Admins insert general notes"
on "public"."admin_messages"
as permissive
for insert
to authenticated
with check (true);


create policy "Admins select all messages"
on "public"."admin_messages"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Service role insert messages"
on "public"."admin_messages"
as permissive
for insert
to service_role
with check (true);

CREATE OR REPLACE FUNCTION public.acknowledge_admin_alert(p_alert_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$\nDECLARE\n  v_user_id uuid;\n  v_is_admin boolean;\n  v_already_acked boolean;\nBEGIN\n  v_user_id := auth.uid();\n  IF v_user_id IS NULL THEN RETURN false; END IF;\n\n  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = v_user_id AND role = 'admin') INTO v_is_admin;\n  IF NOT v_is_admin THEN RETURN false; END IF;\n\n  -- Check idempotency: Has this user acknowledged this alert today?\n  SELECT EXISTS (\n      SELECT 1 FROM admin_messages \n      WHERE alert_id = p_alert_id \n      AND author_id = v_user_id \n      AND action_type = 'acknowledge'\n      AND created_at >= date_trunc('day', now())\n  ) INTO v_already_acked;\n\n  IF v_already_acked THEN\n      RETURN true; -- Treat as success but skip insert\n  END IF;\n\n  INSERT INTO admin_messages (alert_id, author_id, author_role, message, action_type)\n  VALUES (p_alert_id, v_user_id, 'admin', 'Alert acknowledged', 'acknowledge');\n\n  RETURN true;\nEXCEPTION WHEN OTHERS THEN\n  RETURN false;\nEND;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_admin_alert(p_alert_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$\nDECLARE\n  v_user_id uuid;\n  v_is_admin boolean;\n  v_alert_status timestamptz;\nBEGIN\n  v_user_id := auth.uid();\n  IF v_user_id IS NULL THEN RETURN false; END IF;\n\n  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = v_user_id AND role = 'admin') INTO v_is_admin;\n  IF NOT v_is_admin THEN RETURN false; END IF;\n\n  -- Log the resolution action\n  INSERT INTO admin_messages (alert_id, author_id, author_role, message, action_type)\n  VALUES (p_alert_id, v_user_id, 'admin', 'Alert resolved', 'resolve');\n\n  -- Check if already resolved to avoid overwriting original resolution time\n  SELECT resolved_at INTO v_alert_status FROM admin_alerts WHERE id = p_alert_id;\n  
  IF v_alert_status IS NULL THEN
      UPDATE admin_alerts 
      SET resolved_at = now() 
      WHERE id = p_alert_id;
  END IF;\n\n  RETURN true;\nEXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.snooze_admin_alert(p_alert_id uuid, p_until timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$\nDECLARE\n  v_user_id uuid;\n  v_is_admin boolean;\n  v_snooze_msg text;\nBEGIN\n  v_user_id := auth.uid();\n  IF v_user_id IS NULL THEN RETURN false; END IF;\n\n  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = v_user_id AND role = 'admin') INTO v_is_admin;\n  IF NOT v_is_admin THEN RETURN false; END IF;\n\n  -- Format timestamp for US Central in the message (best effort in SQL, better in JS but required here)\n  v_snooze_msg := 'Alert snoozed until ' || to_char(p_until AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD HH24:MI:SS') || ' CT';\n\n  INSERT INTO admin_messages (alert_id, author_id, author_role, message, action_type)\n  VALUES (p_alert_id, v_user_id, 'admin', v_snooze_msg, 'snooze');\n\n  -- Ideally we might update a 'snoozed_until' column on admin_alerts if it existed, but per spec we only log message here.\n  
  RETURN true;\nEXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_error_threshold()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$\nDECLARE\n  v_error_count integer;\n  v_window_start timestamptz;\n  v_window_end timestamptz;\n  v_existing_alert_id uuid;\n  v_top_reasons jsonb;\nBEGIN\n  v_window_start := date_trunc('hour', now());\n  v_window_end := v_window_start + interval '1 hour';\n\n  -- Count errors in last hour\n  SELECT count(*) INTO v_error_count\n  FROM app_events\n  WHERE severity = 'error'\n  AND created_at >= (now() - interval '1 hour');\n\n  IF v_error_count >= 5 THEN
    -- Check if alert exists for current window
    SELECT id INTO v_existing_alert_id
    FROM admin_alerts
    WHERE window_start = v_window_start;

    IF v_existing_alert_id IS NULL THEN
      -- Get top reasons
      SELECT jsonb_agg(jsonb_build_object('reason', r.reason, 'count', r.count)) 
      INTO v_top_reasons 
      FROM public.get_top_error_reasons() r;

      -- Insert new alert
      INSERT INTO admin_alerts (window_start, window_end, error_count, metadata)
      VALUES (v_window_start, v_window_end, v_error_count, jsonb_build_object('top_reasons', v_top_reasons));
      
      -- Trigger Edge Function via pg_net
      -- REPLACE_WITH_PROJECT_REF and REPLACE_WITH_SERVICE_ROLE_KEY must be updated manually or via env injection script
      PERFORM net.http_post(
          url := 'https://REPLACE_WITH_PROJECT_REF.supabase.co/functions/v1/send_admin_alert',
          headers := '{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer REPLACE_WITH_SERVICE_REF.supabase.co/functions/v1/send_admin_alert',
          body := jsonb_build_object(
            'error_count', v_error_count, 
            'window_start', v_window_start,
            'top_reasons', v_top_reasons
          )
      );
      
    END IF;\n  ELSE
    -- Find open alert for current window
    UPDATE admin_alerts
    SET resolved_at = now()
    WHERE window_start = v_window_start
    AND resolved_at IS NULL;
  END IF;\nEND;
$function$;

CREATE OR REPLACE FUNCTION public.get_top_error_reasons()
 RETURNS TABLE(reason text, count bigint)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$\n  SELECT reason, count(*) as c\n  FROM app_events\n  WHERE severity = 'error'\n  AND created_at >= now() - interval '1 hour'\n  GROUP BY reason\n  ORDER BY c DESC\n  LIMIT 3;\n$function$;
