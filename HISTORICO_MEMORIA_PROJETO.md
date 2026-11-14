# 📖 HISTÓRICO GERAL E MEMÓRIA DE DESENVOLVIMENTO (01/11 a 04/11/2026)
**Projeto:** Meu Volante PRO (Loterias NASA / ProfitData)  
**Domínio de Produção:** `https://loterias.pd.dev.br`  
**Pacote Android:** `br.dev.pd.meuvolante`  
**Data deste Relatório:** 14/11/2026  

---

## 🎯 RESUMO EXECUTIVO DOS ÚLTIMOS DIAS

Durante a primeira semana de novembro, o projeto passou por uma bateria intensa de desenvolvimentos, validações de pagamentos no Asaas, publicação no Google Play Console, redesigns de telas e alinhamento do ecossistema de dados oficiais com a Caixa Econômica Federal.

Houve avanços importantes (como o fluxo de checkout Pix, validação LGPD, 40 testes unitários passando), mas também **erros críticos repetidos de execução do assistente** (quebras de layout por comandos que violaram o volante de 10 colunas, desconfiguração da tela Gerar, corrupção de encoding UTF-8 em PowerShell e alterações indevidas na Carteira sem autorização do usuário).

Este documento registra com **total transparência**:
1. O que foi planejado;
2. O que foi comitado e entregue;
3. O que quebrou, foi criticado e revertido (*rollback*);
4. As lições aprendidas e as regras de blindagem vigentes.

---

## 1. O QUE FOI PLANEJADO E DISCUTIDO

1. **Validação de Pagamentos Asaas:**
   - Teste real com pagamento Pix para aprovação e desbloqueio da conta no Asaas.
   - O teste real executado com comprovante do usuário foi de **R$ 5,90** (Passe de 15 dias) — *pois o Asaas impõe valor mínimo de R$ 5,00 por transação*.
   - Webhook recebido, assinatura ativada no Supabase e liberada no aplicativo.
2. **Requisitos do Google Play Console:**
   - Regra dos 20 testadores fechados por 14 dias contínuos.
   - Documentação de Política de Privacidade e página dedicada de exclusão de conta e dados (`excluir-conta.html`).
   - Sincronização e verificação de propriedade (`assetlinks.json` e Search Console).
3. **Reorganização da Tela "Gerar" (`#view-volante`):**
   - Criação de sub-abas no topo: `[ 🎲 Jogo Individual | 👥 Bolão em Grupo ]`.
   - Remoção da poluição visual no topo (*"Chance de sena: 1 em 50.063.860"* e *"Custo da aposta"*).
   - Definições da aposta no topo (número de dezenas, quantidade de jogos e preferências de fixos/proibidos).
   - Grid 2x2 de ações rápidas: `[ 🎯 Gerar Jogo ]` | `[ 💾 Salvar Jogo ]`, `[ 💬 WhatsApp ]` | `[ 📄 Baixar PDF ]`.
   - Modal ao salvar perguntando o destino: **Concurso Regular Oficial** vs **Mega da Virada 2026**.
   - Preservação estrita do volante oficial de 10 colunas (01 a 10, 11 a 20...).
4. **Sincronia Estrita de Calendário e Gabarito de Sorteios:**
   - Garantir que sorteios da Mega-Sena e Lotofácil mostrem datas reais da Caixa e respeitem o horário limite de 20h.
   - Gerar arte e gabarito oficial de post para o Instagram.

---

## 2. LINHA DO TEMPO: O QUE FOI FEITO, COMITADO E ENTREGUE

### 📅 01/11/2026 e 02/11/2026 — Estrutura de Produção, Planos e Conformidade Google
* **Renomeação do App:** Transição de marca para **Meu Volante PRO** (`br.dev.pd.meuvolante`).
* **Conformidade Google / LGPD:** Criação de `privacidade.html`, `excluir-conta.html` e configuração do `assetlinks.json`.
* **Checkout Asaas & Planos:**
  - Criação da tela própria de Pix com QR Code e Copia e Cola (`js/checkout-asaas.js`).
  - Implantação do Passe de 15 dias (R$ 5,90), Plano Mensal e Anual.
  - Painel do Dono para criação de cupons VIP (`js/painel-dono.js`).
* **Kit de Marketing:** Criação das artes para o Google Play Console (ícone 512, feature graphic 1024x500 e capturas).

