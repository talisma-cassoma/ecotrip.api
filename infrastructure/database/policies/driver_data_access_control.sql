create policy "Drivers can view their own data"
on drivers
for select
using (auth.uid() = user_id);
