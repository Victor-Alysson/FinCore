# Fincore-backend/app/routers/bancos.py

# Bibliotecas nativas
from typing import List

# Bibliotecas externas
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Módulos internos
from app.database import get_db
from app.models import BancoDB, UsuarioDB
from app.schemas import BancoCriar, BancoResponse
from app.security import obter_usuario_atual

router = APIRouter(prefix="/bancos", tags=["Bancos"])

@router.post("", response_model=BancoResponse, status_code=status.HTTP_201_CREATED)
def criar_banco(
    banco: BancoCriar,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
):
    """
    Registra uma nova instituição bancária ou conta vinculada ao usuário autenticado.

    Realiza a validação de unicidade de nomenclatura de bancos no escopo do usuário
    para mitigar registros duplicados no banco de dados.

    Parâmetros:
        banco (BancoCriar): Payload contendo os dados do banco a ser instanciado.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        BancoResponse: Objeto serializado com os dados do banco recém-criado.

    Exceções:
        HTTPException (400): Levantada caso o usuário já possua uma instituição cadastrada com a mesma nomenclatura.
    """
    # Resolução da identidade do recurso (usuário)
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Validação de unicidade da entidade BancoDB restrita ao ID do usuário atual
    banco_existente = db.query(BancoDB).filter(
        BancoDB.nome.ilike(banco.nome),
        BancoDB.usuario_id == usuario.id
    ).first()

    if banco_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já cadastrou um banco com este nome."
        )

    # Instanciação e persistência do novo registro
    novo_banco = BancoDB(
        nome=banco.nome,
        usuario_id=usuario.id
    )

    db.add(novo_banco)
    db.commit()
    db.refresh(novo_banco)
    
    return novo_banco

@router.get("", response_model=List[BancoResponse])
def listar_bancos(
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
):
    """
    Recupera a listagem de bancos/contas restritas ao usuário autenticado.

    Parâmetros:
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        List[BancoResponse]: Lista serializada representando as instituições atreladas ao usuário.
    """
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    # Filtro de isolamento de dados por chave estrangeira (usuario_id)
    return db.query(BancoDB).filter(BancoDB.usuario_id == usuario.id).all()

@router.delete("/{banco_id}")
def deletar_banco(
    banco_id: int,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
):
    """
    Remove um registro de instituição bancária e processa as deleções em cascata atreladas.

    Exige a verificação de propriedade (ownership) do registro no banco de dados antes da execução
    da operação DML para garantir o isolamento da manipulação de dados entre os usuários.

    Parâmetros:
        banco_id (int): Identificador primário do banco selecionado para exclusão.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        dict: Objeto com a mensagem de validação de sucesso.

    Exceções:
        HTTPException (404): Levantada em caso de falha na resolução do banco_id ou quebra de propriedade.
    """
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Verificação de existência da tupla e restrição de acesso por ID de usuário
    banco = db.query(BancoDB).filter(
        BancoDB.id == banco_id,
        BancoDB.usuario_id == usuario.id
    ).first()

    if not banco:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco não encontrado ou não pertence a você."
        )

    # DML de deleção seguido de processamento (flush) antes da efetivação transacional (commit)
    db.delete(banco)
    db.flush()
    db.commit()

    return {"mensagem": "Banco deletado com sucesso!"}