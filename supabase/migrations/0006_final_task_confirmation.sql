-- cotizaciones-migration: 'enviar_cliente' y 'enviar_no_cotizar' dejan de
-- cerrarse solas al llegar a ellas. En el diagrama BPMN son un task de envío
-- propio (ícono de sobre) antes del evento Fin, no un efecto colateral
-- automático de la aprobación previa -- por eso quedaba una fila 'pending' en
-- tume_tasks para gerente_comercial que la UI nunca dejaba completar. Esta
-- función marca esa fila como 'done' y deja un registro de auditoría
-- (self-transition: from_task_type = to_task_type) sin insertar una tarea
-- siguiente, porque no la hay -- el caso ya llegó a current_task_type
-- correcto desde la transición anterior. NO hay lógica de negocio acá (ver
-- 0002_transition_functions.sql): solo valida que la tarea actual sea una de
-- las dos finales antes de escribir.

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
    set updated_at = now()
    where id = p_case_id
    returning * into v_case;

  return v_case;
end;
$$;
