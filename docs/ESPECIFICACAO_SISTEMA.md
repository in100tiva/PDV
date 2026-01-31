# PDV - Sistema de Ponto de Venda e Controle de Estoque

## Visão Geral

Sistema de PDV para pequenos comércios com foco em controle de estoque inteligente, suporte a múltiplas lojas, gestão de funcionários e emissão de notas fiscais.

---

## 1. Módulos do Sistema

### 1.1 Autenticação e Autorização
### 1.2 Gestão de Lojas
### 1.3 Gestão de Usuários/Funcionários
### 1.4 Cadastro de Produtos
### 1.5 Controle de Estoque
### 1.6 Ponto de Venda (PDV)
### 1.7 Gestão de Clientes
### 1.8 Sistema de Fiado/Crediário
### 1.9 Notas Fiscais (NFC-e/NF-e)
### 1.10 Relatórios e Dashboards

---

## 2. Entidades do Banco de Dados

### 2.1 EMPRESAS (companies)
Representa a empresa/grupo que pode ter múltiplas lojas.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome da empresa |
| cnpj | VARCHAR(18) | Sim | CNPJ formatado |
| razao_social | VARCHAR(255) | Sim | Razão social |
| email | VARCHAR(255) | Sim | Email principal |
| telefone | VARCHAR(20) | Não | Telefone |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.2 LOJAS (stores)
Cada unidade física da empresa.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| empresa_id | UUID (FK) | Sim | Referência à empresa |
| nome | VARCHAR(255) | Sim | Nome da loja |
| codigo | VARCHAR(20) | Sim | Código interno da loja |
| cnpj | VARCHAR(18) | Não | CNPJ da filial (se diferente) |
| inscricao_estadual | VARCHAR(20) | Não | IE para NF |
| endereco | JSONB | Sim | {rua, numero, bairro, cidade, estado, cep} |
| telefone | VARCHAR(20) | Não | Telefone da loja |
| ativa | BOOLEAN | Sim | Se a loja está ativa |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.3 USUÁRIOS (users)
Funcionários e administradores do sistema.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| empresa_id | UUID (FK) | Sim | Referência à empresa |
| email | VARCHAR(255) | Sim | Email (login) |
| senha_hash | VARCHAR(255) | Sim | Senha criptografada |
| nome | VARCHAR(255) | Sim | Nome completo |
| cpf | VARCHAR(14) | Não | CPF do funcionário |
| telefone | VARCHAR(20) | Não | Telefone |
| cargo | ENUM | Sim | 'admin', 'gerente', 'vendedor', 'caixa' |
| avatar_url | TEXT | Não | URL da foto |
| ativo | BOOLEAN | Sim | Se o usuário está ativo |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.4 USUÁRIO_LOJAS (user_stores)
Relacionamento N:N entre usuários e lojas (permissão de acesso).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| user_id | UUID (FK) | Sim | Referência ao usuário |
| store_id | UUID (FK) | Sim | Referência à loja |
| permissoes | JSONB | Não | Permissões específicas na loja |
| created_at | TIMESTAMP | Sim | Data de criação |

---

