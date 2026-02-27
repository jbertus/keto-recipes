
ADMIN ROLE STORAGE:
- Column Name: role
- Data Type: text
- Admin Value: 'admin'
- Example Query: SELECT * FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin';

JWT/METADATA:
- Stored in: Not directly in `auth.users` `raw_app_meta_data` or `raw_user_meta_data` for admin status. The `role` is stored in `public.profiles`.
- Structure: N/A for admin status directly in JWT metadata.

is_admin() Function:
- Current Logic:
