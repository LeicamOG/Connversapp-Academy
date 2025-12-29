-- ATUALIZAR SENHA DO ADMIN NO SUPABASE
-- Execute este script no SQL Editor do Supabase Dashboard
-- Isso vai forçar a senha 'adminzeira' para o usuário maciel.eduardof@gmail.com

-- ATENÇÃO: A atualização direta de senha na tabela `auth.users` exige criptografia.
-- Como não temos acesso ao algoritmo de hash do Supabase (GoTrue) diretamente via SQL simples sem extensões,
-- a forma correta via SQL é usar a função de atualização de usuário se disponível, ou,
-- MAIS SEGURO: Apenas delete o usuário da tabela `auth.users` e crie novamente pelo painel com a senha certa.

-- POREM, SE VOCÊ QUISER TENTAR CRIAR VIA SQL (Se não existir):

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Verifica se o usuário já existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'maciel.eduardof@gmail.com') THEN
    
    -- Insere novo usuário na auth.users (Senha é criptografada automaticamente pelo Supabase API, mas via SQL cru é complexo)
    -- RECOMENDAÇÃO: Use o painel para criar o usuário com a senha 'adminzeira'.
    
    RAISE NOTICE 'Usuário não existe. Crie-o pelo painel Authentication > Users com a senha adminzeira';
    
  ELSE
    -- Se usuário existe, não podemos resetar a senha facilmente via SQL puro sem saber o hash.
    RAISE NOTICE 'Usuário já existe. Para alterar a senha para adminzeira: Vá em Authentication > Users > Procure o email > Clique nos 3 pontinhos > Send Password Recovery ou Delete e crie de novo.';
  END IF;
  
  -- Garante que o perfil existe em public.profiles
  INSERT INTO public.profiles (id, name, email, role, avatar)
  SELECT 
    id, 
    'Eduardo Maciel', 
    'maciel.eduardof@gmail.com', 
    'ADMIN', 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
  FROM auth.users WHERE email = 'maciel.eduardof@gmail.com'
  ON CONFLICT (id) DO UPDATE
  SET role = 'ADMIN';
  
END $$;
