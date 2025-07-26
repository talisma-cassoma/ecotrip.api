create or replace function public.insert_driver_info(
  p_car_model text,
  p_car_plate text,
  p_license_number text
)
returns void as $$
begin
  insert into public.drivers (user_id, car_model, car_plate, license_number, complited_rides, rating)
  values (
    auth.uid(),
    p_car_model,
    p_car_plate,
    p_license_number,
    0, -- default
    0 -- default
  );
end;
$$ language plpgsql security definer;

-- Agora ativar a política (se RLS estiver ON)
alter table public.drivers enable row level security;

create policy "Allow insert for authenticated users"
on public.drivers for insert
WITH CHECK (auth.uid() = user_id);
