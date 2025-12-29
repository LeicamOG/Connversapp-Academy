# 🔗 Sistema de Webhooks - ConversApp Academy

## 📋 Visão Geral

Este sistema permite:
1. **Receber webhooks** para criar usuários automaticamente
2. **Enviar webhooks** quando eventos acontecem na plataforma
3. **Gerenciar assinaturas** de webhooks

---

## 🚀 Configuração Inicial

### 1. Execute o SQL no Supabase

Execute o arquivo `supabase-webhooks-setup.sql` no SQL Editor do Supabase.

### 2. Configure as Edge Functions

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Link ao seu projeto
supabase link --project-ref sexgdfohmlrxmzvsxqct

# Deploy das functions
supabase functions deploy webhook-create-user
supabase functions deploy webhook-notify

# Configurar secrets
supabase secrets set WEBHOOK_SECRET=seu_secret_aqui_123456
```

---

## 📥 Webhook de Entrada: Criar Usuário

### Endpoint
```
POST https://sexgdfohmlrxmzvsxqct.supabase.co/functions/v1/webhook-create-user
```

### Headers
```
Content-Type: application/json
x-webhook-secret: seu_secret_aqui_123456
```

### Body
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "role": "STUDENT",
  "phone": "(11) 99999-9999",
  "companyName": "Empresa XYZ"
}
```

### Resposta de Sucesso (201)
```json
{
  "success": true,
  "user": {
    "id": "uuid-do-usuario",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "STUDENT"
  }
}
```

### Exemplo com cURL
```bash
curl -X POST \
  https://sexgdfohmlrxmzvsxqct.supabase.co/functions/v1/webhook-create-user \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: seu_secret_aqui_123456' \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "role": "STUDENT"
  }'
```

---

## 📤 Webhooks de Saída: Notificar Eventos

### Eventos Disponíveis

- `user.created` - Quando um usuário é criado
- `user.updated` - Quando um usuário atualiza o perfil
- `course.created` - Quando um curso é criado
- `course.updated` - Quando um curso é atualizado
- `lesson.completed` - Quando um aluno completa uma aula
- `course.completed` - Quando um aluno completa um curso

### Cadastrar uma Assinatura de Webhook

Execute no SQL Editor ou via API:

```sql
INSERT INTO public.webhook_subscriptions (name, url, event_type, secret)
VALUES (
  'Meu Sistema Externo',
  'https://seu-sistema.com/webhook',
  'user.created',
  'secret-compartilhado-123'
);
```

### Formato do Webhook Enviado

```json
{
  "event": "user.created",
  "data": {
    "id": "uuid-do-usuario",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "STUDENT",
    "createdAt": "2025-12-26T23:40:00Z"
  },
  "timestamp": "2025-12-26T23:40:00Z"
}
```

### Headers Enviados
```
Content-Type: application/json
X-Webhook-Event: user.created
X-Webhook-Signature: hash-hmac-sha256
```

### Verificar Assinatura (Segurança)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}

// Uso
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, 'secret-compartilhado-123');
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Processar webhook...
  res.json({ received: true });
});
```

---

## 🔧 Gerenciar Webhooks via Interface

Você pode criar uma interface de administração para gerenciar webhooks:

```typescript
// Listar assinaturas
const { data: webhooks } = await supabase
  .from('webhook_subscriptions')
  .select('*')
  .order('created_at', { ascending: false });

// Criar nova assinatura
const { data, error } = await supabase
  .from('webhook_subscriptions')
  .insert({
    name: 'Meu Webhook',
    url: 'https://example.com/webhook',
    event_type: 'user.created',
    secret: 'meu-secret-123',
    active: true
  });

// Desativar webhook
const { error } = await supabase
  .from('webhook_subscriptions')
  .update({ active: false })
  .eq('id', webhookId);

// Ver logs
const { data: logs } = await supabase
  .from('webhook_logs')
  .select('*, webhook_subscriptions(name, url)')
  .order('created_at', { ascending: false })
  .limit(100);
```

---

## 🧪 Testar Webhooks

### Usar webhook.site para testes
1. Acesse https://webhook.site
2. Copie a URL única gerada
3. Cadastre como webhook subscription
4. Teste criando um usuário
5. Veja a requisição chegar em tempo real

---

## 📊 Monitoramento

### Ver logs de webhooks
```sql
SELECT 
  wl.*,
  ws.name as webhook_name,
  ws.url as webhook_url
FROM webhook_logs wl
JOIN webhook_subscriptions ws ON wl.subscription_id = ws.id
ORDER BY wl.created_at DESC
LIMIT 100;
```

### Estatísticas
```sql
SELECT 
  event_type,
  status,
  COUNT(*) as total,
  AVG(response_code) as avg_response_code
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type, status;
```

---

## 🔒 Segurança

1. **Sempre use HTTPS** para URLs de webhook
2. **Valide a assinatura** em todos os webhooks recebidos
3. **Use secrets fortes** (mínimo 32 caracteres)
4. **Limite rate** de requisições se necessário
5. **Monitore logs** para detectar falhas

---

## 🆘 Troubleshooting

### Webhook não está sendo enviado
- Verifique se a assinatura está `active: true`
- Verifique os logs em `webhook_logs`
- Teste a URL manualmente com cURL

### Erro 401 Unauthorized
- Verifique se o `x-webhook-secret` está correto
- Confirme que o secret está configurado nas Edge Functions

### Timeout
- Webhooks têm timeout de 10 segundos
- Se o endpoint externo demora muito, considere usar fila

---

## 📝 Próximos Passos

1. Execute `supabase-webhooks-setup.sql`
2. Deploy das Edge Functions
3. Configure o WEBHOOK_SECRET
4. Teste com webhook.site
5. Integre com seus sistemas externos