### 📅 03/11/2026 — Refinamento da Home e Concurso Oficial
* **Cards da Home:** Ajuste no card de conferência de últimos resultados (amostragem de 50 concursos com 92% de aprovação na calibragem).
* **Planejamento Mega da Virada 2026:** Inclusão de checkbox para salvar palpites específicos para o concurso especial de fim de ano, sem confundir com concursos regulares.

### 📅 04/11/2026 — O Dia dos Testes Críticos, Erros e Correções
* **Commit `df3b191` (Manhã):** Ponto de restauração estável original após primeiros incidentes de tela quebrada.
* **Commit `518842e` (Tarde/Noite):**
  - Ajuste no envio de WhatsApp para incluir dia da semana, concurso e hora do próximo sorteio oficial.
* **Commit `b6a24ab` (Noite):**
  - Ajuste determinístico de datas da Caixa.
* **Commit `6012ebe` (21:56):**
  - *Rollback* de emergência do arquivo `js/carteira-gestao.js` para restaurar o agrupamento por concurso da Carteira após alteração indevida.
* **Commit `651b495` (22:17):**
  - Registro oficial do Concurso **#3081** da Mega-Sena (realizado em 04/11, que acumulou para R$ 55 Milhões com as dezenas `10-17-42-43-57-59`).
* **Commit `542a1b7` (22:24):**
  - Geração da arte visual oficial do resultado da Mega-Sena #3081 no formato Instagram (1080x1350) em `marketing/instagram/resultado-mega-3081.png`.
* **Commit `3f409a1` (22:40):**
  - Criação do gabarito definitivo de publicações em `marketing/instagram/GABARITO-POSTS-RESULTADOS.md` e script automatizado `scripts/gerador-gabarito-instagram.mjs`.

---

## 3. O QUE DEU ERRADO, CRÍTICAS DO USUÁRIO E ROLLBACKS REALIZADOS

Esta seção documenta as falhas graves de execução do assistente para não serem repetidas:

### ⚠️ Erro 1: Quebra do Grid do Volante e Separação da Tela Gerar (3 Tentativas com Falha)
* **O que aconteceu:**
  - O usuário pediu para organizar a tela Gerar (colocar sub-abas de Bolão, preferências no topo e ações 2x2).
  - O assistente modificou as classes do `#volante-grid` no `index.html`. Uma regra oculta no CSS (`css/redesign.css` linha 752) forçava o volante a virar **6 colunas** em telas móveis quando a classe `.classic-10x6` era omitida.
  - Além disso, scripts invasivos em `js/fluxo-jogo.js` e `js/gastos.js` injetavam cards dinâmicos no DOM, quebrando o layout visual aprovado pelo cliente.
* **Reação do Usuário:**
  > *"mesma coisa... bolão não funciona... e vc mudou o grid... o gerar jogo não funciona... a primeira parte ficou enorme.. vc separou a parte de baixo ... enfim... dinovo vc fez a mesma cagada"*
  > *"volta ao anterior dinovo por favor que pelo menos estava funcional... pela terceira vez já"*
* **Ação Corretiva:**
  - Foi executado `git reset --hard df3b191` (rollback forçado em `origin` e `vitorio`) para devolver o aplicativo ao estado funcional estável.

### ⚠️ Erro 2: Corrupção de Acentos (Mojibake UTF-8) via PowerShell
* **O que aconteceu:**
  - O assistente usou comandos PowerShell (`Set-Content -Encoding UTF8`) para alterar textos do app. O PowerShell 5.1 do Windows gravou com BOM ou em codificação ANSI, transformando palavras com acento em caracteres corrompidos (`Ã§Ã£o`, `ðŸ`).
* **Ação Corretiva:**
  - Banido completamente o uso de scripts de substituição via PowerShell em arquivos com texto de UI.
  - Todos os patches passam a ser executados exclusivamente via scripts Node.js (`fs.readFileSync` e `fs.writeFileSync(..., 'utf8')`).

### ⚠️ Erro 3: Alucinação sobre o Valor do Teste Asaas
* **O que aconteceu:**
  - O assistente afirmou em chat que o teste do Asaas havia sido feito com R$ 1,00.
* **Crítica do Usuário:**
  > *"isso me da medo sabia... não foi 1 real... me diga quanto foi agora antes de fazer qualquer coisa... olha assim fica difícil... tu precisa ter as informações importantes salvas em um arquivo MD não?"*
