const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const {crearMensaje} = require('../utilidades/utilidades');
const {crearMensajeConFecha} = require('../utilidades/utilidades');
const mysql = require('mysql');
const usuarios = new Usuarios();

const deepl = require('deepl-node');
const authKey = process.env['e84c1fb1-7439-d7a7-5af0-9d0c2525d125:fx'];
const serverUrl = process.env['https://api-free.deepl.com/v2/translate'];
const translator = new deepl.Translator('e84c1fb1-7439-d7a7-5af0-9d0c2525d125:fx', { serverUrl: serverUrl });

// Configuración para conectarnos a la base de datos de Heroku
var configuracionBaseDeDatos = {
    connectionLimit : 1000,
    connectTimeout  : 60 * 60 * 1000,
    acquireTimeout  : 60 * 60 * 1000,
    timeout         : 60 * 60 * 1000,
    host: "eu-cdbr-west-02.cleardb.net",
    user: "bc1cc84703d82d",
    password: "e4aae247",
    database: "heroku_d49b9d52105cd15"
}; 

// Objeto de conexión a MySQL
var mysqlConnection;

function ManejarDesconexion() {
    mysqlConnection = mysql.createConnection(configuracionBaseDeDatos);

    // Si nos desconectamos de la base de datos queremos volver a conectarnos automáticamente,
    // por eso, nos suscribimos a cualquier error y si ese error es una desconexión nos volvemos
    // a conectar automáticamente
    mysqlConnection.on('error', function(err) {
        console.log('Error en la conexión de la base de datos: ', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            ManejarDesconexion();
        }
        else {
            throw err;
        }
    });
}

// Nos conectamos a MySQL
ManejarDesconexion();

// Como respuesta a la conexión crearemos las tablas si no existen
mysqlConnection.connect(function(err) {
    if(err) {
        console.log('Error al conectarse a la base de datos: ', err);
        setTimeout(ManejarDesconexion, 2000);
    }
    console.log("Conectado a MySQL");

    // Creamos las tablas, si ya están creadas dará error pero lo ignoramos
    var crearTablaGruposQuery = "CREATE TABLE IF NOT EXISTS `Grupos` (`nombre` varchar(255), PRIMARY KEY (nombre))";
    mysqlConnection.query(crearTablaGruposQuery, function (err, result) {
        if (err) throw err;
        console.log("Tabla Grupos existe");

        var crearTablaUsuariosQuery = "CREATE TABLE IF NOT EXISTS `Usuarios` (`id` varchar(255),`nombre` varchar(255),`idioma` varchar(255),`grupo` varchar(255),PRIMARY KEY (id),  FOREIGN KEY (grupo) REFERENCES Grupos(nombre))";
        mysqlConnection.query(crearTablaUsuariosQuery, function (err, result) {
            if (err) throw err;
            console.log("Tabla Usuarios existe");

            var crearTablaMensajesQuery = "CREATE TABLE IF NOT EXISTS `Mensajes` (`id` int AUTO_INCREMENT,`texto` varchar(255),`idioma` varchar(255),`fecha` datetime DEFAULT CURRENT_TIMESTAMP,`usuario` varchar(255),`grupo` varchar(255),PRIMARY KEY (id),FOREIGN KEY (usuario) REFERENCES Usuarios(id),FOREIGN KEY (grupo) REFERENCES Grupos(nombre))"
            mysqlConnection.query(crearTablaMensajesQuery, function (err, result) {
                if (err) throw err;
                console.log("Tabla Mensajes existe");
            });
        });
    });
});

