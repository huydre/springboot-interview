-- Study days (local dates YYYY-MM-DD) behind the streak tile; merged with the device's copy on sign-in.
alter table public.user_state add column if not exists study_days text[] not null default '{}';