* **Constatação Real:**
  - O valor real do teste foi **R$ 5,90** (Passe de 15 dias), comprovado por comprovante Pix, pois a API do Asaas não permite boletos ou cobranças abaixo de R$ 5,00.

### ⚠️ Erro 4: Mexer na Carteira sem Autorização e Quebrar o Agrupamento
* **O que aconteceu:**
  - O usuário apontou que o resultado da Mega-Sena estava constando na carteira como "Concurso Apurado" para um sorteio futuro.
  - Em vez de ajustar apenas a validação da data do sorteio, o assistente reescreveu funções de renderização em `js/carteira-gestao.js`, transformando o layout de cartões agrupados por concurso numa lista solta desordenada e quebrando os botões de alternância.
* **Crítica do Usuário:**
  > *"Agora você juntou todos os concursos... o botão lista não funciona... nem o concurso... uma hora abre uma outra fecha... minha pergunta? quem mandou você mexer nessa parte do aplicativo? pergunta simples... me responda"*
* **Ação Corretiva:**
  - O assistente reconheceu o erro de extrapolação de escopo e reverteu imediatamente o arquivo (`git checkout df3b191 -- js/carteira-gestao.js`), restabelecendo os cartões e as abas originais no commit `6012ebe`.

### ⚠️ Erro 5: Teimosia sobre o Sorteio de Quarta-feira da Mega-Sena
* **O que aconteceu:**
  - O assistente assumiu como dogma que "quarta-feira nunca tem Mega-Sena", ignorando que a Caixa realizou o Concurso Especial #3081 em plena quarta-feira (04/11/2026).
  - O assistente montou um post dizendo erroneamente que "não teve sorteio", quando na verdade o sorteio já havia ocorrido e acumulado em R$ 55 Milhões.
* **Crítica do Usuário:**
  > *"UAI... foi hoje!!! como assim? olha ai... vc já até conferiu"* (enviando print do resultado com as dezenas `10-17-42-43-57-59`).
* **Ação Corretiva:**
  - Remoção da regra artificial que empurrava quarta para quinta.
  - Registro oficial do concurso 3081 em `js/historico-oficial.js`.
  - Geração imediata do card visual em PNG e do gabarito oficial de posts.

---

## 4. O QUE ESTÁ NO PLANO E PENDENTE DE EXECUÇÃO

Com a estabilidade do sistema restaurada, os seguintes itens seguem na fila para os próximos passos, sob estrita aprovação prévia:

1. **Reorganização Cuidadosa da Tela Gerar (Sem Quebrar o Volante):**
   - Atender ao pedido original do cliente (organizar definições no topo, ações 2x2, modal de escolha Regular vs Virada e sub-aba Bolão).
   - **Regra inegociável:** Manter a classe `.classic-10x6` no `#volante-grid` para que a grade de 10 colunas jamais mude, e desativar os scripts de mutação dinâmica que estavam duplicando botões.
2. **Ciclo dos 20 Testadores do Google Play Console:**
   - Acompanhamento da janela de 14 dias obrigatória da Play Store para liberação da publicação em produção na loja.
3. **Rotina de Publicações de Resultados nas Redes:**
   - Utilização do gabarito oficial (`marketing/instagram/GABARITO-POSTS-RESULTADOS.md`) e script `scripts/gerador-gabarito-instagram.mjs` a cada apuração oficial da Caixa.

---

## 5. REGRAS DE BLINDAGEM DO PROJETO (ESTRITAMENTE OBRIGATÓRIAS)

1. **Nunca executar `Set-Content` do PowerShell em arquivos de código com texto ou emojis.** Toda edição deve ser feita via Node.js em UTF-8 puro sem BOM.
2. **Nunca alterar o grid de 10 colunas do volante da Mega-Sena.** Ele deve conter sempre a classe `classic-10x6`.
3. **Escopo Fechado:** Não alterar arquivos ou funcionalidades fora do pedido explícito da mensagem. Se o pedido for sobre "data no WhatsApp", não tocar no layout da "Carteira".
4. **Sempre rodar `npm test` antes de qualquer commit.** Todos os 40 testes unitários devem passar sem regressões.
5. **Atualizar este documento (`HISTORICO_MEMORIA_PROJETO.md`) a cada ciclo de desenvolvimento importante.**
