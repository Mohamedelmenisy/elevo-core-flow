
-- migrations/20250928_create_version_history.sql
-- Creates version_history and trigger to save previous version of public.cases
BEGIN;

CREATE TABLE IF NOT EXISTS public.version_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  item_id BIGINT NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title_en_before TEXT,
  description_en_before TEXT,
  content_en_before TEXT,
  title_ar_before TEXT,
  description_ar_before TEXT,
  content_ar_before TEXT,
  modified_by_id UUID,
  modified_by_name TEXT,
  modified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  change_summary TEXT
);

-- function to save previous row into version_history before update
CREATE OR REPLACE FUNCTION public.fn_save_case_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.version_history(
    item_id,
    title_en_before, description_en_before, content_en_before,
    title_ar_before, description_ar_before, content_ar_before,
    modified_by_id, modified_by_name, modified_at, change_summary
  ) VALUES (
    OLD.id,
    OLD.title_en, OLD.description_en, OLD.content_en,
    OLD.title_ar, OLD.description_ar, OLD.content_ar,
    NEW.last_modified_by, NEW.last_modified_by_name, now(), NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_save_case_version ON public.cases;
CREATE TRIGGER trg_save_case_version
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.fn_save_case_version();

-- RLS policy on version_history: allow selects only for users who have role='admin' OR is_admin=true in public.users
ALTER TABLE public.version_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_admins_read_version_history ON public.version_history
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    OR (SELECT is_admin FROM public.users WHERE id = auth.uid()) = true
  );

COMMIT;
