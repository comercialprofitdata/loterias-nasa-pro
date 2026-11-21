# Ficha da Google Play: LotoLab: Gerador e Loterias

## Textos (ASO Otimizado)
**Nome do app (até 30):** LotoLab: Gerador e Loterias

**Descrição curta (até 80):** Gerador, conferência e bolão para Mega-Sena e Lotofácil com dados oficiais.

**Descrição completa:**

O LotoLab é o seu gerador de jogos, conferidor de resultados oficiais e organizador de bolões para Mega-Sena e Lotofácil em um só lugar, com contas exatas e histórico de 500 concursos.

Seja para montar seu volante de Mega-Sena, conferir sua aposta da Lotofácil na hora ou organizar um bolão com amigos sem precisar de planilha, o LotoLab reúne tudo em uma interface rápida e fácil de usar.

O QUE VOCÊ PODE FAZER NO LOTOLAB
• Gerador de Mega-Sena e Lotofácil: gere combinações aleatórias, escolha suas dezenas fixas ou proibidas e visualize tudo no volante tradicional.
• Conferir resultados oficiais: salve seus jogos na carteira e confira os acertos de cada concurso em tempo real com os sorteios oficiais.
• Organizar Bolão em grupo: controle jogos, cotas, valor por participante e quem já pagou, com resumo pronto para enviar no WhatsApp. O app não recebe nem movimenta dinheiro.
• Mega da Virada: separe seus palpites da Mega da Virada dos concursos regulares.
• Controle de gastos: defina um limite mensal e acompanhe quanto você já registrou em jogos no mês e no ano.
• Probabilidade e custo exatos: veja a chance real e o valor oficial antes de registrar sua aposta.
• Estatísticas de 500 concursos: consulte frequência, pares/ímpares, soma, moldura/miolo e simulador retrospectivo ("e se eu tivesse jogado?").
• Exportar para PDF e WhatsApp: imprima espelhos de volante em A4 ou compartilhe seus jogos com um toque.

ANTES DE USAR (TRANSPARÊNCIA E COMPLIANCE)
Todas as combinações têm exatamente a mesma chance matemática de sorteio. O app não prevê resultados, não aumenta suas chances e não garante prêmios.

Fonte dos resultados: Loterias CAIXA (loterias.caixa.gov.br). Mega-Sena e Lotofácil são loterias da Caixa Econômica Federal, sem vínculo com este app.

Este app é independente, sem vínculo com a Caixa Econômica Federal ou órgão público. Ele não vende nem registra apostas. Confirme resultados e prêmios nos canais oficiais da Caixa.

Uso exclusivo para maiores de 18 anos. Jogue com responsabilidade e só com um valor que não fará falta.

## Tags da Google Play (até 5)
No Google Play Console (*Crescer > Presença na loja > Configurações da loja > Gerenciar tags*), selecionar até 5 tags compatíveis com a categoria Ferramentas/Produtividade:
1. `Ferramentas`
2. `Produtividade`
3. `Utilitários`
4. `Finanças pessoais` (ou `Organização` / `Estatísticas`, conforme opções disponíveis no Console)
5. `Loterias` *(se disponível na lista oficial; nunca usar tags de Cassino/Jogos de Azar)*

## Repaginação Visual Recomendada (Para aumentar cliques na busca)
1. **Ícone (512x512):** Trocar o grid abstrato atual por um **trevo de 4 folhas estilizado + volante/números** mantendo a paleta escura (`#0B1220`) e verde esmeralda (`#10B981`), para comunicar "loteria" em 0,3 segundo nos resultados de busca.
2. **Screenshots com Título Grande no Topo:** Em vez de prints crus da tela escura, adicionar uma faixa superior com texto grande e legível em cada uma das 6 capturas:
   - Captura 1: **GERADOR DE MEGA E LOTOFÁCIL**
   - Captura 2: **CONFIRA RESULTADOS NA HORA**
   - Captura 3: **ORGANIZE SEU BOLÃO NO WHATSAPP**
   - Captura 4: **CONTROLE SEUS GASTOS MENSAIS**
   - Captura 5: **ESTATÍSTICAS DE 500 SORTEIOS**
   - Captura 6: **CALCULE A CHANCE REAL DO JOGO**

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
