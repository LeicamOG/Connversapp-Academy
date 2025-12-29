-- ADICIONA COLUNAS FALTANTES NA TABELA PROFILES
-- Execute este script no SQL Editor do Supabase para garantir que as colunas existam

-- Adicionar company_name
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN 
        ALTER TABLE public.profiles ADD COLUMN company_name text;
    END IF; 
END $$;

-- Adicionar display_name
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN 
        ALTER TABLE public.profiles ADD COLUMN display_name text;
    END IF; 
END $$;

-- Adicionar instagram
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'instagram') THEN 
        ALTER TABLE public.profiles ADD COLUMN instagram text;
    END IF; 
END $$;

-- Adicionar phone (se não existir)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN 
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF; 
END $$;

RAISE NOTICE 'Verificação de colunas concluída.';
