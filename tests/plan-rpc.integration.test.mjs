import { before, after, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { generateAdaptiveSession, formatAdaptiveSession } from '../packages/training-engine/src/adaptivePlanning.js'

// No URL, secrets or network clients: every query targets this in-memory engine.
const owner = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
const coach = '00000000-0000-4000-8000-000000000003'
const admin = '00000000-0000-4000-8000-000000000004'
let db
const file = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const content = formatAdaptiveSession(generateAdaptiveSession({ goal: 'fighter', level: 'basico', daysPerWeek: 3, durationMinutes: 45, equipment: 'none', adultConfirmed: true }).session)
const saveSql = 'select public.save_powerfit_manual_plan_with_generation_secure($1,$2,$3,$4,$5) as result'

async function actingAs(uid, action) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated')
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [uid || ''])
    return action(tx)
  })
}
const save = (tx, id = 100, text = content) => tx.query(saveSql, [id, 'fighter', 'basico', text, 'powerfit-consultant-v2'])
async function snapshot(id = 100) {
  const { rows } = await db.query('select generaciones_disponibles as balance, (select count(*)::int from public.planificaciones_generadas) as plans, (select count(*)::int from public.powerfit_plan_metadata) as metadata, (select count(*)::int from public.powerfit_plan_events) as events, (select count(*)::int from public.powerfit_generation_adjustments) as adjustments from public.alumnos where id=$1', [id])
  return rows[0]
}

before(async () => {
  db = new PGlite()
  await db.exec(await file('./fixtures/plan-rpc-schema.sql'))
  await db.exec(await file('./fixtures/plan-rpc-observed.sql'))
  await db.exec(await file('./fixtures/generator-reader-schema.sql'))
  await db.exec(await file('./fixtures/generator-reader-observed.sql'))
  for (const signature of ['save_powerfit_plan_secure(bigint,text,text,text,text,text)', 'save_powerfit_manual_plan_with_generation_secure(bigint,text,text,text,text)', 'get_powerfit_generator_state_secure(bigint)']) {
    await db.exec(`revoke all on function public.${signature} from public, anon; grant execute on function public.${signature} to authenticated`)
  }
})
after(async () => { await db?.close() })
beforeEach(async () => {
  await db.exec('truncate public.powerfit_plan_events,public.powerfit_plan_metadata,public.powerfit_generation_adjustments,public.planificaciones_generadas,public.powerfit_coach_assignments,public.alumnos restart identity')
  for (const [id, user, role, balance] of [[100,owner,'alumno',3],[200,other,'alumno',3],[300,coach,'coach',3],[400,admin,'admin',3],[500,null,'alumno',2],[600,owner,'alumno',0],[700,owner,'alumno',1]]) {
    await db.query('insert into public.alumnos(id,user_id,nombre,role,generaciones_disponibles) values($1,$2,$3,$4,$5)', [id,user,`Persona ficticia ${id}`,role,balance])
  }
  await db.query('insert into public.powerfit_coach_assignments(coach_user_id,alumno_id) values($1,100)', [coach])
})

test('owner saves adapted text, metadata, event and exactly one credit atomically', async () => {
  const { rows } = await actingAs(owner, (tx) => save(tx))
  assert.equal(rows[0].result.consumed_generations, 1)
  assert.equal(rows[0].result.quota_after, 2)
  assert.equal(rows[0].result.plan.contenido, content)
  assert.equal(rows[0].result.metadata.source_ref, 'powerfit-consultant-v2')
  assert.deepEqual(await snapshot(), { balance: 2, plans: 1, metadata: 1, events: 1, adjustments: 1 })
})

test('unauthenticated and another student cannot save or consume a credit', async () => {
  for (const uid of [null, other]) {
    await assert.rejects(actingAs(uid, (tx) => save(tx)), (error) => error.code === '42501')
    assert.deepEqual(await snapshot(), { balance: 3, plans: 0, metadata: 0, events: 0, adjustments: 0 })
  }
})

test('anonymous role has no execute grant on the three observed entry points', async () => {
  await assert.rejects(db.transaction(async (tx) => {
    await tx.exec('set local role anon')
    return save(tx)
  }), (error) => error.code === '42501')
  assert.deepEqual(await snapshot(), { balance: 3, plans: 0, metadata: 0, events: 0, adjustments: 0 })
})

test('admin may save, while manual credit RPC retains its existing coach restriction', async () => {
  await assert.rejects(actingAs(coach, (tx) => save(tx)), /FORBIDDEN/)
  await actingAs(admin, (tx) => save(tx))
  assert.equal((await snapshot()).balance, 2)
})

