/**
 * @file services.ts
 * @description Services do front — um por Controller do backend, com os mesmos
 * nomes de operação e os mesmos nomes de campo que a API espera. Cada método
 * devolve o `data` do envelope já tipado; erros sobem como `ApiError`.
 *
 * Mapa de rotas (src/routes do agrostand-backend):
 *   /auth       → AutenticacaoService
 *   /users      → UsuarioService
 *   /addresses  → EnderecoService
 *   /categories → CategoriaService
 *   /ads        → AnuncioService
 *   /favorites  → FavoritoService
 *   /orders, /notifications, /reviews, /questions, /producers, /verification,
 *   /chats, /claims, /admin, /quotes, /baskets, /subscriptions → services homônimos
 */

import { request, tokenStorage } from './client';
import type {
  AnuncioDetalheVenda,
  AnuncioInput,
  AnuncioResumoVenda,
  Assinante,
  Assinatura,
  Avaliacao,
  Categoria,
  Cesta,
  Conversa,
  Cotacao,
  Endereco,
  EnderecoInput,
  Estatisticas,
  Favorito,
  FormaPagamento,
  Frequencia,
  GrupoCarrinho,
  ListaPaginada,
  Mensagem,
  MotivoReclamacao,
  Notificacao,
  Pedido,
  PedidoDetalhe,
  PerfilProdutor,
  PerfilPublico,
  Pergunta,
  Reclamacao,
  ResumoAvaliacoes,
  SessaoDTO,
  StatusPedido,
  StatusReclamacao,
  TipoEntrega,
  ToggleFavoritoDTO,
  Usuario,
  Verificacao,
} from './types';

// ─── /auth ───
export type RegisterInput = {
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  senha: string;
} & EnderecoInput;

export const AutenticacaoService = {
  /** POST /auth/register — cria usuário + endereço e já devolve o JWT. */
  async register(input: RegisterInput): Promise<SessaoDTO> {
    const { data } = await request<SessaoDTO>('/auth/register', { method: 'POST', body: input });
    tokenStorage.set(data.token);
    return data;
  },

  /** POST /auth/login — 401 credenciais inválidas, 429 bloqueio temporário (RN19). */
  async login(email: string, senha: string): Promise<SessaoDTO> {
    const { data } = await request<SessaoDTO>('/auth/login', { method: 'POST', body: { email, senha } });
    tokenStorage.set(data.token);
    return data;
  },

  /** POST /auth/google — valida o ID token do Google; cria a conta no primeiro acesso. */
  async loginWithGoogle(credential: string): Promise<SessaoDTO & { novoUsuario: boolean }> {
    const { data } = await request<SessaoDTO & { novoUsuario: boolean }>('/auth/google', {
      method: 'POST',
      body: { credential },
    });
    tokenStorage.set(data.token);
    return data;
  },

  /** POST /auth/logout — revoga o JWT atual (UC13). Limpa o token local mesmo se falhar. */
  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST', auth: true });
    } finally {
      tokenStorage.clear();
    }
  },

  /** POST /auth/forgot-password — sempre responde sucesso (anti-enumeração). */
  async forgotPassword(email: string): Promise<string | undefined> {
    const { message } = await request('/auth/forgot-password', { method: 'POST', body: { email } });
    return message;
  },

  /** POST /auth/reset-password — código de 6 dígitos enviado por e-mail. */
  async resetPassword(email: string, codigo: string, novaSenha: string): Promise<string | undefined> {
    const { message } = await request('/auth/reset-password', {
      method: 'POST',
      body: { email, codigo, novaSenha },
    });
    return message;
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.get();
  },
};

// ─── /users ───
export const UsuarioService = {
  /** GET /users/profile */
  async getProfile(): Promise<Usuario> {
    const { data } = await request<{ usuario: Usuario }>('/users/profile', { auth: true });
    return data.usuario;
  },

  /** PUT /users/profile */
  async updateProfile(input: Pick<Usuario, 'nome' | 'sobrenome' | 'email' | 'telefone'>): Promise<Usuario> {
    const { data } = await request<{ usuario: Usuario }>('/users/profile', {
      method: 'PUT',
      body: input,
      auth: true,
    });
    return data.usuario;
  },

  /** PUT /users/password */
  async updatePassword(senhaAtual: string, novaSenha: string, confirmarNovaSenha: string): Promise<void> {
    await request('/users/password', {
      method: 'PUT',
      body: { senhaAtual, novaSenha, confirmarNovaSenha },
      auth: true,
    });
  },

  /** DELETE /users/account — exclusão definitiva (LGPD). */
  async deleteAccount(): Promise<void> {
    await request('/users/account', { method: 'DELETE', auth: true });
    tokenStorage.clear();
  },
};

