# Site da ASMATOZ

Site institucional estático (HTML/CSS/JS puro, sem build) para a **ASMATOZ — Associação dos Catadores de Materiais Recicláveis de Matozinhos**.

## Estrutura

```
asmatoz-site/
├── index.html
├── css/style.css
├── js/script.js
├── assets/favicon-32.png
├── assets/favicon-180.png
├── assets/header-logo.png
├── assets/parceiros/ (8 logos de parceiros)
├── docs/ (5 relatórios em PDF)
└── README.md
```

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex.: `asmatoz-site`).
2. Envie todos os arquivos desta pasta para o repositório (pela interface web do GitHub — "Add file → Upload files" — ou via `git`).
3. No repositório, vá em **Settings → Pages**.
4. Em "Build and deployment", selecione **Source: Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/ (root)`, depois clique em **Save**.
6. Após 1–2 minutos, o site estará disponível em:
   `https://<seu-usuario>.github.io/<nome-do-repositorio>/`

Não é necessário nenhum passo de build — os arquivos já estão prontos para produção.

Atenção: o arquivo `docs/relatorio-execucao-financeira-2025.pdf` tem cerca de 20 MB. Está dentro do limite do GitHub Pages, mas se o repositório tiver múltiplos arquivos grandes, considere usar o Git LFS.

## O que já foi preenchido

- **Quem somos**: texto institucional oficial (fundação em 15/09/2005, finalidade da associação), centralizado e com texto justificado.
- **Contato**: endereço (Av. André Favalelli, 660 — Bairro Estação, Matozinhos/MG), telefone/WhatsApp, e-mail e horário de atendimento, com mapa do Google Maps incorporado.
- **Logo**: logo "Asmatoz Whats" aplicada no cabeçalho e como favicon.
- **Parceiros**: tira com os 8 logos (Prefeitura de Matozinhos, Cataunidos, PoLEN, Sicredi, Cimento Nacional, New Eletric, Ligas Gerais, Oggi Sorvetes).
- **Nosso Impacto**: painel interativo (accordion) com o impacto ambiental estimado da reciclagem por tipo de material — CO₂ evitado, recursos naturais poupados e economia de energia — com nota de metodologia e fontes.
- **Materiais que trabalhamos**: cada chip abre um modal com uma breve descrição do material.
- **Relatórios**: 5 documentos reais em PDF disponíveis para download em `docs/`:
  - Relatório de Execução Financeira (2025)
  - Relatório de Comercialização de Materiais (Mar/2025 a Abr/2026)
  - Relatório de Rateio de Vendas e Outros Pagamentos (Mar/2025 a Abr/2026)
  - Relatório de Quadro Social (Mar/2025 a Abr/2026)
  - Relatório de Movimentações do Sistema MTR/FEAM (Mar/2025 a Mar/2026)

## O que revisar antes de publicar

- **Valores de "Nosso Impacto"**: os números de comercialização (201,7 t / R$ 184.853) e as estimativas ambientais foram calculados a partir dos relatórios internos e de coeficientes médios do setor (ver nota de metodologia no próprio site). Vale revisar/atualizar periodicamente.
- **Formulário de contato** é estático (não envia e-mail de fato). Para funcionar, conecte-o a um serviço como o Formspree, ou substitua-o por um link direto de WhatsApp/e-mail.
- **Novos relatórios**: quando houver um relatório novo (ex.: exercício 2026), adicione o PDF em `docs/` e duplique um bloco `.report-card` na seção `<section id="relatorios">` do `index.html`, ajustando título, período e o `href` do botão "Baixar PDF".

## Personalização rápida

- Cores: variáveis `--green-900`, `--green-700`, `--green-500` no topo de `css/style.css`.
- Seções: cada bloco do site está em uma tag `<section>` no `index.html`, identificado por `id` (`sobre`, `atividades`, `impacto`, `materiais`, `parceiros`, `relatorios`, `contato`).
- Descrições dos materiais: editar o objeto `materialInfo` em `js/script.js`.
