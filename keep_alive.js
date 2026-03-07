const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('🟢 Bot online y funcionando!');
});

function keepAlive() {
    app.listen(3000, () => {
        console.log('[ Servidor ] Web server corriendo en puerto 3000');
    });
}

module.exports = keepAlive;