// ─── /addresses ───
export const EnderecoService = {
  /** GET /addresses */
  async list(): Promise<Endereco[]> {
    const { data } = await request<{ enderecos: Endereco[] }>('/addresses', { auth: true });
    return data.enderecos;
  },

  /** POST /addresses */
  async create(input: EnderecoInput): Promise<Endereco> {
    const { data } = await request<{ endereco: Endereco }>('/addresses', {
      method: 'POST',
      body: input,
      auth: true,
    });
    return data.endereco;
  },

  /** PUT /addresses/:id */
  async update(id: number, input: EnderecoInput): Promise<Endereco> {
    const { data } = await request<{ endereco: Endereco }>(`/addresses/${id}`, {
      method: 'PUT',
      body: input,
      auth: true,
    });
    return data.endereco;
  },

  /** DELETE /addresses/:id */
  async delete(id: number): Promise<void> {
    await request(`/addresses/${id}`, { method: 'DELETE', auth: true });
  },
};

// ─── /categories ───
export const CategoriaService = {
  /** GET /categories (público) */
  async list(): Promise<Categoria[]> {
    const { data } = await request<{ categorias: Categoria[] }>('/categories');
    return data.categorias;
  },
};

// ─── /ads ───
export type Ordenacao = 'recentes' | 'menor_preco' | 'maior_preco' | 'mais_avaliados' | 'proximos';

export type ListarAnunciosQuery = {
  page?: number;
  limit?: number;
  categoriaId?: number | null;
  search?: string | null;
  anuncianteId?: number | null;
  precoMin?: number | null;
  precoMax?: number | null;
  uf?: string | null;
  cidade?: string | null;
  zona?: 'URBANA' | 'RURAL' | null;
  ofertas?: boolean;
  lat?: number | null;
  lng?: number | null;
  raioKm?: number | null;
  sort?: Ordenacao;
  /** ids a excluir, separados por vírgula */
  excluir?: string | null;
};

/** Monta o multipart esperado pelo Multer (`imagemPrincipal` + `imagensSecundarias`). */
function toAnuncioFormData(input: AnuncioInput): FormData {
  const form = new FormData();
  form.append('nome', input.nome);
  form.append('descricao', input.descricao);
  form.append('preco', String(input.preco));
  form.append('categoriaId', String(input.categoriaId));

  if (input.enderecoId) {
    form.append('enderecoId', String(input.enderecoId));
  } else if (input.novoEndereco) {
    for (const [key, value] of Object.entries(input.novoEndereco)) {
      if (value !== undefined && value !== null) form.append(key, String(value));
    }
  }

  if (input.imagemPrincipal) form.append('imagemPrincipal', input.imagemPrincipal);
  for (const file of input.imagensSecundarias ?? []) form.append('imagensSecundarias', file);
  if (input.deletarImagensIds?.length) form.append('deletarImagensIds', input.deletarImagensIds.join(','));

  // Campos de venda: só vão quando definidos (na edição, ausente = mantém)
  const simples = ['unidade', 'estoque', 'pesoKg', 'precoPromocional', 'promocaoAte', 'permiteEntrega', 'permiteRetirada'] as const;
  for (const campo of simples) {
    const valor = input[campo];
    if (valor !== undefined) form.append(campo, String(valor));
  }
  if (input.atacado) form.append('atacado', JSON.stringify(input.atacado));
  if (input.certificacoes) form.append('certificacoes', JSON.stringify(input.certificacoes));

  return form;
}

