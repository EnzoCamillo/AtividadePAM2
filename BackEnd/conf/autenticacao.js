"use strict";
const mysql = require('mysql');
const cn = mysql.createConnection({
    host: 'localhost',
    user:'root',
   database: 'nodemysql'
});
 // Função para conectar ao banco de dados
const connectToDatabase = () => {
    cn.connect(function (err) {
        if (err) {
            console.log('Erro ao conectar com o banco de dados: ' + err);
        } else {
            console.log('Conectado com sucesso ao banco de dados!');
            return cn;
        }
    });
}

async function selectFull() {
    const query = 'SELECT * FROM Clientes';    
    return new Promise((resolve, reject) => {
        cn.query(query, (err, results, fields) => {
            if (err) {
                console.log('Erro ao consultar o banco de dados: ' + err);
                reject(err);
            } else {
                console.log(JSON.parse(JSON.stringify(results)));
                resolve(JSON.parse(JSON.stringify(results)));
            }
        });
    });
}


// ROTEAMENTO PARA INSERIR
async function insertCliente(Nome, Idade, UF) {
    const query = 'INSERT INTO Clientes (Nome, Idade, UF) VALUES (?, ?, ?)';
    return new Promise((resolve, reject) => {
        cn.query(query, [Nome, Idade, UF], (err, results) => {
            if (err) {
                console.log('Erro ao inserir o registro: ' + err);
                reject(err);
            } else {
                console.log('Registro inserido com sucesso!');
                resolve(results);
            }
        });
    });
}

// SELECIONAR PELO ID
async function selectById(id) {
    const query = 'SELECT * FROM Clientes WHERE id = ?';
    return new Promise((resolve, reject) => {
        cn.query(query, [id], (err, results, fields) => {
            if (err) {
                console.log('Erro ao consultar o banco de dados: ' + err);
                reject(err);
            } else {
                console.log(JSON.parse(JSON.stringify(results)));
                resolve(JSON.parse(JSON.stringify(results)));
            }
        });
    });
}

// DELETAR PELO ID
async function deleteById(id) {
    const query = 'DELETE FROM Clientes WHERE id = ?';  
    return new Promise((resolve, reject) => {
        cn.query(query, [id], (err, results, fields) => {
            if (err) {
                console.log('Erro ao deletar o registro: ' + err);
                reject(err);
            } else {
                console.log('deletado');
                resolve(results.affectedRows > 0);
            }
        });
    });
}


async function updateCliente(Nome, Idade, UF,ID ) {
    const query = 'UPDATE Clientes SET Nome = ?, Idade = ?, UF = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        cn.query(query, [Nome, Idade, UF, ID], (err, results) => {
            if (err) {
                console.log('Erro ao atualizar o registro: ' + err);
                reject(err);
            } else {
                console.log('Registro atualizado com sucesso!');
                resolve(results);
            }
        });
    });     
}   


// connectToDatabase();
// //insertCliente('Sofia', 18, 'SP');
// selectFull();
// //deleteById(1);
// updateCliente('José', 18, 'MG',2);
// selectFull();
// selectById(2);
module.exports = { selectFull, selectById, deleteById, insertCliente,updateCliente}

