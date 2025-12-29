# Configuração do Supabase Storage

## 📦 Buckets Necessários

A plataforma ConversApp Academy utiliza os seguintes buckets para armazenamento de imagens:

1. **avatars** - Fotos de perfil dos usuários
2. **course-covers** - Imagens de capa dos cursos
3. **course-banners** - Banners dos cursos
4. **lesson-images** - Imagens das aulas
5. **certificates** - Certificados gerados
6. **general** - Imagens gerais

## 🚀 Como Configurar (Método Automático)

Execute o seguinte código no console do navegador após fazer login como admin:

```javascript
import { initializeStorageBuckets } from './services/storage';
await initializeStorageBuckets();
```

## 🔧 Como Configurar (Método Manual)

### Passo 1: Acessar o Painel do Supabase

1. Acesse: https://sexgdfohmlrxmzvsxqct.supabase.co
2. Faça login com suas credenciais
3. Vá para **Storage** no menu lateral

### Passo 2: Criar os Buckets

Para cada bucket listado acima:

1. Clique em **New Bucket**
2. Preencha:
   - **Name**: Nome do bucket (ex: `avatars`)
   - **Public bucket**: ✅ **Ativado** (para permitir acesso público às imagens)
   - **File size limit**: `5242880` (5MB)
3. Clique em **Create bucket**

### Passo 3: Configurar Políticas de Acesso (RLS)

Para cada bucket, configure as seguintes políticas:

#### Política 1: Leitura Pública (SELECT)
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'NOME_DO_BUCKET' );
```

#### Política 2: Upload Autenticado (INSERT)
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'NOME_DO_BUCKET' 
  AND auth.role() = 'authenticated'
);
```

#### Política 3: Atualização pelo Proprietário (UPDATE)
```sql
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'NOME_DO_BUCKET' 
  AND auth.uid() = owner 
);
```

#### Política 4: Deleção pelo Proprietário (DELETE)
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'NOME_DO_BUCKET' 
  AND auth.uid() = owner 
);
```

### Passo 4: Script SQL Completo

Execute este script no **SQL Editor** do Supabase para criar todos os buckets e políticas de uma vez:

```sql
-- Criar buckets (se não existirem)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('avatars', 'avatars', true, 5242880),
  ('course-covers', 'course-covers', true, 5242880),
  ('course-banners', 'course-banners', true, 5242880),
  ('lesson-images', 'lesson-images', true, 5242880),
  ('certificates', 'certificates', true, 5242880),
  ('general', 'general', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para cada bucket
DO $$
DECLARE
  bucket_name TEXT;
BEGIN
  FOR bucket_name IN 
    SELECT unnest(ARRAY['avatars', 'course-covers', 'course-banners', 'lesson-images', 'certificates', 'general'])
  LOOP
    -- Leitura pública
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "%s_public_access"
      ON storage.objects FOR SELECT
      USING ( bucket_id = %L );
    ', bucket_name, bucket_name);

    -- Upload autenticado
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "%s_authenticated_upload"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = %L 
        AND auth.role() = ''authenticated''
      );
    ', bucket_name, bucket_name);

    -- Atualização pelo proprietário
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "%s_owner_update"
      ON storage.objects FOR UPDATE
      USING ( 
        bucket_id = %L 
        AND auth.uid() = owner 
      );
    ', bucket_name, bucket_name);

    -- Deleção pelo proprietário
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "%s_owner_delete"
      ON storage.objects FOR DELETE
      USING ( 
        bucket_id = %L 
        AND auth.uid() = owner 
      );
    ', bucket_name, bucket_name);
  END LOOP;
END $$;
```

## 📝 Como Usar no Código

### Upload de Avatar de Usuário

```typescript
import { uploadFile, STORAGE_BUCKETS } from './services/storage';

async function updateUserAvatar(file: File, userId: string) {
  const result = await uploadFile(file, STORAGE_BUCKETS.AVATARS, {
    fileName: `${userId}-avatar.png`,
    upsert: true
  });
  
  console.log('Avatar URL:', result.url);
  return result.url;
}
```

### Upload de Capa de Curso

```typescript
import { uploadFile, STORAGE_BUCKETS } from './services/storage';

async function uploadCourseCover(file: File, courseId: string) {
  const result = await uploadFile(file, STORAGE_BUCKETS.COURSE_COVERS, {
    folder: courseId,
    upsert: true
  });
  
  return result.url;
}
```

### Upload a partir de URL ou Base64

```typescript
import { uploadImageFromUrl, STORAGE_BUCKETS } from './services/storage';

// De uma URL externa
const result = await uploadImageFromUrl(
  'https://example.com/image.jpg',
  STORAGE_BUCKETS.GENERAL
);

// De base64
const result = await uploadImageFromUrl(
  'data:image/png;base64,iVBORw0KG...',
  STORAGE_BUCKETS.GENERAL
);
```

## 🔍 Verificar Configuração

Execute no console do navegador:

```javascript
import { listFiles, STORAGE_BUCKETS } from './services/storage';

// Listar arquivos em um bucket
const files = await listFiles(STORAGE_BUCKETS.AVATARS);
console.log('Arquivos no bucket avatars:', files);
```

## ⚠️ Fallback Local

Se o Supabase não estiver configurado, o sistema automaticamente usa `localStorage` como fallback:
- Imagens são armazenadas como base64
- Funciona offline
- Limitado pelo tamanho do localStorage (~5-10MB)

## 🎯 Próximos Passos

1. Execute o script SQL acima no Supabase
2. Teste o upload de uma imagem
3. Verifique se a URL pública está acessível
4. Integre o upload nos componentes de edição de perfil e cursos
