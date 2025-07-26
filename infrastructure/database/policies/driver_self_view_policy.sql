create or replace function get_current_driver()
returns table (
  id uuid,
  name text,
  image text,
  role text,
  rating numeric,
  car_model text,
  car_plate text,
  license_number text,
  complited_rides numeric
) 
language sql
security definer
as $$
  select 
    u.id,
    u.name,
    u.image,
    u.role,
    d.rating,
    d.car_model,
    d.car_plate,
    d.license_number,
    d.complited_rides
  from users u
  join drivers d on d.user_id = u.id
  where u.id = auth.uid()
    and u.role = 'driver';
$$;