test('no credits, missing athlete and invalid content leave no partial writes', async () => {
  await assert.rejects(actingAs(owner, (tx) => save(tx, 600)), /NO_GENERATIONS_AVAILABLE/)
  await assert.rejects(actingAs(owner, (tx) => save(tx, 999)), /ATHLETE_NOT_FOUND/)
  await assert.rejects(actingAs(owner, (tx) => save(tx, 100, 'corto')), /too short/)
  await assert.rejects(actingAs(owner, (tx) => save(tx, 100, 'x'.repeat(120001))), /too large/)
  assert.deepEqual(await snapshot(), { balance: 3, plans: 0, metadata: 0, events: 0, adjustments: 0 })
})

test('an audit-write failure rolls back the plan, metadata, event and credit', async () => {
  await db.exec("create function public.test_fail_adjustment() returns trigger language plpgsql as $$ begin raise exception 'TEST_AUDIT_FAILURE'; end $$; create trigger test_fail_adjustment before insert on public.powerfit_generation_adjustments for each row execute function public.test_fail_adjustment()")
  try {
    await assert.rejects(actingAs(owner, (tx) => save(tx)), /TEST_AUDIT_FAILURE/)
    assert.deepEqual(await snapshot(), { balance: 3, plans: 0, metadata: 0, events: 0, adjustments: 0 })
  } finally {
    await db.exec('drop trigger test_fail_adjustment on public.powerfit_generation_adjustments; drop function public.test_fail_adjustment()')
  }
})

test('a second attempt after the last credit fails without a second plan', async () => {
  await actingAs(owner, (tx) => save(tx, 700))
  await assert.rejects(actingAs(owner, (tx) => save(tx, 700)), /NO_GENERATIONS_AVAILABLE/)
  assert.deepEqual(await snapshot(700), { balance: 0, plans: 1, metadata: 1, events: 1, adjustments: 1 })
})

test('observed function bodies reproduce NULL-owner authorization gap locally', async () => {
  await actingAs(other, (tx) => save(tx, 500))
  assert.equal((await snapshot(500)).balance, 1)
  const result = await actingAs(other, (tx) => tx.query('select public.get_powerfit_generator_state_secure(500) as state'))
  assert.equal(result.rows[0].state.generations_available, 1)
  // This is a characterization of the observed SQL, not an accepted policy.
  // Production triggers/constraints/JWT validation are not cloned here.
})

test('proposed hardening denies NULL owner in both entry points and retains valid saves', async () => {
  await db.exec(await file('../supabase/proposals/harden_plan_rpc_null_authorization.sql'))
  try {
    await assert.rejects(actingAs(other, (tx) => save(tx, 500)), /FORBIDDEN/)
    await assert.rejects(actingAs(other, (tx) => tx.query("select public.save_powerfit_plan_secure(500,'fighter','basico',$1,'manual','test')", [content])), /FORBIDDEN/)
    await assert.rejects(actingAs(other, (tx) => tx.query('select public.get_powerfit_generator_state_secure(500)')), /FORBIDDEN/)
    assert.deepEqual(await snapshot(500), { balance: 2, plans: 0, metadata: 0, events: 0, adjustments: 0 })
    await actingAs(owner, (tx) => save(tx))
    await actingAs(admin, (tx) => save(tx, 500))
    assert.equal((await snapshot()).balance, 2)
    assert.equal((await snapshot(500)).balance, 1)
  } finally {
    await db.exec(await file('./fixtures/plan-rpc-observed.sql'))
    await db.exec(await file('./fixtures/generator-reader-observed.sql'))
  }
})

test('proposal refuses to overwrite SQL changed since the reviewed snapshot', async () => {
  const observed = await file('./fixtures/plan-rpc-observed.sql')
  await db.exec(observed.replace('Plan content is too short', 'Changed locally for drift test'))
  try {
    await assert.rejects(db.exec(await file('../supabase/proposals/harden_plan_rpc_null_authorization.sql')), /PLAN_RPC_SOURCE_DRIFT_REVIEW_REQUIRED/)
    await db.exec('rollback')
    const { rows } = await db.query("select pg_get_functiondef('public.save_powerfit_plan_secure(bigint,text,text,text,text,text)'::regprocedure) as definition")
    assert.match(rows[0].definition, /Changed locally for drift test/)
  } finally {
    await db.exec('rollback')
    await db.exec(observed)
  }
})
