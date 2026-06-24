# Fincore-backend/app/routers/dividas.py

# Bibliotecas nativas
from typing import List

# Bibliotecas externas
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Módulos internos
from app.database import get_db
from app.models import BancoDB, DividaDB, UsuarioDB
from app.schemas import DividaCriar, DividaResponse
from app.security import obter_usuario_atual

router = APIRouter(prefix="/dividas", tags=["Dívidas"])

@router.post("", response_model=DividaResponse, status_code=status.HTTP_201_CREATED)
def criar_divida(
    divida: DividaCriar,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> DividaDB:
    """
    Registra um novo passivo financeiro ou contrato de empréstimo vinculado a uma conta bancária.

    Valida a existência e a titularidade do banco informado antes de associá-lo à nova dívida,
    garantindo o isolamento de dados entre usuários.

    Parâmetros:
        divida (DividaCriar): Esquema contendo os dados do passivo e o identificador do banco associado.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário autenticado extraído do token JWT.

    Retorno:
        DividaDB: Instância do modelo relacional contendo o passivo persistido e seu ID gerado.

    Exceções:
        HTTPException (404): Levantada caso o banco_id não seja encontrado ou não pertença ao usuário.
    """
    # Resolução da identidade do usuário logado
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    # Validação de propriedade e existência da instituição financeira informada
    banco = db.query(BancoDB).filter(BancoDB.id == divida.banco_id, BancoDB.usuario_id == usuario.id).first()
    
    if not banco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banco não encontrado ou inválido.")

    # Instanciação da entidade relacional de passivos
    nova_divida = DividaDB(
        credor=divida.credor,
        tipo=divida.tipo,
        taxa_juro=divida.taxa_juro,
        prestacao=divida.prestacao,
        valor_total=divida.valor_total,
        valor_pago=divida.valor_pago,
        status=divida.status,
        data_contraira=divida.data_contraira,
        data_final=divida.data_final,
        banco_id=banco.id
    )
    
    # Execução das instruções DML e persistência definitiva
    db.add(nova_divida)
    db.commit()
    db.refresh(nova_divida)
    
    return nova_divida

@router.get("", response_model=List[DividaResponse])
def listar_dividas(
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> List[DividaDB]:
    """
    Recupera a listagem completa de passivos vinculados a todas as contas do usuário autenticado.

    Executa uma operação de junção (JOIN) entre as tabelas de dívidas e bancos para filtrar
    apenas os registros pertencentes ao escopo do usuário ativo.

    Parâmetros:
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário autenticado extraído do token JWT.

    Retorno:
        List[DividaDB]: Lista de instâncias contendo as dívidas do usuário.
    """
    # Resolução da identidade do usuário logado
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    # Consulta estruturada com junção de tabelas para isolamento e extração de dados
    dividas = db.query(DividaDB).join(BancoDB).filter(BancoDB.usuario_id == usuario.id).all()
    
    return dividas

@router.put("/{divida_id}", response_model=DividaResponse)
def atualizar_divida(
    divida_id: int,
    divida_atualizada: DividaCriar,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> DividaDB:
    """
    Atualiza integralmente os dados cadastrais e financeiros de um passivo existente.

    Realiza dupla validação de propriedade: primeiro garante que a dívida pertence a uma conta
    do usuário; segundo, caso haja alteração de conta de destino (banco_id), valida se a nova conta
    também é de propriedade do requisitante.

    Parâmetros:
        divida_id (int): Identificador primário da dívida a ser modificada.
        divida_atualizada (DividaCriar): Esquema com as novas propriedades para atualização.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário autenticado extraído do token JWT.

    Retorno:
        DividaDB: Instância do modelo atualizada e sincronizada com a base de dados.

    Exceções:
        HTTPException (404): Levantada caso o passivo não exista ou viole restrições de propriedade.
        HTTPException (400): Levantada caso a nova conta bancária especificada seja inválida.
    """
    # Resolução da identidade do usuário logado
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    # Verificação de propriedade do registro original através de cláusula de junção
    divida_db = db.query(DividaDB).join(BancoDB).filter(
        DividaDB.id == dividid_id if 'dividid_id' in locals() else DividaDB.id == divida_id, 
        BancoDB.usuario_id == usuario.id
    ).first()
    
    if not divida_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dívida não encontrada.")

    # Validação de propriedade condicional em caso de reassociamento de instituição bancária
    if divida_atualizada.banco_id != divida_db.banco_id:
        novo_banco = db.query(BancoDB).filter(BancoDB.id == divida_atualizada.banco_id, BancoDB.usuario_id == usuario.id).first()
        if not novo_banco:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Banco inválido.")

    # Atribuição dos novos valores aos campos do objeto monitorado pelo ORM
    divida_db.credor = divida_atualizada.credor
    divida_db.tipo = divida_atualizada.tipo
    divida_db.taxa_juro = divida_atualizada.taxa_juro
    divida_db.prestacao = divida_atualizada.prestacao
    divida_db.valor_total = divida_atualizada.valor_total
    divida_db.valor_pago = divida_atualizada.valor_pago
    divida_db.status = divida_atualizada.status
    divida_db.data_contraira = divida_atualizada.data_contraira
    divida_db.data_final = divida_atualizada.data_final
    divida_db.banco_id = divida_atualizada.banco_id

    # Efetivação transacional das modificações
    db.commit()
    db.refresh(divida_db)
    
    return divida_db

@router.delete("/{divida_id}")
def deletar_divida(
    divida_id: int,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> dict:
    """
    Remove definitivamente o registro de um passivo da base de dados.

    Exige a validação de propriedade por meio da associação com a tabela de bancos, impedindo
    que requisições não autorizadas acessem ou manipulem dados de terceiros.

    Parâmetros:
        divida_id (int): Identificador primário da dívida selecionada para exclusão.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário autenticado extraído do token JWT.

    Retorno:
        dict: Resposta de confirmação de exclusão bem-sucedida.

    Exceções:
        HTTPException (404): Levantada se o registro não for localizado ou violar o isolamento de escopo.
    """
    # Resolução da identidade do usuário logado
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    # Consulta de validação e isolamento do registro baseado no ID do usuário proprietário
    divida = db.query(DividaDB).join(BancoDB).filter(
        DividaDB.id == divida_id,
        BancoDB.usuario_id == usuario.id
    ).first()
    
    if not divida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Dívida não encontrada ou não pertence a você."
        )

    # DML de remoção estruturada com sincronização imediata
    db.delete(divida)
    db.flush() 
    db.commit()
    
    return {"mensagem": "Dívida deletada com sucesso!"}