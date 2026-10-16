# Handoff — o que já foi feito no AgroMundo

Resumo para a próxima pessoa/IA que continuar o projeto. Última atualização: 14/10/2026.
**Nada foi commitado ainda**: todo o trabalho abaixo está só na árvore de trabalho (`git status`).

## Visão geral do repositório

- `agrostand-backend/` — API Node/Express 5 + Drizzle ORM + PostgreSQL com **Row-Level Security**.
  Camadas: `routes → controllers (finos) → services (regras) → dao (Drizzle) → domain (entidades)`.
  Banco criado/migrado no boot por `src/db/schema.sql` (idempotente: `CREATE ... IF NOT EXISTS`,
  `ALTER ... ADD COLUMN IF NOT EXISTS`, policies recriadas a cada boot). `src/db/schema.js` espelha em Drizzle.
  Contexto RLS por requisição via AsyncLocalStorage (`src/db/context.js`: `runAsUser`, `runAsSystem`).
- `Agromundo/` — front React 18 + Vite 6 + Tailwind 4, estilos majoritariamente inline.
  API em `src/app/api/` (`client.ts`, `services.ts`, `types.ts`, `mappers.ts`).
- Raiz: `.claude/launch.json` (servidores de preview), `.android-tools/` (JDK/SDK, ignorado no git),
  `AgroMundo-teste.apk` (ignorado no git).

## 1. Redesign visual (concluído)

- Paleta nova em `Agromundo/src/app/components/agro/theme.ts` (`C`): fundo `#F7F5F0`, branco, grafite `#252522`,
  laranja `#F4770B`, laranja suave `#FCE7D2`, marrom `#8C5A32`. Verde só para sinais semânticos.
- Cabeçalho com foto de campo + barra grafite fixa, rodapé grafite (`Footer.tsx`), página de produto
  no layout da referência (galeria · infos · cartão do produtor). Todas as páginas antigas migradas
  do tema escuro verde para a nova paleta.
- Kit visual compartilhado em `components/agro/ui.tsx` (PageShell, Card, botões, Pill, Estrelas, Modal, formatadores).

## 2. Funcionalidades de marketplace (concluídas, ambiente de TESTE)

O usuário escolheu ~40 itens numa lista comparando com Amazon/Mercado Livre e disse
"adiciona tudo, mas ainda estamos testando". Decisões tomadas por isso:
- **Pagamento simulado** (botão "Pagar (simulação)"); reembolso só registrado no histórico do pedido.
- **Frete estimado por tabela** (`FreteService`): mesma cidade/mesmo estado/outro estado + peso; grátis ≥ R$ 500; retirada grátis.
- **Notificações** no site (sininho) + e-mail opcional (`NOTIFY_EMAIL=on`; sem SMTP vai para Ethereal/console). WhatsApp automático não (só links `wa.me`).
- **Admin** = e-mails em `ADMIN_EMAILS` (`src/middlewares/adminMiddleware.js`); ações de admin rodam como sistema.
- **Geocodificação** via Nominatim/OpenStreetMap (`GeocodificacaoService`, `GEOCODER=nominatim`, 1 req/s, desligada nos testes).

### Backend (novos arquivos principais)
- Tabelas novas (schema.sql + schema.js): `PrecoAtacado`, `Certificacao`, `EventoAnuncio`, `Pedido`, `ItemPedido`,
  `HistoricoPedido`, `Avaliacao`, `AvaliacaoFoto`, `Pergunta`, `Conversa`, `Mensagem`, `Notificacao`, `Reclamacao`,
  `Verificacao`, `Cesta`, `Assinatura`, `Cotacao`. Colunas novas: `Usuario(bio, video_url, foto_url)`,
  `Endereco(latitude, longitude)`, `Anuncio(unidade, estoque, peso_kg, preco_promocional, promocao_ate, permite_entrega, permite_retirada)`, status `PAUSADO`.
- Funções `SECURITY DEFINER` em `schema.sql` (`app.cesta_vendedor`, `app.assina_cesta`, `app.endereco_de_assinante`,
  `app.usuario_verificado`) **para evitar recursão entre policies** — não trocar por EXISTS diretos.
- Services: `PedidoService` (checkout divide por vendedor, preço = menor entre oferta e faixa de atacado, baixa de estoque atômica, `gravarPedido` reaproveitado), `domain/Pedido.js` (máquina de estados), `FreteService`, `NotificacaoService`, `AvaliacaoService`, `PerguntaService`, `ProdutorService` (perfil público + reputação 0–5), `VerificacaoService` (CPF/CNPJ/CAR), `ChatService`, `ReclamacaoService`, `CotacaoService`, `CestaService`, `GeocodificacaoService`. `AnuncioService` ganhou campos de venda, filtros/ordenação, sugestões, eventos, estatísticas, recomendações, pausar.
- Rotas novas: `/api/orders`, `/api/notifications`, `/api/reviews`, `/api/questions`, `/api/producers`, `/api/verification`,
  `/api/chats`, `/api/claims`, `/api/admin`, `/api/quotes`, `/api/baskets`, `/api/subscriptions`; e `/share/produto/:id`, `/share/produtor/:id` (prévia Open Graph). Lista completa no `agrostand-backend/README.md`.
