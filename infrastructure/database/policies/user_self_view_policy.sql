create policy "Users can view their own record"
on users
for select
using (auth.uid() = id);
