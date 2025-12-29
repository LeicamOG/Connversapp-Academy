# 🤖 Integração com Nano Banana (Gemini AI)

Este documento descreve a integração da plataforma ConversApp Academy com o **Nano Banana**, a API de geração de imagens e processamento de texto do Google Gemini.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Funcionalidades](#funcionalidades)
- [Como Usar](#como-usar)
- [API Reference](#api-reference)

---

## 🎯 Visão Geral

A integração com Nano Banana permite:

1. **Geração de Imagens com IA** - Crie imagens personalizadas para cursos, banners e avatares
2. **Resumos Automáticos** - Gere resumos de textos longos em diferentes estilos
3. **Anotações de Aulas** - Crie anotações estruturadas automaticamente do conteúdo das aulas

### Modelos Utilizados

- **Nano Banana Standard** (`gemini-2.5-flash-image`) - Geração rápida de imagens
- **Nano Banana Pro** (`gemini-3-pro-image-preview`) - Geração de imagens em alta qualidade (4K)
- **Gemini Flash** (`gemini-2.0-flash-exp`) - Processamento e resumo de texto

---

## ⚙️ Configuração

### 1. Obter API Key do Google

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar Variável de Ambiente

Adicione a chave no arquivo `.env`:

```env
VITE_GOOGLE_API_KEY=sua_chave_aqui
```

### 3. Verificar Instalação

A plataforma verificará automaticamente se a API está configurada. Se não estiver, você verá avisos no console.

---

## 🚀 Funcionalidades

### 1. Geração de Imagens

#### Resoluções Disponíveis

A plataforma oferece resoluções otimizadas para cada tipo de conteúdo:

| Tipo | Resolução | Proporção | Uso |
|------|-----------|-----------|-----|
| `COURSE_THUMBNAIL` | 1200x675 | 16:9 | Capa de cursos |
| `LESSON_BANNER` | 1920x600 | 16:5 | Banner de aulas |
| `PROFILE_AVATAR` | 512x512 | 1:1 | Avatar de usuário |
| `CERTIFICATE` | 1754x1240 | A4 | Certificados |
| `SOCIAL_SHARE` | 1200x630 | 1.91:1 | Compartilhamento social |
| `ICON` | 256x256 | 1:1 | Ícones |

#### Estilos de Imagem

- **Professional** - Design corporativo e limpo
- **Vibrant** - Cores vibrantes e dinâmicas
- **Minimalist** - Design minimalista e moderno
- **Illustration** - Ilustração digital artística
- **Realistic** - Fotorrealista com alta qualidade

### 2. Resumos de Texto

#### Estilos de Resumo

- **Concise** - Resumo breve em 2-3 frases
- **Detailed** - Resumo completo cobrindo todos os pontos principais
- **Bullet Points** - Resumo em tópicos
- **Academic** - Resumo em estilo acadêmico formal

#### Controle de Tamanho

- **Curto** - Até 50 palavras
- **Médio** - Até 150 palavras
- **Longo** - Até 300 palavras

### 3. Anotações de Aulas

Gera anotações estruturadas contendo:

1. **Resumo Geral** (2-3 frases)
2. **Conceitos Principais** (lista com 3-5 pontos)
3. **Pontos-Chave** (detalhes importantes)
4. **Exemplos Práticos** (quando aplicável)
5. **Dicas de Estudo** (sugestões para fixação)

---

## 💡 Como Usar

### Geração de Imagens na Interface

#### 1. No Editor de Cursos

1. Acesse **Construtor** no menu lateral
2. Crie ou edite um curso
3. Nos campos de imagem (Capa ou Banner), clique na aba **IA**
4. Descreva a imagem que deseja gerar
5. Escolha o estilo (opcional)
6. Clique em **Gerar com IA**

**Exemplo de prompt:**
```
Uma ilustração moderna de estudantes usando tecnologia para aprender, 
com cores vibrantes e estilo profissional
```

#### 2. No Construtor de Páginas

1. Acesse **Construtor** > **Page Builder**
2. Adicione ou edite um bloco Hero Banner
3. No campo "Imagem de Fundo", clique na aba **IA**
4. Descreva a imagem desejada
5. Clique em **Gerar com IA**

### Modo Pro

Para imagens de maior qualidade (4K, melhor renderização de texto):

1. Ative o toggle **Modo Pro** no gerador
2. Gere a imagem normalmente

**Nota:** O modo Pro pode levar mais tempo para gerar.

### Usando Programaticamente

#### Gerar Imagem

```typescript
import { generateImage } from './services/nanoBanana';

const imageUrl = await generateImage({
  prompt: 'Uma ilustração profissional de aprendizado online',
  resolution: 'COURSE_THUMBNAIL',
  style: 'professional',
  usePro: false
});

console.log('Imagem gerada:', imageUrl);
```

#### Gerar Resumo

```typescript
import { generateSummary } from './services/nanoBanana';

const summary = await generateSummary({
  text: 'Texto longo para resumir...',
  style: 'concise',
  maxLength: 150,
  language: 'Portuguese (Brazil)'
});

console.log('Resumo:', summary);
```

#### Gerar Anotações de Aula

```typescript
import { generateLessonNotes } from './services/nanoBanana';

const notes = await generateLessonNotes(
  'Conteúdo completo da aula...'
);

console.log('Anotações:', notes);
```

---

## 📚 API Reference

### `generateImage(request: GenerateImageRequest): Promise<string>`

Gera uma imagem usando Nano Banana.

**Parâmetros:**
- `prompt` (string) - Descrição da imagem a ser gerada
- `resolution` (ImageResolutionType) - Tipo de resolução desejada
- `style` (opcional) - Estilo da imagem
- `usePro` (opcional, boolean) - Usar modelo Pro

**Retorna:** URL da imagem em base64

---

### `generateSummary(request: GenerateSummaryRequest): Promise<string>`

Gera um resumo de texto.

**Parâmetros:**
- `text` (string) - Texto para resumir
- `style` (opcional) - Estilo do resumo
- `maxLength` (opcional, number) - Tamanho máximo em palavras
- `language` (opcional, string) - Idioma do resumo

**Retorna:** Texto do resumo

---

### `generateLessonNotes(lessonContent: string): Promise<string>`

Gera anotações estruturadas de uma aula.

**Parâmetros:**
- `lessonContent` (string) - Conteúdo da aula

**Retorna:** Anotações formatadas em markdown

---

### `generateImagePromptSuggestions(context): string[]`

Gera sugestões de prompts baseadas no contexto.

**Parâmetros:**
- `type` (ImageResolutionType) - Tipo de imagem
- `title` (string) - Título do conteúdo
- `description` (opcional, string) - Descrição
- `keywords` (opcional, string[]) - Palavras-chave

**Retorna:** Array de sugestões de prompts

---

### `isNanoBananaConfigured(): boolean`

Verifica se a API está configurada.

**Retorna:** `true` se a API key está configurada

---

## 🎨 Componentes React

### `<AIImageGenerator />`

Componente completo para geração de imagens com IA.

```tsx
import AIImageGenerator from './components/AIImageGenerator';

<AIImageGenerator
  resolutionType="COURSE_THUMBNAIL"
  onImageGenerated={(url) => console.log('Imagem:', url)}
  context={{
    title: 'Curso de React',
    description: 'Aprenda React do zero',
    keywords: ['programação', 'web', 'javascript']
  }}
/>
```

---

### `<AISummaryGenerator />`

Componente para geração de resumos e anotações.

```tsx
import AISummaryGenerator from './components/AISummaryGenerator';

// Para resumos
<AISummaryGenerator
  text="Texto longo para resumir..."
  type="summary"
  onGenerated={(summary) => console.log('Resumo:', summary)}
/>

// Para anotações de aula
<AISummaryGenerator
  text="Conteúdo da aula..."
  type="notes"
  autoGenerate={true}
  onGenerated={(notes) => console.log('Anotações:', notes)}
/>
```

---

## 🔒 Segurança e Boas Práticas

### Proteção da API Key

- ✅ **NUNCA** exponha sua API key no código frontend em produção
- ✅ Use variáveis de ambiente (`.env`)
- ✅ Adicione `.env` ao `.gitignore`
- ✅ Para produção, considere usar um backend proxy

### Limites de Uso

- A API do Google tem limites de requisições
- Implemente cache quando possível
- Mostre feedback ao usuário durante a geração

### Tratamento de Erros

```typescript
try {
  const image = await generateImage({...});
} catch (error) {
  console.error('Erro ao gerar imagem:', error);
  // Mostrar mensagem amigável ao usuário
  alert('Não foi possível gerar a imagem. Tente novamente.');
}
```

---

## 🐛 Troubleshooting

### Erro: "API Key do Google não configurada"

**Solução:** Verifique se a variável `VITE_GOOGLE_API_KEY` está definida no arquivo `.env`

### Erro: "API Error: 403"

**Solução:** Sua API key pode estar inválida ou sem permissões. Gere uma nova chave no Google AI Studio.

### Erro: "API Error: 429"

**Solução:** Você atingiu o limite de requisições. Aguarde alguns minutos ou atualize seu plano.

### Imagem não está sendo gerada

**Solução:** 
1. Verifique o console do navegador para erros
2. Confirme que a API key está correta
3. Teste com um prompt mais simples
4. Verifique sua conexão com a internet

---

## 📝 Changelog

### v1.0.0 (2025-12-27)

- ✨ Integração inicial com Nano Banana
- ✨ Geração de imagens em múltiplas resoluções
- ✨ Resumos automáticos de texto
- ✨ Geração de anotações de aulas
- ✨ Componentes React para UI
- ✨ Integração no ImagePicker

---

## 📞 Suporte

Para questões sobre a API do Google Gemini:
- [Documentação Oficial](https://ai.google.dev/)
- [Google AI Studio](https://makersuite.google.com/)

Para questões sobre a plataforma:
- Abra uma issue no repositório do projeto

---

**Desenvolvido com ❤️ para ConversApp Academy**
