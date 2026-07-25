-- Fixes the "function_search_path_mutable" security advisory (WARN) on
-- tume_create_case and tume_apply_transition. In a shared multi-tenant DB,
-- an unset search_path means unqualified table references could be shadowed
-- by objects created earlier in another role's search_path. Pin it.

alter function tume_create_case(
  text, uuid, text, text, tume_case_type_enum, numeric, boolean, timestamptz, uuid
) set search_path = public;

alter function tume_apply_transition(
  uuid, tume_task_type_enum, tume_role_enum, tume_case_stage_enum,
  tume_case_outcome_enum, uuid, text
) set search_path = public;
