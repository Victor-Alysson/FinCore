# Fincore-backend/app/auth.py

# Bibliotecas nativas
import os
from datetime import datetime, timedelta, timezone

# Bibliotecas externas
from dotenv import load_dotenv
from jose import jwt

# Inicialização do carregamento de variáveis de ambiente
load_dotenv()

# Configurações globais de criptografia e tokenização
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def criar_token(dados: dict) -> str:
    """
    Gera um token JWT (JSON Web Token) com tempo de expiração predefinido.

    Parâmetros:
        dados (dict): Carga útil (payload) contendo as informações a serem codificadas.

    Retorno:
        str: Token JWT codificado e assinado.
    """
    # Cópia do payload para evitar mutação do dicionário de entrada
    to_encode = dados.copy()
    
    # Definição do tempo de expiração (30 minutos a partir do instante atual em UTC)
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    
    # Geração e retorno do token assinado com a chave secreta
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)