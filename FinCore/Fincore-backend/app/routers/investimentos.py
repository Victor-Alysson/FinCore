# Fincore-backend/app/routers/investimentos.py

# Bibliotecas nativas
from typing import List

# Bibliotecas externas
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Módulos internos
from app.database import get_db
from app.models import BancoDB, InvestimentoDB, UsuarioDB
from app.schemas import InvestimentoCriar, InvestimentoResponse
from app.security import obter_usuario_atual

router = APIRouter(prefix="/investimentos", tags=["Investimentos"])

@router.post("", response_model=InvestimentoResponse, status_code=status.HTTP_201_CREATED)
def criar_investimento(
    investimento: InvestimentoCriar,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> InvestimentoDB:
    """
    Registra um novo ativo de investimento vinculado a uma instituição bancária específica.

    Assegura a integridade referencial validando se a conta informada existe e está
    sob a titularidade do usuário autenticado.

    Parâmetros:
        investimento (InvestimentoCriar): Esquema de validação com os dados estruturais do ativo.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        InvestimentoDB: Instância do modelo relacional contendo o ativo recém-criado.

    Exceções:
        HTTPException (404): Levantada em caso de falha na resolução de propriedade do banco_id.
    """
    # Resolução da identidade do usuário logado
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Validação de propriedade e integridade relacional do banco de destino
    banco = db.query(BancoDB).filter(
        BancoDB.id == investimento.banco_id,
        BancoDB.usuario_id == usuario.id
    ).first()

    if not banco:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada ou não pertence a você."
        )

    # Instanciação da entidade de investimento
    novo_investimento = InvestimentoDB(
        ticker=investimento.ticker,
        nome=investimento.nome,
        tipo=investimento.tipo,
        quantidade=investimento.quantidade,
        preco_medio=investimento.preco_medio,
        preco_atual=investimento.preco_atual,
        corretora=investimento.corretora,
        data_adquirido=investimento.data_adquirido,
        data_final=investimento.data_final,
        banco_id=banco.id
    )

    # Persistência transacional
    db.add(novo_investimento)
    db.commit()
    db.refresh(novo_investimento)
    
    return novo_investimento

@router.get("", response_model=List[InvestimentoResponse])
def listar_investimentos(
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> List[InvestimentoDB]:
    """
    Recupera a totalidade de ativos financeiros pertencentes às contas do usuário autenticado.

    Realiza uma junção interna (JOIN) entre a entidade de investimentos e bancos para garantir
    o isolamento de escopo por identificador de usuário.

    Parâmetros:
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        List[InvestimentoDB]: Lista de entidades ORM atreladas ao usuário requisitante.
    """
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Consulta isolada por cláusula de junção garantindo restrição de domínio
    investimentos = db.query(InvestimentoDB).join(BancoDB).filter(BancoDB.usuario_id == usuario.id).all()

    return investimentos

@router.put("/{investimento_id}", response_model=InvestimentoResponse)
def atualizar_investimento(
    investimento_id: int,
    dados_atualizados: InvestimentoCriar,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> InvestimentoDB:
    """
    Atualiza integralmente os parâmetros de um ativo financeiro existente.

    Implementa validação estrita de titularidade do ativo e, em caso de transferência
    entre contas, exige a verificação de propriedade da nova conta de destino.

    Parâmetros:
        investimento_id (int): Identificador primário do ativo a ser atualizado.
        dados_atualizados (InvestimentoCriar): Esquema validado com a nova estrutura do ativo.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        InvestimentoDB: Instância do modelo atualizada e sincronizada com a base de dados.

    Exceções:
        HTTPException (404): Levantada se o ativo não existir ou violar o isolamento de escopo.
        HTTPException (400): Levantada se houver tentativa de migração para uma conta de terceiros.
    """
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Verificação de existência e titularidade do registro alvo
    investimento_db = db.query(InvestimentoDB).join(BancoDB).filter(
        InvestimentoDB.id == investimento_id,
        BancoDB.usuario_id == usuario.id
    ).first()

    if not investimento_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investimento não encontrado ou não pertence a você."
        )

    # Validação de titularidade condicional por alteração de chave estrangeira (banco_id)
    if dados_atualizados.banco_id != investimento_db.banco_id:
        novo_banco = db.query(BancoDB).filter(
            BancoDB.id == dados_atualizados.banco_id,
            BancoDB.usuario_id == usuario.id
        ).first()

        if not novo_banco:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A nova conta selecionada não pertence a você."
            )

    # Atribuição dos novos valores às propriedades monitoradas pelo ORM
    investimento_db.ticker = dados_atualizados.ticker
    investimento_db.nome = dados_atualizados.nome
    investimento_db.tipo = dados_atualizados.tipo
    investimento_db.quantidade = dados_atualizados.quantidade
    investimento_db.preco_medio = dados_atualizados.preco_medio
    investimento_db.preco_atual = dados_atualizados.preco_atual
    investimento_db.corretora = dados_atualizados.corretora
    investimento_db.data_adquirido = dados_atualizados.data_adquirido
    investimento_db.data_final = dados_atualizados.data_final
    investimento_db.banco_id = dados_atualizados.banco_id

    # Efetivação das operações transacionais
    db.commit()
    db.refresh(investimento_db)
    
    return investimento_db

@router.delete("/{investimento_id}")
def deletar_investimento(
    investimento_id: int,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> dict:
    """
    Executa a exclusão de um registro de ativo financeiro.

    Exige a pré-verificação de propriedade do ativo através do relacionamento indireto
    com a entidade bancária do usuário.

    Parâmetros:
        investimento_id (int): Identificador primário do ativo.
        db (Session): Sessão ativa do banco de dados injetada via dependência.
        usuario_email (str): Identificador do usuário extraído do token JWT.

    Retorno:
        dict: Resposta de confirmação de exclusão da entidade.

    Exceções:
        HTTPException (404): Levantada se o ativo não for localizado ou pertencer a outro usuário.
    """
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()

    # Validação de escopo de exclusão baseada na restrição relacional de usuário
    investimento = db.query(InvestimentoDB).join(BancoDB).filter(
        InvestimentoDB.id == investimento_id,
        BancoDB.usuario_id == usuario.id
    ).first()

    if not investimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investimento não encontrado ou não pertence a você."
        )

    # DML de exclusão e sincronização de base
    db.delete(investimento)
    db.commit()

    return {"mensagem": "Investimento removido da carteira com sucesso!"}