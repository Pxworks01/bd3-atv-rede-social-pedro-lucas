const express = require('express');
const path = require('path');
const db = require('./firebase');
const app = express();

// Criação do servidor HTTP
const server = require('http').createServer(app);

// Vincula o Socket.io ao servidor
const io = require('socket.io')(server);

// Configuração dos arquivos estáticos
app.use(express.static(path.join(__dirname, 'publico')));

// Configuração do EJS
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// Rota principal
app.get('/', (req, res) => {
    res.render('index.html');
});

// Teste de conexão com o Firestore
async function testarConexao() {
    try {
        await db.collection('posts').limit(1).get();
        console.log('Firebase Firestore conectado com sucesso!');
    } catch (erro) {
        console.error('Erro ao conectar com o Firebase:', erro);
    }
}

// Conexão dos usuários
io.on('connection', async (socket) => {
    console.log('Usuário conectado:', socket.id);

    // Identifica usuários desconectados
    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
    });

    // Recebe uma nova publicação
    socket.on('sendMessage', async (dados) => {
        try {
            if (!dados || typeof dados.titulo !== 'string' ||
                typeof dados.texto !== 'string') {
                return;
            }

            const titulo = dados.titulo.trim();
            const texto = dados.texto.trim();

            // Impede publicações vazias
            if (!titulo || !texto) {
                return;
            }

            // Cria o objeto da publicação
            const post = {
                titulo: titulo,
                texto: texto,
                data: new Date()
            };

            // Salva a publicação no Firestore
            const documento = await db.collection('posts').add(post);

            // Distribui a publicação para todos os usuários
            io.emit('receivedMessage', {
                id: documento.id,
                ...post,
                data: post.data.toISOString()
            });

            console.log('Publicação cadastrada com sucesso!');
        } catch (erro) {
            console.error('Erro ao cadastrar publicação:', erro);
        }
    });

    // Busca as publicações anteriores
    try {
        const resultado = await db.collection('posts')
            .orderBy('data', 'desc')
            .get();

        const posts = resultado.docs.map(doc => {
            const dados = doc.data();

            return {
                id: doc.id,
                ...dados,
                data: dados.data.toDate().toISOString()
            };
        });

        // Envia as publicações ao usuário conectado
        socket.emit('previousMessage', posts);
    } catch (erro) {
        console.error('Erro ao buscar publicações:', erro);
    }
});

// Inicialização do servidor
server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
    testarConexao();
});