### 2.5 CATEGORIAS (categories)
Categorias de produtos.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| empresa_id | UUID (FK) | Sim | Referência à empresa |
| nome | VARCHAR(100) | Sim | Nome da categoria |
| descricao | TEXT | Não | Descrição |
| cor | VARCHAR(7) | Não | Cor hex para exibição |
| icone | VARCHAR(50) | Não | Nome do ícone |
| ordem | INTEGER | Não | Ordem de exibição |
| ativa | BOOLEAN | Sim | Se está ativa |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.6 PRODUTOS (products)
Cadastro base dos produtos.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| empresa_id | UUID (FK) | Sim | Referência à empresa |
| categoria_id | UUID (FK) | Não | Referência à categoria |
| nome | VARCHAR(255) | Sim | Nome do produto |
| descricao | TEXT | Não | Descrição detalhada |
| codigo_interno | VARCHAR(50) | Não | Código interno |
| codigo_barras | VARCHAR(50) | Não | Código de barras (EAN) |
| unidade_medida | ENUM | Sim | 'un', 'kg', 'g', 'l', 'ml', 'cx', 'pc' |
| preco_custo | DECIMAL(10,2) | Não | Preço de custo |
| preco_venda | DECIMAL(10,2) | Sim | Preço de venda |
| margem_lucro | DECIMAL(5,2) | Não | Margem de lucro % |
| ncm | VARCHAR(10) | Não | NCM para NF |
| cest | VARCHAR(10) | Não | CEST para NF |
| cfop | VARCHAR(10) | Não | CFOP para NF |
| origem | ENUM | Não | Origem do produto (NF) |
| imagem_url | TEXT | Não | URL da imagem |
| ativo | BOOLEAN | Sim | Se está ativo |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.7 VARIAÇÕES DE PRODUTO (product_variants)
Variações de um mesmo produto (tamanho, cor, etc).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| produto_id | UUID (FK) | Sim | Referência ao produto base |
| nome | VARCHAR(100) | Sim | Nome da variação (ex: "350ml") |
| sku | VARCHAR(50) | Não | SKU único |
| codigo_barras | VARCHAR(50) | Não | Código de barras específico |
| preco_custo | DECIMAL(10,2) | Não | Preço de custo (se diferente) |
| preco_venda | DECIMAL(10,2) | Não | Preço de venda (se diferente) |
| atributos | JSONB | Não | {tamanho: "350ml", cor: "verde"} |
| imagem_url | TEXT | Não | Imagem específica da variação |
| ativo | BOOLEAN | Sim | Se está ativa |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.8 ESTOQUE (stock)
Controle de estoque por loja e produto/variação.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| loja_id | UUID (FK) | Sim | Referência à loja |
| produto_id | UUID (FK) | Sim | Referência ao produto |
| variante_id | UUID (FK) | Não | Referência à variação (se aplicável) |
| quantidade | DECIMAL(10,3) | Sim | Quantidade atual |
| quantidade_minima | DECIMAL(10,3) | Não | Alerta de estoque mínimo |
| quantidade_maxima | DECIMAL(10,3) | Não | Estoque máximo recomendado |
| localizacao | VARCHAR(50) | Não | Localização física (prateleira) |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.9 MOVIMENTAÇÕES DE ESTOQUE (stock_movements)
Histórico de todas as movimentações.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| loja_id | UUID (FK) | Sim | Referência à loja |
| produto_id | UUID (FK) | Sim | Referência ao produto |
| variante_id | UUID (FK) | Não | Referência à variação |
| usuario_id | UUID (FK) | Sim | Quem fez a movimentação |
| tipo | ENUM | Sim | 'entrada', 'saida', 'ajuste', 'transferencia' |
| quantidade | DECIMAL(10,3) | Sim | Quantidade movimentada |
| quantidade_anterior | DECIMAL(10,3) | Sim | Quantidade antes |
| quantidade_posterior | DECIMAL(10,3) | Sim | Quantidade depois |
| motivo | VARCHAR(255) | Não | Motivo da movimentação |
| referencia_tipo | ENUM | Não | 'venda', 'compra', 'ajuste_manual', 'transferencia' |
| referencia_id | UUID | Não | ID da venda, compra, etc |
| created_at | TIMESTAMP | Sim | Data da movimentação |

---

### 2.10 CLIENTES (customers)
Cadastro de clientes.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| empresa_id | UUID (FK) | Sim | Referência à empresa |
| nome | VARCHAR(255) | Sim | Nome completo |
| tipo_documento | ENUM | Sim | 'cpf', 'cnpj' |
| documento | VARCHAR(18) | Não | CPF ou CNPJ |
| email | VARCHAR(255) | Não | Email |
| telefone | VARCHAR(20) | Não | Telefone principal |
| celular | VARCHAR(20) | Não | Celular/WhatsApp |
| endereco | JSONB | Não | {rua, numero, bairro, cidade, estado, cep} |
| data_nascimento | DATE | Não | Data de nascimento |
| limite_credito | DECIMAL(10,2) | Não | Limite para fiado |
| observacoes | TEXT | Não | Observações gerais |
| ativo | BOOLEAN | Sim | Se está ativo |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.11 VENDAS (sales)
Registro de vendas/pedidos.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| loja_id | UUID (FK) | Sim | Referência à loja |
| usuario_id | UUID (FK) | Sim | Vendedor/Operador |
| cliente_id | UUID (FK) | Não | Cliente (se identificado) |
| numero | SERIAL | Sim | Número sequencial da venda |
| status | ENUM | Sim | 'aberta', 'finalizada', 'cancelada' |
| subtotal | DECIMAL(10,2) | Sim | Soma dos itens |
| desconto_tipo | ENUM | Não | 'percentual', 'valor' |
| desconto_valor | DECIMAL(10,2) | Não | Valor do desconto |
| total | DECIMAL(10,2) | Sim | Total final |
| observacoes | TEXT | Não | Observações da venda |
| created_at | TIMESTAMP | Sim | Data/hora da venda |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.12 ITENS DA VENDA (sale_items)
Produtos de cada venda.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| venda_id | UUID (FK) | Sim | Referência à venda |
| produto_id | UUID (FK) | Sim | Referência ao produto |
| variante_id | UUID (FK) | Não | Referência à variação |
| quantidade | DECIMAL(10,3) | Sim | Quantidade vendida |
| preco_unitario | DECIMAL(10,2) | Sim | Preço unitário no momento |
| preco_custo | DECIMAL(10,2) | Não | Custo no momento (para lucro) |
| desconto_tipo | ENUM | Não | 'percentual', 'valor' |
| desconto_valor | DECIMAL(10,2) | Não | Desconto no item |
| subtotal | DECIMAL(10,2) | Sim | Quantidade x Preço - Desconto |
| created_at | TIMESTAMP | Sim | Data de criação |

