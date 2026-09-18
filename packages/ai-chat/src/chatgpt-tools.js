export const DASTAN_CHATGPT_TOOLS = Object.freeze([
  { name: 'get_my_powerfit_summary', description: 'Read the authenticated user PowerFit360 summary: membership, AI generation balance, and enabled edition.', readOnly: true },
  { name: 'get_my_ai_generations', description: 'Read the authenticated user available AI workout generations and recent generation history.', readOnly: true },
  { name: 'get_my_routines', description: 'Read the authenticated user recent assigned or generated workout plans.', readOnly: true },
  { name: 'get_my_cps_progress', description: 'Read the authenticated user CPS route, current level/grade, current tomo and pending progression requirements.', readOnly: true },
  { name: 'get_my_cps_tomos', description: 'Read the authenticated user CPS tomo entitlements and completion states.', readOnly: true },
  { name: 'get_my_pending_video_reviews', description: 'Read CPS technique videos submitted by the authenticated user and their review states.', readOnly: true },
  { name: 'get_my_evaluations', description: 'Read the authenticated user recent technical, live and tomo-test evaluation states.', readOnly: true },
  { name: 'get_my_payment_status', description: 'Read the authenticated user membership payment status and due date.', readOnly: true },
])

export const DASTAN_CHATGPT_PHASE2_ACTIONS = Object.freeze([
  'generate_workout_after_user_confirmation',
  'schedule_cps_assessment_after_user_confirmation',
  'open_or_download_authorized_tomo',
])

export function isReadOnlyDastanTool(name) {
  return DASTAN_CHATGPT_TOOLS.some((tool) => tool.name === name && tool.readOnly)
}
