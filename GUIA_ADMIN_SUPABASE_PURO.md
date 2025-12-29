# 🔐 Guia de Segurança: Autenticação Exclusiva via Supabase

## ✅ Mudança de Segurança Aplicada
Atendendo à sua solicitação, **removi completamente qualquer fallback de autenticação local**.

Isso significa:
1. **Zero tolerância com falhas:** Se o Supabase estiver fora do ar, ninguém entra. (Isso é bom para segurança).
2. **Validação Real:** Todas as senhas são testadas contra os hashes bcrypt nos servidores do Google/Supabase.
3. **Sem portas dos fundos:** Não existe mais código que permita criar admins locais ou logar "por fora".

---

## 🚀 Como Criar seu Usuário Admin Agora

Como o código local foi removido, você **NÃO** pode mais criar usuários "fake" no navegador. Você deve criar usuários REAIS no Supabase.

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto.
3. Vá em **Authentication** > **Users**.
4. Clique em **Add User**.
5. Insira:
   - Email: `maciel.eduardof@gmail.com`
   - Senha: (Sua senha forte)
   - Marque "Auto Confirm User?"

6. Vá em **Table Editor** > tabela `profiles`.
7. Insira uma nova linha:
   - `id`: (Copie o UUID do usuário criado no passo anterior)
   - `email`: `maciel.eduardof@gmail.com`
   - `role`: `ADMIN`
   - `name`: `Eduardo Maciel`

### Opção 2: Via SQL Editor (Rápido)

Rode este script no SQL Editor do Supabase:

```sql
-- 1. Cria o usuário na tabela de autenticação (auth.users)
-- ATENÇÃO: Você não pode inserir senha crua aqui facilmente.
-- O melhor é criar o usuário pelo menu "Authentication" e depois rodar isso:

-- (Assumindo que você já criou o usuário no menu Auth e tem o ID dele)
INSERT INTO public.profiles (id, name, email, role, avatar)
VALUES (
  'COLE_O_UUID_AQUI', 
  'Eduardo Maciel', 
  'maciel.eduardof@gmail.com', 
  'ADMIN', 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
);
```

---

## 🧹 Limpeza de Resíduos

Recomendo limpar o `localStorage` do seu navegador para evitar confusão com dados antigos cacheados.

1. No App, aperte `F12`.
2. Vá em `Application` > `Local Storage`.
3. Apague `local_users_db` e `local_user`.
4. Recarregue a página (`F5`).

Agora, ao tentar fazer login, o sistema vai bater **exclusivamente** no Supabase.
Se a senha estiver errada lá, não entra. Ponto final. 🔒
