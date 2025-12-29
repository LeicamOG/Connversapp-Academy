-- Adiciona a coluna 'modules' do tipo JSONB na tabela 'courses'
-- Isso é crucial para salvar as aulas, módulos e estrutura do curso.
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS modules jsonb DEFAULT '[]'::jsonb;

-- Garante que a coluna tags também exista
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Atualiza cursos existentes para ter array vazio se for nulo
UPDATE public.courses SET modules = '[]'::jsonb WHERE modules IS NULL;
