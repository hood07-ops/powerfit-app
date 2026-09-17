# CPS deployed inventory

> Source: current `cps-staging` deployment inspected during monorepo migration. This is a compatibility inventory, not a reconstruction of the original source repository.

## Product boundaries

CPS remains an independent combat-sports product with its own deployment and Supabase project during the first monorepo stages.

### Athlete areas
- Dashboard
- My Program
- Library
- Progress
- Alerts
- Profile

### Coach areas
- Dashboard
- Athletes
- Athlete detail / progress workspace
- Feedback
- Session overrides
- Technical assessments

### Admin areas
- Techniques
- Sessions
- Programs
- Videos

## CPS domain detected

### Core tables
- profiles
- athlete_profiles
- alerts
- enrollments
- programs
- enrollment_days
- program_days
- program_weeks
- sessions
- session_blocks
- session_logs
- techniques
- technique_steps
- technique_videos
- technique_drills
- drills
- assessments
- technical_assessment_items
- weekly_reviews
- recovery_logs
- body_metrics
- pain_reports

### Storage buckets
- cps-technique-videos
- cps-assessment-videos
- cps-avatars

### RPC / backend contracts
- start_cps_mvp_enrollment
- has_completed_initial_assessment
- complete_initial_assessment
- complete_final_assessment
- complete_weekly_review
- get_assessment_comparison
- acknowledge_my_alert
- set_my_avatar_path
- get_my_progress_dashboard
- get_coach_athlete_progress
- get_coach_profile
- get_coach_athletes
- get_coach_athlete_detail
- create_coach_feedback
- override_enrollment_day_session
- create_technical_assessment
- get_athlete_feedback
- mark_coach_feedback_read
- save_daily_recovery
- save_body_metric
- save_pain_report
- start_enrollment_session
- complete_session

## MVP program contract

- Program: `CPS Fighter - Fundamentals & Performance`
- Duration: 8 weeks
- Known program code: `CPS-PROG-MVP-08`
- Known final test session code: `CPS-SES-TEST-016`
- Disciplines represented: boxing, kickboxing, K1 and multi

## Shared candidates with PowerFit360

These are safe conceptual candidates for shared packages, but they must not directly share database credentials:

1. Technical content metadata
2. Evaluation types and scoring models
3. Video metadata / validation rules
4. Recovery data types
5. Body metrics data types
6. Progress DTOs
7. Roles and common identity types
8. Payment product references
9. ES/EN translation keys

## Do not share yet

Keep these product-specific in phase 1:

- Supabase project URLs / keys
- RLS policies
- auth sessions
- service-role credentials
- storage bucket permissions
- webhook secrets
- production domains

## Migration rule

The deployed CPS application stays operational while the monorepo is prepared. Nothing in this inventory authorizes schema changes or data migration.
