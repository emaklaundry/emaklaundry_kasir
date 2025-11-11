-- Dummy kasir: ani
-- Ganti UUID sesuai user di auth.users dan store yang valid
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('2c093716-8e1e-4237-92a2-04cd5ef2658b', 'ani', 'Kasir', 'babc700d-d486-4440-b066-d4a40e0a4b51');

INSERT INTO public.user_credentials (profile_id, username, password_hash)
VALUES ('2c093716-8e1e-4237-92a2-04cd5ef2658b', 'ani', '$2a$10$wH6Q8Qw1Q8Qw1Q8Qw1Q8QeQw1Q8Qw1Q8Qw1Q8Qw1Q8Qw1Q8Qw1Q8');

-- Dummy kasir: didi
-- Ganti UUID sesuai user di auth.users jika sudah ada
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('22222222-2222-2222-2222-222222222222', 'didi', 'Kasir', 'babc700d-d486-4440-b066-d4a40e0a4b51');

INSERT INTO public.user_credentials (profile_id, username, password_hash)
VALUES ('22222222-2222-2222-2222-222222222222', 'didi', '$2a$10$wH6Q8Qw1Q8Qw1Q8Qw1Q8QeQw1Q8Qw1Q8Qw1Q8Qw1Q8Qw1Q8Qw1Q8');

