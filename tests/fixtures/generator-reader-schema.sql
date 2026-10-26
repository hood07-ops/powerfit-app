-- TEST ONLY: minimal dependencies for the observed reader, no real data.
-- These four tables are stubs for SQL compilation/execution, not schema clones.
create table public.rm_alumnos(id bigint,alumno_id bigint,ejercicio text,rm_kg numeric,fecha date,created_at timestamptz);
create table public.powerfit_generation_packages(id bigint,code text,label text,generations int,amount int,currency text,sort_order int,active bool);
create table public.solicitudes_compra(id bigint,alumno_id bigint,monto int,generaciones int,estado text,created_at timestamptz);
create table public.powerfit_purchase_request_meta(request_id bigint,package_id bigint,origin text,status text);
