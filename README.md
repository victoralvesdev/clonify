# Clonify

Clonify é uma aplicação web moderna construída com Next.js que permite aos usuários gerenciar e organizar suas músicas favoritas.

## Tecnologias Utilizadas

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Prisma
- PostgreSQL

## Pré-requisitos

- Node.js 18.17 ou superior
- PostgreSQL
- NPM ou Yarn

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/clonify.git
cd clonify
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
```env
DATABASE_URL="sua-url-do-banco-de-dados"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret"
```

4. Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## Deploy na Vercel

1. Faça fork deste repositório
2. Conecte sua conta do GitHub à Vercel
3. Importe o projeto na Vercel
4. Configure as variáveis de ambiente necessárias
5. Deploy! 