export const AnuncioService = {
  /** GET /ads — vitrine pública (só ATIVOS), paginada, com filtro e busca. */
  async list(query: ListarAnunciosQuery = {}): Promise<ListaPaginada<AnuncioResumoVenda>> {
    const { ofertas, ...resto } = query;
    const { data } = await request<ListaPaginada<AnuncioResumoVenda>>('/ads', {
      query: { ...resto, ofertas: ofertas ? 'true' : undefined },
    });
    return data;
  },

  /** GET /ads/suggest — sugestões enquanto digita. */
  async suggest(q: string): Promise<{ produtos: string[]; categorias: Array<{ id: number; nome: string }> }> {
    const { data } = await request<{ produtos: string[]; categorias: Array<{ id: number; nome: string }> }>(
      '/ads/suggest', { query: { q } }
    );
    return data;
  },

  /** POST /ads/:id/events — visualização ou clique no WhatsApp (falha silenciosa). */
  async registrarEvento(id: number | string, tipo: 'VISUALIZACAO' | 'CLIQUE_WHATSAPP', sessao: string): Promise<void> {
    try {
      await request(`/ads/${id}/events`, { method: 'POST', body: { tipo, sessao }, auth: 'optional' });
    } catch {
      // estatística não pode atrapalhar a navegação
    }
  },

  /** GET /ads/:id/recommendations — "quem viu também viu". */
  async recomendacoes(id: number | string): Promise<{ anuncios: AnuncioResumoVenda[]; baseado_em_visitas: boolean }> {
    const { data } = await request<{ anuncios: AnuncioResumoVenda[]; baseado_em_visitas: boolean }>(
      `/ads/${id}/recommendations`
    );
    return data;
  },

  /** GET /ads/me/stats — visitas e cliques do vendedor. */
  async estatisticas(dias = 30): Promise<Estatisticas> {
    const { data } = await request<Estatisticas>('/ads/me/stats', { query: { dias }, auth: true });
    return data;
  },

  /** PATCH /ads/:id/status — pausar/reativar. */
  async alterarStatus(id: number, status: 'ATIVO' | 'PAUSADO'): Promise<string | undefined> {
    const { message } = await request(`/ads/${id}/status`, { method: 'PATCH', body: { status }, auth: true });
    return message;
  },

  /** GET /ads/:id — detalhe + vendedor + link WhatsApp. */
  async get(id: number | string): Promise<AnuncioDetalheVenda> {
    const { data } = await request<{ anuncio: AnuncioDetalheVenda }>(`/ads/${id}`);
    return data.anuncio;
  },

  /** GET /ads/me/products — painel do anunciante (ATIVO | EM_LIXEIRA). */
  async myProducts(
    query: { page?: number; limit?: number; status?: 'ATIVO' | 'PAUSADO' | 'EM_LIXEIRA' } = {}
  ): Promise<ListaPaginada<AnuncioResumoVenda>> {
    const { data } = await request<ListaPaginada<AnuncioResumoVenda>>('/ads/me/products', { query, auth: true });
    return data;
  },

  /** POST /ads — multipart; imagem principal obrigatória (RN04). */
  async create(input: AnuncioInput): Promise<{ message?: string }> {
    const { message } = await request('/ads', { method: 'POST', body: toAnuncioFormData(input), auth: true });
    return { message };
  },

  /** PUT /ads/:id — multipart; enderecoId obrigatório na edição. */
  async update(id: number, input: AnuncioInput): Promise<{ message?: string }> {
    const { message } = await request(`/ads/${id}`, {
      method: 'PUT',
      body: toAnuncioFormData(input),
      auth: true,
    });
    return { message };
  },

  /** DELETE /ads/:id — envia para a lixeira (soft delete, RS09). */
  async remove(id: number): Promise<string | undefined> {
    const { message } = await request(`/ads/${id}`, { method: 'DELETE', auth: true });
    return message;
  },

  /** POST /ads/:id/restore — tira da lixeira. */
  async restore(id: number): Promise<string | undefined> {
    const { message } = await request(`/ads/${id}/restore`, { method: 'POST', auth: true });
    return message;
  },
};

// ─── /favorites ───
export const FavoritoService = {
  /** POST /favorites/toggle — liga/desliga o coração (só anúncios ATIVOS). */
  async toggle(anuncioId: number | string): Promise<ToggleFavoritoDTO> {
    const { data } = await request<ToggleFavoritoDTO>('/favorites/toggle', {
      method: 'POST',
      body: { anuncioId: Number(anuncioId) },
      auth: true,
    });
    return data;
  },

  /** GET /favorites — recentes primeiro, indisponíveis sinalizados. */
  async list(): Promise<Favorito[]> {
    const { data } = await request<{ favoritos: Favorito[] }>('/favorites', { auth: true });
    return data.favoritos;
  },

  /** DELETE /favorites/:id — id do favorito (não do anúncio). */
  async remove(id: number): Promise<void> {
    await request(`/favorites/${id}`, { method: 'DELETE', auth: true });
  },
};

