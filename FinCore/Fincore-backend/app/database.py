# Fincore-backend/app/database.py

# Bibliotecas externas
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Módulos internos
from app.models import Base

# Configuração da URI de conexão para a base de dados SQLite local
URL_DO_BANCO = "sqlite:///./fincore.db"

# Inicialização do engine do SQLAlchemy com isolamento de thread para compatibilidade assíncrona do SQLite
engine = create_engine(
    URL_DO_BANCO,
    connect_args={"check_same_thread": False},
)

# Configuração do construtor de sessões (Session Factory) com desativação de autocommit/autoflush manuais
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Execução automática do DDL para criação e sincronização das tabelas mapeadas no modelo relacional
Base.metadata.create_all(bind=engine)

def get_db():
    """
    Gerenciador de contexto para injeção de dependência do ciclo de vida da sessão do banco de dados.

    Garante a abertura e disponibilização de uma conexão isolada por requisição HTTP,
    fornecendo um bloco try/finally para assegurar o encerramento da sessão e mitigar riscos de connection leak.

    Yields:
        Session: Instância ativa de sessão do SQLAlchemy conectada ao banco de dados.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()