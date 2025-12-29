-- Criar tabelas para gerenciar webhooks

-- Tabela de assinaturas de webhook
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'user.created', 'course.created', 'lesson.completed', etc.
    secret TEXT NOT NULL, -- Para assinar as requisições
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de webhook
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed'
    response_code INTEGER,
    payload JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies (apenas admins podem gerenciar webhooks)
CREATE POLICY "Admins can manage webhook subscriptions" ON public.webhook_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_event_type ON public.webhook_subscriptions(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active ON public.webhook_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_subscription_id ON public.webhook_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- Função para limpar logs antigos (manter apenas últimos 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.webhook_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_subscriptions_updated_at
    BEFORE UPDATE ON public.webhook_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
