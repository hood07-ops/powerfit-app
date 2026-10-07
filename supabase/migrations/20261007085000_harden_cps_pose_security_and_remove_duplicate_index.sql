drop index if exists public.cps_certificates_code_unique_idx;

alter view public.cps_pose_review_queue set (security_invoker = true);
alter view public.cps_pose_publish_ready set (security_invoker = true);

revoke all on public.cps_pose_review_queue from public, anon;
revoke all on public.cps_pose_publish_ready from public, anon;
grant select on public.cps_pose_review_queue to authenticated, service_role;
grant select on public.cps_pose_publish_ready to authenticated, service_role;

create or replace function public.cps_pose_publish_gate(p_technique_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare v_result jsonb;
begin
  if coalesce(auth.role(),'') <> 'service_role'
     and (auth.uid() is null or not coalesce(public.cps_is_admin(),false)) then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;

  with t as (
    select * from public.cps_pose_techniques where technique_code=p_technique_code
  ),
  q as (
    select * from public.cps_pose_qc_runs
    where technique_id=(select id from t)
    order by created_at desc
    limit 1
  )
  select jsonb_build_object(
    'technique_code',(select technique_code from t),
    'status',(select status from t),
    'locked',(select locked from t),
    'latest_qc',coalesce((select overall_status from q),'MISSING'),
    'publish_ready',
      coalesce((select status in ('CHECK_OK','LOCKED') from t),false)
      and coalesce((select overall_status='PASS' from q),false)
      and exists(
        select 1 from public.cps_pose_assets a
        where a.technique_id=(select id from t)
          and a.asset_kind in ('CHECK_OK_IMAGE','FINAL_PAGE')
          and a.is_canonical=true
      )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.get_cps_pose_generation_contract(p_technique_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_t public.cps_pose_techniques%rowtype;
  v_keyframes jsonb;
  v_rules jsonb;
begin
  if coalesce(auth.role(),'') <> 'service_role'
     and (auth.uid() is null or not coalesce(public.cps_is_admin(),false)) then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;

  select * into v_t
  from public.cps_pose_techniques
  where technique_code=p_technique_code;

  if not found then
    raise exception 'unknown CPS technique code: %',p_technique_code;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'frame_no',k.frame_no,'frame_name_es',k.frame_name_es,'frame_name_en',k.frame_name_en,
      'stance',k.stance,'execution_side',k.execution_side,'lead_foot',k.lead_foot,
      'rear_foot',k.rear_foot,'pivot_foot',k.pivot_foot,'support_foot',k.support_foot,
      'weight_transfer',k.weight_transfer,'torso_rotation',k.torso_rotation,
      'head_position',k.head_position,'protecting_hand',k.protecting_hand,
      'trajectory',k.trajectory,'recovery_expected',k.recovery_expected,'notes',k.notes
    ) order by k.frame_no
  ),'[]'::jsonb)
  into v_keyframes
  from public.cps_pose_keyframes k
  where k.technique_id=v_t.id;

  select coalesce(jsonb_agg(
    jsonb_build_object('rule_key',r.rule_key,'expected_value',r.expected_value,'severity',r.severity)
    order by r.rule_key
  ),'[]'::jsonb)
  into v_rules
  from public.cps_pose_rules r
  where r.technique_id=v_t.id and r.active=true;

  return jsonb_build_object(
    'technique_code',v_t.technique_code,'tomo_no',v_t.tomo_no,'discipline',v_t.discipline,
    'section',v_t.section,'title_es',v_t.title_es,'title_en',v_t.title_en,
    'movement_type',v_t.movement_type,'stance',v_t.stance,'lead_side',v_t.lead_side,
    'rear_side',v_t.rear_side,'execution_side',v_t.execution_side,
    'protecting_side',v_t.protecting_side,'pivot_foot',v_t.pivot_foot,
    'first_moving_foot',v_t.first_moving_foot,'recovery_rule',v_t.recovery_rule,
    'canonical_notes',v_t.canonical_notes,'status',v_t.status,'locked',v_t.locked,
    'keyframes',v_keyframes,'rules',v_rules,
    'generation_policy',jsonb_build_object(
      'do_not_mirror',true,'do_not_swap_sides',true,
      'text_must_follow_database_not_image_guess',true,
      'locked_pose_may_not_be_regenerated',v_t.locked,'require_qc_before_publish',true
    )
  );
end;
$$;

revoke all on function public.cps_pose_publish_gate(text) from public, anon;
revoke all on function public.get_cps_pose_generation_contract(text) from public, anon;
grant execute on function public.cps_pose_publish_gate(text) to authenticated, service_role;
grant execute on function public.get_cps_pose_generation_contract(text) to authenticated, service_role;
