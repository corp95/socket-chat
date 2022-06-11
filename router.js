const express = require('express');
const router = express.Router();
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

router.get('/panel', (req, res)=>{
    conexion.query('SELECT * FROM mensajes', (error, results) =>{
        if(error){
            throw error;
        } else {
            res.render('index', {results:results});
        }
    })
})

router.get('/panel-usuarios', (req, res)=>{
    conexion.query('SELECT * FROM usuarios', (error, results) =>{
        if(error){
            throw error;
        } else {
            res.render('indexUsuarios', {results:results});
        }
    })
})

router.get('/panel-grupos', (req, res)=>{
    conexion.query('SELECT * FROM grupos', (error, results) =>{
        if(error){
            throw error;
        } else {
            res.render('indexGrupos', {results:results});
        }
    })
})

//Para crear registros
router.get('/create', (req, res)=>{
    res.render('create');
});

//Para editar los registros
router.get('/edit/:id', (req, res)=>{
    const id = req.params.id;
    conexion.query('SELECT * FROM mensajes WHERE id =?',[id], (error, results)=>{
        if(error){
            throw error;
        } else {
            res.render('edit', {mensajes:results[0]});
        }
    })
})

//Para eliminar
router.get('/delete/:id', (req, res)=>{
    const id = req.params.id;
    conexion.query('DELETE FROM mensajes WHERE id = ?', [id], (error, results)=>{
        if(error){
            throw error;
        } else {
            res.redirect('/panel');
        }
    })
})

router.get('/deleteUsuarios/:id', (req, res)=>{
    const id = req.params.id;
    conexion.query('DELETE FROM usuarios WHERE id = ?', [id], (error, results)=>{
        if(error){
            throw error;
        } else {
            res.redirect('/panel-Usuarios');
        }
    })
})

router.get('/deleteGrupos/:nombre', (req, res)=>{
    const nombre = req.params.nombre;
    conexion.query('DELETE FROM grupos WHERE nombre = ?', [nombre], (error, results)=>{
        if(error){
            throw error;
        } else {
            res.redirect('/panel-Grupos');
        }
    })
})

exports.save = (req,res)=> { //Controla el guardado
    const texto = req.body.texto;
    const idioma = req.body.idioma;
    const fecha = req.body.fecha;
    const usuario = req.body.usuario;
    const grupo = req.body.grupo;
    conexion.query('INSERT INTO mensajes SET ?', {texto:texto, idioma:idioma, fecha:fecha, usuario:usuario, grupo:grupo}, (error, results)=>{
      if(error){
          console.log(error);
      }else{
          res.redirect('/panel');
      }
    })
};

exports.update = (req, res)=>{ //Controla la actualización
    const id = req.body.id;
    const texto = req.body.texto;
    const idioma = req.body.idioma;
    const fecha = req.body.fecha;
    const usuario = req.body.usuario;
    const grupo = req.body.grupo;
    conexion.query('UPDATE mensajes SET ? WHERE id = ?', [{texto:texto, idioma:idioma, fecha:fecha, usuario:usuario, grupo:grupo}, id], (error, results)=>{
        if(error){
            console.log(error);
        }else{
            res.redirect('/panel');
        }
    })
}

router.post('/save', exports.save);
router.post('/update', exports.update);

module.exports = router;