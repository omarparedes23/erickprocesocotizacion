-- cotizaciones-migration: registra quién registró cada caso (created_by).
-- La restricción de QUÉ roles pueden crear casos (gerente_comercial y
-- lider_cotizador) vive en la capa de aplicación (ver lib/permissions.ts),
-- no acá: la política RLS v1 sigue siendo permisiva por diseño (ver
-- 0001_init.sql), igual que el resto de las reglas de negocio del workflow.

alter table tume_cases add column created_by uuid references tume_profiles(id);

create or replace function tume_create_case(
  p_code text,
  p_client_id uuid,
  p_title text,
  p_description text,
  p_type tume_case_type_enum,
  p_budget_usd numeric,
  p_is_express boolean,
  p_delivery_due_at timestamptz,
  p_actor_id uuid
) returns tume_cases
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_case tume_cases;
begin
  insert into tume_cases (
    code, client_id, title, description, type, budget_usd,
    is_express, current_task_type, delivery_due_at, created_by
  )
  values (
    p_code, p_client_id, p_title, p_description, p_type, p_budget_usd,
    p_is_express, 'recibir_solicitud', p_delivery_due_at, p_actor_id
  )
  returning * into v_case;

  insert into tume_tasks (case_id, task_type, assigned_role, status, started_at)
  values (v_case.id, 'recibir_solicitud', 'gerente_comercial', 'pending', now());

  insert into tume_case_transitions (case_id, from_task_type, to_task_type, actor_id, reason)
  values (v_case.id, null, 'recibir_solicitud', p_actor_id, 'Caso creado');

  return v_case;
end;
$$;
