const mysql = require('mysql');

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
var conexion;

function ManejarDesconexion() {
    conexion = mysql.createConnection(configuracionBaseDeDatos);

    // Si nos desconectamos de la base de datos queremos volver a conectarnos automáticamente,
    // por eso, nos suscribimos a cualquier error y si ese error es una desconexión nos volvemos
    // a conectar automáticamente
    conexion.on('error', function(err) {
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

conexion.connect((error)=>{
    if(error){
        console.error('El error de conexión es: ' + error);
        return
    }
    console.log('¡Conectado a la Base de Datos!');
});

module.exports = conexion;