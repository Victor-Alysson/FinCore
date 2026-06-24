# Fincore-backend/main.py

# Bibliotecas externas
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Módulos internos e inicialização de dependências de banco de dados
import app.database
from app.routers import usuarios, bancos, transacoes, dividas, investimentos

# Instanciação central da aplicação
app = FastAPI(title="FinCore API - Backend")

# Configuração de CORS (Cross-Origin Resource Sharing) para comunicação com o Front-End
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://fin-core2-0-fvnquuizh-victor-alyssons-projects.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão modular de roteadores para isolamento de domínios
app.include_router(usuarios.router)
app.include_router(bancos.router)
app.include_router(transacoes.router)
app.include_router(dividas.router)
app.include_router(investimentos.router)

# Endpoints de validação global e telemetria básica
@app.get("/")
def raiz() -> dict:
    """
    Rota raiz de validação do serviço.

    Retorno:
        dict: Objeto contendo o nome do sistema, status de operação e mensagem de confirmação.
    """
    return {
        "sistema": "FinCore API",
        "status": "Online",
        "mensagem": "Servidor central do FinCore rodando com sucesso!"
    }

@app.get("/ping")
def ping() -> dict:
    """
    Endpoint de health check para monitoramento de disponibilidade.

    Retorno:
        dict: Objeto com o status de operação do servidor.
    """
    return {"status": "online"}