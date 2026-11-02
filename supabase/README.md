# Backend seguro

O aplicativo usa Supabase para autenticacao, perfis, assinaturas e auditoria.

## Configuracao inicial

1. Crie um projeto no Supabase.
2. Execute `schema.sql` no SQL Editor.
3. Crie sua conta em Authentication > Users.
4. Promova somente sua conta para `owner` no SQL Editor usando o UUID da conta.
5. Preencha `config.js` com a URL e a anon key publica do projeto.
6. Configure OAuth Google no painel do Supabase, se esse login for necessario.

A `service_role key` nunca deve ser colocada em `index.html`, `config.js`, GitHub Pages ou qualquer arquivo enviado ao navegador.

## Cupons VIP pelo aplicativo

Para habilitar a criação de códigos personalizados no painel do dono, execute `RODAR-CUPOM-PERSONALIZADO.sql` uma vez no SQL Editor. Depois dessa instalação inicial, crie, compartilhe, desative e reative os cupons pelo painel do aplicativo; não é necessário inserir cada novo cupom manualmente no Supabase.

## Edge Functions

As funcoes em `functions/` devem ser publicadas pelo Supabase CLI ou pelo fluxo de deploy do projeto:

- `admin-action`: exige um Bearer token valido e confirma `profiles.role = owner` antes de alterar assinaturas.
- `payment-webhook`: exige `x-webhook-signature` HMAC-SHA256 e atualiza assinaturas por evento idempotente.

Configure no ambiente das Edge Functions, nunca no repositorio:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PAYMENT_WEBHOOK_SECRET
```

O webhook ainda precisa de um adaptador específico para Asaas, Mercado Pago ou Stripe. O formato atual e deliberadamente genérico e não deve ser publicado na URL do gateway antes de mapear os eventos oficiais do provedor escolhido.

## Limite atual

A interface continua com algumas telas demonstrativas locais. Elas não são fonte de verdade para usuários, planos ou pagamentos. A próxima integração do front-end deve chamar as Edge Functions e consultar `subscriptions`; não deve voltar a gravar permissões no `localStorage`.
