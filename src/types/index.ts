// ==========================================
// TIPOS BASE DO SISTEMA PDV
// ==========================================

// Tipos utilitários
export type ID = string

export interface BaseEntity {
  id: ID
  createdAt: string
  updatedAt: string
}

// ==========================================
// EMPRESA E LOJAS
// ==========================================

export interface Company extends BaseEntity {
  nome: string
  cnpj: string
  razaoSocial: string
  email: string
  telefone?: string
}

export interface Address {
  rua: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export interface Store extends BaseEntity {
  empresaId: ID
  nome: string
  codigo: string
  cnpj?: string
  inscricaoEstadual?: string
  endereco: Address
  telefone?: string
  ativa: boolean
}

// ==========================================
// USUÁRIOS
// ==========================================

export type UserRole = 'admin' | 'gerente' | 'vendedor' | 'caixa'

export interface User extends BaseEntity {
  empresaId: ID
  email: string
  nome: string
  cpf?: string
  telefone?: string
  cargo: UserRole
  avatarUrl?: string
  ativo: boolean
}

export interface UserStore {
  id: ID
  userId: ID
  storeId: ID
  permissoes?: Record<string, boolean>
  createdAt: string
}

// ==========================================
// PRODUTOS
// ==========================================

export type UnitOfMeasure = 'un' | 'kg' | 'g' | 'l' | 'ml' | 'cx' | 'pc'

export interface Category extends BaseEntity {
  empresaId: ID
  nome: string
  descricao?: string
  cor?: string
  icone?: string
  ordem?: number
  ativa: boolean
}

export interface Product extends BaseEntity {
  empresaId: ID
  categoriaId?: ID
  nome: string
  descricao?: string
  codigoInterno?: string
  codigoBarras?: string
  unidadeMedida: UnitOfMeasure
  precoCusto?: number
  precoVenda: number
  margemLucro?: number
  ncm?: string
  cest?: string
  cfop?: string
  imagemUrl?: string
  ativo: boolean
}

export interface ProductVariant extends BaseEntity {
  produtoId: ID
  nome: string
  sku?: string
  codigoBarras?: string
  precoCusto?: number
  precoVenda?: number
  atributos?: Record<string, string>
  imagemUrl?: string
  ativo: boolean
}

// Produto com variantes e estoque (para exibição)
export interface ProductWithDetails extends Product {
  categoria?: Category
  variantes: ProductVariant[]
  estoque?: Stock
}

// ==========================================
// ESTOQUE
// ==========================================

export interface Stock {
  id: ID
  lojaId: ID
  produtoId: ID
  varianteId?: ID
  quantidade: number
  quantidadeMinima?: number
  quantidadeMaxima?: number
  localizacao?: string
  updatedAt: string
}

export type StockMovementType = 'entrada' | 'saida' | 'ajuste' | 'transferencia'
export type StockReferenceType = 'venda' | 'compra' | 'ajuste_manual' | 'transferencia'

export interface StockMovement extends BaseEntity {
  lojaId: ID
  produtoId: ID
  varianteId?: ID
  usuarioId: ID
  tipo: StockMovementType
  quantidade: number
  quantidadeAnterior: number
  quantidadePosterior: number
  motivo?: string
  referenciaTipo?: StockReferenceType
  referenciaId?: ID
}

export type StockAlertType = 'estoque_baixo' | 'estoque_zerado' | 'vencimento'

export interface StockAlert {
  id: ID
  lojaId: ID
  produtoId: ID
  varianteId?: ID
  tipo: StockAlertType
  quantidadeAtual: number
  quantidadeMinima?: number
  lido: boolean
  createdAt: string
}

// ==========================================
// CLIENTES
// ==========================================

export type DocumentType = 'cpf' | 'cnpj'

export interface Customer extends BaseEntity {
  empresaId: ID
  nome: string
  tipoDocumento: DocumentType
  documento?: string
  email?: string
  telefone?: string
  celular?: string
  endereco?: Address
  dataNascimento?: string
  limiteCredito?: number
  observacoes?: string
  ativo: boolean
}

// ==========================================
// VENDAS
// ==========================================

export type SaleStatus = 'aberta' | 'finalizada' | 'cancelada'
export type DiscountType = 'percentual' | 'valor'
export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito' | 'fiado'

export interface Sale extends BaseEntity {
  lojaId: ID
  usuarioId: ID
  clienteId?: ID
  numero: number
  status: SaleStatus
  subtotal: number
  descontoTipo?: DiscountType
  descontoValor?: number
  total: number
  observacoes?: string
}

export interface SaleItem {
  id: ID
  vendaId: ID
  produtoId: ID
  varianteId?: ID
  quantidade: number
  precoUnitario: number
  precoCusto?: number
  descontoTipo?: DiscountType
  descontoValor?: number
  subtotal: number
  createdAt: string
}

export interface Payment {
  id: ID
  vendaId: ID
  formaPagamento: PaymentMethod
  valor: number
  troco?: number
  bandeira?: string
  nsu?: string
  autorizacao?: string
  parcelas?: number
  createdAt: string
}

// Venda completa com itens e pagamentos
export interface SaleWithDetails extends Sale {
  cliente?: Customer
  usuario?: User
  itens: SaleItemWithProduct[]
  pagamentos: Payment[]
}

export interface SaleItemWithProduct extends SaleItem {
  produto: Product
  variante?: ProductVariant
}

// ==========================================
// FIADO/CREDIÁRIO
// ==========================================

export type CreditStatus = 'pendente' | 'parcial' | 'pago' | 'atrasado'

export interface CreditSale extends BaseEntity {
  lojaId: ID
  clienteId: ID
  vendaId: ID
  valorTotal: number
  valorPago: number
  valorRestante: number
  dataVencimento?: string
  status: CreditStatus
  observacoes?: string
}

export interface CreditPayment {
  id: ID
  fiadoId: ID
  usuarioId: ID
  valor: number
  formaPagamento: Exclude<PaymentMethod, 'fiado'>
  observacoes?: string
  createdAt: string
}

// ==========================================
// NOTAS FISCAIS
// ==========================================

export type InvoiceType = 'nfce' | 'nfe'
export type InvoiceStatus = 'pendente' | 'autorizada' | 'cancelada' | 'inutilizada'

export interface Invoice extends BaseEntity {
  lojaId: ID
  vendaId: ID
  tipo: InvoiceType
  numero: number
  serie: number
  chaveAcesso?: string
  protocolo?: string
  status: InvoiceStatus
  xml?: string
  pdfUrl?: string
  dataEmissao?: string
  dataAutorizacao?: string
  motivoCancelamento?: string
}

// ==========================================
// CAIXA
// ==========================================

export type CashRegisterStatus = 'aberto' | 'fechado'
export type CashMovementType = 'sangria' | 'reforco' | 'venda' | 'pagamento_fiado'

export interface CashRegister extends BaseEntity {
  lojaId: ID
  usuarioAberturaId: ID
  usuarioFechamentoId?: ID
  valorAbertura: number
  valorFechamento?: number
  valorSistema?: number
  diferenca?: number
  status: CashRegisterStatus
  observacoes?: string
  dataAbertura: string
  dataFechamento?: string
}

export interface CashMovement {
  id: ID
  caixaId: ID
  usuarioId: ID
  tipo: CashMovementType
  valor: number
  descricao?: string
  createdAt: string
}

// ==========================================
// CONFIGURAÇÕES
// ==========================================

export interface Settings {
  id: ID
  empresaId: ID
  lojaId?: ID
  chave: string
  valor: unknown
}

// ==========================================
// RELATÓRIOS
// ==========================================

export interface SalesReport {
  periodo: {
    inicio: string
    fim: string
  }
  totalVendas: number
  quantidadeVendas: number
  ticketMedio: number
  vendasPorDia: {
    data: string
    total: number
    quantidade: number
  }[]
  vendasPorFormaPagamento: {
    formaPagamento: PaymentMethod
    total: number
    quantidade: number
  }[]
}

export interface ProductsReport {
  periodo: {
    inicio: string
    fim: string
  }
  maisVendidos: {
    produto: Product
    variante?: ProductVariant
    quantidade: number
    valorTotal: number
  }[]
  menosVendidos: {
    produto: Product
    variante?: ProductVariant
    quantidade: number
    valorTotal: number
  }[]
}

export interface StockReport {
  lojaId: ID
  produtosAbaixoMinimo: {
    produto: Product
    variante?: ProductVariant
    quantidadeAtual: number
    quantidadeMinima: number
  }[]
  produtosZerados: {
    produto: Product
    variante?: ProductVariant
  }[]
  valorTotalEstoque: number
}

// ==========================================
// CARRINHO (PDV)
// ==========================================

export interface CartItem {
  id: ID
  produtoId: ID
  varianteId?: ID
  produto: Product
  variante?: ProductVariant
  quantidade: number
  precoUnitario: number
  descontoTipo?: DiscountType
  descontoValor?: number
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  clienteId?: ID
  cliente?: Customer
  subtotal: number
  descontoTipo?: DiscountType
  descontoValor?: number
  total: number
}
