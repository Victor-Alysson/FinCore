# Fincore-backend/app/security.py

# Bibliotecas externas
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

# Módulos internos
from app.auth import ALGORITHM, SECRET_KEY

# Configuração do esquema de autenticação OAuth2 (fluxo de senha) para injeção de dependência
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def obter_usuario_atual(token: str = Depends(oauth2_scheme)) -> str:
    """
    Valida o token JWT injetado na requisição e extrai o identificador do usuário.

    Utiliza a chave secreta e o algoritmo definidos nas configurações globais para decodificar
    o payload. Caso a assinatura seja inválida, o token esteja expirado ou o campo
    'sub' (subject) não seja encontrado, uma exceção HTTP 401 é levantada.

    Parâmetros:
        token (str): Token JWT extraído automaticamente do cabeçalho de autorização (Bearer).

    Retorno:
        str: O identificador do usuário (email) extraído do payload decodificado.
        
    Exceções:
        HTTPException: Retorna status 401 Unauthorized em caso de falha na decodificação ou ausência de dados.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception