const conexion = require('../database/db');

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