# Meu Volante PRO

Aplicação web progressiva (PWA) autossuficiente para análise combinatória, telemetria estatística aeroespacial, gestão de carteira e rateio de bolões para Mega-Sena e Lotofácil.

## Identidade e configuração comercial

O nome comercial do produto é **Meu Volante PRO**. A interface usa uma linguagem de telemetria e engenharia de missão; o projeto não declara vínculo oficial com ou MIT. O código é distribuído sob a licença MIT disponível em `LICENSE`.

Antes de publicar a coleta de contatos, execute o arquivo `supabase/schema.sql` no SQL Editor do Supabase. Ele cria a tabela protegida `visitor_leads`, que recebe nome, e-mail, telefone e consentimento de comunicação. O aplicativo continua permitindo o teste gratuito, mas não deve enviar mensagens sem consentimento registrado.

Preencha `supportEmail` e `supportPhone` em `supabase/config.js` somente com os canais comerciais públicos. Chaves secretas e credenciais de gateway devem ficar nas variáveis de ambiente das Edge Functions.

## 🎯 Como Publicar Grátis no GitHub Pages (Sem Cloudflare)

1. Crie um novo repositório no seu GitHub (ex: `loterias-nasa-pro`).
2. Suba este arquivo `index.html` na branch principal (`main`).
3. No GitHub, acesse **Settings** ➔ **Pages**.
4. Em **Build and deployment** / **Branch**, selecione `main` e pasta `/ (root)`, depois clique em **Save**.
5. Em cerca de 1 minuto, o link estará no ar:
   `https://<seu-usuario>.github.io/loterias-nasa-pro/`

## 📲 Como Usar no Celular como App Nativo
- Abra o link gerado no Safari (iPhone) ou Chrome (Android).
- Toque em **Compartilhar / Opções** ➔ **Adicionar à Tela de Início**.
- O app abrirá em tela cheia com alta performance.
