-- Seed manual de usuarios de prueba (uno por rol) para correr la suite e2e
-- (Playwright) contra un proyecto Supabase real. NO es una migración: vive
-- fuera de supabase/migrations/ a propósito para que NO corra automático
-- con `supabase db push` — créalo a mano, una sola vez, en el SQL Editor del
-- proyecto de destino (nunca en un proyecto compartido con datos reales).
--
-- Credenciales: deben coincidir exactamente con TEST_USERS en
-- e2e/helpers.ts. Mismo password para los 4 (solo para test).
--
-- Idempotente: cada bloque revisa si el email ya existe antes de insertar,
-- así que correr el script de nuevo no duplica usuarios ni falla.
--
-- Nota: inserta directo en auth.users/auth.identities (esquema interno de
-- GoTrue) en vez de usar la Admin API porque el pedido fue "un SQL". Si tu
-- proyecto Supabase tiene una versión de GoTrue con un esquema de
-- auth.identities distinto, esto puede fallar — la alternativa más robusta
-- (aunque no sea SQL puro) es supabase.auth.admin.createUser() vía Node
-- con la service_role key.

create extension if not exists pgcrypto;

-- gerente_comercial ----------------------------------------------------
do $$
declare
  v_user_id uuid;
begin
  if not exists (select 1 from auth.users where email = 'tume.comercial@example.com') then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'tume.comercial@example.com', crypt('TumeTest2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'tume.comercial@example.com'),
      'email', now(), now(), now()
    );

    insert into tume_profiles (id, full_name, role)
    values (v_user_id, 'Gerente Comercial (Test)', 'gerente_comercial');
  end if;
end $$;

-- lider_cotizador -------------------------------------------------------
do $$
declare
  v_user_id uuid;
begin
  if not exists (select 1 from auth.users where email = 'tume.lider@example.com') then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'tume.lider@example.com', crypt('TumeTest2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'tume.lider@example.com'),
      'email', now(), now(), now()
    );

    insert into tume_profiles (id, full_name, role)
    values (v_user_id, 'Líder Cotizador (Test)', 'lider_cotizador');
  end if;
end $$;

-- gerente_tecnico ---------------------------------------------------------
do $$
declare
  v_user_id uuid;
begin
  if not exists (select 1 from auth.users where email = 'tume.tecnico@example.com') then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'tume.tecnico@example.com', crypt('TumeTest2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'tume.tecnico@example.com'),
      'email', now(), now(), now()
    );

    insert into tume_profiles (id, full_name, role)
    values (v_user_id, 'Gerente Técnico (Test)', 'gerente_tecnico');
  end if;
end $$;

-- cotizador ---------------------------------------------------------------
do $$
declare
  v_user_id uuid;
begin
  if not exists (select 1 from auth.users where email = 'tume.cotizador@example.com') then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'tume.cotizador@example.com', crypt('TumeTest2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'tume.cotizador@example.com'),
      'email', now(), now(), now()
    );

    insert into tume_profiles (id, full_name, role)
    values (v_user_id, 'Cotizador (Test)', 'cotizador');
  end if;
end $$;