---

### 2.13 PAGAMENTOS (payments)
Pagamentos de cada venda.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| venda_id | UUID (FK) | Sim | Referência à venda |
| forma_pagamento | ENUM | Sim | 'dinheiro', 'pix', 'credito', 'debito', 'fiado' |
| valor | DECIMAL(10,2) | Sim | Valor pago |
| troco | DECIMAL(10,2) | Não | Troco (se dinheiro) |
| bandeira | VARCHAR(50) | Não | Bandeira do cartão |
| nsu | VARCHAR(50) | Não | NSU da transação |
| autorizacao | VARCHAR(50) | Não | Código de autorização |
| parcelas | INTEGER | Não | Número de parcelas |
| created_at | TIMESTAMP | Sim | Data do pagamento |

---

### 2.14 FIADO/CREDIÁRIO (credit_sales)
Controle de vendas fiadas.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| loja_id | UUID (FK) | Sim | Referência à loja |
| cliente_id | UUID (FK) | Sim | Referência ao cliente |
| venda_id | UUID (FK) | Sim | Referência à venda |
| valor_total | DECIMAL(10,2) | Sim | Valor total fiado |
| valor_pago | DECIMAL(10,2) | Sim | Valor já pago |
| valor_restante | DECIMAL(10,2) | Sim | Valor pendente |
| data_vencimento | DATE | Não | Data de vencimento |
| status | ENUM | Sim | 'pendente', 'parcial', 'pago', 'atrasado' |
| observacoes | TEXT | Não | Observações |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.15 PAGAMENTOS DO FIADO (credit_payments)
Pagamentos parciais do fiado.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| fiado_id | UUID (FK) | Sim | Referência ao fiado |
| usuario_id | UUID (FK) | Sim | Quem recebeu |
| valor | DECIMAL(10,2) | Sim | Valor pago |
| forma_pagamento | ENUM | Sim | 'dinheiro', 'pix', 'credito', 'debito' |
| observacoes | TEXT | Não | Observações |
| created_at | TIMESTAMP | Sim | Data do pagamento |

---

### 2.16 NOTAS FISCAIS (invoices)
Controle de NFC-e/NF-e emitidas.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| loja_id | UUID (FK) | Sim | Referência à loja |
| venda_id | UUID (FK) | Sim | Referência à venda |
| tipo | ENUM | Sim | 'nfce', 'nfe' |
| numero | INTEGER | Sim | Número da nota |
| serie | INTEGER | Sim | Série da nota |
| chave_acesso | VARCHAR(44) | Não | Chave de acesso |
| protocolo | VARCHAR(50) | Não | Protocolo de autorização |
| status | ENUM | Sim | 'pendente', 'autorizada', 'cancelada', 'inutilizada' |
| xml | TEXT | Não | XML da nota |
| pdf_url | TEXT | Não | URL do DANFE |
| data_emissao | TIMESTAMP | Não | Data/hora de emissão |
| data_autorizacao | TIMESTAMP | Não | Data/hora de autorização |
| motivo_cancelamento | TEXT | Não | Motivo (se cancelada) |
| created_at | TIMESTAMP | Sim | Data de criação |
| updated_at | TIMESTAMP | Sim | Última atualização |

---

### 2.17 CAIXA (cash_registers)
Controle de abertura/fechamento de caixa.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| loja_id | UUID (FK) | Sim | Referência à loja |
| usuario_abertura_id | UUID (FK) | Sim | Quem abriu |
| usuario_fechamento_id | UUID (FK) | Não | Quem fechou |
| valor_abertura | DECIMAL(10,2) | Sim | Valor inicial |
| valor_fechamento | DECIMAL(10,2) | Não | Valor final informado |
| valor_sistema | DECIMAL(10,2) | Não | Valor calculado pelo sistema |
| diferenca | DECIMAL(10,2) | Não | Diferença (quebra de caixa) |
| status | ENUM | Sim | 'aberto', 'fechado' |
| observacoes | TEXT | Não | Observações |
| data_abertura | TIMESTAMP | Sim | Data/hora abertura |
| data_fechamento | TIMESTAMP | Não | Data/hora fechamento |

