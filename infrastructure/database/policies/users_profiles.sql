create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  image text,
  role text check (role in ('driver', 'passenger')) not null,
  created_at timestamp default now()
);
