# 📸 Sistema de Upload e Armazenamento de Imagens

## ✅ O que foi implementado

### 1. **Serviço de Storage (`services/storage.ts`)**
Sistema completo de gerenciamento de imagens com Supabase Storage:

- ✅ Upload de arquivos (File/Blob)
- ✅ Upload de imagens a partir de URL ou base64
- ✅ Deleção de arquivos
- ✅ Listagem de arquivos
- ✅ Validação de tipo e tamanho
- ✅ Fallback automático para localStorage quando Supabase não está disponível
- ✅ Conversão entre base64 e Blob

**Buckets configurados:**
- `avatars` - Fotos de perfil
- `course-covers` - Capas de cursos
- `course-banners` - Banners de cursos
- `lesson-images` - Imagens de aulas
- `certificates` - Certificados
- `general` - Imagens gerais

### 2. **Componente de Upload (`components/ImageUpload.tsx`)**
Componente React reutilizável para upload de imagens:

- ✅ Preview da imagem antes e depois do upload
- ✅ Drag & drop visual
- ✅ Validação de tipo e tamanho
- ✅ Estados de loading
- ✅ Mensagens de erro
- ✅ Remoção de imagem
- ✅ Aspect ratio configurável
- ✅ Integração com Supabase Storage

### 3. **Scripts de Configuração**

#### `supabase-storage-setup.sql`
Script SQL para criar automaticamente:
- Todos os buckets necessários
- Políticas de acesso (RLS)
- Permissões públicas para leitura
- Permissões autenticadas para upload/edição

#### `SUPABASE_STORAGE_SETUP.md`
Documentação completa com:
- Instruções passo a passo
- Exemplos de uso
- Troubleshooting
- Configuração manual e automática

### 4. **Correção do Gemini (`services/nanoBanana.ts`)**
- ❌ Removida funcionalidade de geração de imagens (Gemini não suporta)
- ✅ Mantida geração de resumos e análise de texto
- ✅ Mensagem clara explicando alternativas (DALL-E, Stable Diffusion)

---

## 🚀 Como Usar

### Passo 1: Configurar Supabase Storage

Execute o script SQL no painel do Supabase:

1. Acesse: https://sexgdfohmlrxmzvsxqct.supabase.co
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase-storage-setup.sql`
4. Clique em **Run**

### Passo 2: Usar o Componente de Upload

```tsx
import ImageUpload from './components/ImageUpload';
import { STORAGE_BUCKETS } from './services/storage';

function ProfileEditor() {
  const [avatarUrl, setAvatarUrl] = useState('');

  return (
    <ImageUpload
      bucket={STORAGE_BUCKETS.AVATARS}
      currentImageUrl={avatarUrl}
      onImageUploaded={setAvatarUrl}
      label="Foto de Perfil"
      aspectRatio="1/1"
      fileName={`user-${userId}-avatar.png`}
    />
  );
}
```

### Passo 3: Upload Programático

```tsx
import { uploadFile, STORAGE_BUCKETS } from './services/storage';

async function handleFileUpload(file: File) {
  const result = await uploadFile(file, STORAGE_BUCKETS.COURSE_COVERS, {
    folder: 'my-course',
    fileName: 'cover.png',
    upsert: true
  });
  
  console.log('URL da imagem:', result.url);
  return result.url;
}
```

### Passo 4: Upload de URL Externa

```tsx
import { uploadImageFromUrl, STORAGE_BUCKETS } from './services/storage';

async function saveExternalImage(imageUrl: string) {
  const result = await uploadImageFromUrl(
    imageUrl,
    STORAGE_BUCKETS.GENERAL,
    { fileName: 'imported-image.png' }
  );
  
  return result.url;
}
```

---

## 📝 Onde Integrar

### 1. **Edição de Perfil de Usuário**
Adicionar upload de avatar em `components/Views.tsx` (ProfileView):

```tsx
<ImageUpload
  bucket={STORAGE_BUCKETS.AVATARS}
  currentImageUrl={user.avatar}
  onImageUploaded={(url) => setUser({ ...user, avatar: url })}
  label="Foto de Perfil"
  aspectRatio="1/1"
  fileName={`${user.id}-avatar.png`}