---

### 2.18 MOVIMENTAÇÕES DE CAIXA (cash_movements)
Sangrias, reforços e outras movimentações.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| caixa_id | UUID (FK) | Sim | Referência ao caixa |
| usuario_id | UUID (FK) | Sim | Quem fez |
| tipo | ENUM | Sim | 'sangria', 'reforco', 'venda', 'pagamento_fiado' |
| valor | DECIMAL(10,2) | Sim | Valor (positivo ou negativo) |
| descricao | TEXT | Não | Descrição |
| created_at | TIMESTAMP | Sim | Data/hora |

---

### 2.19 ALERTAS DE ESTOQUE (stock_alerts)
Notificações de estoque baixo.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| loja_id | UUID (FK) | Sim | Referência à loja |
| produto_id | UUID (FK) | Sim | Referência ao produto |
| variante_id | UUID (FK) | Não | Referência à variação |
| tipo | ENUM | Sim | 'estoque_baixo', 'estoque_zerado', 'vencimento' |
| quantidade_atual | DECIMAL(10,3) | Sim | Quantidade no momento do alerta |
| quantidade_minima | DECIMAL(10,3) | Não | Quantidade mínima configurada |
| lido | BOOLEAN | Sim | Se foi lido/visualizado |
| created_at | TIMESTAMP | Sim | Data do alerta |

---

## 3. Relacionamentos Principais

```
EMPRESA (1) ────────< (N) LOJAS
    │
    └──────────────< (N) USUÁRIOS
    │                    │
    │                    └────< (N) USUÁRIO_LOJAS >────(N) LOJAS
    │
    └──────────────< (N) CATEGORIAS
    │
    └──────────────< (N) PRODUTOS
    │                    │
    │                    └────< (N) VARIAÇÕES
    │                    │
    │                    └────< (N) ESTOQUE (por loja)
    │
    └──────────────< (N) CLIENTES
                         │
                         └────< (N) VENDAS
                                   │
                                   ├────< (N) ITENS_VENDA
                                   │
                                   ├────< (N) PAGAMENTOS
                                   │
                                   ├────< (1) FIADO
                                   │         │
                                   │         └────< (N) PAGAMENTOS_FIADO
                                   │
                                   └────< (1) NOTA_FISCAL
```

---

## 4. Regras de Negócio Importantes

### 4.1 Estoque
- [ ] Estoque é controlado **por loja** (cada loja tem seu próprio estoque)
- [ ] Movimentações são registradas automaticamente em vendas
- [ ] Alertas são gerados quando quantidade < quantidade_minima
- [ ] Produtos com variação têm estoque na variação, não no produto base
- [ ] Permitir estoque negativo? (configurável por empresa)

### 4.2 Vendas
- [ ] Venda só pode ser cancelada se não tiver NF autorizada
- [ ] Ao cancelar venda, estoque deve ser devolvido
- [ ] Desconto pode ser por item ou na venda total
- [ ] Múltiplas formas de pagamento na mesma venda

### 4.3 Fiado
- [ ] Cliente precisa ter cadastro completo para fiado
- [ ] Respeitar limite de crédito do cliente
- [ ] Bloquear novas vendas fiado se cliente estiver inadimplente (configurável)
- [ ] Permitir pagamentos parciais

### 4.4 Notas Fiscais
- [ ] NFC-e para consumidor final (CPF opcional)
- [ ] NF-e para pessoa jurídica
- [ ] Contingência offline quando SEFAZ indisponível
- [ ] Cancelamento até 24h após emissão

### 4.5 Usuários e Permissões
- [ ] **Admin**: Acesso total
- [ ] **Gerente**: Gerencia loja específica, relatórios, estoque
- [ ] **Vendedor**: PDV, consulta estoque
- [ ] **Caixa**: Apenas PDV e caixa

### 4.6 Caixa
- [ ] Caixa deve ser aberto antes de vender
- [ ] Apenas um caixa aberto por usuário
- [ ] Sangria requer justificativa
- [ ] Fechamento exige contagem de valores

---

## 5. Índices Sugeridos para Performance