// ─── /orders ───
export type ItemCarrinhoInput = { anuncioId: number; quantidade: number };

export const PedidoService = {
  /** POST /orders/quote — frete estimado e totais por produtor (login opcional). */
  async cotar(itens: ItemCarrinhoInput[], destino?: { cidade: string; uf: string } | null) {
    const { data } = await request<{ grupos: GrupoCarrinho[]; estimativa: boolean; frete_gratis_acima: number }>(
      '/orders/quote',
      { method: 'POST', body: { itens, cidade: destino?.cidade, uf: destino?.uf }, auth: 'optional' }
    );
    return data;
  },

  /** POST /orders/checkout — um pedido por produtor. */
  async checkout(input: {
    itens: ItemCarrinhoInput[];
    entregas: Record<number, TipoEntrega>;
    enderecoId?: number | null;
    formaPagamento: FormaPagamento;
    observacao?: string;
  }) {
    const { data, message } = await request<{ pedidos: Array<{ id: number; total: number }> }>('/orders/checkout', {
      method: 'POST', body: input, auth: true,
    });
    return { ...data, message };
  },

  async compras(status?: StatusPedido) {
    const { data } = await request<{ pedidos: Pedido[] }>('/orders', { query: { status }, auth: true });
    return data.pedidos;
  },

  async vendas(status?: StatusPedido) {
    const { data } = await request<{ pedidos: Pedido[]; resumo: Array<{ status: StatusPedido; total: number; valor: number }> }>(
      '/orders/sales', { query: { status }, auth: true }
    );
    return data;
  },

  async detalhe(id: number | string) {
    const { data } = await request<{ pedido: PedidoDetalhe }>(`/orders/${id}`, { auth: true });
    return data.pedido;
  },

  /** PATCH /orders/:id/status — pagar (simulado), preparar, enviar, entregar, cancelar. */
  async alterarStatus(id: number, status: StatusPedido, extra: { codigoRastreio?: string; observacao?: string } = {}) {
    const { data } = await request<{ pedido: PedidoDetalhe }>(`/orders/${id}/status`, {
      method: 'PATCH', body: { status, ...extra }, auth: true,
    });
    return data.pedido;
  },
};

// ─── /notifications ───
export const NotificacaoService = {
  async listar() {
    const { data } = await request<{ notificacoes: Notificacao[]; nao_lidas: number }>('/notifications', { auth: true });
    return data;
  },
  async marcarLida(id: number) {
    await request(`/notifications/${id}/read`, { method: 'POST', auth: true });
  },
  async marcarTodasLidas() {
    await request('/notifications/read-all', { method: 'POST', auth: true });
  },
};

// ─── /reviews e /questions ───
export const AvaliacaoService = {
  async listar(filtro: { anuncioId?: number | string; vendedorId?: number | string }) {
    const { data } = await request<{ avaliacoes: Avaliacao[]; resumo: ResumoAvaliacoes }>('/reviews', { query: filtro });
    return data;
  },
  async criar(input: { pedidoId: number; anuncioId: number; nota: number; comentario?: string; fotos?: File[] }) {
    const form = new FormData();
    form.append('pedidoId', String(input.pedidoId));
    form.append('anuncioId', String(input.anuncioId));
    form.append('nota', String(input.nota));
    if (input.comentario) form.append('comentario', input.comentario);
    for (const f of input.fotos ?? []) form.append('fotos', f);
    const { message } = await request('/reviews', { method: 'POST', body: form, auth: true });
    return message;
  },
  async responder(id: number, resposta: string) {
    await request(`/reviews/${id}/reply`, { method: 'POST', body: { resposta }, auth: true });
  },
};

export const PerguntaService = {
  async listar(anuncioId: number | string) {
    const { data } = await request<{ perguntas: Pergunta[] }>('/questions', { query: { anuncioId } });
    return data.perguntas;
  },
  async perguntar(anuncioId: number | string, texto: string) {
    await request('/questions', { method: 'POST', body: { anuncioId: Number(anuncioId), texto }, auth: true });
  },
  async responder(id: number, resposta: string) {
    await request(`/questions/${id}/answer`, { method: 'POST', body: { resposta }, auth: true });
  },
  async excluir(id: number) {
    await request(`/questions/${id}`, { method: 'DELETE', auth: true });
  },
};

