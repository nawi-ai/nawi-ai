-- Ñawi MVP
-- El catálogo de cuentos vive en data/stories.ts. Es la única fuente de los textos,
-- preguntas y criterios. reading_sessions.story_id guarda ese identificador estable.
-- No hay tabla stories para no mantener dos copias que puedan contradecirse.
--
-- Las escrituras de sesiones y respuestas las hace el servidor con la service role,
-- después de comprobar la identidad. El navegador no puede insertar puntajes:
-- authenticated solo puede leer sus filas. Los perfiles sí los actualiza el lector
-- autenticado, porque solo guardan el nivel preferido.

create table public.reader_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  preferred_level smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reader_profiles_nickname_length check (nickname is null or char_length(nickname) <= 24),
  constraint reader_profiles_level_check check (preferred_level is null or preferred_level in (1, 2, 3))
);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  reader_id uuid not null references public.reader_profiles (id) on delete cascade,
  story_id text not null,
  reading_level smallint not null,
  status text not null default 'in_progress',
  score integer,
  correct_answers integer,
  total_questions integer,
  evaluated_questions integer,
  pending_review integer,
  strengths jsonb not null default '[]'::jsonb,
  recommendation text,
  support_note text,
  next_story_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint reading_sessions_story_id_check check (story_id ~ '^[a-z0-9-]{1,80}$'),
  constraint reading_sessions_level_check check (reading_level in (1, 2, 3)),
  constraint reading_sessions_status_check check (status in ('in_progress', 'completed')),
  constraint reading_sessions_completion_check check (
    (
      status = 'in_progress'
      and score is null
      and completed_at is null
      and correct_answers is null
    )
    or (
      status = 'completed'
      and completed_at is not null
      and correct_answers is not null
      and total_questions is not null
      and evaluated_questions is not null
      and pending_review is not null
      and (score is null or (score >= 0 and score <= 100))
    )
  )
);

create unique index reading_sessions_one_active_per_story
  on public.reading_sessions (reader_id, story_id)
  where status = 'in_progress';

create index reading_sessions_reader_started_idx
  on public.reading_sessions (reader_id, started_at desc);

create table public.reading_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reading_sessions (id) on delete cascade,
  question_id text not null,
  answer_text text not null,
  is_correct boolean not null,
  feedback text not null,
  hint text,
  confidence double precision not null default 1,
  needs_review boolean not null default false,
  next_action text not null,
  attempt_number integer not null,
  created_at timestamptz not null default now(),
  constraint reading_answers_question_check check (question_id ~ '^[a-z0-9-]{1,80}$'),
  constraint reading_answers_text_check check (char_length(answer_text) between 1 and 500),
  constraint reading_answers_feedback_check check (char_length(feedback) between 1 and 500),
  constraint reading_answers_attempt_check check (attempt_number between 1 and 3),
  constraint reading_answers_action_check check (next_action in ('continue', 'retry', 'clarify')),
  constraint reading_answers_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint reading_answers_attempt_unique unique (session_id, question_id, attempt_number)
);

create index reading_answers_session_idx
  on public.reading_answers (session_id, created_at);

alter table public.reader_profiles enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.reading_answers enable row level security;

alter table public.reader_profiles force row level security;
alter table public.reading_sessions force row level security;
alter table public.reading_answers force row level security;

revoke all on public.reading_sessions from anon, authenticated;
revoke all on public.reading_answers from anon, authenticated;
grant select on public.reading_sessions to authenticated;
grant select on public.reading_answers to authenticated;

revoke all on public.reader_profiles from anon, authenticated;
grant select, insert, update on public.reader_profiles to authenticated;

-- Las tablas nuevas no heredan privilegios para service_role. Sin este
-- grant el API responde 42501 al guardar una lectura.
grant select, insert, update, delete on public.reader_profiles to service_role;
grant select, insert, update, delete on public.reading_sessions to service_role;
grant select, insert, update, delete on public.reading_answers to service_role;

create policy reader_profiles_select
  on public.reader_profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy reader_profiles_insert
  on public.reader_profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy reader_profiles_update
  on public.reader_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy reading_sessions_select
  on public.reading_sessions
  for select
  to authenticated
  using (reader_id = auth.uid());

create policy reading_answers_select
  on public.reading_answers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reading_sessions
      where reading_sessions.id = reading_answers.session_id
        and reading_sessions.reader_id = auth.uid()
    )
  );
