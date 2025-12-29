-- ============================================
-- Supabase Storage Setup Script
-- ConversApp Academy
-- ============================================

-- PASSO 1: Criar buckets públicos
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('course-covers', 'course-covers', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('course-banners', 'course-banners', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('lesson-images', 'lesson-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('certificates', 'certificates', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/pdf']),
  ('general', 'general', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- PASSO 2: Criar políticas de acesso
-- ============================================

-- Função auxiliar para criar políticas
CREATE OR REPLACE FUNCTION create_storage_policies()
RETURNS void AS $$
DECLARE
  bucket_name TEXT;
  bucket_names TEXT[] := ARRAY['avatars', 'course-covers', 'course-banners', 'lesson-images', 'certificates', 'general'];
BEGIN
  FOREACH bucket_name IN ARRAY bucket_names
  LOOP
    -- 1. Leitura pública (qualquer pessoa pode ver)
    EXECUTE format('
      DROP POLICY IF EXISTS "%s_public_read" ON storage.objects;
      CREATE POLICY "%s_public_read"
      ON storage.objects FOR SELECT
      USING ( bucket_id = %L );
    ', bucket_name, bucket_name, bucket_name);

    -- 2. Upload para usuários autenticados
    EXECUTE format('
      DROP POLICY IF EXISTS "%s_authenticated_upload" ON storage.objects;
      CREATE POLICY "%s_authenticated_upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK ( bucket_id = %L );
    ', bucket_name, bucket_name, bucket_name);

    -- 3. Atualização pelo proprietário
    EXECUTE format('
      DROP POLICY IF EXISTS "%s_owner_update" ON storage.objects;
      CREATE POLICY "%s_owner_update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING ( bucket_id = %L AND auth.uid() = owner )
      WITH CHECK ( bucket_id = %L AND auth.uid() = owner );
    ', bucket_name, bucket_name, bucket_name, bucket_name);

    -- 4. Deleção pelo proprietário
    EXECUTE format('
      DROP POLICY IF EXISTS "%s_owner_delete" ON storage.objects;
      CREATE POLICY "%s_owner_delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING ( bucket_id = %L AND auth.uid() = owner );
    ', bucket_name, bucket_name, bucket_name);

    RAISE NOTICE 'Políticas criadas para bucket: %', bucket_name;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função
SELECT create_storage_policies();

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS create_storage_policies();

-- PASSO 3: Verificar configuração
-- ============================================

-- Listar buckets criados
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('avatars', 'course-covers', 'course-banners', 'lesson-images', 'certificates', 'general')
ORDER BY name;

-- Listar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================
-- Configuração concluída! ✅
-- ============================================
-- 
-- Próximos passos:
-- 1. Verifique se os buckets foram criados na aba Storage
-- 2. Teste o upload de uma imagem
-- 3. Verifique se a URL pública está acessível
-- 
-- ============================================
