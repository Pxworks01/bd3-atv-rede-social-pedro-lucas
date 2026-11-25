const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa o Firebase com a chave privada
initializeApp({
    credential: cert(serviceAccount)
});

// Obtém a instância do Firestore
const db = getFirestore();

// Exporta a conexão com o banco
module.exports = db;