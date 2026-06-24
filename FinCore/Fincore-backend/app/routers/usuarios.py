# Fincore-backend/app/routers/usuarios.py

# Bibliotecas nativas
import io
from typing import List

# Bibliotecas externas
import bcrypt
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

# Módulos internos
from app.auth import criar_token
from app.database import get_db
from app.models import BancoDB, DividaDB, InvestimentoDB, TransacaoDB, UsuarioDB
from app.schemas import (
    DeletarContaRequest,
    RedefinirSenha,
    UsuarioAtualizarPerfil,
    UsuarioCriar,
    UsuarioLogin,
    UsuarioResponse,
    VerificarRespostas
)
from app.security import obter_usuario_atual

router = APIRouter()

def hash_password(password: str) -> str:
    """
    Gera o hash criptográfico de uma credencial utilizando bcrypt.

    Parâmetros:
        password (str): Senha em texto plano.

    Retorno:
        str: Hash criptográfico decodificado em formato de string (utf-8).
    """
    # Conversão da string de entrada para a codificação de bytes exigida pelo bcrypt
    pwd_bytes = password.encode('utf-8')
    
    # Geração de salt dinâmico para mitigação de ataques de dicionário e rainbow tables
    salt = bcrypt.gensalt()
    
    # Execução do algoritmo de hashing e decodificação para persistência textual
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


# ==========================================
# 1. AUTENTICAÇÃO E RECUPERAÇÃO DE CONTA
# ==========================================

@router.post("/login")
def login(usuario_login: UsuarioLogin, db: Session = Depends(get_db)) -> dict:
    """
    Autentica as credenciais do usuário e emite um token JWT para controle de sessão.
    """
    # Resolução da identidade do usuário por meio do identificador de e-mail
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_login.email).first()
    
    # Validação de existência do registro e verificação estrita do hash criptográfico
    if not usuario or not bcrypt.checkpw(usuario_login.senha.encode('utf-8'), usuario.senha_hash.encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )

    # Emissão do token de acesso (JWT) vinculando o escopo ao e-mail autenticado
    token = criar_token({"sub": usuario.email})
    
    return {"access_token": token, "token_type": "bearer"}

@router.post("/usuarios/verificar-recuperacao")
def verificar_respostas(dados: VerificarRespostas, db: Session = Depends(get_db)) -> dict:
    """
    Valida as respostas às perguntas de segurança para autorização de redefinição de senha.
    """
    # Resolução da identidade alvo para recuperação
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == dados.email).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

    # Normalização de strings (case-insensitive e remoção de whitespaces) para comparação de segurança
    p1_ok = usuario.pergunta1 == dados.pergunta1.lower().strip()
    p2_ok = usuario.pergunta2 == dados.pergunta2.lower().strip()
    p3_ok = usuario.pergunta3 == dados.pergunta3.lower().strip()

    # Validação condicional exigindo a exatidão das três respostas simultaneamente
    if not (p1_ok and p2_ok and p3_ok):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uma ou mais respostas estão incorretas.")

    return {"mensagem": "Respostas validadas com sucesso!"}

@router.post("/usuarios/redefinir-senha")
def redefinir_senha(dados: RedefinirSenha, db: Session = Depends(get_db)) -> dict:
    """
    Executa a substituição da credencial esquecida mediante revalidação das respostas de segurança.
    """
    # Resolução da identidade alvo
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == dados.email).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

    # Revalidação de segurança contínua para autorização da operação de mutação
    p1_ok = usuario.pergunta1 == dados.pergunta1.lower().strip()
    p2_ok = usuario.pergunta2 == dados.pergunta2.lower().strip()
    p3_ok = usuario.pergunta3 == dados.pergunta3.lower().strip()

    if not (p1_ok and p2_ok and p3_ok):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Falha na validação de segurança.")

    # Mutação da credencial com aplicação do algoritmo de hashing e efetivação no banco
    usuario.senha_hash = hash_password(dados.nova_senha)
    db.commit()

    return {"mensagem": "Senha alterada com sucesso!"}


# ==========================================
# 2. FLUXO DO USUÁRIO AUTENTICADO (ME)
# ==========================================