// ─── /producers, perfil público e verificação ───
export const ProdutorService = {
  async perfil(id: number | string) {
    const { data } = await request<PerfilProdutor>(`/producers/${id}`);
    return data;
  },
  async meuPerfilPublico() {
    const { data } = await request<{ perfil: PerfilPublico }>('/users/profile/public', { auth: true });
    return data.perfil;
  },
  async atualizarPerfilPublico(input: { bio?: string; videoUrl?: string }) {
    const { data } = await request<{ perfil: PerfilPublico }>('/users/profile/public', { method: 'PUT', body: input, auth: true });
    return data.perfil;
  },
  async atualizarFoto(foto: File) {
    const form = new FormData();
    form.append('foto', foto);
    const { data } = await request<{ perfil: PerfilPublico }>('/users/profile/photo', { method: 'POST', body: form, auth: true });
    return data.perfil;
  },
};

export const VerificacaoService = {
  async minha() {
    const { data } = await request<{ verificacao: Verificacao | null }>('/verification', { auth: true });
    return data.verificacao;
  },
  async solicitar(input: { tipoDocumento: 'CPF' | 'CNPJ'; documento: string; car?: string }) {
    const { data } = await request<{ verificacao: Verificacao }>('/verification', { method: 'POST', body: input, auth: true });
    return data.verificacao;
  },
};

// ─── /chats ───
export const ChatService = {
  async conversas() {
    const { data } = await request<{ conversas: Conversa[] }>('/chats', { auth: true });
    return data.conversas;
  },
  async naoLidas() {
    const { data } = await request<{ nao_lidas: number }>('/chats/unread', { auth: true });
    return data.nao_lidas;
  },
  async iniciar(anuncioId: number | string, texto: string) {
    const { data } = await request<{ conversa_id: number }>('/chats', {
      method: 'POST', body: { anuncioId: Number(anuncioId), texto }, auth: true,
    });
    return data.conversa_id;
  },
  async mensagens(conversaId: number, depoisDe?: number) {
    const { data } = await request<{ mensagens: Mensagem[] }>(`/chats/${conversaId}/messages`, {
      query: { depoisDe }, auth: true,
    });
    return data.mensagens;
  },
  async enviar(conversaId: number, texto: string) {
    const { data } = await request<{ mensagem: Mensagem }>(`/chats/${conversaId}/messages`, {
      method: 'POST', body: { texto }, auth: true,
    });
    return data.mensagem;
  },
};

// ─── /claims ───
export const ReclamacaoService = {
  async listar() {
    const { data } = await request<{ reclamacoes: Reclamacao[] }>('/claims', { auth: true });
    return data.reclamacoes;
  },
  async detalhe(id: number | string) {
    const { data } = await request<{ reclamacao: Reclamacao }>(`/claims/${id}`, { auth: true });
    return data.reclamacao;
  },
  async abrir(input: { pedidoId: number; motivo: MotivoReclamacao; descricao: string; pedidoDevolucao: boolean }) {
    const { data } = await request<{ reclamacao: Reclamacao }>('/claims', { method: 'POST', body: input, auth: true });
    return data.reclamacao;
  },
  async responder(id: number, resposta: string, aceitar: boolean) {
    const { data } = await request<{ reclamacao: Reclamacao }>(`/claims/${id}/reply`, {
      method: 'POST', body: { resposta, aceitar }, auth: true,
    });
    return data.reclamacao;
  },
  async encerrar(id: number) {
    const { data } = await request<{ reclamacao: Reclamacao }>(`/claims/${id}/close`, { method: 'POST', auth: true });
    return data.reclamacao;
  },
  async pedirMediacao(id: number) {
    const { data } = await request<{ reclamacao: Reclamacao }>(`/claims/${id}/mediation`, { method: 'POST', auth: true });
    return data.reclamacao;
  },
};

