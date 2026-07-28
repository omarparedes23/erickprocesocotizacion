-- cotizaciones-migration: captura el monto resultante de la tarea 'cotizar'.
-- Nullable: null hasta que el caso pasa por 'cotizar' por primera vez: cada
-- vez que el cotizador confirma (incluyendo reenvíos tras un rechazo), se
-- sobreescribe con el monto más reciente.

alter table tume_cases add column quoted_amount_usd numeric;

create or replace function tume_apply_transition(
  p_case_id uuid,
  p_next_task_type tume_task_type_enum,
  p_next_role tume_role_enum,
  p_next_stage tume_case_stage_enum,
  p_next_outcome tume_case_outcome_enum,
  p_actor_id uuid,
  p_reason text default null,
  p_quoted_amount_usd numeric default null
) returns tume_cases
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_from_task_type tume_task_type_enum;
  v_case tume_cases;
begin
  select current_task_type into v_from_task_type
    from tume_cases where id = p_case_id for update;

  if not found then
    raise exception 'tume_cases % not found', p_case_id;
  end if;

  update tume_tasks
    set status = 'done', completed_at = now()
    where case_id = p_case_id
      and task_type = v_from_task_type
      and status in ('pending', 'in_progress');

  insert into tume_tasks (case_id, task_type, assigned_role, status, started_at)
    values (p_case_id, p_next_task_type, p_next_role, 'pending', now());

  insert into tume_case_transitions (case_id, from_task_type, to_task_type, actor_id, reason)
    values (p_case_id, v_from_task_type, p_next_task_type, p_actor_id, p_reason);

  -- awarded_at (fecha de adjudicación) no se toca acá: ese campo se llena
  -- cuando el cliente decide (adjudicado/desestimado), que es posterior a
  -- enviar_cliente y está fuera del alcance de v1 (ver TASKS.md, Fase 5).
  update tume_cases
    set current_task_type = p_next_task_type,
        stage = p_next_stage,
        outcome = coalesce(p_next_outcome, outcome),
        quoted_amount_usd = coalesce(p_quoted_amount_usd, quoted_amount_usd),
        updated_at = now()
    where id = p_case_id
    returning * into v_case;

  return v_case;
end;
$$;
