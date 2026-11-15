# Ficha da Google Play: Meu Volante PRO

## Textos
**Nome do app (até 30):** Meu Volante PRO

**Descrição curta (até 80):** Organize seus jogos, confira resultados e controle quanto você gasta.

**Descrição completa:**

Organize seus jogos de Mega-Sena e Lotofácil em um só lugar, com resultados oficiais e contas exatas.

O QUE VOCÊ PODE FAZER
• Salvar jogos e ver o resultado de cada um.
• Definir um limite mensal e acompanhar quanto registrou em jogos.
• Ver a chance exata e o custo de cada jogo antes de decidir.
• Gerar uma combinação aleatória ou escolher suas dezenas.
• Organizar um bolão: jogos, cotas e quem já pagou, com resumo pronto para o grupo. O app não recebe nem movimenta dinheiro.
• Separar os palpites da Mega da Virada dos concursos normais.
• Consultar estatísticas dos últimos 500 concursos.

ANTES DE USAR
Todas as combinações têm a mesma chance. O app não prevê resultados, não aumenta suas chances e não garante prêmios.

Fonte dos resultados: Loterias CAIXA (loterias.caixa.gov.br). Mega-Sena e Lotofácil são loterias da Caixa Econômica Federal, sem vínculo com este app.

Este app é independente, sem vínculo com a Caixa Econômica Federal ou órgão público. Ele não vende nem registra apostas. Confirme resultados e prêmios nos canais oficiais da Caixa.

Uso exclusivo para maiores de 18 anos. Jogue com responsabilidade e só com um valor que não fará falta.

## Links
- **Política de privacidade:** https://loterias.pd.dev.br/privacidade.html
- **Exclusão de conta:** https://loterias.pd.dev.br/excluir-conta.html
- **E-mail de suporte:** comercial.profitdata@gmail.com

## Imagens
Pasta `marketing/play/`: ícone de 512 px, destaque de 1024 x 500 e 6 capturas de celular (1082 x 1922), refeitas em 15/11/2026 como no app da loja: Gerar, Início, resultado, Carteira, estatísticas e bolão.

## Rascunho das declarações (confirmar no Console)
- **Categoria:** Ferramentas ou Produtividade, sem usar "Jogos".
- **Anúncios:** não contém.
- **Público-alvo:** somente 18 anos ou mais, com "Restringir acesso de menores" ativado.
- **Apps do governo:** não.
- **Jogos de azar com dinheiro real:** não aceita apostas nem pagamentos de aposta. O advogado precisa validar antes do envio.

**Segurança dos dados, conforme o código atual:**

| Dado | Coleta | Finalidade | Obrigatório |
|---|---|---|---|
| Nome | Sim | Conta | Sim |
| IDs de usuário (identificador da conta) | Sim | Conta, sincronização dos jogos | Sim |
| E-mail | Sim | Conta, contato | Sim |
| Celular | Sim | Conta, contato | Sim |
| Interações no app e identificador aleatório do aparelho | Sim | Análise, correção de falhas | Sim |
| Registros de falhas e diagnóstico (mensagem de erro, tipo de aparelho) | Sim | Correção de falhas | Sim |
| Jogos salvos | No aparelho; na nuvem só se entrar em uma conta | Função do app | Não |

Dados em trânsito usam HTTPS. O usuário pode pedir a exclusão pela página acima, mas o fluxo completo ainda precisa de teste e das tabelas no banco.

## Acesso para a análise da Google
O cadastro pede nome, e-mail, celular e senha, e pode exigir a confirmação do e-mail. O revisor não consegue confirmar um e-mail, então é preciso **criar antes uma conta de teste já confirmada** e informar no Console (Conteúdo do app > Acesso ao app):

- E-mail: (conta de teste criada pelo dono)
- Senha: (senha dessa conta)
- Instrução: "Na primeira tela, confirme ter 18 anos ou mais. Toque em Entrar e use o e-mail e a senha acima. Todos os recursos ficam liberados no app da loja; o app não vende nada dentro dele."

No app aberto pela loja não há preços, planos nem link de pagamento (modo loja em `js/contexto-loja.js`).