// ─── /admin ───
export const AdminService = {
  async verificacoes(status: 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'TODAS' = 'PENDENTE') {
    const { data } = await request<{ verificacoes: Verificacao[] }>('/admin/verifications', { query: { status }, auth: true });
    return data.verificacoes;
  },
  async decidirVerificacao(id: number, status: 'APROVADA' | 'REJEITADA', observacao?: string) {
    await request(`/admin/verifications/${id}/decision`, { method: 'POST', body: { status, observacao }, auth: true });
  },
  async reclamacoes(status: StatusReclamacao | 'TODAS' = 'EM_MEDIACAO') {
    const { data } = await request<{ reclamacoes: Reclamacao[] }>('/admin/claims', { query: { status }, auth: true });
    return data.reclamacoes;
  },
  async decidirReclamacao(id: number, favorecido: 'COMPRADOR' | 'VENDEDOR', decisao: string) {
    const { data } = await request<{ reclamacao: Reclamacao }>(`/admin/claims/${id}/decision`, {
      method: 'POST', body: { favorecido, decisao }, auth: true,
    });
    return data.reclamacao;
  },
};

// ─── /quotes ───
export const CotacaoService = {
  async solicitar(anuncioId: number | string, quantidade: number, mensagem?: string) {
    await request('/quotes', { method: 'POST', body: { anuncioId: Number(anuncioId), quantidade, mensagem }, auth: true });
  },
  async minhas() {
    const { data } = await request<{ cotacoes: Cotacao[] }>('/quotes', { auth: true });
    return data.cotacoes;
  },
  async recebidas() {
    const { data } = await request<{ cotacoes: Cotacao[] }>('/quotes/received', { auth: true });
    return data.cotacoes;
  },
  async responder(id: number, input: { precoUnitario?: number; prazoEntrega?: string; resposta?: string; recusar?: boolean }) {
    await request(`/quotes/${id}/reply`, { method: 'POST', body: input, auth: true });
  },
  async aceitar(id: number, input: { tipoEntrega: TipoEntrega; enderecoId?: number | null; formaPagamento: FormaPagamento }) {
    const { data } = await request<{ pedido_id: number }>(`/quotes/${id}/accept`, { method: 'POST', body: input, auth: true });
    return data.pedido_id;
  },
  async cancelar(id: number) {
    await request(`/quotes/${id}/cancel`, { method: 'POST', auth: true });
  },
};

// ─── /baskets e /subscriptions ───
export type CestaInput = {
  nome: string; descricao: string; itens: string; preco: number | string; frequencia: Frequencia;
  ativa?: boolean; imagem?: File | null;
};

function toCestaFormData(input: CestaInput): FormData {
  const form = new FormData();
  form.append('nome', input.nome);
  form.append('descricao', input.descricao);
  form.append('itens', input.itens);
  form.append('preco', String(input.preco));
  form.append('frequencia', input.frequencia);
  if (input.ativa !== undefined) form.append('ativa', String(input.ativa));
  if (input.imagem) form.append('imagem', input.imagem);
  return form;
}

export const CestaService = {
  async publicas() {
    const { data } = await request<{ cestas: Cesta[] }>('/baskets');
    return data.cestas;
  },
  async detalhe(id: number | string) {
    const { data } = await request<{ cesta: Cesta }>(`/baskets/${id}`);
    return data.cesta;
  },
  async minhas() {
    const { data } = await request<{ cestas: Cesta[] }>('/baskets/mine', { auth: true });
    return data.cestas;
  },
  async criar(input: CestaInput) {
    const { data } = await request<{ cesta: Cesta }>('/baskets', { method: 'POST', body: toCestaFormData(input), auth: true });
    return data.cesta;
  },
  async editar(id: number, input: CestaInput) {
    const { data } = await request<{ cesta: Cesta }>(`/baskets/${id}`, { method: 'PUT', body: toCestaFormData(input), auth: true });
    return data.cesta;
  },
  async assinantes(id: number) {
    const { data } = await request<{ assinantes: Assinante[] }>(`/baskets/${id}/subscribers`, { auth: true });
    return data.assinantes;
  },
  async assinar(id: number, tipoEntrega: TipoEntrega, enderecoId?: number | null) {
    await request(`/baskets/${id}/subscribe`, { method: 'POST', body: { tipoEntrega, enderecoId }, auth: true });
  },
};

export const AssinaturaService = {
  async minhas() {
    const { data } = await request<{ assinaturas: Assinatura[] }>('/subscriptions', { auth: true });
    return data.assinaturas;
  },
  async alterar(id: number, status: Assinatura['status']) {
    await request(`/subscriptions/${id}`, { method: 'PATCH', body: { status }, auth: true });
  },
  async gerarPedidoDaEntrega(id: number) {
    const { data } = await request<{ pedido_id: number }>(`/subscriptions/${id}/delivery`, { method: 'POST', auth: true });
    return data.pedido_id;
  },
};
