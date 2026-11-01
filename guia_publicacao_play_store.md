# 🎯 Guia de Publicação na Google Play Store (App Android Nativo via TWA / Bubblewrap)

Este documento detalha o procedimento técnico padrão do Google para empacotar o **Meu Volante PRO** em um arquivo `.aab` (Android App Bundle) e publicá-lo na Google Play Store.

---

## 1. Abordagem Técnica Recomendada: TWA (Trusted Web Activity) com Bubblewrap

A tecnologia **TWA (Google Trusted Web Activity)** é a solução oficial da equipe do Chromium/Google para transformar aplicações web de alta performance em aplicativos Android nativos sem perda de desempenho, sem duplicar base de código e com atualização instantânea (over-the-air).

### Vantagens do TWA:
* **Atualização Imediata:** Qualquer melhoria que você fizer no HTML/JS/CSS reflete imediatamente para os usuários que baixaram na Play Store, sem precisar enviar uma nova revisão para o Google.
* **Tamanho Leve:** O aplicativo pesa menos de 3 MB na Play Store.
* **Full Screen Nativo:** Remove barra de navegador, comportando-se como aplicativo nativo puro.
* **Ícone e Splash Screen Nativa:** Tela de abertura com logo e cores do sistema.

---

## 2. Requisitos Prévios

1. **Node.js (LTS)** instalado na máquina.
2. **Java JDK 17+** ou Android Studio CLI (o Bubblewrap baixa o JDK e Android SDK automaticamente se desejar).
3. **Conta de Desenvolvedor Google Play Console** (taxa única de $25 dólares cobrada pelo Google).
4. **URL de Produção com SSL (HTTPS):** Já temos publicado e ativo em:
   `https://vitoriobergamobrazil.github.io/loterias-nasa-pro/`

---

## 3. Passo a Passo de Empacotamento via Terminal

Abra o terminal PowerShell nesta pasta (`C:\Users\vitorio.neto\Documents\Vitório PC\Arquivos BERT\Meu Volante PRO`) e execute:

```powershell
# 1. Instalar o Bubblewrap CLI globalmente
npm i -g @bubblewrap/cli

# 2. Inicializar o projeto Android a partir do Manifest online
bubblewrap init --manifest="https://vitoriobergamobrazil.github.io/loterias-nasa-pro/manifest.json"
```

Durante o assistente, responda as perguntas:
* **Application name:** `Meu Volante PRO`
* **Short name:** `Meu Volante PRO`
* **Package name:** `com.loteriasnasa.pro`
* **Display mode:** `standalone` ou `fullscreen`
* **Theme color:** `#0b1329`
* **Navigation color:** `#070b14`

### Gerar o Android App Bundle (.aab):
```powershell
bubblewrap build
```
O Bubblewrap gerará a chave criptográfica de assinatura (`android.keystore`) e o arquivo final:
`app-release-bundle.aab`.

---

## 4. Configuração do Digital Asset Links (Validação de Domínio)

Para que o Google retire qualquer barra de endereço e valide a titularidade do domínio:
1. O comando `bubblewrap build` imprimirá a impressão digital SHA-256 da sua chave de assinatura.
2. Crie uma pasta chamada `.well-known/` no repositório web contendo `assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.loteriasnasa.pro",
    "sha256_cert_fingerprints": ["SUA_CHAVE_SHA256_AQUI"]
  }
}]
```

---

## 5. Publicação no Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console).
2. Clique em **Criar app** -> Nome: `Meu Volante PRO` -> Categoria: `Finanças / Ferramentas`.
3. Preencha a **Ficha da Loja (Store Listing)**:
   - Descrição curta: *Inteligência combinatória, telemetria espacial e testes estatísticos para apostadores.*
   - Descrição completa: utilize os tópicos do documento `manual_do_usuario_e_tutorial.md`.
   - Screenshots: utilize as capturas já geradas na pasta.
4. Faça o upload do arquivo `app-release-bundle.aab` na faixa de **Produção**.
5. Envie para revisão do Google (geralmente aprovado em 24h a 72h).
