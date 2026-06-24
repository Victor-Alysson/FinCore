# Fincore-backend/app/schemas.py

# Bibliotecas nativas
from typing import Optional

# Bibliotecas externas
from pydantic import BaseModel, EmailStr

# ==========================================
# 1. SCHEMAS DE AUTENTICAÇÃO E RECUPERAÇÃO
# ==========================================

class UsuarioLogin(BaseModel):
    """Schema para validação de credenciais de acesso (Login)."""
    email: EmailStr
    senha: str

class VerificarRespostas(BaseModel):
    """Schema para validação das perguntas de segurança na recuperação de conta."""
    email: EmailStr
    pergunta1: str
    pergunta2: str
    pergunta3: str

class RedefinirSenha(BaseModel):
    """Schema para payload de redefinição de senha esquecida."""
    email: EmailStr
    pergunta1: str
    pergunta2: str
    pergunta3: str
    nova_senha: str

# ==========================================
# 2. SCHEMAS DE USUÁRIO E PERFIL
# ==========================================

class UsuarioCriar(BaseModel):
    """Schema para payload de criação de novo usuário e configuração das perguntas de segurança."""
    nome: str
    email: EmailStr
    senha: str
    pergunta1: str
    pergunta2: str
    pergunta3: str

class UsuarioAtualizarPerfil(BaseModel):
    """Schema para validação de atualização de dados e credenciais do perfil do usuário autenticado."""
    senha_atual: str
    novo_nome: Optional[str] = None
    nova_senha: Optional[str] = None
    pergunta1: Optional[str] = None
    pergunta2: Optional[str] = None
    pergunta3: Optional[str] = None

class DeletarContaRequest(BaseModel):
    """Schema para validação de segurança no encerramento definitivo de conta."""
    senha_atual: str

class UsuarioResponse(BaseModel):
    """Schema de serialização para retorno de dados base do usuário."""
    id: int
    email: EmailStr

    class Config:
        from_attributes = True

# ==========================================
# 3. SCHEMAS DE BANCOS (CONTAS)
# ==========================================

class BancoCriar(BaseModel):
    """Schema para payload de registro de nova instituição bancária ou conta."""
    nome: str

class BancoResponse(BaseModel):
    """Schema de serialização para retorno de dados bancários."""
    id: int
    nome: str
    usuario_id: int

    class Config:
        from_attributes = True

# ==========================================
# 4. SCHEMAS DE TRANSAÇÕES
# ==========================================

class Transacao(BaseModel):
    """Schema para payload de criação de lançamento no fluxo de caixa (Entrada/Saída)."""
    valor: float
    tipo: str
    descricao: str
    categoria: str
    data: str
    banco_id: int

class TransacaoResponse(BaseModel):
    """Schema de serialização para retorno de lançamentos de fluxo de caixa."""
    id: int
    valor: float
    tipo: str
    descricao: str
    categoria: str
    data: str
    banco_id: int

    class Config:
        from_attributes = True

# ==========================================
# 5. SCHEMAS DE DÍVIDAS (PASSIVOS)
# ==========================================

class DividaCriar(BaseModel):
    """Schema para payload de registro de passivos e empréstimos."""
    credor: str
    tipo: str
    taxa_juro: float
    prestacao: float
    valor_total: float
    valor_pago: float
    status: Optional[str] = "Ativa"
    data_contraira: str
    data_final: Optional[str] = None
    banco_id: int

class DividaResponse(BaseModel):
    """Schema de serialização para retorno de dados de passivos."""
    id: int
    credor: str
    tipo: str
    taxa_juro: float
    prestacao: float
    valor_total: float
    valor_pago: float
    status: str
    data_contraira: str
    data_final: Optional[str] = None
    banco_id: int

    class Config:
        from_attributes = True

# ==========================================
# 6. SCHEMAS DE INVESTIMENTOS (ATIVOS)
# ==========================================

class InvestimentoCriar(BaseModel):
    """Schema para payload de registro de ativos (Renda Fixa, Variável ou Cripto)."""
    ticker: str
    nome: str
    tipo: str
    quantidade: float
    preco_medio: float
    preco_atual: float
    corretora: str
    data_adquirido: str
    data_final: Optional[str] = None
    banco_id: int

class InvestimentoResponse(BaseModel):
    """Schema de serialização para retorno de dados de ativos."""
    id: int
    ticker: str
    nome: str
    tipo: str
    quantidade: float
    preco_medio: float
    preco_atual: float
    corretora: str
    data_adquirido: str
    data_final: Optional[str] = None
    banco_id: int

    class Config:
        from_attributes = True