/>
```

### 2. **Criação/Edição de Cursos**
Adicionar upload de capa e banner:

```tsx
{/* Capa do Curso */}
<ImageUpload
  bucket={STORAGE_BUCKETS.COURSE_COVERS}
  currentImageUrl={course.coverImage}
  onImageUploaded={(url) => setCourse({ ...course, coverImage: url })}
  label="Capa do Curso"
  aspectRatio="16/9"
  folder={course.id}
/>

{/* Banner do Curso */}
<ImageUpload
  bucket={STORAGE_BUCKETS.COURSE_BANNERS}
  currentImageUrl={course.bannerImage}
  onImageUploaded={(url) => setCourse({ ...course, bannerImage: url })}
  label="Banner do Curso"
  aspectRatio="16/5"
  folder={course.id}
/>
```

### 3. **Aulas**
Adicionar upload de imagens nas aulas:

```tsx
<ImageUpload
  bucket={STORAGE_BUCKETS.LESSON_IMAGES}
  currentImageUrl={lesson.imageUrl}
  onImageUploaded={(url) => setLesson({ ...lesson, imageUrl: url })}
  label="Imagem da Aula"
  aspectRatio="16/9"
  folder={`${courseId}/${lessonId}`}
/>
```

---

## 🔧 Funcionalidades Adicionais

### Validação de Arquivo

```tsx
import { validateImageFile } from './services/storage';

const validation = validateImageFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

### Conversão Base64 ↔ Blob

```tsx
import { fileToBase64, base64ToBlob } from './services/storage';

// File para base64
const base64 = await fileToBase64(file);

// Base64 para Blob
const blob = base64ToBlob(base64String);
```

### Deletar Arquivo

```tsx
import { deleteFile, STORAGE_BUCKETS } from './services/storage';

await deleteFile(STORAGE_BUCKETS.AVATARS, 'user-123-avatar.png');
```

### Listar Arquivos

```tsx
import { listFiles, STORAGE_BUCKETS } from './services/storage';

const files = await listFiles(STORAGE_BUCKETS.COURSE_COVERS, 'course-123');
console.log('Arquivos:', files);
```

---

## ⚠️ Sobre Geração de Imagens com IA

**Gemini NÃO gera imagens!** O código anterior estava incorreto.

### Alternativas para geração de imagens:

1. **DALL-E 3 (OpenAI)**
   - API: https://platform.openai.com/docs/guides/images
   - Requer: API key da OpenAI
   - Custo: ~$0.04 por imagem (1024x1024)

2. **Stable Diffusion**
   - Pode ser executado localmente
   - Gratuito (requer GPU potente)
   - API via Replicate: https://replicate.com/

3. **Midjourney**
   - Qualidade excelente
   - Sem API oficial (apenas Discord)

### Implementação futura (DALL-E):

```tsx
// Adicionar ao .env
VITE_OPENAI_API_KEY=sk-...

// Criar services/dalle.ts
async function generateImage(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1
    })
  });
  
  const data = await response.json();
  return data.data[0].url;
}
```

---

## 📊 Status Atual

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Upload de imagens | ✅ Implementado | Supabase Storage + fallback localStorage |
| Componente de Upload | ✅ Implementado | Reutilizável em toda aplicação |
| Validação de arquivos | ✅ Implementado | Tipo e tamanho |
| Preview de imagens | ✅ Implementado | Antes e depois do upload |
| Deleção de imagens | ✅ Implementado | Com confirmação |
| Geração de imagens IA | ❌ Não disponível | Gemini não suporta (usar DALL-E) |
| Resumos de texto IA | ✅ Funcionando | Gemini 2.0 Flash |
| Buckets Supabase | ⚠️ Precisa configurar | Executar script SQL |

---

## 🎯 Próximos Passos

1. **Executar script SQL** no Supabase para criar os buckets
2. **Integrar ImageUpload** nos componentes de edição
3. **Testar upload** de uma imagem
4. **Verificar URLs públicas** das imagens
5. **(Opcional) Implementar DALL-E** para geração de imagens

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se os buckets foram criados no Supabase
2. Verifique as políticas RLS no Storage
3. Verifique o console do navegador para erros
4. Em caso de erro, o sistema usa fallback local (base64)
