const express = require("express");
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const mysql_config = require('./inc/mysql_config');
const functions = require('./inc/functions');

const API_AVAILABILITY = true;
const API_VERSION = '4.0.0';

const app = express();
app.listen(3000, () => {
    console.log("API está executando");
});

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (API_AVAILABILITY) {
        next();
    } else {
        res.json(functions.response('atenção', 'API está em manutenção. Sinto muito', 0, null));
    }
});

const connection = mysql.createConnection(mysql_config);

app.use(cors());

// Rotas
app.get('/', (req, res) => {
    res.json(functions.response('sucesso', 'API está rodando', 0, null));
});

app.get("/tasks", (req, res) => {
    connection.query('SELECT * FROM tasks', (err, rows) => {
        if (!err) {
            res.json(functions.response('sucesso', 'Tarefas recuperadas com sucesso', rows.length, rows));
        } else {
            res.json(functions.response('erro', err.message, 0, null));
        }
    });
});

app.get('/tasks/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM tasks WHERE id = ?', [id], (err, rows) => {
        if (!err) {
            if (rows.length > 0) {
                res.json(functions.response('sucesso', 'Sucesso na pesquisa', rows.length, rows));
            } else {
                res.json(functions.response('atenção', 'Não foi possível encontrar a task solicitada', 0, null));
            }
        } else {
            res.json(functions.response('erro', err.message, 0, null));
        }
    });
});

app.put('/tasks/:id/status', (req, res) => {
    const id = req.params.id;
    const status = req.body.status;

    connection.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id], (err, results) => {
        if (!err) {
            if (results.affectedRows > 0) {
                res.json(functions.response('sucesso', 'Status atualizado com sucesso', results.affectedRows, null));
            } else {
                res.json(functions.response('atenção', 'Task não encontrada', 0, null));
            }
        } else {
            res.json(functions.response('erro', err.message, 0, null));
        }
    });
});

app.delete('/tasks/:id/delete', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM tasks WHERE id = ?', [id], (err, results) => {
        if (!err) {
            if (results.affectedRows > 0) {
                res.json(functions.response('sucesso', 'Task deletada', results.affectedRows, null));
            } else {
                res.json(functions.response('atenção', 'Task não encontrada', 0, null));
            }
        } else {
            res.json(functions.response('erro', err.message, 0, null));
        }
    });
});

app.post('/tasks/create', (req, res) => {
    const { task, status } = req.body;

    if (!task || !status) {
        res.json(functions.response('atenção', 'Dados inválidos para criar uma task', 0, null));
        return;
    }

    connection.query('INSERT INTO tasks (task, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [task, status], (err, results) => {
        if (!err) {
            res.json(functions.response('sucesso', 'Task cadastrada com sucesso', results.insertId, null));
        } else {
            res.json(functions.response('erro', err.message, 0, null));
        }
    });
});

app.put('/tasks/:id/update', (req, res) => {
    const id = req.params.id;
    const { task, status } = req.body;

    if (!task || !status) {
        res.json(functions.response('atenção', 'Dados inválidos para atualizar a task', 0, null));
        return;
    }

    connection.query('UPDATE tasks SET task = ?, status = ?, updated_at = NOW() WHERE id = ?', [task, status, id], (err, results) => {
        if (!err) {
            if (results.affectedRows > 0) {
                res.json(functions.response('sucesso', 'Task atualizada com sucesso', results.affectedRows, null));
            } else {
                res.json(functions.response('atenção', 'Task não encontrada', 0, null));
            }
        } else {
            res.json(functions.response('erro', err.message, 0, null));
        }
    });
});

app.use((req, res) => {
    res.status(404).json(functions.response('atenção', 'Rota não encontrada', 0, null));
});
