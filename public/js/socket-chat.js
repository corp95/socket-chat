var socket = io();

var params = new URLSearchParams(window.location.search);

if (!params.has('nombre') || !params.has('sala')) {
    window.location = 'index.html';
    throw new Error('El nombre y sala son necesarios');
}

var usuario = {
    nombre: params.get('nombre'),
    sala: params.get('sala'),
    id: "",
    idioma: params.get("idioma"),
};



socket.on('connect', function() {
    console.log('Conectado al servidor');

    socket.emit('entrarChat', usuario, function(resp) {
        var usuarios = resp.users;
        usuario.id = usuarios[usuarios.length - 1].id;
        renderizarUsuarios(usuarios);

        resp.messages.forEach(element => {
            renderizarMensajes(element, false);
            scrollBottom(); 
        });
    });
});



// escuchar
socket.on('disconnect', function() {

    console.log('Perdimos conexión con el servidor');

});


// Escuchar información
socket.on('crearMensaje', function(mensaje) {/* 
    console.log('Servidor:', mensaje); */
    renderizarMensajes(mensaje, false);
    scrollBottom();
});

// Escuchar cambios de usuarios
// cuando un usuario entra o sale del chat
socket.on('listaPersona', function(personas) {
    renderizarUsuarios(personas);
});

// Recibir un mensaje privado - Parte cliente
socket.on('mensajePrivado', function(mensaje) {
    abrirVentanaPrivadaReceptor(mensaje);
});