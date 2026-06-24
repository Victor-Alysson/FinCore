# Fincore-backend/app/routers/transacoes.py

# Bibliotecas nativas
from typing import List

# Bibliotecas externas
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Módulos internos
from app.database import get_db
from app.models import BancoDB, TransacaoDB, UsuarioDB
from app.schemas import Transacao, TransacaoResponse
from app.security import obter_usuario_atual

router = APIRouter(prefix="/transacoes", tags=["Transações"])

@router.post("", response_model=TransacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_transacao(
    transacao: Transacao,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> TransacaoDB:
    """
    Registra um novo lançamento financeiro (fluxo de caixa) vinculado a uma conta bancária.

    Assegura a integridade referencial validando a existência da conta de destino e
    sua titularidade em relação ao usuário autenticado.

    Parâmetros:
        transacao (Transacao): Esquema de validação com os dados estruturais do lançamento.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        TransacaoDB: Instância do modelo relacional contendo o lançamento recém-criado.

    Exceções:
        HTTPException (404): Levantada caso o banco_id não seja localizado ou não pertença ao usuário.
    """
    # Resolução da identidade do usuário logado
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Verificação de propriedade da instituição financeira de destino
    banco = db.query(BancoDB).filter(
        BancoDB.id == transacao.banco_id,
        BancoDB.usuario_id == usuario.id
    ).first()

    if not banco:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco não encontrado ou não pertence a você."
        )

    # Instanciação da entidade relacional de transação
    nova_transacao = TransacaoDB(
        valor=transacao.valor,
        tipo=transacao.tipo,
        descricao=transacao.descricao,
        categoria=transacao.categoria,
        data=transacao.data,
        banco_id=banco.id
    )

    # Persistência transacional
    db.add(nova_transacao)
    db.commit()
    db.refresh(nova_transacao)
    
    return nova_transacao

@router.get("", response_model=List[TransacaoResponse])
def listar_transacoes(
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> List[TransacaoDB]:
    """
    Recupera a totalidade de lançamentos financeiros atrelados às contas do usuário.

    Realiza uma junção (JOIN) entre as entidades de transações e bancos para aplicar
    o isolamento de escopo e garantir o retorno exclusivo de dados do usuário autenticado.

    Parâmetros:
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        List[TransacaoDB]: Lista de entidades ORM contendo o histórico de transações.
    """
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    # Extração isolada por cláusula de junção garantindo restrição de titularidade
    transacoes = db.query(TransacaoDB).join(BancoDB).filter(BancoDB.usuario_id == usuario.id).all()
    
    return transacoes

@router.put("/{transacao_id}", response_model=TransacaoResponse)
def atualizar_transacao(
    transacao_id: int,
    transacao_atualizada: Transacao,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> TransacaoDB:
    """
    Atualiza os dados cadastrais e financeiros de um lançamento existente.

    Implementa validação estrita de titularidade do lançamento e, caso haja alteração da
    conta vinculada (banco_id), impõe verificação de propriedade sobre a nova conta de destino.

    Parâmetros:
        transacao_id (int): Identificador primário da transação a ser modificada.
        transacao_atualizada (Transacao): Esquema validado com os novos dados do lançamento.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        TransacaoDB: Instância atualizada e sincronizada com a base de dados.

    Exceções:
        HTTPException (404): Levantada se o lançamento não for encontrado ou não pertencer ao usuário.
        HTTPException (400): Levantada em tentativas de transferência para uma conta de terceiros.
    """
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Resolução do registro original com junção para garantia de escopo
    transacao_db = db.query(TransacaoDB).join(BancoDB).filter(
        TransacaoDB.id == transacao_id,
        BancoDB.usuario_id == usuario.id
    ).first()

    if not transacao_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada ou não pertence a você."
        )

    # Validação de titularidade condicional em alterações de chave estrangeira
    if transacao_atualizada.banco_id != transacao_db.banco_id:
        novo_banco = db.query(BancoDB).filter(
            BancoDB.id == transacao_atualizada.banco_id,
            BancoDB.usuario_id == usuario.id
        ).first()

        if not novo_banco:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O novo banco selecionado não pertence a você."
            )

    # Mutação das propriedades monitoradas pelo ORM
    transacao_db.valor = transacao_atualizada.valor
    transacao_db.tipo = transacao_atualizada.tipo
    transacao_db.descricao = transacao_atualizada.descricao
    transacao_db.categoria = transacao_atualizada.categoria
    transacao_db.data = transacao_atualizada.data
    transacao_db.banco_id = transacao_atualizada.banco_id

    # Sincronização transacional
    db.commit()
    db.refresh(transacao_db)
    
    return transacao_db

@router.delete("/{transacao_id}")
def deletar_transacao(
    transacao_id: int,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> dict:
    """
    Remove definitivamente um registro de lançamento financeiro.

    Exige verificação prévia de titularidade baseada no relacionamento com a conta
    bancária, protegendo a base contra deleções indevidas.

    Parâmetros:
        transacao_id (int): Identificador primário da transação.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        dict: Resposta de confirmação de exclusão bem-sucedida.

    Exceções:
        HTTPException (404): Levantada caso a transação não exista ou viole a restrição de escopo.
    """
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Validação de existência e escopo de deleção via junção relacional
    transacao = db.query(TransacaoDB).join(BancoDB).filter(
        TransacaoDB.id == transacao_id,
        BancoDB.usuario_id == usuario.id
    ).first()

    if not transacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada ou não pertence a você."
        )

    # Execução DML de deleção com processamento transacional
    db.delete(transacao)
    db.flush()
    db.commit()

    return {"mensagem": "Transação deletada com sucesso!"}