-- Ativa as extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Cria usuário admin padrão se não existir
DO $$
BEGIN
    -- Esta parte será executada depois do Prisma criar as tabelas
    -- Por enquanto só ativamos as extensões
END
$$;