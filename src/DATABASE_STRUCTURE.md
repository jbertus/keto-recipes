# Database Schema & Data Flow Analysis

## Overview
This document outlines the data structure used for the Planner, Recipes, and Shopping List functionality, specifically identifying where ingredients are stored and how they propagate to the Shopping List.

## 1. Weekly Meal Plans
**Table:** `weekly_plans`  
**Purpose:** Stores the user's meal schedule for a specific week.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Links to the `users` table (Auth). |
| `week_start` | Date | The start date of the week (e.g., '2024-01-01'). |
| `plan_data` | JSONB | **PRIMARY STORAGE FOR INGREDIENTS.** Stores the full state of the planner. |
| `updated_at` | Timestamp | Used to identify the latest save state. |

### How Ingredients are Stored
Ingredients for planned meals are **NOT** stored in a separate relational table (e.g., there is no `plan_ingredients` table). Instead, they are embedded within the `plan_data` JSON structure.

**JSON Structure Example (`plan_data`):**