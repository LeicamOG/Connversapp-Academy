-- Adicionar coluna para armazenar módulos e aulas como JSON
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;

-- Verificar a estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses';
