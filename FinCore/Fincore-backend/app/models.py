# Fincore-backend/app/models.py

# Bibliotecas externas
from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import declarative_base, relationship

# Instanciação da classe base declarativa para mapeamento ORM
Base = declarative_base()

class UsuarioDB(Base):
    """
    Modelo relacional para a entidade Usuário.

    Mapeia a tabela 'usuarios', armazenando credenciais, hashes de segurança
    e dados de recuperação. Detém relacionamento de um-para-muitos com a entidade BancoDB.
    """
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String, unique=True, index=True)
    senha_hash = Column(String)
    pergunta1 = Column(String)
    pergunta2 = Column(String)
    pergunta3 = Column(String)

    # Relacionamento bidirecional com propagação de deleção (cascade)
    bancos = relationship("BancoDB", back_populates="dono", cascade="all, delete-orphan")


class BancoDB(Base):
    """
    Modelo relacional para a entidade Banco (Instituição/Conta).

    Mapeia a tabela 'bancos', vinculada a um UsuarioDB. Atua como agregador
    (chave estrangeira) para TransacaoDB, InvestimentoDB e DividaDB, aplicando
    deleção em cascata (delete-orphan) para garantir integridade referencial.
    """
    __tablename__ = "bancos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    dono = relationship("UsuarioDB", back_populates="bancos")

    # Relacionamentos bidirecionais dependentes com integridade referencial estrita
    transacoes = relationship("TransacaoDB", back_populates="banco", cascade="all, delete-orphan")
    investimentos = relationship("InvestimentoDB", back_populates="banco", cascade="all, delete-orphan")
    dividas = relationship("DividaDB", back_populates="banco", cascade="all, delete-orphan")


class TransacaoDB(Base):
    """
    Modelo relacional para a entidade Transação (Fluxo de Caixa).

    Mapeia a tabela 'transacoes', registrando lançamentos de entradas e saídas
    associadas a um BancoDB específico.
    """
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    valor = Column(Float)
    tipo = Column(String)
    descricao = Column(String)
    categoria = Column(String)
    data = Column(String)

    banco_id = Column(Integer, ForeignKey("bancos.id"))
    banco = relationship("BancoDB", back_populates="transacoes")


class InvestimentoDB(Base):
    """
    Modelo relacional para a entidade Investimento (Ativos).

    Mapeia a tabela 'investimentos', armazenando posições de renda fixa,
    variável ou criptoativos alocados sob um BancoDB.
    """
    __tablename__ = "investimentos"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    nome = Column(String)
    tipo = Column(String)
    quantidade = Column(Float)
    preco_medio = Column(Float)
    preco_atual = Column(Float)
    corretora = Column(String)
    data_adquirido = Column(String)
    data_final = Column(String, nullable=True)

    banco_id = Column(Integer, ForeignKey("bancos.id"))
    banco = relationship("BancoDB", back_populates="investimentos")


class DividaDB(Base):
    """
    Modelo relacional para a entidade Dívida (Passivos).

    Mapeia a tabela 'dividas', registrando passivos, financiamentos e
    empréstimos vinculados a um BancoDB.
    """
    __tablename__ = "dividas"

    id = Column(Integer, primary_key=True, index=True)
    credor = Column(String, index=True)
    tipo = Column(String)
    taxa_juro = Column(Float)
    prestacao = Column(Float)
    valor_total = Column(Float)
    valor_pago = Column(Float, default=0.0)
    status = Column(String, default="Ativa")
    data_contraira = Column(String)
    data_final = Column(String, nullable=True)

    banco_id = Column(Integer, ForeignKey("bancos.id"))
    banco = relationship("BancoDB", back_populates="dividas")