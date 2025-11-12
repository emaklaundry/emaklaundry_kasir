-- user dengan id ini ada di auth.users
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('11c86333-295c-4bd9-9302-a69fda4811c0', 'Super Admin', 'Super Admin', NULL);

-- cabang: Kota Banjar
-- UUID: 9b7e1c2a-1234-4bcd-8e9f-abcdef123456
INSERT INTO public.stores (id, name, address, "isActive")
VALUES ('9b7e1c2a-1234-4bcd-8e9f-abcdef123456', 'Cabang Kota Banjar', 'Kota Banjar', true);

-- admin: admin_banjar (cabang Kota Banjar)
-- nama: yopi, password: 12345678
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('e0efe954-3fcc-4688-a78d-45640228df47', 'YOPI', 'Admin', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');

INSERT INTO public.user_credentials (profile_id, username, password_hash)
VALUES ('e0efe954-3fcc-4688-a78d-45640228df47', 'admin_banjar', '$2b$10$VA30w6vAXfP3REFPEIpkqu6vjgs/FvBJHB8nWQouvVmZd0wUTfMaC');

-- kasir: ani (cabang Kota Banjar)
-- nama: ani, password: 12345678
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('2c093716-8e1e-4237-92a2-04cd5ef2658b', 'ani', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');

INSERT INTO public.user_credentials (profile_id, username, password_hash)
VALUES ('2c093716-8e1e-4237-92a2-04cd5ef2658b', 'ani', '$2b$10$VA30w6vAXfP3REFPEIpkqu6vjgs/FvBJHB8nWQouvVmZd0wUTfMaC');