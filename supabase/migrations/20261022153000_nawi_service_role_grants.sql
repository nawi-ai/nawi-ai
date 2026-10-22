-- Complementa 20261022120000_nawi_mvp.sql en proyectos que ya crearon las tablas.
-- service_role no tenía privilegios, así que guardar una sesión devolvía 42501.

grant select, insert, update, delete on public.reader_profiles to service_role;
grant select, insert, update, delete on public.reading_sessions to service_role;
grant select, insert, update, delete on public.reading_answers to service_role;
