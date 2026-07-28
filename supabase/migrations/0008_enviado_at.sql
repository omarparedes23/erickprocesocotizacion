-- cotizaciones-migration: registra el momento exacto en que gerente_comercial
-- confirma el envío final (enviar_cliente / enviar_no_cotizar), ver
-- 0006_final_task_confirmation.sql. Antes de esto, saber si un caso ya
-- estaba "enviado" (vs. solo pendiente de confirmar) requería un query
-- aparte a tume_tasks buscando la fila más reciente y mirando su status.
-- Con esta columna, tanto el detalle del caso como cualquier filtro/listado
-- lo resuelven con un simple `enviado_at is not null`, sin joins.

alter table tume_cases add column enviado_at timestamptz;

create or replace function tume_complete_final_task(
  p_case_id uuid,
  p_actor_id uuid,
  p_reason text default null
) returns tume_cases
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_task_type tume_task_type_enum;
  v_case tume_cases;
begin
  select current_task_type into v_task_type
    from tume_cases where id = p_case_id for update;

  if not found then
    raise exception 'tume_cases % not found', p_case_id;
  end if;

  if v_task_type not in ('enviar_cliente', 'enviar_no_cotizar') then
    raise exception 'tume_cases % no está en una tarea final confirmable (actual: %)',
      p_case_id, v_task_type;
  end if;

  update tume_tasks
    set status = 'done', completed_at = now()
    where case_id = p_case_id
      and task_type = v_task_type
      and status in ('pending', 'in_progress');

  insert into tume_case_transitions (case_id, from_task_type, to_task_type, actor_id, reason)
    values (p_case_id, v_task_type, v_task_type, p_actor_id, p_reason);

  update tume_cases
    set updated_at = now(),
        enviado_at = now()
    where id = p_case_id
    returning * into v_case;

  return v_case;
end;
$$;
