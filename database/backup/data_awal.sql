SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict dUhta5uUuCTpL2CmscZa7wPosazaOxbAMAQ4ruHAGbj5wviRIr3aCTkMuJ4iheZ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '0bbe08f0-2cbc-40d9-b2ec-5a2d3ba99c0e', 'authenticated', 'authenticated', 'emaklaundry12@gmail.com', '$2a$10$vOIQLvXABxBdMhuX.eZqkezlNMroDtfBLvCGJtDFDbwOJpx.OHNru', '2025-11-14 11:13:27.925162+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-28 13:01:45.866344+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-14 11:13:27.912769+00', '2025-11-29 09:50:30.621427+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2c093716-8e1e-4237-92a2-04cd5ef2658b', 'authenticated', 'authenticated', 'ani@gmail.com', '$2a$10$QpylgTdCjpLyqdn/jqK1ruHWvTfJ4Iv3O6n/cO4OJvV5co9ansJKu', '2025-11-11 20:55:06.768214+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-30 08:20:48.512761+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-11 20:55:06.72948+00', '2025-11-30 08:20:48.552447+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '7b13d493-23ea-49a0-99cf-133ed7ecf05e', 'authenticated', 'authenticated', 'lilis@gmail.com', '$2a$10$m5pnZUyWnoeeFa1fZBnpbOlb/lCHyueynM52kUvE8jnXW2RDi4S7.', '2025-11-12 10:24:02.436178+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-25 06:07:21.321902+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-12 10:24:02.425523+00', '2025-11-25 11:01:03.988434+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e0efe954-3fcc-4688-a78d-45640228df47', 'authenticated', 'authenticated', 'yopi@gmail.com', '$2a$10$rlYb/81jkcSS6kldZZxtEeNFDUW/1z2Cl4gcpa4NUILTz7bf.JLgq', '2025-11-12 09:25:47.871765+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-29 09:58:03.125772+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-12 09:25:47.837675+00', '2025-11-30 08:54:55.696748+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '11c86333-295c-4bd9-9302-a69fda4811c0', 'authenticated', 'authenticated', 'mhmdnvn18@gmail.com', '$2a$10$lgzgVOsMr305mcawbzkJpOemI89.CO4/I1zN.jm40S8/ASEoY5jLi', '2025-11-11 18:16:20.264878+00', NULL, '', '2025-11-11 18:16:05.704532+00', '', NULL, '', '', NULL, '2025-11-18 19:10:41.702656+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-11 15:51:49.807645+00', '2025-11-18 19:10:41.727023+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '8cbdd6f3-ee72-4500-b2c8-b6401ed6c053', 'authenticated', 'authenticated', 'didi@gmail.com', '$2a$10$Wp0Zu3WUpUi1dfvqgC3fbuLVpy5EzzQ4.fcu2JeT8ut.nNTl2v6aa', '2025-11-12 10:23:25.829741+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-25 06:06:46.32203+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-12 10:23:25.801948+00', '2025-11-25 06:06:46.324373+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('11c86333-295c-4bd9-9302-a69fda4811c0', '11c86333-295c-4bd9-9302-a69fda4811c0', '{"sub": "11c86333-295c-4bd9-9302-a69fda4811c0", "email": "mhmdnvn18@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-11-11 15:51:49.834409+00', '2025-11-11 15:51:49.83508+00', '2025-11-11 15:51:49.83508+00', '0b81aa5a-934b-4188-974c-acd7b18892b4'),
	('2c093716-8e1e-4237-92a2-04cd5ef2658b', '2c093716-8e1e-4237-92a2-04cd5ef2658b', '{"sub": "2c093716-8e1e-4237-92a2-04cd5ef2658b", "email": "ani@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-11 20:55:06.754656+00', '2025-11-11 20:55:06.754722+00', '2025-11-11 20:55:06.754722+00', '719ba4b0-8ac7-47eb-b942-b4d1edd018f7'),
	('e0efe954-3fcc-4688-a78d-45640228df47', 'e0efe954-3fcc-4688-a78d-45640228df47', '{"sub": "e0efe954-3fcc-4688-a78d-45640228df47", "email": "yopi@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-12 09:25:47.859436+00', '2025-11-12 09:25:47.860129+00', '2025-11-12 09:25:47.860129+00', '024523d3-a26f-444d-ab53-f35b8eaf37b1'),
	('8cbdd6f3-ee72-4500-b2c8-b6401ed6c053', '8cbdd6f3-ee72-4500-b2c8-b6401ed6c053', '{"sub": "8cbdd6f3-ee72-4500-b2c8-b6401ed6c053", "email": "didi@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-12 10:23:25.820402+00', '2025-11-12 10:23:25.821612+00', '2025-11-12 10:23:25.821612+00', 'd07359f5-acca-42d7-b758-943d8d284b79'),
	('7b13d493-23ea-49a0-99cf-133ed7ecf05e', '7b13d493-23ea-49a0-99cf-133ed7ecf05e', '{"sub": "7b13d493-23ea-49a0-99cf-133ed7ecf05e", "email": "lilis@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-12 10:24:02.43073+00', '2025-11-12 10:24:02.430787+00', '2025-11-12 10:24:02.430787+00', '7819db17-9d23-4d09-b5d7-18fca2d0259b'),
	('0bbe08f0-2cbc-40d9-b2ec-5a2d3ba99c0e', '0bbe08f0-2cbc-40d9-b2ec-5a2d3ba99c0e', '{"sub": "0bbe08f0-2cbc-40d9-b2ec-5a2d3ba99c0e", "email": "emaklaundry12@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-14 11:13:27.922592+00', '2025-11-14 11:13:27.922653+00', '2025-11-14 11:13:27.922653+00', 'a8ed6c0e-387d-4ddd-a6e7-3b97304fb78f');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('2ef8d264-0472-4c26-83de-06f33c7c81b1', 'e0efe954-3fcc-4688-a78d-45640228df47', '2025-11-29 09:58:03.12587+00', '2025-11-30 07:36:10.923464+00', NULL, 'aal1', NULL, '2025-11-30 07:36:10.923344', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '180.252.16.24', NULL, NULL, NULL, NULL, NULL),
	('6145fd18-5e7d-4c14-b794-531f5730004e', 'e0efe954-3fcc-4688-a78d-45640228df47', '2025-11-29 09:51:44.019821+00', '2025-11-30 08:00:25.487793+00', NULL, 'aal1', NULL, '2025-11-30 08:00:25.487698', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '180.252.16.24', NULL, NULL, NULL, NULL, NULL),
	('69aa7d0f-c8c2-4d11-ab4e-420e2bff68b6', '2c093716-8e1e-4237-92a2-04cd5ef2658b', '2025-11-30 08:20:48.512881+00', '2025-11-30 08:20:48.512881+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '180.252.16.24', NULL, NULL, NULL, NULL, NULL),
	('970b1c74-b76b-4b7a-b89c-9e98e7dec11c', 'e0efe954-3fcc-4688-a78d-45640228df47', '2025-11-27 08:22:58.586652+00', '2025-11-30 08:38:40.420819+00', NULL, 'aal1', NULL, '2025-11-30 08:38:40.420108', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '180.252.16.24', NULL, NULL, NULL, NULL, NULL),
	('5b1a9eac-295f-4a66-b1fe-29c7836ece0c', 'e0efe954-3fcc-4688-a78d-45640228df47', '2025-11-27 08:22:40.750917+00', '2025-11-30 08:54:55.705815+00', NULL, 'aal1', NULL, '2025-11-30 08:54:55.705695', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '180.252.16.24', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('5b1a9eac-295f-4a66-b1fe-29c7836ece0c', '2025-11-27 08:22:40.819814+00', '2025-11-27 08:22:40.819814+00', 'password', '9adadd93-82f7-462f-a297-cff748828c70'),
	('970b1c74-b76b-4b7a-b89c-9e98e7dec11c', '2025-11-27 08:22:58.591082+00', '2025-11-27 08:22:58.591082+00', 'password', 'f3997734-9ecb-4db9-b738-63a1dd61b39e'),
	('6145fd18-5e7d-4c14-b794-531f5730004e', '2025-11-29 09:51:44.054546+00', '2025-11-29 09:51:44.054546+00', 'password', '348ae28b-26c0-4b80-b482-24167718bc14'),
	('2ef8d264-0472-4c26-83de-06f33c7c81b1', '2025-11-29 09:58:03.13987+00', '2025-11-29 09:58:03.13987+00', 'password', 'ce31e276-2f98-42bb-bcf2-c5d929711c6a'),
	('69aa7d0f-c8c2-4d11-ab4e-420e2bff68b6', '2025-11-30 08:20:48.556925+00', '2025-11-30 08:20:48.556925+00', 'password', '0206a890-1523-4f7b-a631-933073f0c260');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 383, '5xoovt7jml2c', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-28 06:49:14.201644+00', '2025-11-28 07:47:44.40977+00', 'pkfzty7vuvd6', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 384, 'lyjnn73a64ni', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-28 07:47:44.431719+00', '2025-11-28 08:46:14.440834+00', '5xoovt7jml2c', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 385, 'lf3foh45pw6v', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-28 08:46:14.449328+00', '2025-11-28 09:44:45.954126+00', 'lyjnn73a64ni', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 386, '2blffb2scmlt', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-28 09:44:45.970522+00', '2025-11-28 10:43:14.630622+00', 'lf3foh45pw6v', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 387, 'pgggyb6webxw', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-28 10:43:14.642948+00', '2025-11-28 11:41:44.801427+00', '2blffb2scmlt', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 388, 'pgh6oynlfsqo', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-28 11:41:44.820567+00', '2025-11-28 12:40:14.862513+00', 'pgggyb6webxw', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 389, 'd76b7smrqqpx', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-28 12:40:14.884552+00', '2025-11-29 00:04:16.90634+00', 'pgh6oynlfsqo', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 392, 'csalvydrwdfp', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 00:04:16.93594+00', '2025-11-29 01:02:17.774848+00', 'd76b7smrqqpx', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 380, 'foxsw6i23cij', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-27 08:22:58.589084+00', '2025-11-29 01:42:25.094922+00', NULL, '970b1c74-b76b-4b7a-b89c-9e98e7dec11c'),
	('00000000-0000-0000-0000-000000000000', 393, 'wwbpxuotm3bx', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 01:02:17.789664+00', '2025-11-29 02:00:23.558164+00', 'csalvydrwdfp', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 395, 'jhhdpykesjyw', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 02:00:23.577536+00', '2025-11-29 02:58:53.707154+00', 'wwbpxuotm3bx', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 396, 'hc2af3yfgtod', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 02:58:53.725139+00', '2025-11-29 03:57:23.82181+00', 'jhhdpykesjyw', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 397, 'het4jlpa5ytp', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 03:57:23.83425+00', '2025-11-29 04:55:53.929242+00', 'hc2af3yfgtod', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 398, '325zm3vsvwxb', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 04:55:53.939604+00', '2025-11-29 05:54:23.971229+00', 'het4jlpa5ytp', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 399, 'fqfjv6ckgjn3', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 05:54:23.986116+00', '2025-11-29 06:52:54.072772+00', '325zm3vsvwxb', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 400, '6vbzlqdhzby3', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 06:52:54.100178+00', '2025-11-29 07:51:25.400425+00', 'fqfjv6ckgjn3', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 401, 'v4f7nolks3lr', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 07:51:25.421855+00', '2025-11-29 08:49:54.20756+00', '6vbzlqdhzby3', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 402, '64tjkr7cysxw', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 08:49:54.224146+00', '2025-11-29 09:48:24.519392+00', 'v4f7nolks3lr', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 403, '5rdbrkmayzc4', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 09:48:24.535986+00', '2025-11-29 10:46:54.327049+00', '64tjkr7cysxw', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 407, '5k2emz4kutkc', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 10:46:54.347476+00', '2025-11-29 11:45:24.588294+00', '5rdbrkmayzc4', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 408, 'n4tbz5rhwiyo', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 11:45:24.60356+00', '2025-11-29 12:43:54.689205+00', '5k2emz4kutkc', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 409, 'cqv53m422t5z', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 12:43:54.706959+00', '2025-11-30 00:12:05.316287+00', 'n4tbz5rhwiyo', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 379, 'abhlrpgxfiiy', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-27 08:22:40.785554+00', '2025-11-27 09:20:59.242738+00', NULL, '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 410, 'jogrqshlagv2', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 00:12:05.344832+00', '2025-11-30 01:10:25.344065+00', 'cqv53m422t5z', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 381, 'yzcvzuj37vjh', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-27 09:20:59.265071+00', '2025-11-28 05:50:42.84529+00', 'abhlrpgxfiiy', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 411, 's2mnnwujieut', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 01:10:25.356117+00', '2025-11-30 02:08:25.308202+00', 'jogrqshlagv2', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 382, 'pkfzty7vuvd6', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-28 05:50:42.869066+00', '2025-11-28 06:49:14.188289+00', 'yzcvzuj37vjh', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 412, 'eurzelj3d7rn', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 02:08:25.323961+00', '2025-11-30 03:06:25.506947+00', 's2mnnwujieut', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 413, 'gmt4xonmqcrc', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 03:06:25.530809+00', '2025-11-30 04:04:25.796823+00', 'eurzelj3d7rn', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 414, 'dfde3ajvkkba', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 04:04:25.812946+00', '2025-11-30 05:02:25.710886+00', 'gmt4xonmqcrc', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 415, 'ipdnplu6osru', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 05:02:25.72486+00', '2025-11-30 06:00:25.836596+00', 'dfde3ajvkkba', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 416, 'jsthi7c2f72q', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 06:00:25.849675+00', '2025-11-30 06:58:26.051753+00', 'ipdnplu6osru', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 406, 'aevqsbjfkvrv', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 09:58:03.133119+00', '2025-11-30 07:36:10.880409+00', NULL, '2ef8d264-0472-4c26-83de-06f33c7c81b1'),
	('00000000-0000-0000-0000-000000000000', 418, 'iv3ao4cjq5sj', 'e0efe954-3fcc-4688-a78d-45640228df47', false, '2025-11-30 07:36:10.900702+00', '2025-11-30 07:36:10.900702+00', 'aevqsbjfkvrv', '2ef8d264-0472-4c26-83de-06f33c7c81b1'),
	('00000000-0000-0000-0000-000000000000', 417, 'sfdpwr5g45mp', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 06:58:26.077917+00', '2025-11-30 07:56:55.792778+00', 'jsthi7c2f72q', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 405, 'orcujstihyeo', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 09:51:44.034367+00', '2025-11-30 08:00:25.479706+00', NULL, '6145fd18-5e7d-4c14-b794-531f5730004e'),
	('00000000-0000-0000-0000-000000000000', 420, 'pvkgn2devi34', 'e0efe954-3fcc-4688-a78d-45640228df47', false, '2025-11-30 08:00:25.483385+00', '2025-11-30 08:00:25.483385+00', 'orcujstihyeo', '6145fd18-5e7d-4c14-b794-531f5730004e'),
	('00000000-0000-0000-0000-000000000000', 421, 'esdnvl3wzg2h', '2c093716-8e1e-4237-92a2-04cd5ef2658b', false, '2025-11-30 08:20:48.540481+00', '2025-11-30 08:20:48.540481+00', NULL, '69aa7d0f-c8c2-4d11-ab4e-420e2bff68b6'),
	('00000000-0000-0000-0000-000000000000', 394, 'aerpc2lcglpu', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-29 01:42:25.113338+00', '2025-11-30 08:38:40.385215+00', 'foxsw6i23cij', '970b1c74-b76b-4b7a-b89c-9e98e7dec11c'),
	('00000000-0000-0000-0000-000000000000', 422, 'p63bbg447p6p', 'e0efe954-3fcc-4688-a78d-45640228df47', false, '2025-11-30 08:38:40.400003+00', '2025-11-30 08:38:40.400003+00', 'aerpc2lcglpu', '970b1c74-b76b-4b7a-b89c-9e98e7dec11c'),
	('00000000-0000-0000-0000-000000000000', 419, '36bdtu662wlg', 'e0efe954-3fcc-4688-a78d-45640228df47', true, '2025-11-30 07:56:55.810191+00', '2025-11-30 08:54:55.671855+00', 'sfdpwr5g45mp', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c'),
	('00000000-0000-0000-0000-000000000000', 423, 'dpfvibjujmc4', 'e0efe954-3fcc-4688-a78d-45640228df47', false, '2025-11-30 08:54:55.690991+00', '2025-11-30 08:54:55.690991+00', '36bdtu662wlg', '5b1a9eac-295f-4a66-b1fe-29c7836ece0c');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."stores" ("id", "name", "address", "phone", "isActive", "created_at") VALUES
	('9b7e1c2a-1234-4bcd-8e9f-abcdef123456', 'Cabang Kota Banjar', 'Kota Banjar', NULL, true, '2025-11-20 13:57:55.646384+00');


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."audit_logs" ("id", "timestamp", "user", "action", "storeId") OVERRIDING SYSTEM VALUE VALUES
	(1, '2025-11-20 13:58:45.673+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(2, '2025-11-20 14:00:43.865367+00', 'YOPI', 'Update progress 545c02e8-2c7a-4ef3-a267-36cbe1b3df32', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(3, '2025-11-20 14:00:45.221505+00', 'YOPI', 'Update progress 545c02e8-2c7a-4ef3-a267-36cbe1b3df32', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(4, '2025-11-20 14:00:46.516717+00', 'YOPI', 'Update progress 545c02e8-2c7a-4ef3-a267-36cbe1b3df32', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(5, '2025-11-20 14:08:28.584+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(6, '2025-11-20 14:16:00.028+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(7, '2025-11-20 14:20:30.476+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(8, '2025-11-20 14:22:29.521+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(9, '2025-11-20 14:28:22.461+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(10, '2025-11-20 14:42:57.475+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(11, '2025-11-20 14:45:13.046+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(12, '2025-11-20 14:45:40.307+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(13, '2025-11-20 14:46:42.8+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(14, '2025-11-20 14:48:36.685+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(15, '2025-11-20 14:55:19.325+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(16, '2025-11-20 14:55:24.101+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(17, '2025-11-20 14:55:26.204+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(18, '2025-11-20 14:55:29.593+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(19, '2025-11-20 14:58:40.865+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(20, '2025-11-20 15:07:16.357+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(21, '2025-11-20 15:07:16.816+00', 'YOPI', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(22, '2025-11-20 15:07:22.973+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(23, '2025-11-20 15:10:15.984+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(24, '2025-11-20 15:10:38.376+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(25, '2025-11-20 15:10:54.702+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(26, '2025-11-20 15:13:39.551+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(27, '2025-11-20 15:14:19.109+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(28, '2025-11-20 15:14:43.023+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(29, '2025-11-20 15:14:56.911+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(30, '2025-11-20 15:16:12.276+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(31, '2025-11-20 15:20:43.526714+00', 'YOPI', 'Update progress 990b6251-2b6d-49bf-8260-9348f3306d8d', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(32, '2025-11-20 15:20:43.179+00', 'YOPI', 'Mengubah status transaksi 990b6251-2b6d-49bf-8260-9348f3306d8d menjadi "Siap Diambil" dari Dashboard.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(33, '2025-11-20 15:20:45.923002+00', 'YOPI', 'Update progress 71ff77e5-0709-49a0-bd98-782a82d34bba', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(34, '2025-11-20 15:20:45.53+00', 'YOPI', 'Mengubah status transaksi 71ff77e5-0709-49a0-bd98-782a82d34bba menjadi "Siap Diambil" dari Dashboard.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(35, '2025-11-20 15:22:45.861+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(36, '2025-11-20 15:23:00.302609+00', 'YOPI', 'Update progress 4dbc6240-3025-4bc2-b946-31f4c3efe5ac', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(37, '2025-11-20 15:23:05.429+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(38, '2025-11-20 15:25:58.431+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(39, '2025-11-20 15:26:14.394167+00', 'YOPI', 'Update progress c0d2daee-9e50-4a23-98cc-d29a6acf046f', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(40, '2025-11-20 15:26:20.23816+00', 'YOPI', 'Update progress c0d2daee-9e50-4a23-98cc-d29a6acf046f', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(41, '2025-11-20 15:26:22.482378+00', 'YOPI', 'Update progress c0d2daee-9e50-4a23-98cc-d29a6acf046f', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(42, '2025-11-20 15:26:48.913+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(43, '2025-11-20 15:26:57.522598+00', 'YOPI', 'Update progress 990b6251-2b6d-49bf-8260-9348f3306d8d', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(44, '2025-11-20 15:26:57.134+00', 'YOPI', 'Mengubah status transaksi 990b6251-2b6d-49bf-8260-9348f3306d8d menjadi "Selesai" dari Dashboard.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(45, '2025-11-20 15:26:58.602481+00', 'YOPI', 'Update progress 71ff77e5-0709-49a0-bd98-782a82d34bba', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(46, '2025-11-20 15:26:58.251+00', 'YOPI', 'Mengubah status transaksi 71ff77e5-0709-49a0-bd98-782a82d34bba menjadi "Selesai" dari Dashboard.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(47, '2025-11-20 15:37:32.807+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(48, '2025-11-20 15:37:46.323+00', 'YOPI', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(49, '2025-11-20 15:37:51.456+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(50, '2025-11-20 15:41:36.038+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(51, '2025-11-20 15:45:40.2+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(52, '2025-11-20 15:52:09.746+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(53, '2025-11-20 15:52:15.07+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(54, '2025-11-20 15:52:23.811+00', 'emaklaundry', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(55, '2025-11-20 15:52:33.192+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(56, '2025-11-20 15:52:40.562+00', 'emaklaundry', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(57, '2025-11-20 15:52:44.178+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(58, '2025-11-20 15:54:05.656+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(59, '2025-11-20 15:54:22.227+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(60, '2025-11-20 15:56:56.405+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(61, '2025-11-20 15:56:57.132+00', 'YOPI', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(62, '2025-11-20 15:57:23.155+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(63, '2025-11-20 15:57:53.84+00', 'ani', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(64, '2025-11-20 15:58:17.832524+00', 'ani', 'Update progress f1e823db-a837-4ba1-8183-c9d8c8ebe693', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(65, '2025-11-20 15:58:17.447+00', 'ani', 'Menerima pembayaran untuk transaksi f1e823db-a837-4ba1-8183-c9d8c8ebe693. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(66, '2025-11-20 15:58:39.346731+00', 'ani', 'Update progress f1e823db-a837-4ba1-8183-c9d8c8ebe693', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(67, '2025-11-20 15:58:41.287432+00', 'ani', 'Update progress f1e823db-a837-4ba1-8183-c9d8c8ebe693', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(68, '2025-11-20 15:58:58.145244+00', 'ani', 'Update progress 80047e2e-ee83-41f6-865a-da5ee0c02a97', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(69, '2025-11-20 15:58:59.139701+00', 'ani', 'Update progress 80047e2e-ee83-41f6-865a-da5ee0c02a97', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(70, '2025-11-20 16:01:42.123+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(71, '2025-11-20 16:02:35.445+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(72, '2025-11-20 16:02:38.352+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(73, '2025-11-20 16:03:18.633433+00', 'YOPI', 'Update progress fcc1bdc3-5f21-4d27-a699-9e48833da9b5', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(74, '2025-11-20 16:04:18.389+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(75, '2025-11-20 16:04:30.826+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(76, '2025-11-21 07:25:08.771+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(77, '2025-11-21 07:25:24.114+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(78, '2025-11-21 07:25:37.967445+00', 'YOPI', 'Update progress 545c02e8-2c7a-4ef3-a267-36cbe1b3df32', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(80, '2025-11-21 07:25:40.510988+00', 'YOPI', 'Update progress 545c02e8-2c7a-4ef3-a267-36cbe1b3df32', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(79, '2025-11-21 07:25:36.764+00', 'YOPI', 'Menerima pembayaran untuk transaksi 545c02e8-2c7a-4ef3-a267-36cbe1b3df32 dari Dashboard. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(81, '2025-11-21 07:25:39.268+00', 'YOPI', 'Mengubah status transaksi 545c02e8-2c7a-4ef3-a267-36cbe1b3df32 menjadi "Selesai" dari Dashboard.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(82, '2025-11-21 10:15:47.472+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(83, '2025-11-21 10:17:34.651+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Naomi.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(84, '2025-11-21 10:18:31.554+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(85, '2025-11-21 11:40:21.74+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Pa Erwan.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(86, '2025-11-21 12:29:12.849+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Kaira.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(87, '2025-11-21 12:32:21.989+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(88, '2025-11-22 00:10:37.821+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(89, '2025-11-22 00:34:10.475+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Ibu Iti vIv A.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(90, '2025-11-22 01:34:58.136378+00', 'YOPI', 'Update progress fcc1bdc3-5f21-4d27-a699-9e48833da9b5', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(91, '2025-11-22 01:34:58.51+00', 'YOPI', 'Menerima pembayaran untuk transaksi fcc1bdc3-5f21-4d27-a699-9e48833da9b5. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(92, '2025-11-22 01:35:11.02578+00', 'YOPI', 'Update progress fcc1bdc3-5f21-4d27-a699-9e48833da9b5', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(93, '2025-11-22 01:35:11.139+00', 'YOPI', 'Mengubah status transaksi fcc1bdc3-5f21-4d27-a699-9e48833da9b5 menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(94, '2025-11-22 01:44:01.94+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Bu Evi         .', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(95, '2025-11-22 01:47:50.713+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Jaya      .', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(96, '2025-11-22 01:59:45.666+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Rais.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(97, '2025-11-22 02:09:53.572+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Rozy.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(98, '2025-11-22 02:58:48.069+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan septian.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(99, '2025-11-22 05:47:32.931+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan A Ade Cikadu.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(100, '2025-11-22 15:34:44.116+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(101, '2025-11-23 00:34:04.921+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(102, '2025-11-23 00:35:08.655+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Ibu Iti vIv A.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(103, '2025-11-23 01:09:00.727+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Bu Fitri.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(104, '2025-11-23 04:24:21.894+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Pa Ivan.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(105, '2025-11-23 09:21:08.853+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(106, '2025-11-23 09:22:11.513+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Pa Isman.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(107, '2025-11-23 11:16:35.027+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(108, '2025-11-23 11:59:32.245201+00', 'YOPI', 'Update progress 099f3731-6e9c-4ec5-9553-36a9b99e3a69', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(109, '2025-11-23 11:59:31.681+00', 'YOPI', 'Menerima pembayaran untuk transaksi 099f3731-6e9c-4ec5-9553-36a9b99e3a69. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(110, '2025-11-23 11:59:54.992807+00', 'YOPI', 'Update progress 8419b804-968b-440c-b401-9cdeecf40987', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(111, '2025-11-23 11:59:54.685+00', 'YOPI', 'Menerima pembayaran untuk transaksi 8419b804-968b-440c-b401-9cdeecf40987. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(112, '2025-11-23 12:00:17.063393+00', 'YOPI', 'Update progress 72aea24b-37cc-4b16-a513-5e4f69431faf', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(113, '2025-11-23 12:00:16.606+00', 'YOPI', 'Menerima pembayaran untuk transaksi 72aea24b-37cc-4b16-a513-5e4f69431faf dari Dashboard. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(114, '2025-11-23 12:00:35.593818+00', 'YOPI', 'Update progress d2abcff0-4f54-44e5-8b85-a278b8e446ad', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(115, '2025-11-23 12:00:34.8+00', 'YOPI', 'Menerima pembayaran untuk transaksi d2abcff0-4f54-44e5-8b85-a278b8e446ad dari Dashboard. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(116, '2025-11-23 12:00:50.63316+00', 'YOPI', 'Update progress 72aea24b-37cc-4b16-a513-5e4f69431faf', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(117, '2025-11-23 12:00:49.834+00', 'YOPI', 'Mengubah status transaksi 72aea24b-37cc-4b16-a513-5e4f69431faf menjadi "Siap Diambil" dari Dashboard.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(118, '2025-11-23 12:00:59.296235+00', 'YOPI', 'Update progress 72aea24b-37cc-4b16-a513-5e4f69431faf', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(119, '2025-11-23 12:00:58.784+00', 'YOPI', 'Mengubah status transaksi 72aea24b-37cc-4b16-a513-5e4f69431faf menjadi "Selesai" dari Dashboard.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(120, '2025-11-23 12:01:15.268217+00', 'YOPI', 'Update progress 099f3731-6e9c-4ec5-9553-36a9b99e3a69', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(121, '2025-11-23 12:01:14.539+00', 'YOPI', 'Mengubah status transaksi 099f3731-6e9c-4ec5-9553-36a9b99e3a69 menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(122, '2025-11-23 12:01:22.677303+00', 'YOPI', 'Update progress 8419b804-968b-440c-b401-9cdeecf40987', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(123, '2025-11-23 12:01:21.955+00', 'YOPI', 'Mengubah status transaksi 8419b804-968b-440c-b401-9cdeecf40987 menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(124, '2025-11-23 12:24:05.631356+00', 'YOPI', 'Update progress fcc1bdc3-5f21-4d27-a699-9e48833da9b5', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(125, '2025-11-23 12:24:05.114+00', 'YOPI', 'Menerima pembayaran untuk transaksi fcc1bdc3-5f21-4d27-a699-9e48833da9b5. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(126, '2025-11-24 11:54:35.278+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(127, '2025-11-24 11:55:22.506+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(128, '2025-11-24 12:04:39.291+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Batalion.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(129, '2025-11-24 12:05:36.38+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(130, '2025-11-24 12:07:34.461+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Andry Langky.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(131, '2025-11-24 12:08:41.159762+00', 'YOPI', 'Update progress c5895514-4a99-4418-a523-754039839b54', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(132, '2025-11-24 12:08:43.173+00', 'YOPI', 'Menerima pembayaran untuk transaksi c5895514-4a99-4418-a523-754039839b54. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(133, '2025-11-24 12:08:47.741545+00', 'YOPI', 'Update progress c5895514-4a99-4418-a523-754039839b54', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(134, '2025-11-24 12:08:52.389+00', 'YOPI', 'Mengubah status transaksi c5895514-4a99-4418-a523-754039839b54 menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(135, '2025-11-24 12:09:20.729981+00', 'YOPI', 'Update progress 205049e5-453e-4437-a07a-f1ee15f7e810', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(136, '2025-11-24 12:09:29.328+00', 'YOPI', 'Menerima pembayaran untuk transaksi 205049e5-453e-4437-a07a-f1ee15f7e810. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(137, '2025-11-24 12:09:33.561607+00', 'YOPI', 'Update progress 205049e5-453e-4437-a07a-f1ee15f7e810', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(138, '2025-11-24 12:09:38.437+00', 'YOPI', 'Mengubah status transaksi 205049e5-453e-4437-a07a-f1ee15f7e810 menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(139, '2025-11-24 12:09:47.805255+00', 'YOPI', 'Update progress d2abcff0-4f54-44e5-8b85-a278b8e446ad', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(140, '2025-11-24 12:09:50.822331+00', 'YOPI', 'Update progress d2abcff0-4f54-44e5-8b85-a278b8e446ad', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(141, '2025-11-24 12:09:50.861+00', 'YOPI', 'Mengubah status transaksi d2abcff0-4f54-44e5-8b85-a278b8e446ad menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(142, '2025-11-24 12:09:50.969+00', 'YOPI', 'Mengubah status transaksi d2abcff0-4f54-44e5-8b85-a278b8e446ad menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(143, '2025-11-24 12:10:04.855967+00', 'YOPI', 'Update progress 0e7f1754-d385-47e3-8b80-50acb768b5b1', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(144, '2025-11-24 12:10:13.356+00', 'YOPI', 'Menerima pembayaran untuk transaksi 0e7f1754-d385-47e3-8b80-50acb768b5b1. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(145, '2025-11-24 12:15:57.989245+00', 'YOPI', 'Update progress 814617ea-a263-4aef-8427-0530e1101684', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(146, '2025-11-24 12:15:57.87+00', 'YOPI', 'Mengubah status transaksi 814617ea-a263-4aef-8427-0530e1101684 menjadi "Siap Diambil".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(147, '2025-11-24 12:16:05.422125+00', 'YOPI', 'Update progress 0e7f1754-d385-47e3-8b80-50acb768b5b1', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(148, '2025-11-24 12:16:05.891+00', 'YOPI', 'Mengubah status transaksi 0e7f1754-d385-47e3-8b80-50acb768b5b1 menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(149, '2025-11-24 12:16:40.892128+00', 'YOPI', 'Update progress 814617ea-a263-4aef-8427-0530e1101684', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(150, '2025-11-24 12:16:40.686+00', 'YOPI', 'Menerima pembayaran untuk transaksi 814617ea-a263-4aef-8427-0530e1101684. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(151, '2025-11-24 12:16:43.817478+00', 'YOPI', 'Update progress 814617ea-a263-4aef-8427-0530e1101684', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(152, '2025-11-24 12:16:43.603+00', 'YOPI', 'Mengubah status transaksi 814617ea-a263-4aef-8427-0530e1101684 menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(153, '2025-11-24 12:36:34.714+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Teh Rani.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(154, '2025-11-25 06:06:11.625+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(155, '2025-11-25 06:06:15.352+00', 'YOPI', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(156, '2025-11-25 06:06:29.608+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(157, '2025-11-25 06:06:31.671+00', 'ani', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(159, '2025-11-25 06:06:47.423+00', 'didi', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(160, '2025-11-25 06:06:54.302+00', 'didi', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(163, '2025-11-25 06:07:27.997+00', 'lilis', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(164, '2025-11-25 06:16:33.258+00', 'lilis', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(165, '2025-11-25 11:06:18.979+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(166, '2025-11-25 11:07:08.443+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Jaya      .', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(167, '2025-11-25 11:08:23.518+00', 'lilis', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(168, '2025-11-25 11:08:27.007+00', 'lilis', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(169, '2025-11-25 11:08:32.951+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(170, '2025-11-25 11:13:26.942+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(171, '2025-11-25 11:34:21.447+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(172, '2025-11-25 11:35:21.542+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(173, '2025-11-25 11:37:00.159+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Teh lia jiemas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(174, '2025-11-25 11:38:12.457+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(175, '2025-11-25 11:39:47.29+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Jaya      .', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(176, '2025-11-25 11:40:08.907+00', 'YOPI', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(177, '2025-11-25 11:40:46.233+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(178, '2025-11-25 11:41:37.589+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(179, '2025-11-25 11:43:05.224+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Teh Isna.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(180, '2025-11-25 11:48:09.938+00', 'emaklaundry', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(181, '2025-11-25 11:48:16.936+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(182, '2025-11-25 11:59:33.937784+00', 'YOPI', 'Update progress 077aa911-e3c8-4b03-9451-d8f6ae43a785', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(183, '2025-11-25 11:59:35.225+00', 'YOPI', 'Menerima pembayaran untuk transaksi 077aa911-e3c8-4b03-9451-d8f6ae43a785. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(184, '2025-11-25 11:59:40.39631+00', 'YOPI', 'Update progress 077aa911-e3c8-4b03-9451-d8f6ae43a785', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(185, '2025-11-25 11:59:40.308+00', 'YOPI', 'Mengubah status transaksi 077aa911-e3c8-4b03-9451-d8f6ae43a785 menjadi "Selesai".', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(186, '2025-11-25 13:10:27.999+00', 'YOPI', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(187, '2025-11-25 18:05:19.849+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(188, '2025-11-26 02:00:45.189+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(189, '2025-11-26 04:42:37.19+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(190, '2025-11-26 04:46:56.355+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Surya Plastik.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(191, '2025-11-26 04:48:40.404+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(192, '2025-11-26 06:53:35.784+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(193, '2025-11-26 11:17:24.381+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(194, '2025-11-26 11:25:57.872+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(195, '2025-11-27 03:37:58.328+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(196, '2025-11-27 03:41:22.337+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(197, '2025-11-27 03:43:51.015+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan rian.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(198, '2025-11-27 03:47:22.975+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan P Griya Az Zahra.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(199, '2025-11-27 03:50:04.153+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Perum Az zahra.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(200, '2025-11-27 03:53:21.980375+00', 'YOPI', 'Update progress 7fe09749-1ce4-4051-8bdb-af3b7cee3281', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(201, '2025-11-27 03:53:22.497+00', 'YOPI', 'Menerima pembayaran untuk transaksi 7fe09749-1ce4-4051-8bdb-af3b7cee3281 dari Dashboard. Status bayar: Lunas.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(202, '2025-11-27 08:18:05.175+00', 'YOPI', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(203, '2025-11-27 08:22:41.417+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(204, '2025-11-27 08:22:56.485+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(205, '2025-11-28 05:50:42.533+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(206, '2025-11-28 12:47:08.269+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(207, '2025-11-28 12:49:18.701+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(208, '2025-11-28 12:50:52.514+00', 'emaklaundry', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(209, '2025-11-28 13:01:49.217+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(210, '2025-11-29 00:04:17.808+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(211, '2025-11-29 00:06:55.093+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Bu Deti.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(212, '2025-11-29 00:37:18.921+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Bu Deti.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(213, '2025-11-29 01:02:24.677+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Pa Ahmad Gozali.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(214, '2025-11-29 01:05:24.427+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Pa Ahmad Gozali.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(215, '2025-11-29 01:10:20.635+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(216, '2025-11-29 01:10:35.287+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(217, '2025-11-29 01:11:06.605+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(218, '2025-11-29 01:11:17.451+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(219, '2025-11-29 01:11:34.102+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(220, '2025-11-29 01:15:53.764+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Tengku Abbad.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(221, '2025-11-29 01:31:22.943+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(222, '2025-11-29 01:40:53.728+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan P Griya Az Zahra.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(223, '2025-11-29 01:42:24.52+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(224, '2025-11-29 01:44:27.88+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan P Griya Az Zahra.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(225, '2025-11-29 05:15:58.103+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan A Ade Cikadu.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(226, '2025-11-29 09:50:34.465+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(227, '2025-11-29 09:51:38.549+00', 'emaklaundry', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(228, '2025-11-29 09:51:39.482+00', 'emaklaundry', 'Melakukan logout.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(229, '2025-11-29 09:51:47.937+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(230, '2025-11-29 09:51:57.925+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(231, '2025-11-29 09:55:43.753+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(232, '2025-11-29 09:58:06.208+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(233, '2025-11-30 00:12:07.297+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(234, '2025-11-30 00:13:16.108+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan anop.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(235, '2025-11-30 02:04:08.221+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Hopipah.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(236, '2025-11-30 07:36:15.752+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(237, '2025-11-30 07:54:56.562+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(238, '2025-11-30 08:00:29.971+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(239, '2025-11-30 08:00:34.052+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(240, '2025-11-30 08:01:49.941+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(241, '2025-11-30 08:11:16.801+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(242, '2025-11-30 08:17:01.218+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(243, '2025-11-30 08:19:05.88+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(244, '2025-11-30 08:20:35.567+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(245, '2025-11-30 08:20:53.099+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(246, '2025-11-30 08:25:19.272+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(247, '2025-11-30 08:25:39.528+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(248, '2025-11-30 08:27:44.796+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(249, '2025-11-30 08:28:33.899+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(250, '2025-11-30 08:28:45.826+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(251, '2025-11-30 08:28:55.369+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(252, '2025-11-30 08:28:59.579+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(253, '2025-11-30 08:29:01.251+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(254, '2025-11-30 08:29:18.727+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(255, '2025-11-30 08:30:29.432+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(256, '2025-11-30 08:31:06.983+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(257, '2025-11-30 08:34:24.568+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(258, '2025-11-30 08:38:39.028+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(259, '2025-11-30 08:40:10.784+00', 'YOPI', 'Membuat transaksi baru untuk pelanggan Cindi panatasan.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(260, '2025-11-30 08:43:29.192+00', 'YOPI', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(261, '2025-11-30 08:56:27.355+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(262, '2025-11-30 08:56:41.763+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(263, '2025-11-30 08:57:40.174+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(264, '2025-11-30 08:57:46.578+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(265, '2025-11-30 08:58:24.957+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(266, '2025-11-30 08:58:34.584+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(267, '2025-11-30 08:59:07.529+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(268, '2025-11-30 08:59:40.619+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(269, '2025-11-30 08:59:45.938+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(270, '2025-11-30 08:59:55.957+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(271, '2025-11-30 09:00:31.689+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(272, '2025-11-30 09:01:40.503+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(273, '2025-11-30 09:01:53.983+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(274, '2025-11-30 09:02:08.686+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(275, '2025-11-30 09:02:32.66+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(276, '2025-11-30 09:02:46.802+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	(277, '2025-11-30 09:03:05.348+00', 'ani', 'Melakukan login.', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customers" ("id", "name", "phone", "address", "notes", "defaultDiscount", "createdAt", "storeId") VALUES
	('400d33a3-b300-44ea-914a-2cf7b69a8122', 'anop', '085175306797', 'Banjar', '', 0, '2025-11-20 13:58:31.946+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('5c269273-6a59-43e8-b01b-1525b23d44e9', 'Naomi', '081212195120', 'Balokang', '', 0, '2025-11-21 10:16:40.062+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('f765d0e1-b4cc-47c5-98f7-eee5d252eb26', 'Pa Erwan', '081322140004', '', '', 0, '2025-11-21 11:39:46.969+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('9b5dbab9-70df-4801-b7f1-67a4c0785e9b', 'Kaira', '081213822203', '', '', 0, '2025-11-21 12:28:35.731+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('903e6666-8720-49b4-b9f2-e76ab15b6c68', 'Ibu Iti vIv A', '', '', '', 0, '2025-11-22 00:32:17.501+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('9e0256d6-9b7c-4749-bc35-5352dd8a01dc', 'Bu Evi         ', '', '', '', 0, '2025-11-22 01:41:45.146+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('ded003dd-6c52-435b-bbaf-06abaf562e8f', 'Jaya      ', '', '', '', 0, '2025-11-22 01:46:57.624+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('12253d22-758d-41d9-b5b2-650d5ec3f417', 'Rais', '', '', '', 0, '2025-11-22 01:58:51.037+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('cd544fab-d14f-4665-8df0-ff6ffe347bf1', 'Rozy', '', '', '', 0, '2025-11-22 02:09:05.555+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('029d079d-17f0-45c6-80c2-624ad5ba829c', 'P Griya Az Zahra', '', '', '', 0, '2025-11-22 02:34:41.784+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('47282850-2a21-4597-ae7d-28b2b431666d', 'septian', '', '', '', 0, '2025-11-22 02:57:16.41+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('1c70311e-8727-4b0e-8660-56464c7244b7', 'A Ade Cikadu', '', '', '', 0, '2025-11-22 05:45:34.647+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('2a643039-eb7b-429a-a10a-f3a2c93f82bb', 'Bu Fitri', '', '', '', 0, '2025-11-23 01:08:15.898+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('4ba0ff6d-dbfa-4d20-a1e6-2c5132b4199a', 'Pa Ivan', '', '', '', 0, '2025-11-23 04:23:24.256+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('415b3c8f-6942-44d2-a13e-544a97f5af75', 'Pa Isman', '0882002044730', '', '', 0, '2025-11-23 09:21:40.34+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('5f30222a-1d5b-41f3-aa13-df2a74ca819e', 'Batalion', '082218165154', '', '', 0, '2025-11-24 11:56:39.938+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('adc06142-5890-4ea7-8eed-ef7262c5f517', 'Batalion', '082218165154', '', '', 0, '2025-11-24 11:56:39.938+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('8c8c6470-1ee2-4d15-95a3-0a241ab204a6', 'Batalion', '082218165154', '', '', 0, '2025-11-24 11:56:39.938+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('ad3b7763-176c-49e1-abfb-0b86a46a689a', 'Batalion', '082218165154', '', '', 0, '2025-11-24 11:56:39.938+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('8cdcedea-d403-4067-96ca-f3673142e78a', 'Batalion', '082218165154', '', '', 0, '2025-11-24 11:56:39.938+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('ce2df395-9256-4c55-8580-95f716b78dd6', 'Batalion', '082218165154', '', '', 0, '2025-11-24 11:56:39.938+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('5d708a98-8369-4064-8b39-9ec24ea1031e', 'Andry Langky', '0895344830377', '', '', 0, '2025-11-24 12:07:03.285+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('218461d0-3860-4c18-8d9b-2ca6593d23cf', 'Teh Rani', '081222818885', '', '', 0, '2025-11-24 12:36:05.002+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('8f9eb6a8-4a69-4dca-b59d-03ba319c25a9', 'Teh lia jiemas', '081324260609', '', '', 0, '2025-11-25 11:36:38.175+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('9b97b8ae-55df-44f8-bdd6-d4b5b461e8fd', 'Teh Isna', '082262218994', '', '', 0, '2025-11-25 11:42:40.259+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('5c4f014b-88ca-4a05-99d5-93d7b1eb8cf9', 'Surya Plastik', '082119251270', '', '', 0, '2025-11-26 04:46:10.399+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('c6cbf27b-f50f-4c0f-b4ec-e9fe83185f7d', 'Surya Plastik', '082119251270', '', '', 0, '2025-11-26 04:46:10.399+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('4fc31f0c-7db7-4829-bbe1-897a3d5213e8', 'rian', '081213537715', 'purawaharja', '', 0, '2025-11-27 03:42:52.664+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('3a5533d5-c094-4ba7-bc48-cefbf1ac938f', 'Perum Az zahra', '082129955715', 'Randegan', '', 0, '2025-11-27 03:49:14.029+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('03ac3b42-eec3-4d14-a1c8-03f4f1fe1b0f', 'Bu Deti', '', '', '', 0, '2025-11-29 00:04:54.188+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('8e48870f-570c-4a08-bec1-6681b5e1a31f', 'Pa Ahmad Gozali', '085320174747', 'Banjar', '', 0, '2025-11-29 01:01:44.959+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('498154aa-9596-4a1a-ac85-cc77acfc07a9', 'Tengku Abbad', '083153551824', 'Koat Wardi No 01', '', 0, '2025-11-29 01:14:29.207+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('23f02f1a-910c-4078-8c8f-21cc5a1c94ab', 'Hopipah', '', '', '', 0, '2025-11-30 02:03:26.687+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('3d1b3aec-efdd-4c99-9d44-7d84cc0b807c', 'Cindi panatasan', '082218977711', '', '', 0, '2025-11-30 08:39:24.423+00', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "name", "role", "store_id", "created_at", "isActive", "canGiveDiscount") VALUES
	('11c86333-295c-4bd9-9302-a69fda4811c0', 'Super Admin', 'Super Admin', NULL, '2025-11-20 13:57:55.646384+00', true, false),
	('0bbe08f0-2cbc-40d9-b2ec-5a2d3ba99c0e', 'emaklaundry', 'Admin', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '2025-11-20 13:57:55.646384+00', true, false),
	('e0efe954-3fcc-4688-a78d-45640228df47', 'YOPI', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '2025-11-20 13:57:55.646384+00', true, false),
	('2c093716-8e1e-4237-92a2-04cd5ef2658b', 'ani', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '2025-11-20 13:57:55.646384+00', true, false),
	('8cbdd6f3-ee72-4500-b2c8-b6401ed6c053', 'didi', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '2025-11-20 13:57:55.646384+00', true, false),
	('7b13d493-23ea-49a0-99cf-133ed7ecf05e', 'lilis', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '2025-11-20 13:57:55.646384+00', true, false);


--
-- Data for Name: scheduled_maintenances; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."services" ("id", "name", "category", "price", "unit", "durationDays", "storeId") VALUES
	('d6b33500-65d2-44f4-8af4-fe60c28d119c', 'Campuran', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('72326b81-a356-41ea-927c-eb912bcc0c56', 'Cuci dan lipat (min. 3 kg) - 1 hari', 'Kiloan', 8000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('2c5f7dd6-91da-48e0-bd12-66321aca68e4', 'Cuci dan lipat (min. 3 kg) - 2 hari', 'Kiloan', 6000, 'kg', 2, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('fda8705e-dbdc-4643-b464-50f644dc23e7', 'Cuci dan liprika (min. 3 kg) - 3 hari', 'Kiloan', 5000, 'kg', 3, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('1f67bb11-fe08-4733-890d-e85489ecc125', 'Cuci dan setrika (min. 2 kg) - 2 hari', 'Kiloan', 13000, 'kg', 2, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('99737bae-acfa-4528-bca6-3ec6c09e2877', 'Cuci dan setrika (min. 2 kg) - 3 hari', 'Kiloan', 7500, 'kg', 3, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('11210778-1193-4b14-9c9c-e63e46f99539', 'Cuci dan setrika (min. 2 kg) - 6 jam (ekspres)', 'Kiloan', 20000, 'kg', 0, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('e56a7a83-58e5-4b9d-be68-5bc43096a000', 'Cuci ekspres - 3 jam', 'Kiloan', 25000, 'kg', 0, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('762569de-0dfc-4053-b570-683a4c7bb317', 'Cuci lipat mitra laundry', 'Kiloan', 4000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('e4cc32c3-685d-4bc8-b53a-3ad953d3198b', 'Cuci dan setrika (min. 2 kg) - 1 hari', 'Kiloan', 15000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('9229c0f5-95dd-4402-bbea-690bbb397ef8', 'Fitrase', 'Kiloan', 15000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('351bfaaa-81ab-458f-af66-1c5abf91a938', 'Gorden', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('e101370c-11dd-41ac-aea2-6385d22d7f12', 'Karpet cendol', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('4b464ccd-e0f8-4a05-a9fe-08c04fc46bed', 'Karpet permadani', 'Kiloan', 15000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('22b555cc-10a1-497d-9ad5-abadd318d415', 'Karpet tipis', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('fb6db74e-e970-4c84-8292-b69891bce9ee', 'Kasur busa/lantai', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('44512378-0f8c-4621-9767-abd356f0ac89', 'Kasur Palembang', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('d0715328-ec10-448d-bcb5-57a52be1a69a', 'Lain-lain', 'Kiloan', 8000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('05205897-42e1-42ad-ad28-dd7fb80c0d4e', 'Mitra cuci komplit', 'Kiloan', 5500, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('55ee0bb8-3e26-4385-b626-46fe8d3d9f50', 'Mitra setrika', 'Kiloan', 3000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('bd67aca1-d90c-4a08-a47d-3de607ee4112', 'Setrika saja (min. 3 kg)', 'Kiloan', 5000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('642223e6-013a-4df0-b48f-9f6813df1e4b', 'Sprei (kiloan)', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('c1d661f5-57e8-49d2-a28a-d2b31c46db0b', 'Surpet', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('0cf96575-4edb-4b81-98e3-d025b738f4cf', 'Tikar', 'Kiloan', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('d2d139f1-a66b-426e-8de2-4558f046e7ec', 'Karpet tebal (per m)', 'Karpet', 12000, 'm2', 2, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('a83c0f41-9b06-438a-bea8-1e9434894674', 'Karpet tipis / masjid (per m)', 'Karpet', 7000, 'm2', 2, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('3d550e6d-92f8-4a36-ba22-17777871235f', 'Bantal', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('eb2e9d81-fac0-468f-bd2f-90e1d3a0fb72', 'Bed cover', 'Satuan', 18000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('86497846-ff9f-4992-83bc-50ad7af48c7c', 'Bed cover jumbo/besar', 'Satuan', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('15b144ca-8933-405b-af78-d046aa288879', 'Bedcover', 'Satuan', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('aac23044-419e-4d02-9b87-259eb7d0a21b', 'Blus', 'Satuan', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('7b94bb2b-3c18-438d-b898-7a85229f19f2', 'Boneka/bantal bulu', 'Satuan', 12000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('f20220ee-fead-4243-a9a4-1681b2d8d9dc', 'Boneka besar', 'Satuan', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('dd399265-b9b1-4324-8821-f81d93f2971e', 'Boneka jumbo', 'Satuan', 30000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('6f0baaf0-146a-4235-b87b-bcb2063f0bf2', 'Boneka kecil', 'Satuan', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('aa8f96d1-3c94-4aca-93ec-17eb4f6d0cb2', 'Boneka sedang', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('7f0cb798-8ea3-4479-ba2c-53323ba65641', 'Celana panjang', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('7d38398b-ee81-4fd8-b357-169fd0f884b5', 'Celana pendek', 'Satuan', 7500, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('b6cbd8ac-5496-4f42-8bb0-0fecd43a5be5', 'Gamis panjang / dress', 'Satuan', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('5fab1da7-0887-4c7d-a691-ccabb583e57b', 'Guling', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('77818988-f786-49fc-87e2-46781be43ada', 'Guling kecil', 'Satuan', 6000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('be5f84b5-75b0-4e99-9e77-d7950a25b2fc', 'Jaket jeans', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('dfcfcdc9-c965-4a6b-8dc6-4125aa9b7312', 'Jaket kain', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('425bdb7e-ade6-41a9-aa01-cae9a3c4c28a', 'Jaket kulit', 'Satuan', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('eb4ecd8f-e177-468d-91c7-27015a65b7eb', 'Jas koas', 'Satuan', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('6731947a-fcf0-41f9-b06c-430fd679d1aa', 'Jas pendek', 'Satuan', 18000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('cacffe1b-19d2-409f-98ab-cf7dadfe0bcb', 'Kaus oblong', 'Satuan', 8000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('1bdf100c-6a49-44cb-8e09-0384b38c51b7', 'Kaus singlet', 'Satuan', 7500, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('588a1a3f-9198-4a5b-9c3d-6d246ff0e13f', 'Kemeja', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('01ab14af-4dad-4fb4-853e-197e816a262e', 'Keset', 'Satuan', 12000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('c0066a1e-45a4-49b8-a6d5-7661612cba3e', 'Keset besar', 'Satuan', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('a1b37ca3-fc18-44d7-9f4c-a18194e69312', 'Menghilangkan noda (tinta, darah, minyak)', 'Satuan', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('e694acce-bca3-4e7b-875a-853175e15c44', 'Mukena', 'Satuan', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('ff5f7561-9f1a-43f1-b2bc-5fac427a5580', 'Noda di baju', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('ab0245c1-0f80-4f95-ad4d-87c7600f6c3f', 'Rompi', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('c18da81a-90e1-46c1-a8c7-56b898388965', 'Sajadah tebal', 'Satuan', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('dbbce027-b15e-4b3c-b561-8340b891ca61', 'Selimut', 'Satuan', 17000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('c6b3edaf-3b2a-4e1c-98b1-9fdf68251059', 'Selimut jumbo', 'Satuan', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('b314eb8b-253a-429c-9c82-05cae1f740c6', 'Sepatu', 'Satuan', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('4ac181b1-8ee9-469b-a89e-66415b831fe3', 'Sepatu (cats)', 'Satuan', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('aa78594e-790e-4321-8966-3ef9ba00af19', 'Setelan jas lengan panjang', 'Satuan', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('f3416357-df02-41f6-a91c-06b3c7b640ae', 'Setelan jas lengan pendek', 'Satuan', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('be5b4f13-3113-487e-97e6-6cd942aac6e0', 'Sprei satuan', 'Satuan', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('483d2a97-c1bc-444b-954d-94eab8a68c23', 'Tas besar', 'Satuan', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('a22deb6b-c463-491e-8967-238403d7d859', 'Tas kecil', 'Satuan', 12000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'),
	('5c7109f0-4bfe-40ad-9825-408ab72368cd', 'Pakaian dalam', 'Satuan', 2500, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."settings" ("id", "receiptMessage", "taxRate", "discountRate") OVERRIDING SYSTEM VALUE VALUES
	(1, 'Terima kasih telah laundry di tempat kami!', 0, 0);


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."transactions" ("id", "invoice_code", "customerId", "items", "subtotal", "discount", "tax", "total", "paymentStatus", "orderStatus", "createdAt", "estimatedCompletionDate", "amountPaid", "change", "paymentMethod", "createdByUserId", "storeId", "notes", "idempotencyKey") VALUES
	('990b6251-2b6d-49bf-8260-9348f3306d8d', 'CAB-XDFFVJ', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 10000, "quantity": 1, "subtotal": 10000, "serviceId": "d6b33500-65d2-44f4-8af4-fe60c28d119c", "serviceName": "Campuran", "taggedItems": "vvvvvvvvvvvvvvvvvv"}, {"unit": "kg", "price": 8000, "quantity": 1, "subtotal": 8000, "serviceId": "72326b81-a356-41ea-927c-eb912bcc0c56", "serviceName": "Cuci dan lipat (min. 3 kg) - 1 hari", "taggedItems": "aaaaaaaaaaaaaaaaaaa"}]', 18000, 0, 0, 18000, 'Lunas', 'Selesai', '2025-11-20 14:28:21.572+00', '2025-11-21', 18000, 0, 'QRIS', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'db3381b1-3e4f-45da-b3e5-ea876e83752c'),
	('71ff77e5-0709-49a0-bd98-782a82d34bba', 'CAB-DMMDNE', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 15000, "quantity": 1, "subtotal": 15000, "serviceId": "e4cc32c3-685d-4bc8-b53a-3ad953d3198b", "serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari"}]', 15000, 0, 0, 15000, 'Lunas', 'Selesai', '2025-11-20 14:45:39.823+00', '2025-11-21', 15000, 85000, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'e7372deb-dedd-4f4e-afe6-47418afc2a79'),
	('4dbc6240-3025-4bc2-b946-31f4c3efe5ac', 'CAB-QDT52V', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 15000, "quantity": 1, "subtotal": 15000, "serviceId": "e4cc32c3-685d-4bc8-b53a-3ad953d3198b", "serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari"}]', 15000, 0, 0, 15000, 'Lunas', 'Selesai', '2025-11-20 15:22:45.481+00', '2025-11-21', 15000, 0, 'Transfer Bank', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '8375509b-a534-493c-a727-b01ef3d73562'),
	('32d81672-688d-4d2d-b8eb-8155b0f7ec84', 'CAB-MJXKJA', '4ba0ff6d-dbfa-4d20-a1e6-2c5132b4199a', '[{"unit": "kg", "price": 5000, "quantity": 4.7, "subtotal": 23500, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 23500, 0, 0, 23500, 'Belum Lunas', 'Diproses', '2025-11-23 04:24:21.127+00', '2025-11-24', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'bb4c09c1-6648-4a90-ab75-7363e3a8670e'),
	('7d8a2b76-f597-4ca3-ad00-ba8a1ce55182', 'CAB-47YDNS', '415b3c8f-6942-44d2-a13e-544a97f5af75', '[{"unit": "kg", "price": 7500, "quantity": 4.34, "subtotal": 32550, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 32550, 0, 0, 32550, 'Belum Lunas', 'Diproses', '2025-11-23 09:22:10.686+00', '2025-11-26', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'aeb8e051-0eb4-404a-8293-b87e7169837d'),
	('545c02e8-2c7a-4ef3-a267-36cbe1b3df32', 'CAB-UEUHKK', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 10000, "quantity": 1, "subtotal": 10000, "serviceId": "d6b33500-65d2-44f4-8af4-fe60c28d119c", "serviceName": "Campuran"}]', 10000, 0, 0, 10000, 'Lunas', 'Selesai', '2025-11-20 13:58:45.243+00', '2025-11-21', 10000, 40000, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', NULL),
	('8419b804-968b-440c-b401-9cdeecf40987', 'CAB-MPF79U', '903e6666-8720-49b4-b9f2-e76ab15b6c68', '[{"unit": "kg", "price": 15000, "quantity": 3.14, "subtotal": 47100, "serviceId": "e4cc32c3-685d-4bc8-b53a-3ad953d3198b", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari"}]', 47100, 0, 0, 47100, 'Lunas', 'Selesai', '2025-11-23 00:35:04.584+00', '2025-11-24', 47100, 0, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '015b0048-ff8e-4e55-b87d-8c320993603b'),
	('205049e5-453e-4437-a07a-f1ee15f7e810', 'CAB-EET67T', '5c269273-6a59-43e8-b01b-1525b23d44e9', '[{"unit": "kg", "price": 13000, "quantity": 6.1, "subtotal": 79300, "serviceId": "1f67bb11-fe08-4733-890d-e85489ecc125", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 2 hari"}]', 79300, 0, 0, 79300, 'Lunas', 'Selesai', '2025-11-21 10:17:34.002+00', '2025-11-23', 79300, 0, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'c66d6b09-4d0a-4f74-acfb-c886f377e0b6'),
	('2c575df3-6758-4a50-bd36-33607f9bc9a2', 'CAB-3SHWT4', 'ded003dd-6c52-435b-bbaf-06abaf562e8f', '[{"unit": "kg", "price": 7500, "quantity": 3.48, "subtotal": 26100, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 26100, 0, 0, 26100, 'Belum Lunas', 'Diproses', '2025-11-25 11:07:07.5+00', '2025-11-28', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '53087fd1-63f5-4d75-902a-839739fd748c'),
	('b44fc3ec-6f4f-4f49-901d-25caba812435', 'CAB-45PV8Q', '8f9eb6a8-4a69-4dca-b59d-03ba319c25a9', '[{"unit": "kg", "price": 5000, "quantity": 5.87, "subtotal": 29350, "serviceId": "fda8705e-dbdc-4643-b464-50f644dc23e7", "itemDetails": [], "serviceName": "Cuci dan liprika (min. 3 kg) - 3 hari"}]', 29350, 0, 0, 29350, 'Belum Lunas', 'Diproses', '2025-11-25 11:36:59.582+00', '2025-11-28', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'afb0839e-0bf0-4dea-be58-9afc3bb2a6c2'),
	('fcc1bdc3-5f21-4d27-a699-9e48833da9b5', 'CAB-6G8V45', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 10000, "quantity": 1, "subtotal": 10000, "serviceId": "d6b33500-65d2-44f4-8af4-fe60c28d119c", "serviceName": "Campuran"}, {"unit": "kg", "price": 6000, "quantity": 1, "subtotal": 6000, "serviceId": "2c5f7dd6-91da-48e0-bd12-66321aca68e4", "serviceName": "Cuci dan lipat (min. 3 kg) - 2 hari"}]', 16000, 0, 0, 16000, 'Lunas', 'Selesai', '2025-11-20 14:46:42.34+00', '2025-11-22', 16000, 0, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '6e6cc9c8-4fbb-4b1b-ae05-5e7239b84b03'),
	('72aea24b-37cc-4b16-a513-5e4f69431faf', 'CAB-XGUW7J', '029d079d-17f0-45c6-80c2-624ad5ba829c', '[{"unit": "kg", "price": 5000, "quantity": 15.44, "subtotal": 77200, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 77200, 0, 0, 77200, 'Lunas', 'Selesai', '2025-11-22 02:40:17.272+00', '2025-11-23', 77200, 0, 'Transfer Bank', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '2792112e-5c9d-4943-89ba-b8e6ee0c8938'),
	('099f3731-6e9c-4ec5-9553-36a9b99e3a69', 'CAB-QHRQTM', '2a643039-eb7b-429a-a10a-f3a2c93f82bb', '[{"unit": "kg", "price": 5000, "quantity": 13.11, "subtotal": 65550, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 65550, 0, 0, 65550, 'Lunas', 'Selesai', '2025-11-23 01:08:59.276+00', '2025-11-24', 65550, 0, 'QRIS', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '7a0ca163-0635-44a6-99a9-2aa754b57862'),
	('afc442cc-29b2-42ed-8c40-48414412faa9', 'CAB-QHZAZC', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 10000, "quantity": 1, "subtotal": 10000, "serviceId": "d6b33500-65d2-44f4-8af4-fe60c28d119c", "itemDetails": [], "serviceName": "Campuran"}]', 10000, 0, 0, 10000, 'Belum Lunas', 'Diproses', '2025-11-25 11:38:11.979+00', '2025-11-26', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '30898756-1288-47db-8fa2-72f2bd372fa5'),
	('c5895514-4a99-4418-a523-754039839b54', 'CAB-RH2NER', '1c70311e-8727-4b0e-8660-56464c7244b7', '[{"unit": "kg", "price": 5000, "quantity": 9.6, "subtotal": 48000, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 48000, 0, 0, 48000, 'Lunas', 'Selesai', '2025-11-22 05:47:30.255+00', '2025-11-23', 48000, 0, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '3c50285e-46b2-48e6-94d7-870c13434a14'),
	('0df70837-eb4b-4f66-96e9-7e2460097926', 'CAB-8HEFRC', 'ded003dd-6c52-435b-bbaf-06abaf562e8f', '[{"unit": "kg", "price": 7500, "quantity": 3.48, "subtotal": 26100, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 26100, 0, 0, 26100, 'Belum Lunas', 'Diproses', '2025-11-25 11:39:46.399+00', '2025-11-28', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'a86c3bd5-afd9-41bd-bea0-d8079b991d79'),
	('6947f7ef-9de6-4379-85a7-a7e3f3124fb8', 'CAB-3FT7LK', '9b97b8ae-55df-44f8-bdd6-d4b5b461e8fd', '[{"unit": "kg", "price": 7500, "quantity": 2.52, "subtotal": 18900, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 18900, 0, 0, 18900, 'Belum Lunas', 'Diproses', '2025-11-25 11:43:04.787+00', '2025-11-28', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '6cd6e3b1-8810-40fe-80f0-2edfb05dcbc2'),
	('9992dfe7-e609-409c-b152-a8a67715c947', 'CAB-R4NQCF', 'f765d0e1-b4cc-47c5-98f7-eee5d252eb26', '[{"unit": "kg", "price": 7500, "quantity": 5.31, "subtotal": 39825, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 39825, 0, 0, 39825, 'Belum Lunas', 'Diproses', '2025-11-21 11:40:20.136+00', '2025-11-24', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '497cf1a8-6a0d-4723-83a0-1a2d739b6439'),
	('c0d2daee-9e50-4a23-98cc-d29a6acf046f', 'CAB-ZL7W2A', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 10000, "quantity": 1, "subtotal": 10000, "serviceId": "d6b33500-65d2-44f4-8af4-fe60c28d119c", "serviceName": "Campuran"}, {"unit": "kg", "price": 8000, "quantity": 1, "subtotal": 8000, "serviceId": "72326b81-a356-41ea-927c-eb912bcc0c56", "serviceName": "Cuci dan lipat (min. 3 kg) - 1 hari"}, {"unit": "kg", "price": 6000, "quantity": 1, "subtotal": 6000, "serviceId": "2c5f7dd6-91da-48e0-bd12-66321aca68e4", "serviceName": "Cuci dan lipat (min. 3 kg) - 2 hari"}, {"unit": "kg", "price": 5000, "quantity": 1, "subtotal": 5000, "serviceId": "fda8705e-dbdc-4643-b464-50f644dc23e7", "serviceName": "Cuci dan liprika (min. 3 kg) - 3 hari"}, {"unit": "kg", "price": 7500, "quantity": 1, "subtotal": 7500, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}, {"unit": "kg", "price": 25000, "quantity": 1, "subtotal": 25000, "serviceId": "e56a7a83-58e5-4b9d-be68-5bc43096a000", "serviceName": "Cuci ekspres - 3 jam"}, {"unit": "kg", "price": 15000, "quantity": 1, "subtotal": 15000, "serviceId": "e4cc32c3-685d-4bc8-b53a-3ad953d3198b", "serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari"}, {"unit": "kg", "price": 15000, "quantity": 1, "subtotal": 15000, "serviceId": "9229c0f5-95dd-4402-bbea-690bbb397ef8", "serviceName": "Fitrase"}]', 91500, 0, 0, 91500, 'Lunas', 'Selesai', '2025-11-20 15:25:57.837+00', '2025-11-23', 91500, 0, 'QRIS', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'deb296b3-7ecb-4349-860f-a43c1a09c806'),
	('f1e823db-a837-4ba1-8183-c9d8c8ebe693', 'CAB-4MKURN', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 10000, "quantity": 1, "subtotal": 10000, "serviceId": "d6b33500-65d2-44f4-8af4-fe60c28d119c", "itemDetails": [], "serviceName": "Campuran"}, {"unit": "kg", "price": 8000, "quantity": 1, "subtotal": 8000, "serviceId": "72326b81-a356-41ea-927c-eb912bcc0c56", "itemDetails": [], "serviceName": "Cuci dan lipat (min. 3 kg) - 1 hari"}, {"unit": "kg", "price": 6000, "quantity": 1, "subtotal": 6000, "serviceId": "2c5f7dd6-91da-48e0-bd12-66321aca68e4", "itemDetails": [], "serviceName": "Cuci dan lipat (min. 3 kg) - 2 hari"}, {"unit": "kg", "price": 4000, "quantity": 1, "subtotal": 4000, "serviceId": "762569de-0dfc-4053-b570-683a4c7bb317", "itemDetails": [], "serviceName": "Cuci lipat mitra laundry"}]', 28000, 0, 0, 28000, 'Lunas', 'Selesai', '2025-11-20 15:57:53.272+00', '2025-11-22', 28000, 12000, 'Tunai', '2c093716-8e1e-4237-92a2-04cd5ef2658b', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '9fc7a4a8-12b4-4f22-b668-dac324cc2067'),
	('80047e2e-ee83-41f6-865a-da5ee0c02a97', 'CAB-G6HHQY', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 20000, "quantity": 1, "subtotal": 20000, "serviceId": "11210778-1193-4b14-9c9c-e63e46f99539", "serviceName": "Cuci dan setrika (min. 2 kg) - 6 jam (ekspres)"}]', 20000, 0, 0, 20000, 'Lunas', 'Selesai', '2025-11-20 15:26:48.282+00', '2025-11-20', 20000, 0, 'QRIS', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '63800b05-1bb8-4870-9ae3-f74721e7d9f0'),
	('dcf74b37-0c89-4a46-a416-757824af1aed', 'CAB-RQLXQ4', '9e0256d6-9b7c-4749-bc35-5352dd8a01dc', '[{"unit": "kg", "price": 7500, "quantity": 3.34, "subtotal": 25050, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 25050, 0, 0, 25050, 'Belum Lunas', 'Diproses', '2025-11-22 01:43:28.994+00', '2025-11-25', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '49fc876c-52a6-4b47-9cc2-68d1d59b690e'),
	('aa31157c-85fb-4983-8b80-2d85cb1d0af7', 'CAB-H3HVZN', '12253d22-758d-41d9-b5b2-650d5ec3f417', '[{"unit": "kg", "price": 7500, "quantity": 3.27, "subtotal": 24525, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 24525, 0, 0, 24525, 'Belum Lunas', 'Diproses', '2025-11-22 01:59:44.837+00', '2025-11-25', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '14699123-e74b-4d78-9e32-e1af3839e187'),
	('96a4a6fa-8f94-4036-ae48-841a7d47a5c2', 'CAB-7Y3K3Y', '47282850-2a21-4597-ae7d-28b2b431666d', '[{"unit": "kg", "price": 7500, "quantity": 2.27, "subtotal": 17025, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 17025, 0, 0, 17025, 'Belum Lunas', 'Diproses', '2025-11-22 02:58:44.491+00', '2025-11-25', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '8084f6db-c6bb-46f2-ae56-5e1666519e1d'),
	('d2abcff0-4f54-44e5-8b85-a278b8e446ad', 'CAB-H6PD6N', '903e6666-8720-49b4-b9f2-e76ab15b6c68', '[{"unit": "kg", "price": 15000, "quantity": 4.47, "subtotal": 67050, "serviceId": "e4cc32c3-685d-4bc8-b53a-3ad953d3198b", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari"}]', 67050, 0, 0, 67050, 'Lunas', 'Selesai', '2025-11-22 00:34:09.188+00', '2025-11-23', 67050, 0, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '4216414a-65c7-4ae7-9e0d-c5105eb7f1ba'),
	('09b16e94-fea1-44bf-b1b9-5181321e2653', 'CAB-99X2ND', '5d708a98-8369-4064-8b39-9ec24ea1031e', '[{"unit": "kg", "price": 5000, "quantity": 12.69, "subtotal": 63450, "serviceId": "fda8705e-dbdc-4643-b464-50f644dc23e7", "itemDetails": [], "serviceName": "Cuci dan liprika (min. 3 kg) - 3 hari"}]', 63450, 0, 0, 63450, 'Belum Lunas', 'Diproses', '2025-11-24 12:07:34.02+00', '2025-11-27', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '0ab439a3-cdc9-4f8b-83c0-8bd232ef6c11'),
	('058ecaaa-80ca-40c1-bb5d-9d2937f71db9', 'CAB-DJGJHU', '218461d0-3860-4c18-8d9b-2ca6593d23cf', '[{"unit": "kg", "price": 10000, "quantity": 2, "subtotal": 20000, "serviceId": "642223e6-013a-4df0-b48f-9f6813df1e4b", "itemDetails": [], "serviceName": "Sprei (kiloan)"}]', 20000, 0, 0, 20000, 'Belum Lunas', 'Diproses', '2025-11-24 12:36:34.161+00', '2025-11-25', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '256fe999-e45c-433f-bd2c-11076f31e9ea'),
	('814617ea-a263-4aef-8427-0530e1101684', 'CAB-NR9RDX', 'cd544fab-d14f-4665-8df0-ff6ffe347bf1', '[{"unit": "kg", "price": 5000, "quantity": 6.41, "subtotal": 32050, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 32050, 0, 0, 32050, 'Lunas', 'Selesai', '2025-11-22 02:09:52.499+00', '2025-11-23', 32050, 0, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '321a0f04-19ee-47da-9d75-cd7db28ad231'),
	('0e7f1754-d385-47e3-8b80-50acb768b5b1', 'CAB-XM7YG3', 'ded003dd-6c52-435b-bbaf-06abaf562e8f', '[{"unit": "kg", "price": 7500, "quantity": 6, "subtotal": 45000, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 45000, 0, 0, 45000, 'Lunas', 'Selesai', '2025-11-22 01:47:49.03+00', '2025-11-25', 45000, 0, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '9b565f02-81b2-4356-8ba2-a73e4c0be508'),
	('077aa911-e3c8-4b03-9451-d8f6ae43a785', 'CAB-JQ485R', '9b5dbab9-70df-4801-b7f1-67a4c0785e9b', '[{"unit": "kg", "price": 5000, "quantity": 4.92, "subtotal": 24600, "serviceId": "fda8705e-dbdc-4643-b464-50f644dc23e7", "itemDetails": [], "serviceName": "Cuci dan liprika (min. 3 kg) - 3 hari"}]', 24600, 0, 0, 24600, 'Lunas', 'Selesai', '2025-11-21 12:29:11.526+00', '2025-11-24', 24600, 5400, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '2241fd10-7ec6-482b-832b-d74fa29164d1'),
	('8a2e030f-f541-45e6-b6fc-f050afbe0445', 'CAB-B9CVVW', '5c4f014b-88ca-4a05-99d5-93d7b1eb8cf9', '[{"unit": "kg", "price": 10000, "quantity": 2, "subtotal": 20000, "serviceId": "642223e6-013a-4df0-b48f-9f6813df1e4b", "itemDetails": [], "serviceName": "Sprei (kiloan)"}, {"unit": "pcs", "price": 25000, "quantity": 1, "subtotal": 25000, "serviceId": "86497846-ff9f-4992-83bc-50ad7af48c7c", "itemDetails": [], "serviceName": "Bed cover jumbo/besar"}]', 45000, 0, 0, 45000, 'Belum Lunas', 'Diproses', '2025-11-26 04:46:55.799+00', '2025-11-27', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '6ec5ef7f-c421-4b0e-b9b8-b22b3af0e369'),
	('4e17b9dd-a71c-4fb9-a100-505f3fd4514c', 'CAB-4LXRM6', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 10000, "quantity": 2.34, "subtotal": 23400, "serviceId": "d6b33500-65d2-44f4-8af4-fe60c28d119c", "itemDetails": [], "serviceName": "Campuran"}, {"unit": "kg", "price": 6000, "quantity": 3.2, "subtotal": 19200, "serviceId": "2c5f7dd6-91da-48e0-bd12-66321aca68e4", "itemDetails": [], "serviceName": "Cuci dan lipat (min. 3 kg) - 2 hari"}]', 42600, 0, 0, 42600, 'Belum Lunas', 'Diproses', '2025-11-27 03:41:21.2+00', '2025-11-29', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '16000595-6bf9-430b-80d2-5204ee8f682c'),
	('3f81ef48-e556-4f8b-992a-6be1c5b05aef', 'CAB-8ZJ7SF', '4fc31f0c-7db7-4829-bbe1-897a3d5213e8', '[{"unit": "kg", "price": 8000, "quantity": 3.2, "subtotal": 25600, "serviceId": "72326b81-a356-41ea-927c-eb912bcc0c56", "itemDetails": [], "serviceName": "Cuci dan lipat (min. 3 kg) - 1 hari"}]', 25600, 0, 0, 25600, 'Lunas', 'Diproses', '2025-11-27 03:43:50.382+00', '2025-11-28', 25600, 24400, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '5d2ed6d5-91ee-40ed-8410-fb027c25f380'),
	('0055d3fe-b9c4-4caf-a56d-58ec76d66668', 'CAB-KG994Y', '029d079d-17f0-45c6-80c2-624ad5ba829c', '[{"unit": "kg", "price": 5000, "quantity": 9.18, "subtotal": 45900, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 45900, 0, 0, 45900, 'Belum Lunas', 'Diproses', '2025-11-27 03:47:22.254+00', '2025-11-28', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '032e9acb-ab9c-43b6-952a-a46855a800d0'),
	('05192dfe-6ca4-4f67-abb4-15b12076d3d9', 'CAB-VN24GF', '3a5533d5-c094-4ba7-bc48-cefbf1ac938f', '[{"unit": "kg", "price": 5000, "quantity": 9.18, "subtotal": 45900, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 45900, 0, 0, 45900, 'Belum Lunas', 'Diproses', '2025-11-27 03:50:03.67+00', '2025-11-28', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '1c69b91c-e6b5-4b50-9824-9fe4293d41f1'),
	('7fe09749-1ce4-4051-8bdb-af3b7cee3281', 'CAB-EC2NQ5', '8cdcedea-d403-4067-96ca-f3673142e78a', '[{"unit": "kg", "price": 10000, "quantity": 7.14, "subtotal": 71400, "serviceId": "351bfaaa-81ab-458f-af66-1c5abf91a938", "itemDetails": [], "serviceName": "Gorden"}]', 71400, 0, 0, 71400, 'Lunas', 'Diproses', '2025-11-24 12:04:38.661+00', '2025-11-25', 71400, 0, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'b996e422-106c-4d4f-9943-19742c4e45f6'),
	('355a7c84-f194-459c-908d-7ea95179d854', 'CAB-5PPR8V', '03ac3b42-eec3-4d14-a1c8-03f4f1fe1b0f', '[{"unit": "kg", "price": 7500, "quantity": 4.28, "subtotal": 32100.000000000004, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 32100.000000000004, 0, 0, 32100.000000000004, 'Belum Lunas', 'Diproses', '2025-11-29 00:06:54.011+00', '2025-12-02', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '3ce44f58-9aab-4e56-8527-894eead23180'),
	('763a127c-912a-457f-8b71-ddf8d9939e6e', 'CAB-YVCDPL', '03ac3b42-eec3-4d14-a1c8-03f4f1fe1b0f', '[{"unit": "kg", "price": 7500, "quantity": 4.29, "subtotal": 32175, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 32175, 0, 0, 32175, 'Belum Lunas', 'Diproses', '2025-11-29 00:37:18.057+00', '2025-12-02', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '35190546-4d49-4b7a-a099-c425bf62c022'),
	('3252e8f1-d7c1-4e7e-b6e2-e00e3b80c8ab', 'CAB-XDCT4H', '8e48870f-570c-4a08-bec1-6681b5e1a31f', '[{"unit": "kg", "price": 7500, "quantity": 4.38, "subtotal": 32850, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 32850, 0, 0, 32850, 'Belum Lunas', 'Diproses', '2025-11-29 01:02:24.223+00', '2025-12-02', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '712422e2-a3a1-49c5-aad6-5c8e5a7adf31'),
	('f237fc5c-704b-4bfe-9095-43dc9e590470', 'CAB-7SFF6D', '8e48870f-570c-4a08-bec1-6681b5e1a31f', '[{"unit": "kg", "price": 7500, "quantity": 4.38, "subtotal": 32850, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 32850, 0, 0, 32850, 'Lunas', 'Diproses', '2025-11-29 01:05:23.639+00', '2025-12-02', 32850, 7150, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'a45216af-911f-49cd-8619-411642b24d0a'),
	('1f92bbab-88e5-4c06-80a6-90c78bfa31f3', 'CAB-JQTAVU', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 10000, "quantity": 1, "subtotal": 10000, "serviceId": "d6b33500-65d2-44f4-8af4-fe60c28d119c", "itemDetails": [], "serviceName": "Campuran"}]', 10000, 0, 0, 10000, 'Belum Lunas', 'Diproses', '2025-11-29 01:11:16.982+00', '2025-11-30', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', 'b823eeb7-683c-4953-a016-c31b60c5bd82'),
	('55501eed-958d-43a9-882f-6d7896bd3328', 'CAB-PBC2UU', '498154aa-9596-4a1a-ac85-cc77acfc07a9', '[{"unit": "kg", "price": 15000, "quantity": 3.12, "subtotal": 46800, "serviceId": "e4cc32c3-685d-4bc8-b53a-3ad953d3198b", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari"}]', 46800, 0, 0, 46800, 'Belum Lunas', 'Diproses', '2025-11-29 01:15:53.326+00', '2025-11-30', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '41f328f8-bb6c-4ca7-a861-a53ba8138de6'),
	('37d1de27-e957-46a0-b832-e95c6b799944', 'CAB-Z6XQ45', '029d079d-17f0-45c6-80c2-624ad5ba829c', '[{"unit": "kg", "price": 5000, "quantity": 5.9, "subtotal": 29500, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 29500, 0, 0, 29500, 'Belum Lunas', 'Diproses', '2025-11-29 01:40:50.717+00', '2025-11-30', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '60240d13-ed33-4f21-93f2-3575c575b858'),
	('f540c394-b84c-4cda-93f1-4ec1fb842329', 'CAB-WX2MTK', '029d079d-17f0-45c6-80c2-624ad5ba829c', '[{"unit": "kg", "price": 5000, "quantity": 5.9, "subtotal": 29500, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 29500, 0, 0, 29500, 'Belum Lunas', 'Diproses', '2025-11-29 01:44:26.241+00', '2025-11-30', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '0ee9fb9e-246a-4ac5-8719-95d64606f32f'),
	('e590d1ac-45fe-4cf1-81bf-20e340413e4c', 'CAB-NJJKGQ', '1c70311e-8727-4b0e-8660-56464c7244b7', '[{"unit": "kg", "price": 5000, "quantity": 9.8, "subtotal": 49000, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 49000, 0, 0, 49000, 'Belum Lunas', 'Diproses', '2025-11-29 05:15:56.992+00', '2025-11-30', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '6848aabf-b70b-4c1b-ac54-c9cb8630f14f'),
	('26d65493-b475-4630-b870-a3dd1d44a523', 'CAB-25UQLX', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"unit": "kg", "price": 7500, "quantity": 3.1, "subtotal": 23250, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 23250, 0, 0, 23250, 'Belum Lunas', 'Diproses', '2025-11-30 00:13:15.251+00', '2025-12-03', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '05715368-4f31-431a-9f73-b08923496b25'),
	('d958e69f-2027-4e75-8f92-6b4ad99430af', 'CAB-6D6UAF', '23f02f1a-910c-4078-8c8f-21cc5a1c94ab', '[{"unit": "kg", "price": 7500, "quantity": 4, "subtotal": 30000, "serviceId": "99737bae-acfa-4528-bca6-3ec6c09e2877", "itemDetails": [], "serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari"}]', 30000, 0, 0, 30000, 'Lunas', 'Diproses', '2025-11-30 02:04:07.371+00', '2025-12-03', 30000, 20000, 'Tunai', 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '6c024ba8-fe70-40e8-b025-31ff5a5ffe28'),
	('e4ddb06d-3e24-41d3-893e-239d07c8e014', 'CAB-UXHC6S', '3d1b3aec-efdd-4c99-9d44-7d84cc0b807c', '[{"unit": "kg", "price": 5000, "quantity": 5.26, "subtotal": 26300, "serviceId": "bd67aca1-d90c-4a08-a47d-3de607ee4112", "itemDetails": [], "serviceName": "Setrika saja (min. 3 kg)"}]', 26300, 0, 0, 26300, 'Belum Lunas', 'Diproses', '2025-11-30 08:40:10.224+00', '2025-12-01', 0, 0, NULL, 'e0efe954-3fcc-4688-a78d-45640228df47', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', '', '3aec7e58-8b12-4e0c-8a89-e2692eaeed7b');


--
-- Data for Name: user_credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 423, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."audit_logs_id_seq"', 277, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."settings_id_seq"', 1, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict dUhta5uUuCTpL2CmscZa7wPosazaOxbAMAQ4ruHAGbj5wviRIr3aCTkMuJ4iheZ

RESET ALL;
