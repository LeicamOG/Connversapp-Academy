# 🎨 Design System - ConversApp Academy

## Premium Dark Mode com Verde Neon

Este documento descreve o design system completo da plataforma ConversApp Academy, inspirado no WhatsApp com uma estética premium dark mode.

---

## 📋 Índice

- [Paleta de Cores](#paleta-de-cores)
- [Tipografia](#tipografia)
- [Componentes](#componentes)
- [Efeitos e Texturas](#efeitos-e-texturas)
- [Animações](#animações)
- [Guia de Uso](#guia-de-uso)

---

## 🎨 Paleta de Cores

### Cores Principais

```css
--neon-green: #25D366        /* Verde Neon WhatsApp - Cor de destaque */
--neon-glow: rgba(37, 211, 102, 0.1)   /* Glow suave */
--neon-border: rgba(37, 211, 102, 0.2) /* Bordas com neon */
```

### Backgrounds

```css
--bg-main: #050505           /* Fundo principal (quase preto) */
--bg-card: #0A0A0A           /* Cards e painéis */
--bg-surface: #0F0F0F        /* Surface highlight */
--bg-hover: #111111          /* Estado hover */
--bg-highlight: #151515      /* Destaque adicional */
```

### Bordas

```css
--border-subtle: rgba(255, 255, 255, 0.1)   /* Bordas sutis */
--border-medium: rgba(255, 255, 255, 0.15)  /* Bordas médias */
--border-strong: rgba(255, 255, 255, 0.2)   /* Bordas fortes */
```

### Textos

```css
--text-primary: #FFFFFF      /* Texto principal (branco puro) */
--text-secondary: #A3A3A3    /* Texto secundário (cinza médio) */
--text-tertiary: #737373     /* Texto terciário (cinza escuro) */
--text-muted: #525252        /* Texto muito sutil */
```

---

## ✍️ Tipografia

### Fonte Principal - Inter

**Uso:** Títulos, parágrafos, botões, navegação

**Pesos disponíveis:**
- `300` - Light
- `400` - Regular
- `600` - Semi-Bold
- `700` - Bold

**Exemplo:**
```html
<h1 class="font-sans font-bold text-2xl">Título Principal</h1>
<p class="font-sans font-normal text-base">Parágrafo normal</p>
```

### Fonte Secundária - JetBrains Mono

**Uso:** Tags, números, labels técnicos, código

**Características:**
- Sempre em **UPPERCASE**
- **Letter-spacing** alargado (`tracking-widest`)
- Tamanho pequeno (`text-xs`)

**Exemplo:**
```html
<span class="tech-label">STATUS: ATIVO</span>
<div class="tech-badge">NOVO</div>
```

---

## 🧩 Componentes

### 1. Cards Premium

**Classe:** `.premium-card`

```html
<div class="premium-card p-6">
  <h3 class="text-lg font-bold mb-2">Título do Card</h3>
  <p class="text-neutral-400">Descrição do conteúdo</p>
</div>
```

**Características:**
- Background: `#0A0A0A`
- Borda: `1px solid rgba(255,255,255,0.1)`
- Border-radius: `1.5rem`
- Hover: Sobe 4px + borda neon + glow

---

### 2. Botões

#### Botão Primário (Neon)

**Classe:** `.btn-neon-primary`

```html
<button class="btn-neon-primary">
  Ação Principal
</button>
```

**Características:**
- Background: Verde Neon `#25D366`
- Texto: Preto `#000000`
- Font-weight: `700` (Bold)
- Hover: Glow verde + sobe 2px

#### Botão Outline

**Classe:** `.btn-outline`

```html
<button class="btn-outline">
  Ação Secundária
</button>
```

**Características:**
- Background: Transparente
- Borda: `rgba(255,255,255,0.15)`
- Hover: Borda verde + texto verde + background neon-glow

---

### 3. Badges e Tags

**Classe:** `.tech-badge`

```html
<span class="tech-badge">NOVO</span>
<span class="tech-badge">AO VIVO</span>
```

**Características:**
- Font: JetBrains Mono
- Background: `rgba(37,211,102,0.1)`
- Texto: Verde Neon
- Borda: `rgba(37,211,102,0.2)`
- Uppercase + letter-spacing

---

### 4. Inputs

**Classe:** `.input-premium`

```html
<input 
  type="text" 
  class="input-premium" 
  placeholder="Digite aqui..."
/>
```

**Características:**
- Background: `#0F0F0F`
- Borda: `rgba(255,255,255,0.1)`
- Focus: Borda verde + glow suave

---

### 5. Course Cards

**Classe:** `.course-card`

```html
<div class="course-card">
  <img src="..." class="course-card-image" />
  <div class="p-4">
    <h3 class="font-bold text-white">Nome do Curso</h3>
    <p class="text-neutral-400 text-sm">Descrição</p>
  </div>
</div>
```

**Hover Effect:**
- Sobe 6px
- Borda neon
- Shadow com glow verde

---

### 6. Glassmorphism

**Classes:** `.glass-panel` e `.glass-strong`

```html
<!-- Panel suave -->
<div class="glass-panel p-6">
  Conteúdo com efeito de vidro
</div>

<!-- Panel forte (modais, headers) -->
<header class="glass-strong p-4">
  Header fixo com blur
</header>
```

---

## ✨ Efeitos e Texturas

### 1. Glow Orbs (Luzes Ambientais)

Círculos de luz desfocados no background para dar profundidade.

**Já incluído no HTML:**
```html
<div class="glow-orb glow-orb-1"></div>
<div class="glow-orb glow-orb-2"></div>
```

**Customização:**
```css
.glow-orb-custom {
  position: fixed;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 211, 102, 0.08) 0%, transparent 70%);
  filter: blur(80px);
  top: 50%;
  left: 50%;
}
```

---

### 2. Grid Pattern

Padrão de grade técnica no background.

**Já incluído no body::before do HTML**

---

### 3. Noise Texture

Textura de ruído para evitar aspecto "plástico".

**Já incluído no body::after do HTML**

**Opacidade:** 3% (muito sutil)

---

### 4. Neon Glow

Adicionar brilho verde em elementos.

**Classes:**
- `.glow-neon` - Glow padrão
- `.glow-neon-lg` - Glow grande

```html
<div class="premium-card glow-neon">
  Card com brilho verde
</div>
```

---

## 🎬 Animações

### 1. Slide Up + Fade In

**Classe:** `.animate-slide-up`

```html
<div class="animate-slide-up">
  Elemento que entra de baixo para cima
</div>
```

---

### 2. Fade In

**Classe:** `.animate-fade-in`

```html
<div class="animate-fade-in">
  Elemento que aparece suavemente
</div>
```

---

### 3. Pulse (Status)

**Classe:** `.status-live`

```html
<div class="status-live">
  <span class="tech-label">AO VIVO</span>
</div>
```

**Efeito:** Ponto verde pulsante antes do texto

---

### 4. Skeleton Loading

**Classe:** `.skeleton`

```html
<div class="skeleton h-20 w-full"></div>
```

**Efeito:** Gradiente animado simulando carregamento

---

## 📖 Guia de Uso

### Criando um Card de Curso

```html
<div class="course-card">
  <img 
    src="thumbnail.jpg" 
    alt="Curso" 
    class="course-card-image"
  />
  <div class="p-6">
    <div class="flex items-center gap-2 mb-3">
      <span class="tech-badge">NOVO</span>
      <span class="tech-label">12 AULAS</span>
    </div>
    <h3 class="font-bold text-lg text-white mb-2">
      JavaScript Avançado
    </h3>
    <p class="text-neutral-400 text-sm mb-4">
      Aprenda conceitos avançados de JavaScript
    </p>
    <button class="btn-neon-primary w-full">
      Começar Agora
    </button>
  </div>
</div>
```

---

### Criando um Modal

```html
<!-- Overlay -->
<div class="modal-overlay">
  <!-- Content -->
  <div class="modal-content p-8 max-w-2xl mx-auto mt-20">
    <h2 class="text-2xl font-bold mb-4">Título do Modal</h2>
    <p class="text-neutral-400 mb-6">Conteúdo do modal</p>
    
    <div class="flex gap-3 justify-end">
      <button class="btn-outline">Cancelar</button>
      <button class="btn-neon-primary">Confirmar</button>
    </div>
  </div>
</div>
```

---

### Criando uma Lista de Aulas

```html
<div class="space-y-3">
  <div class="lesson-item">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-neon-glow flex items-center justify-center">
          <span class="text-neon font-mono font-bold">01</span>
        </div>
        <div>
          <h4 class="font-semibold text-white">Introdução ao JavaScript</h4>
          <span class="tech-label">15 MIN</span>
        </div>
      </div>
      <svg class="w-5 h-5 text-neutral-500">...</svg>
    </div>
  </div>
  
  <div class="lesson-item completed">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-neon flex items-center justify-center">
          <svg class="w-5 h-5 text-black">✓</svg>
        </div>
        <div>
          <h4 class="font-semibold text-white">Variáveis e Tipos</h4>
          <span class="tech-label">CONCLUÍDA</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### Criando um Header com Glass

```html
<header class="glass-strong sticky top-0 z-50 px-8 py-4">
  <div class="flex items-center justify-between">
    <img src="logo.png" alt="Logo" class="h-8" />
    
    <nav class="flex items-center gap-6">
      <a href="#" class="text-neutral-400 hover:text-neon transition-colors">
        Início
      </a>
      <a href="#" class="text-neutral-400 hover:text-neon transition-colors">
        Cursos
      </a>
      <button class="btn-neon-primary">
        Entrar
      </button>
    </nav>
  </div>
</header>
```

---

## 🎯 Boas Práticas

### ✅ DO (Faça)

- Use o verde neon **apenas** para destaques e ações principais
- Mantenha espaçamento generoso (padding/margin de 1.5rem ou mais)
- Use JetBrains Mono para dados técnicos e labels
- Adicione transições suaves em todos os elementos interativos
- Use glassmorphism em overlays e elementos flutuantes
- Combine animações para criar experiências fluidas

### ❌ DON'T (Não Faça)

- Não use verde neon em excesso (perde o impacto)
- Não use preto absoluto (#000000) - sempre use #050505
- Não crie bordas muito grossas (máximo 2px)
- Não use animações muito rápidas (mínimo 300ms)
- Não misture muitas cores - mantenha monocromático + verde

---

## 🔧 Variáveis CSS Disponíveis

```css
/* Copie e use em seus componentes */
var(--neon-green)
var(--neon-glow)
var(--neon-border)
var(--bg-main)
var(--bg-card)
var(--bg-surface)
var(--bg-hover)
var(--border-subtle)
var(--border-medium)
var(--text-primary)
var(--text-secondary)
var(--text-tertiary)
```

---

## 📱 Responsividade

O design system é totalmente responsivo. Em telas menores:

- Cards usam `border-radius: 1rem` (ao invés de 1.5rem)
- Espaçamentos são reduzidos proporcionalmente
- Fontes mantêm legibilidade
- Glow orbs são redimensionados

---

## 🎨 Exemplos Visuais

### Hierarquia de Cores

```
Destaque Principal:  #25D366 (Verde Neon)
Background:          #050505 → #0A0A0A → #0F0F0F
Texto:               #FFFFFF → #A3A3A3 → #737373
```

### Hierarquia Tipográfica

```
Título H1:    font-bold text-3xl
Título H2:    font-bold text-2xl
Título H3:    font-semibold text-lg
Corpo:        font-normal text-base
Label:        font-mono text-xs uppercase
```

---

**🎉 Design System criado para ConversApp Academy**

*Desenvolvido com foco em premium experience e usabilidade*
