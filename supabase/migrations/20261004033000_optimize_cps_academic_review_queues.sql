create index if not exists cps_tomo_question_answers_review_queue_idx
  on public.cps_tomo_question_answers(status, updated_at)
  where status in ('SUBMITTED','CORRECTION_REQUIRED');

create index if not exists cps_tomo_question_answers_student_tomo_status_idx
  on public.cps_tomo_question_answers(alumno_id, route_code, tomo_no, status);

create index if not exists cps_exam_items_active_tomo_route_idx
  on public.cps_exam_items(tomo_no, route_code, id)
  where active=true;

create index if not exists cps_video_submissions_review_queue_idx
  on public.cps_video_submissions(status, created_at)
  where status in ('VIDEO_SUBMITTED','VIDEO_UNDER_REVIEW');

create index if not exists cps_card_progress_live_queue_idx
  on public.cps_card_progress(status, updated_at)
  where status in ('LIVE_PENDING','LIVE_CORRECTION_REQUIRED');
