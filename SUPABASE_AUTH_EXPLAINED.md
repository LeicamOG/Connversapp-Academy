# 🔐 Como Funciona a Autenticação no Supabase

## Pergunta: "Como a plataforma sabe que a pessoa colocou a senha correta?"

Ótima pergunta! Vou explicar como funciona a autenticação no Supabase e por que você não vê as senhas armazenadas diretamente.

---

## 🔒 **Segurança de Senhas: Hash vs Texto Plano**

### ❌ **O que NÃO fazer** (Inseguro)
```
Tabela: users
| id | email           | password    |
|----|-----------------|-------------|
| 1  | user@email.com  | senha123    |  ← NUNCA faça isso!
```

### ✅ **O que o Supabase faz** (Seguro)
```
Tabela: auth.users (gerenciada pelo Supabase)
| id   | email           | encrypted_password                    |
|------|-----------------|---------------------------------------|
| uuid | user@email.com  | $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy |
```

---

## 🛡️ **Como Funciona o Processo de Autenticação**

### 1. **Cadastro (Sign Up)**

```typescript
// Quando o usuário se cadastra:
await AuthService.signUp(name, email, password);
```

**O que acontece nos bastidores:**

1. ✅ Supabase recebe a senha em texto plano (apenas durante o cadastro)
2. ✅ Supabase usa **bcrypt** para criar um **hash** da senha
3. ✅ O hash é armazenado na tabela `auth.users`
4. ✅ A senha original é **descartada** e nunca é armazenada

**Exemplo de Hash:**
```
Senha original: "minhaSenha123"
Hash armazenado: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

### 2. **Login (Sign In)**

```typescript
// Quando o usuário faz login:
await AuthService.signIn(email, password);
```

**O que acontece nos bastidores:**

1. ✅ Usuário envia email e senha
2. ✅ Supabase busca o usuário pelo email
3. ✅ Supabase pega a senha digitada e gera um hash temporário
4. ✅ Compara o hash temporário com o hash armazenado
5. ✅ Se os hashes coincidirem → **Login bem-sucedido** ✅
6. ❌ Se os hashes não coincidirem → **Senha incorreta** ❌

---

## 🔐 **Por que Usar Hash?**

### **Segurança em Caso de Vazamento de Dados**

Se alguém hackear o banco de dados e roubar os dados:

#### ❌ **Sem Hash (Inseguro)**
```
Hacker vê: "senha123"
Hacker usa: "senha123" para fazer login ← PROBLEMA!
```

#### ✅ **Com Hash (Seguro)**
```
Hacker vê: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
Hacker tenta usar: Não consegue reverter o hash para descobrir a senha original ✅
```

---

## 📊 **Estrutura do Supabase Auth**

### **Tabelas Principais**

```
auth.users (Gerenciada pelo Supabase - NÃO EDITE DIRETAMENTE)
├── id (UUID)
├── email
├── encrypted_password (Hash bcrypt)
├── email_confirmed_at
├── created_at
└── updated_at

public.profiles (Sua tabela customizada)
├── id (FK para auth.users.id)
├── name
├── avatar
├── role
└── bio
```

---

## 🔍 **Como Verificar se Está Funcionando**

### **1. No Supabase Dashboard**

1. Acesse: `https://supabase.com/dashboard`
2. Vá em **Authentication** → **Users**
3. Você verá os usuários cadastrados
4. A senha aparece como `••••••••` (oculta)

### **2. No SQL Editor**

```sql
-- Ver usuários cadastrados (SEM as senhas)
SELECT id, email, created_at, email_confirmed_at
FROM auth.users;

-- Ver perfis dos usuários
SELECT u.email, p.name, p.role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id;
```

---

## 🚀 **Fluxo Completo de Autenticação**

### **Cadastro**
```
1. Usuário preenche formulário
   ↓
2. App chama: AuthService.signUp(name, email, password)
   ↓
3. Supabase cria hash da senha
   ↓
4. Supabase salva em auth.users
   ↓
5. Supabase cria perfil em public.profiles
   ↓
6. Usuário recebe email de confirmação (opcional)
```

### **Login**
```
1. Usuário digita email e senha
   ↓
2. App chama: AuthService.signIn(email, password)
   ↓
3. Supabase busca usuário por email
   ↓
4. Supabase compara hash da senha digitada com hash armazenado
   ↓
5. Se coincidirem → Gera token JWT
   ↓
6. App armazena token no localStorage
   ↓
7. Usuário está autenticado ✅
```

---

## 🔑 **Tokens JWT (JSON Web Token)**

Após o login bem-sucedido, o Supabase gera um **token JWT**:

```typescript
// Token armazenado no localStorage
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRjcyk1h7...",
  "expires_in": 3600
}
```

**O token contém:**
- ID do usuário
- Email
- Role (função)
- Data de expiração

---

## 🛠️ **Como Funciona no Seu Código**

### **services/supabase.ts**

```typescript
export class AuthService {
  // Cadastro
  static async signUp(name: string, email: string, password: string) {
    // 1. Cria usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,  // ← Supabase faz o hash automaticamente
    });
    
    // 2. Cria perfil na tabela profiles
    await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      role: 'student'
    });
  }

  // Login
  static async signIn(email: string, password: string) {
    // Supabase compara o hash automaticamente
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,  // ← Supabase compara com o hash armazenado
    });
    
    return data.session;  // ← Retorna o token JWT
  }
}
```

---

## 🔐 **Resumo**

1. ✅ **Senhas NUNCA são armazenadas em texto plano**
2. ✅ **Supabase usa bcrypt para criar hashes seguros**
3. ✅ **Comparação de senhas é feita via comparação de hashes**
4. ✅ **Tokens JWT são usados para manter a sessão**
5. ✅ **Você NÃO precisa se preocupar com a segurança das senhas**

---

## 📚 **Recursos Adicionais**

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Como funciona bcrypt](https://en.wikipedia.org/wiki/Bcrypt)
- [JWT.io - Decodificador de Tokens](https://jwt.io/)

---

## ❓ **Perguntas Frequentes**

### **"Posso ver as senhas dos usuários?"**
❌ **Não.** Nem você, nem o Supabase conseguem ver as senhas originais. Isso é uma medida de segurança.

### **"Como resetar a senha de um usuário?"**
✅ Use a função `resetPassword(email)` que envia um email com link de redefinição.

### **"Posso mudar o algoritmo de hash?"**
❌ **Não.** O Supabase usa bcrypt por padrão e não permite mudanças (por segurança).

### **"Como funciona o 'Esqueci minha senha'?"**
✅ O Supabase envia um email com um token temporário que permite criar uma nova senha.

---

**Conclusão:** O Supabase cuida de toda a segurança de autenticação para você. Você só precisa chamar as funções corretas! 🎉
