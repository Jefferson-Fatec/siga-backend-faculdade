require('dotenv').config(); // Carrega as variáveis de ambiente do .env
const express = require('express');
const sql = require('mssql');
const cors = require('cors'); // Para permitir requisições do seu front-end

const app = express();
const port = process.env.PORT || 3000; // Porta para o servidor

// Configuração do banco de dados Azure SQL
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // Para Azure SQL Database (conexão segura)
        trustServerCertificate: false // Mudar para true em desenvolvimento se necessário, mas falso em produção
    },
    port: parseInt(process.env.DB_PORT) || 1433
};

// Middlewares
app.use(cors()); // Habilita CORS para todas as rotas (necessário para o front-end)
app.use(express.json()); // Permite que o Express leia JSON do corpo das requisições




// Rota GET para verificar se o servidor está funcionando

// Rota GET para Consulta de Usuários
app.get('/api/usuarios', async (req, res) => {
    try {
        // Conecta ao banco de dados usando a configuração já existente (dbConfig)
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Executa a consulta SQL para buscar os dados dos usuários
        // Ajuste as colunas no SELECT conforme as colunas da sua tabela dbo.Usuarios
        const result = await request.query('SELECT IDUsuario, Nome, Username, Email, Cargo, CPF, Telefone, Cidade, Estado, DataCadastro FROM dbo.Usuarios');

        // Retorna os resultados como JSON
        res.json(result.recordset);

    } catch (err) {
        // Em caso de erro, loga no console do servidor e envia uma resposta de erro 500
        console.error('Erro ao consultar usuários:', err);
        res.status(500).send('Erro no servidor ao consultar usuários.');
    } finally {
        // Garante que a conexão com o SQL é fechada após a requisição
        sql.close();
    }
});










// Rota POST para Cadastro de Usuários
app.post('/api/cadastrarUsuario', async (req, res) => {
    // req.body conterá os dados enviados pelo seu formulário HTML
    const { nome, username, email, senha, cargo, cpf, rg, telefone, dataNascimento, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;

    // Validação mínima: Verifica se campos essenciais não estão vazios
    if (!nome || !username || !email || !senha || !cargo || !cpf || !cep || !logradouro || !numero || !bairro || !cidade || !estado) {
        return res.status(400).json({ message: "Por favor, preencha todos os campos obrigatórios." });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Query de INSERT com parâmetros para segurança (prevenção de SQL Injection)
        const result = await request
            .input('Nome', sql.NVarChar, nome)
            .input('Username', sql.NVarChar, username)
            .input('Email', sql.NVarChar, email)
            .input('Senha', sql.NVarChar, senha) // Em produção, hashes de senha são CRUCIAIS!
            .input('Cargo', sql.NVarChar, cargo)
            .input('CPF', sql.NVarChar, cpf)
            .input('RG', sql.NVarChar, rg || null) // Opcional
            .input('Telefone', sql.NVarChar, telefone || null) // Opcional
            .input('DataNascimento', sql.Date, dataNascimento || null) // Opcional
            .input('CEP', sql.NVarChar, cep)
            .input('Logradouro', sql.NVarChar, logradouro)
            .input('Numero', sql.NVarChar, numero)
            .input('Complemento', sql.NVarChar, complemento || null) // Opcional
            .input('Bairro', sql.NVarChar, bairro)
            .input('Cidade', sql.NVarChar, cidade)
            .input('Estado', sql.NVarChar, estado)
            .query(`
                INSERT INTO dbo.Usuarios (Nome, Username, Email, Senha, Cargo, CPF, RG, Telefone, DataNascimento, CEP, Logradouro, Numero, Complemento, Bairro, Cidade, Estado)
                VALUES (@Nome, @Username, @Email, @Senha, @Cargo, @CPF, @RG, @Telefone, @DataNascimento, @CEP, @Logradouro, @Numero, @Complemento, @Bairro, @Cidade, @Estado);
            `);

        // Verifica se a inserção afetou alguma linha
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
            res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
        } else {
            res.status(500).json({ message: "Erro ao cadastrar usuário: nenhuma linha afetada." });
        }

    } catch (err) {
        console.error('Erro no cadastro de usuário:', err);
        res.status(500).json({ message: "Erro interno do servidor.", error: err.message });
    } finally {
        sql.close(); // Sempre feche a conexão
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor de cadastro rodando em http://localhost:${port}`);
});