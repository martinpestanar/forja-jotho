-- ==============================================================================
-- FASE 6: Storage Bucket Público para Cartas Holográficas TCG
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tcg-cards',
  'tcg-cards',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read tcg-cards" ON storage.objects;
CREATE POLICY "Public read tcg-cards" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'tcg-cards');

DROP POLICY IF EXISTS "Allow upload tcg-cards" ON storage.objects;
CREATE POLICY "Allow upload tcg-cards" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tcg-cards');

DROP POLICY IF EXISTS "Allow anon upload tcg-cards" ON storage.objects;
CREATE POLICY "Allow anon upload tcg-cards" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'tcg-cards');

DROP POLICY IF EXISTS "Allow update tcg-cards" ON storage.objects;
CREATE POLICY "Allow update tcg-cards" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'tcg-cards');
