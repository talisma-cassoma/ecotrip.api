create table public.drivers (
  user_id uuid primary key references public.users(id) on delete cascade,
  rating numeric,
  car_model text not null,
  car_plate text not null,
  license_number text not null,
  complited_rides numeric
);