```sql
-- Busca de produtos
CREATE INDEX idx_products_empresa ON products(empresa_id);
CREATE INDEX idx_products_categoria ON products(categoria_id);
CREATE INDEX idx_products_codigo_barras ON products(codigo_barras);
CREATE INDEX idx_products_nome ON products(nome);

-- Estoque
CREATE INDEX idx_stock_loja_produto ON stock(loja_id, produto_id);
CREATE INDEX idx_stock_quantidade ON stock(quantidade);

-- Vendas
CREATE INDEX idx_sales_loja ON sales(loja_id);
CREATE INDEX idx_sales_data ON sales(created_at);
CREATE INDEX idx_sales_cliente ON sales(cliente_id);
CREATE INDEX idx_sales_status ON sales(status);

-- Movimentações
CREATE INDEX idx_stock_movements_data ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_produto ON stock_movements(produto_id);
```

---

## 6. Views Úteis para Relatórios

### 6.1 Produtos com Estoque Baixo
```sql
CREATE VIEW vw_estoque_baixo AS
SELECT
    s.loja_id,
    p.nome as produto,
    pv.nome as variacao,
    s.quantidade,
    s.quantidade_minima
FROM stock s
JOIN products p ON s.produto_id = p.id
LEFT JOIN product_variants pv ON s.variante_id = pv.id
WHERE s.quantidade <= s.quantidade_minima;
```

### 6.2 Vendas por Período
```sql
CREATE VIEW vw_vendas_periodo AS
SELECT
    DATE(created_at) as data,
    loja_id,
    COUNT(*) as total_vendas,
    SUM(total) as valor_total
FROM sales
WHERE status = 'finalizada'
GROUP BY DATE(created_at), loja_id;
```

### 6.3 Produtos Mais Vendidos
```sql
CREATE VIEW vw_produtos_mais_vendidos AS
SELECT
    p.id,
    p.nome,
    pv.nome as variacao,
    SUM(si.quantidade) as quantidade_vendida,
    SUM(si.subtotal) as valor_total
FROM sale_items si
JOIN products p ON si.produto_id = p.id
LEFT JOIN product_variants pv ON si.variante_id = pv.id
JOIN sales s ON si.venda_id = s.id
WHERE s.status = 'finalizada'
GROUP BY p.id, p.nome, pv.nome
ORDER BY quantidade_vendida DESC;
```

---

## 7. Configurações por Empresa

Sugiro uma tabela de configurações flexível:

### CONFIGURAÇÕES (settings)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| empresa_id | UUID (FK) | Empresa |
| loja_id | UUID (FK) | Loja (NULL = empresa toda) |
| chave | VARCHAR(100) | Nome da configuração |
| valor | JSONB | Valor da configuração |

**Configurações sugeridas:**
- `permitir_estoque_negativo`: true/false
- `bloquear_fiado_inadimplente`: true/false
- `dias_vencimento_fiado_padrao`: 30
- `alerta_estoque_percentual`: 20
- `impressora_termica`: {modelo, porta}
- `certificado_digital`: {tipo, senha, validade}

---

## 8. Fluxos Principais

### 8.1 Fluxo de Venda
1. Abrir/verificar caixa
2. Iniciar nova venda
3. Adicionar produtos (código de barras ou busca)
4. Aplicar descontos (se houver)
5. Identificar cliente (opcional)
6. Selecionar forma(s) de pagamento
7. Finalizar venda
8. Baixar estoque automaticamente
9. Emitir NFC-e (se configurado)
10. Imprimir cupom

### 8.2 Fluxo de Fiado
1. Venda normal até forma de pagamento
2. Selecionar "Fiado"
3. Obrigar identificação do cliente
4. Verificar limite de crédito
5. Registrar fiado com vencimento
6. Gerar alerta de cobrança (se configurado)

### 8.3 Fluxo de Reabastecimento
1. Receber mercadoria
2. Entrada de estoque (manual ou via NF de entrada)
3. Registrar movimentação
4. Atualizar quantidade em estoque
5. Limpar alertas de estoque baixo

---

## 9. Próximos Passos

1. **Você**: Criar as tabelas no Supabase seguindo este documento
2. **Você**: Configurar Row Level Security (RLS) para multi-tenancy
3. **Você**: Criar as policies de acesso por empresa/loja
4. **Eu**: Desenvolver o frontend com localStorage temporário
5. **Integração**: Substituir localStorage pelo Supabase client

---

## 10. Considerações de Segurança

- [ ] RLS obrigatório em todas as tabelas
- [ ] Usuário só acessa dados da própria empresa
- [ ] Usuário só acessa lojas vinculadas
- [ ] Logs de auditoria para operações sensíveis
- [ ] Certificado digital armazenado com criptografia
- [ ] Senhas com hash bcrypt/argon2

---

**Documento criado em**: Janeiro/2026
**Versão**: 1.0
