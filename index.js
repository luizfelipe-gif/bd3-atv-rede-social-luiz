const express = require('express');
const ejs = require('ejs');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', ejs.renderFile)
app.use('/', (request, response) => {
   response.render('index.html');
});

function conectDB() {
   let dbUrl = 'mongodb+srv://luyvid:b5vltE5FMBGyCDFL@cluster0.xzpjdbb.mongodb.net/Rede_Social';
   mongoose.connect(dbUrl);
   mongoose.connection.on('error', console.error.bind(console, 'connection error'));
   mongoose.connection.once('open', function callback(){console.log('Conexão com o MongoDB efetuada! \n')});
}

let postAnteriores = [];

conectDB();

let Message = mongoose.model('Message', {autor: String, titulo: String, data_hora: String, texto: String});

Message.find({}).then(docs => { // docs representa o retorno do then
   console.log('Documentos:' + docs)
   postAnteriores = docs;
}).catch(error => {
   console.log('ERRO:' + error)
});

io.on('connection', socket => {
   console.log("ID de usuário conectado: " + socket.id);

   socket.emit("previousMessage", postAnteriores);

   socket.on("sendMessage", data => {
      let postAtual = new Message(data);

      console.log(`postAtual: ${postAtual}`)
      console.log(`postAnteriores: ${postAnteriores}`)

      postAtual
         .save()
         .then(() => {
            postAnteriores.push(postAtual);
            socket.broadcast.emit('receivedMessage', data)
         })
         .catch(error => {console.log('ERRO: ' + error)});
   });
});

server.listen(3000, () => {
   console.log("Servidor rodando em - http://localhost:3000")
});