// Cuando un usuario se conecta
io.on('connection', (client) => {

    client.on('entrarChat', (data, callback, callback2) => {
        
        if(!data.nombre || !data.sala){
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }

        client.join(data.sala);
        let personas = usuarios.agregarPersona(client.id, data.nombre, data.sala, data.idioma);
        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `${data.nombre} ha entrado en el chat`));

        // Creamos la sala en MySQL
        var crearSalaQuery = "INSERT INTO Grupos (nombre) VALUES ('" + data.sala + "')";
        mysqlConnection.query(crearSalaQuery, function (err, result) {
            if (err) {
                if(err.code != 'ER_TABLE_EXISTS_ERROR') {
                    console.log("Sala ya existía");  
                }
                else {
                    throw err;
                }
            }
            else {
                console.log("Nueva sala añadida");
            }
        });

        // Creamos el Usuario en MySQL
        var crearUsuarioQuery = "INSERT INTO Usuarios (id, nombre, idioma, grupo) VALUES ('"+client.id+"', '"+data.nombre+"', '"+data.idioma+"', '"+data.sala+"')";
        mysqlConnection.query(crearUsuarioQuery, function (err, result) {
            if (err) {
                if(err.code != 'ER_TABLE_EXISTS_ERROR') {
                    console.log("Usuario ya existía");  
                }
                else {
                    throw err;
                }
            }
            else {
                console.log("Nuevo usuario añadido");
            }
        });

        var returnData = {
            users: usuarios.getPersonasPorSala(data.sala),
            messages: []
        };

        // Cogemos los 10 últimos mensajes de la sala, los traducimos y los imprimimos por pantalla
        var recuperarUltimosMensajesQuery = "SELECT Mensajes.texto as 'Mensaje', Usuarios.nombre as 'Usuario', Mensajes.fecha as Fecha FROM Mensajes LEFT JOIN Usuarios ON Usuarios.id = Mensajes.usuario WHERE Mensajes.grupo = '"+data.sala+"' ORDER BY Mensajes.fecha DESC LIMIT 10";
        mysqlConnection.query(recuperarUltimosMensajesQuery, function (err, result) {
            if (err) throw err;
            else {
                console.log("Ultimos Mensajes recuperados");
                if(result.length <= 0) {
                    // Si no hay mensajes enviamos al cliente los usuarios y no rellenamos los mensajes
                    callback(returnData);
                }
                else {
                    // Si si que hay mensajes, los tenemos que traducir a su idioma objetivo

                    // Primero tratar resultados para hacer la traduccion
                    result = result.reverse();
                    resultMessagesOnly = [];
                    for(let i = 0; i < result.length; i++) {
                        resultMessagesOnly[i] = result[i].Mensaje;
                    }

                    // Hacemos la traducción de los últimos 10 mensajes
                    translator
                        .getUsage()
                        .then((usage) => {
                            console.log("Traduciendo mensajes iniciales para nuevo Usuario");
                            return translator.translateText(resultMessagesOnly, null, data.idioma);
                        })
                        .then((translationResults) => {
                            // Si todo va bien montamos los mensajes y los enviamos
                            var messages = [];
                            for(let i = 0; i < translationResults.length; i++) {
                                var fechaMensaje = new Date(result[i].Fecha);
                                messages[i] = crearMensajeConFecha(result[i].Usuario, translationResults[i].text, fechaMensaje.getTime());
                            }
                            returnData.messages = messages;
                            callback(returnData);
                        })
                        .catch((error) => {
                            console.log("Error al traducir los mensajes iniciales: " + error);
                            var messages = [];
                            for(let i = 0; i < result.length; i++) {
                                messages[i] = crearMensajeConFecha(result[i].Usuario, result[i].Mensaje, result[i].Fecha);
                            }
                            returnData.messages = messages;
                            callback(returnData);
                        });
                }
            }
        });
    });

    client.on('crearMensaje', (data, callback) => { // Cuando el cliente crea el mensaje hacemos esta función

        let usuarioEnviador = usuarios.getPersona(client.id);

        // Vamos a enviar el mensaje a todos los usuarios pero como cada usuario tiene un idioma diferente
        // tenemos que traducirlo y luego enviarlo individualmente a cada usuario
        // Primero sacamos todos los usuarios de la sala
        let personasEnSala = usuarios.getPersonasPorSala(usuarioEnviador.sala);

        // También sacamos los datos que necesitamos para hacer la traducción
        let textoOriginal = data.mensaje;

        // Ahora, por cada persona en la sala hacemos la traducción y le enviamos el mensaje
        personasEnSala.forEach(
            function(usuarioDestino) {
                if(usuarioDestino.id != usuarioEnviador.id)
                {
                    translator
                        .getUsage()
                        .then((usage) => {
                            let idiomaObjetivo = usuarioDestino.idioma;
                            // Hacemos la traducción del texto original al idioma objetivo con auto detección de idioma original
                            return translator.translateText(textoOriginal, null, idiomaObjetivo);
                        })
                        .then((result) => {
                            // Si todo va bien, aquí recibiremos el mensaje traducido
                            let textoTraducido = result.text;

                            // Y se lo enviamos al usuario destino
                            let mensaje = crearMensaje(usuarioEnviador.nombre, textoTraducido);

                            console.log("ID de usuario destino que va a recibir el mensaje es esta:" + client.id);
                            client.broadcast.to(usuarioDestino.id).emit('crearMensaje', mensaje);
                        })
                        .catch((error) => {
                            // Si hay un error, se lo enviamos sin traducir
                            let mensaje = crearMensaje(usuarioEnviador.nombre, textoOriginal);
                            client.broadcast.to(usuarioDestino.id).emit('crearMensaje', mensaje);
                        });
                }
            }, this);

        let mensaje = crearMensaje(usuarioEnviador.nombre, textoOriginal);

        // Creamos el Mensaje en MySQL
        var crearMensajeQuery = "INSERT INTO Mensajes (texto, idioma, usuario, grupo) VALUES ('"+textoOriginal+"', '"+usuarioEnviador.idioma+"', '"+usuarioEnviador.id+"', '"+usuarioEnviador.sala+"')";
        mysqlConnection.query(crearMensajeQuery, function (err, result) {
            if (err) throw err; // Mensaje usa una PK auto incremental, así que nunca añadiremos uno que ya exista
            else {
                console.log("Nuevo mensaje añadido");
            }
        });
        callback(mensaje);
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona( client.id );
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} ha abandonado el chat`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
    });

    // Enviar un mensaje privado - Parte servidor
    client.on('mensajePrivado', data => {
        client.broadcast.to(data.idUser2).emit('mensajePrivado', crearMensaje(data.nombreUser1, ""));
    });
});