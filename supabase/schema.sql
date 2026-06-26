-- ================================================================
-- NexoraOS — Database schema
-- Run in Supabase: SQL Editor → paste → Run
-- ================================================================

-- ----------------------------------------------------------------
-- 1. PROFILES  (extends auth.users)
-- ----------------------------------------------------------------
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- 2. PROJECTS
-- ----------------------------------------------------------------
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color_token text not null default '--p-openresto',  -- CSS var token
  area        text not null default 'Личное',          -- Работа / Подработки / Жизнь
  archived    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------
-- 3. TASKS
-- ----------------------------------------------------------------
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  title       text not null,
  notes       text,
  priority    smallint check (priority between 1 and 3),   -- 1=urgent 2=important 3=normal
  due_at      timestamptz,
  done        boolean not null default false,
  done_at     timestamptz,
  recurring   text,   -- 'daily' | 'weekly' | 'monthly' | null
  stuck       boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------
-- 4. INBOX ITEMS
-- ----------------------------------------------------------------
create table if not exists inbox_items (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  text                text not null,
  source              text not null default 'web',   -- 'telegram'|'web'|'voice'|'email'
  duration_sec        int,                            -- for voice
  resolved            boolean not null default false,
  snoozed_until       timestamptz,
  suggested_type      text,                          -- 'task'|'note'|'reminder'|'contact'
  suggested_project_id uuid references projects(id) on delete set null,
  created_at          timestamptz default now()
);

-- ----------------------------------------------------------------
-- 5. CALENDAR EVENTS
-- ----------------------------------------------------------------
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  title       text not null,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  all_day     boolean not null default false,
  color_token text,
  is_deadline boolean not null default false,
  location    text,
  notes       text,
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------
-- 6. NOTES
-- ----------------------------------------------------------------
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  folder      text not null default 'Личное',
  title       text not null,
  body        text not null default '',
  pinned      boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------
-- 7. JOURNAL ENTRIES
-- ----------------------------------------------------------------
create table if not exists journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  mood        smallint check (mood between 1 and 5),
  energy      smallint check (energy between 1 and 5),
  body        text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, date)
);

-- ----------------------------------------------------------------
-- 8. HABITS + HABIT LOGS
-- ----------------------------------------------------------------
create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color_token text not null default '--p-health',
  area        text,
  archived    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz default now()
);

create table if not exists habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  habit_id   uuid not null references habits(id) on delete cascade,
  date       date not null,
  done       boolean not null default true,
  created_at timestamptz default now(),
  unique (habit_id, date)
);

-- ----------------------------------------------------------------
-- 9. CRM CONTACTS
-- ----------------------------------------------------------------
create table if not exists contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  name        text not null,
  email       text,
  phone       text,
  status      text not null default 'Новый',  -- Новый|В работе|Готово|Переговоры|Архив
  tags        text[] default '{}',
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------
-- 10. FINANCIAL ORDERS
-- ----------------------------------------------------------------
create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  contact_id  uuid references contacts(id) on delete set null,
  project_id  uuid references projects(id) on delete set null,
  description text not null,
  amount      numeric(12, 2) not null default 0,
  status      text not null default 'Новый',  -- Новый|В работе|Готово|Переговоры
  paid        boolean not null default false,
  deadline    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY — every table is user-scoped
-- ----------------------------------------------------------------
alter table profiles        enable row level security;
alter table projects        enable row level security;
alter table tasks           enable row level security;
alter table inbox_items     enable row level security;
alter table events          enable row level security;
alter table notes           enable row level security;
alter table journal_entries enable row level security;
alter table habits          enable row level security;
alter table habit_logs      enable row level security;
alter table contacts        enable row level security;
alter table orders          enable row level security;

-- profiles uses id = auth.uid() (no user_id column)
create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- All other tables use user_id = auth.uid()
do $$ declare t text; begin
  foreach t in array array[
    'projects','tasks','inbox_items','events',
    'notes','journal_entries','habits','habit_logs','contacts','orders'
  ] loop
    execute format(
      'create policy "own rows" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ declare t text; begin
  foreach t in array array['projects','tasks','notes','journal_entries','contacts','orders'] loop
    execute format(
      'drop trigger if exists set_updated_at on %I;
       create trigger set_updated_at before update on %I for each row execute procedure set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------
-- Indexes for common query patterns
-- ----------------------------------------------------------------
create index if not exists idx_tasks_user_due      on tasks (user_id, due_at);
create index if not exists idx_tasks_user_done     on tasks (user_id, done);
create index if not exists idx_tasks_project       on tasks (project_id);
create index if not exists idx_inbox_user_resolved on inbox_items (user_id, resolved);
create index if not exists idx_events_user_range   on events (user_id, start_at, end_at);
create index if not exists idx_habit_logs_date     on habit_logs (habit_id, date);
create index if not exists idx_journal_user_date   on journal_entries (user_id, date);
