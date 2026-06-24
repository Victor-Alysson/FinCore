# FinCore

> **Gerencie suas finanças de forma inteligente.**
> O FinCore é uma plataforma completa para gestão financeira pessoal. Desenvolvido para oferecer controle total sobre fluxo de caixa, carteira de investimentos e amortização de dívidas através de uma interface analítica e intuitiva.

---

## Funcionalidades Principais

* **Dashboard Analítico:** Visão geral do patrimônio, saldo em conta e histórico de fluxo de caixa com gráficos interativos.
* **Gestão de Investimentos:** Controle detalhado de ativos (Ações, Cripto, FIIs, Renda Fixa, ETFs), cálculo de preço médio, rentabilidade e gráfico de alocação de carteira.
* **Controle de Dívidas:** Acompanhamento de passivos financeiros com barras de progresso visuais indicando a amortização.
* **Fluxo de Caixa (Extrato):** Registro detalhado de entradas e saídas, categorização por tags e filtros por instituições bancárias.
* **Segurança e Autenticação:** Sistema de login com recuperação de senha via perguntas de segurança e tokens JWT (JSON Web Tokens).

---

## Tecnologias Utilizadas

O projeto adota uma arquitetura separada entre Client (Front-end) e Server (Back-end).

### Front-end (/Fincore-frontend)
* **[React 19](https://react.dev/):** Biblioteca principal para construção da interface de usuário.
* **[Vite](https://vitejs.dev/):** Bundler para o ambiente de desenvolvimento.
* **[React Router v7](https://reactrouter.com/):** Gerenciamento de rotas e navegação SPA.
* **[Recharts](https://recharts.org/):** Biblioteca para renderização de gráficos.
* **[Lucide React](https://lucide.dev/):** Pacote de ícones vetoriais.
* **CSS Modules:** Estilização encapsulada baseada em um Design System com Tokens globais (Tema Dark).

### Back-end (/Fincore-backend)
* **[FastAPI](https://fastapi.tiangolo.com/):** Framework web para construção das APIs em Python.
* **[SQLAlchemy](https://www.sqlalchemy.org/):** ORM (Object Relational Mapper) para comunicação com o banco de dados.
* **[Pydantic](https://docs.pydantic.dev/):** Validação de dados e serialização.
* **Segurança:** `python-jose` para geração e validação de JWT; `bcrypt` para hashing de senhas.
* **Processamento de Dados:** `pandas` e `numpy` para operações matemáticas e relatórios.

---

## Design System (FinCore UI)

A interface do FinCore foi padronizada utilizando um sistema de variáveis globais (`index.css`), focado em usabilidade e redução de fadiga visual (Dark Mode Nativo):

## Como Executar o Projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) (v18 ou superior)
* [Python](https://www.python.org/) (v3.9 ou superior)
* Gerenciador de pacotes (`npm`, `yarn` ou `pnpm`)

### Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/Victor-Alysson/FinCore.git](https://github.com/Victor-Alysson/FinCore.git)
   cd FinCore
# Inicia o servidor e o client em paralelo