@router.get("/usuarios/me/perfil", response_model=UsuarioResponse)
def obter_perfil(db: Session = Depends(get_db), usuario_email: str = Depends(obter_usuario_atual)) -> UsuarioDB:
    """
    Recupera os dados de perfil do usuário atualmente autenticado via JWT.
    """
    # Consulta restrita baseada na injeção de dependência do token de autorização
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
        
    return usuario

@router.put("/usuarios/me/perfil")
def atualizar_perfil(
    dados: UsuarioAtualizarPerfil, 
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> dict:
    """
    Aplica mutações aos dados de perfil e credenciais do usuário autenticado.
    """
    # Resolução da entidade a ser manipulada
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

    # Validação estrita de propriedade exigindo confirmação de credencial prévia
    if not bcrypt.checkpw(dados.senha_atual.encode('utf-8'), usuario.senha_hash.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Senha atual incorreta.")

    # Mutações condicionais aplicadas apenas aos campos enviados no payload
    if dados.novo_nome:
        usuario.nome = dados.novo_nome
    if dados.nova_senha:
        usuario.senha_hash = hash_password(dados.nova_senha)
    if dados.pergunta1:
        usuario.pergunta1 = dados.pergunta1.lower().strip()
    if dados.pergunta2:
        usuario.pergunta2 = dados.pergunta2.lower().strip()
    if dados.pergunta3:
        usuario.pergunta3 = dados.pergunta3.lower().strip()

    # Sincronização transacional
    db.commit()
    
    return {"mensagem": "Perfil atualizado com sucesso!"}

@router.post("/usuarios/me/encerrar")
def deletar_conta_usuario(
    dados: DeletarContaRequest,
    db: Session = Depends(get_db),
    usuario_email: str = Depends(obter_usuario_atual)
) -> dict:
    """
    Executa a deleção física da conta do usuário autenticado e propagação em cascata.
    """
    # Resolução da entidade a ser destruída
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

    # Validação estrita de intenção e segurança via credencial
    if not bcrypt.checkpw(dados.senha_atual.encode('utf-8'), usuario.senha_hash.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Senha atual incorreta.")

    # Operação DML de exclusão com ativação da restrição cascade para tabelas dependentes
    db.delete(usuario)
    db.commit()

    return {"mensagem": "Sua conta e todos os dados foram apagados permanentemente."}

@router.get("/usuarios/me/exportar")
def exportar_dados(db: Session = Depends(get_db), usuario_email: str = Depends(obter_usuario_atual)) -> StreamingResponse:
    """
    Agrega os dados financeiros do usuário em um artefato Excel trafegado em buffer de memória.
    """
    # Resolução da identidade do requisitante
    usuario = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_email).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

    # Mapeamento relacional inverso para captura de chaves estrangeiras vinculadas
    bancos_ids = [b.id for b in usuario.bancos]
    
    # Extração das coleções de domínio isoladas pelo conjunto de IDs bancários
    transacoes = db.query(TransacaoDB).filter(TransacaoDB.banco_id.in_(bancos_ids)).all()
    investimentos = db.query(InvestimentoDB).filter(InvestimentoDB.banco_id.in_(bancos_ids)).all()
    dividas = db.query(DividaDB).filter(DividaDB.banco_id.in_(bancos_ids)).all()

    # Alocação de buffer I/O em memória RAM para processamento seguro do artefato binário
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        
        # Processamento e mapeamento matricial da coleção de Transações
        if transacoes:
            df_tx = pd.DataFrame([{
                "Data": t.data, "Descrição": t.descricao, "Categoria": t.categoria, 
                "Tipo": t.tipo, "Valor (R$)": t.valor
            } for t in transacoes])
            df_tx.to_excel(writer, sheet_name="Transações", index=False)
        else:
            pd.DataFrame({"Aviso": ["Sem transações"]}).to_excel(writer, sheet_name="Transações", index=False)
            
        # Processamento e mapeamento matricial da coleção de Investimentos
        if investimentos:
            df_inv = pd.DataFrame([{
                "Ativo": i.ticker, "Nome": i.nome, "Classe": i.tipo, "Quantidade": i.quantidade,
                "Preço Médio (R$)": i.preco_medio, "Cotação Atual (R$)": i.preco_atual, "Corretora": i.corretora
            } for i in investimentos])
            df_inv.to_excel(writer, sheet_name="Investimentos", index=False)
        else:
            pd.DataFrame({"Aviso": ["Sem investimentos"]}).to_excel(writer, sheet_name="Investimentos", index=False)

        # Processamento e mapeamento matricial da coleção de Dívidas
        if dividas:
            df_div = pd.DataFrame([{
                "Credor": d.credor, "Tipo": d.tipo, "Taxa de Juros (%)": d.taxa_juro, 
                "Prestação (R$)": d.prestacao, "Total Contratado (R$)": d.valor_total, 
                "Saldo Amortizado (R$)": d.valor_pago, "Status": d.status
            } for d in dividas])
            df_div.to_excel(writer, sheet_name="Dívidas", index=False)
        else:
            pd.DataFrame({"Aviso": ["Sem dívidas"]}).to_excel(writer, sheet_name="Dívidas", index=False)

    # Reposicionamento do cursor de memória para o início do stream de bytes
    output.seek(0)
    
    # Configuração de cabeçalhos HTTP para instrução de download de arquivo binário no client
    headers = {
        'Content-Disposition': 'attachment; filename="Backup_FinCore.xlsx"'
    }
    
    return StreamingResponse(
        output, 
        headers=headers, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )


# ==========================================
# 3. ROTAS DE GERENCIAMENTO GERAL (CRUD BÁSICO)
# ==========================================

@router.post("/usuarios", response_model=UsuarioResponse)
def criar_usuario(usuario: UsuarioCriar, db: Session = Depends(get_db)) -> UsuarioDB:
    """
    Registra um novo usuário com hashing de segurança e normalização de dados.
    """
    # Validação de restrição de unicidade para o atributo identificador (e-mail)
    usuario_existente = db.query(UsuarioDB).filter(UsuarioDB.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este email já está cadastrado.")

    # Aplicação de criptografia na credencial trafegada no payload
    senha_criptografada = hash_password(usuario.senha)

    # Instanciação da entidade com normalização estrita de strings de segurança
    novo_usuario = UsuarioDB(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=senha_criptografada,
        pergunta1=usuario.pergunta1.lower().strip(),
        pergunta2=usuario.pergunta2.lower().strip(),
        pergunta3=usuario.pergunta3.lower().strip()
    )

    # Operações DML para persistência da entidade na base relacional
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario

@router.get("/usuarios", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)) -> List[UsuarioDB]:
    """
    Recupera a coleção integral de usuários cadastrados no sistema.
    """
    # Extração indiscriminada de entidades monitoradas pelo modelo
    usuarios = db.query(UsuarioDB).all()
    
    return usuarios

@router.get("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def obter_usuario(usuario_id: int, db: Session = Depends(get_db)) -> UsuarioDB:
    """
    Consulta uma entidade de usuário a partir do seu identificador primário.
    """
    # Busca de registro com filtragem por chave primária
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        
    return usuario

@router.put("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario(usuario_id: int, usuario_atualizado: UsuarioCriar, db: Session = Depends(get_db)) -> UsuarioDB:
    """
    Sobrecreve os dados de um usuário baseando-se em sua chave primária.
    """
    # Resolução da entidade alvo
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        
    # Validação de unicidade condicional em eventos de mutação do identificador
    if usuario.email != usuario_atualizado.email:
        email_em_uso = db.query(UsuarioDB).filter(UsuarioDB.email == usuario_atualizado.email).first()
        if email_em_uso:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este email já está em uso por outra conta.")

    # Atribuição dos novos valores fornecidos no payload
    usuario.nome = usuario_atualizado.nome
    usuario.email = usuario_atualizado.email
    usuario.senha_hash = hash_password(usuario_atualizado.senha)
    usuario.pergunta1 = usuario_atualizado.pergunta1.lower().strip()
    usuario.pergunta2 = usuario_atualizado.pergunta2.lower().strip()
    usuario.pergunta3 = usuario_atualizado.pergunta3.lower().strip()

    # Efetivação transacional
    db.commit()
    db.refresh(usuario)
    
    return usuario

@router.delete("/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)) -> dict:
    """
    Remove fisicamente o registro de um usuário baseado em sua chave primária.
    """
    # Resolução da entidade alvo
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        
    # Exclusão do mapeamento e processamento DML
    db.delete(usuario)
    db.commit()
    
    return {"mensagem": "Conta de usuário deletada com sucesso!"}