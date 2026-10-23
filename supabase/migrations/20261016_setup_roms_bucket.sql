-- ==============================================================================
-- BUCKET 'roms' PARA ALMACENAR LA ROM COMPILADA POR GITHUB ACTIONS
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'roms',
  'roms',
  true,
  67108864, -- 64MB para ROMs y parches de GBA
  ARRAY['application/octet-stream', 'application/x-gba-rom', 'application/binary']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read roms" ON storage.objects;
CREATE POLICY "Public read roms" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'roms');

DROP POLICY IF EXISTS "Service role manage roms" ON storage.objects;
CREATE POLICY "Service role manage roms" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'roms');