- `optionalAuthMiddleware.js` para rotas públicas que aceitam token.
- Validadores novos em `src/utils/validadores.js` (CPF, CNPJ, CAR, URL de vídeo YouTube/Vimeo).
- Testes novos: `test/unit/pedido.test.js`, `test/integration/vitrine-avancada.test.js`, `pedidos.test.js`, `pos-venda.test.js`.
  **135 testes, todos passando** (`npm test`). `test/helpers.js` desliga geocoder e e-mail.
- `src/db/seed.js` (`npm run db:seed`): além dos anúncios demo, complemento idempotente (unidade/estoque/atacado/ofertas,
  coordenadas de Pouso Alegre/MG, bio, cesta) e contas de teste. `src/db/geocode.js` (`npm run db:geocode`).
- `.env` e `.env.example` receberam `GEOCODER`, `ADMIN_EMAILS`, `FRONTEND_URL`, `NOTIFY_EMAIL`.

### Frontend (principais mudanças)
- **React Router** (`main.tsx` com `BrowserRouter`; rotas em `App.tsx`). Estado global em `src/app/AppContext.tsx`
  (`useApp()`: sessão, carrinho salvo em localStorage, favoritos, contadores de avisos/mensagens). `src/app/lib/storage.ts`.
- Páginas novas em `components/agro/`: `CheckoutPage`, `OrdersPage`, `OrderDetailPage` (rastreio, avaliar, reclamar),
  `ProducerPage`, `MessagesPage`, `ClaimsPage`, `QuotesPage`, `BasketsPage`, `MapPage` (Leaflet), `SeasonPage`,
  `AdminPage`, `SellerExtras` (abas do vendedor: estatísticas, pedidos, cotações, cestas, perfil/verificação),
  `VitrineFiltros` (filtros, "perto de mim", vistos recentemente).
- Reescritos/ampliados: `Header` (sininho, mensagens, autocomplete), `ProductPage` (estoque, oferta, atacado, certificações,
  comprar agora, frete por CEP, zoom, avaliações, perguntas, cotação, chat, vídeo, recomendações), `CartPage` (preço conferido no servidor),
  `ProductCard`, `HomePage` (filtros na URL, `/ofertas`), `SellerDashboard` (rota `/vender/:aba?`, campos de venda, pausar).
- PWA: `public/manifest.webmanifest`, `public/sw.js`, ícones (`scripts/gerar-icones.mjs`), botão "Instalar app" no rodapé.
- Dependência nova: `leaflet` 1.9.4 (+ `@types/leaflet`).
- Não há tsconfig no projeto; a checagem de tipos foi feita com um tsconfig temporário — build (`npx vite build`) passa.

## 3. App Android (APK de teste) — concluído

- Capacitor 8.5.3 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`), `Agromundo/capacitor.config.json`
  (`androidScheme: http`, `cleartext: true`), projeto nativo em `Agromundo/android/` (manifest com `usesCleartextTraffic`).
- `Agromundo/.env.android`: `VITE_API_URL=http://192.168.1.249:3001/api` (IP do PC na rede), `VITE_SHARE_URL`, Google login desligado.
- Scripts: `npm run android:sync`, `npm run android:apk`. Ícones/splash: `scripts/gerar-icones-android.mjs`.
- JDK 21 e Android SDK (platform 36, build-tools 36) em `C:\projetos\laboratorio\.android-tools` (licenças aceitas com autorização do usuário).
  `android/local.properties` usa barras normais: `sdk.dir=C\:/projetos/laboratorio/.android-tools/sdk`.
- No Windows, rodar o Gradle pelo caminho absoluto do `gradlew.bat` (o `cmd` não herda a pasta do PowerShell).
- APK gerado: `C:\projetos\laboratorio\AgroMundo-teste.apk`. **Não foi testado num aparelho.**

## Como rodar

- Backend: `cd agrostand-backend && npm start` (porta 3001 pelo `.env`). Front: `cd Agromundo && npm run dev`
  (precisa `VITE_BACKEND_URL=http://localhost:3001`, pois o proxy padrão é 3000). `.claude/launch.json` já faz isso.
- Contas de teste: produtor `produtor.demo@agrostand.com / Demo@1234`, cliente `cliente.demo@agrostand.com / Cliente@1234`,
  admin `admin.demo@agrostand.com / Admin@1234`.
- O banco de desenvolvimento já tem dados de teste: pedido #1 (enviado com rastreio), uma conversa, produtor demo verificado.

## Pendências / atenção

- **Commitar** o trabalho (nada commitado).
- Celular acessar a API: liberar a porta 3001 no Firewall do Windows (rede está como "Pública"); o usuário precisa fazer isso como admin.
- Imagens antigas enviadas pelo site foram salvas com URL `localhost` e não aparecem no celular.
- Números fixos inventados no banner da Home ("12.000+ produtos" etc.) continuam — o usuário não pediu para remover.
- Animações de troca de página travam quando o painel de navegador do Claude está oculto (só no ambiente de teste, não é bug do app).
