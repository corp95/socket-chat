var params = new URLSearchParams(window.location.search);

var nombre = params.get('nombre');
var sala = params.get('sala');
var privado = params.get('privado');
var idioma = params.get('idioma');

// Referencias de jQuery
var divUsuarios = $('#divUsuarios');
var formEnviar = $('#formEnviar');
var txtMensaje = $('#txtMensaje');
var divChatbox = $('#divChatbox');

// Vamos a renderizar los usuarios

function renderizarUsuarios ( personas ){
    console.log(personas);

    var html = '';
    html += '<li>';
    if(!privado){
        html += '    <a href="javascript:void(0)" class="active"> Chat <span> '+ params.get('sala') +'</span></a>';
    }
    else{
        html += '    <a href="javascript:void(0)" class="active"> Chat <span>Privado</span></a>';
    }
    
    html += '</li>';

    for( var i = 0; i < personas.length; i++) {
        html += '<li>';
        html += '   <a data-nombre="' + personas[i].nombre + '"data-id="'+ personas[i].id + '" href="javascript:void(0)"><img src="assets/images/users/1.jpg" alt="user-img" class="img-circle"> <span>'+ personas[i].nombre +' <small class="text-success">online</small></span></a>';
        html += '</li>';
    }

    divUsuarios.html(html);
}

function renderizarMensajes(mensaje, yo){
    var html = '';
    var fecha = new Date(mensaje.fecha);
    var hora = fecha.getHours() + ':' + fecha.getMinutes();
    var adminClass = 'info';
    if (mensaje.nombre === 'Administrador' ){
        adminClass = 'danger';
    }

    if( yo ){
        html += '<li class="reverse">';
        html += '    <div class="chat-content">';
        html += '        <h5>'+ mensaje.nombre +'</h5>';
        html += '        <div class="box bg-light-inverse">'+ mensaje.mensaje +'</div>';
        html += '    </div>';
        html += '    <div class="chat-img"><img src="assets/images/users/5.jpg" alt="user" /></div>';
        html += '    <div class="chat-time">'+ hora +'</div>';
        html += '</li>';
    } else{
        html += '<li class="animated fadeIn">';
        if (mensaje.nombre !== 'Administrador'){
            html += '    <div class="chat-img"><img src="assets/images/users/1.jpg" alt="user" /></div>';

        }
        html += '    <div class="chat-content">';
        html += '        <h5>' + mensaje.nombre + '</h5>';
        html += '        <div class="box bg-light-'+ adminClass +'">' + mensaje.mensaje + '</div>';
        html += '    </div>';
        html += '    <div class="chat-time">'+ hora +'</div>';
        html += '</li>';
    }

    divChatbox.append(html);
}

function scrollBottom() {

    // selectors
    var newMessage = divChatbox.children('li:last-child');

    // heights
    var clientHeight = divChatbox.prop('clientHeight');
    var scrollTop = divChatbox.prop('scrollTop');
    var scrollHeight = divChatbox.prop('scrollHeight');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight() || 0;

    if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
        divChatbox.scrollTop(scrollHeight);
    }
}




// Listeners
// Abrimos una nueva ventana para hablar con la nueva persona
divUsuarios.on('click', 'a', function(){
    var id = $(this).data('id');
    var miId = usuario.id;

    if(privado || id == miId)
    {
        return;
    }

    var user1 = nombre;
    var user2 = $(this).data('nombre');
    var url =  "/privado.html?nombre=" + user1 + "&sala=" + user1 + user2 + "&privado=true&idioma=" + idioma;
    var win = window.open(url, '_blank');
    win.focus();

    socket.emit("mensajePrivado", { nombreUser1: user1, idUser2: id});
});


function abrirVentanaPrivadaReceptor(mensaje) {
    var user1 = nombre;
    var user2 = mensaje.nombre;
    if (window.confirm("Usuario " + user2 + " quiere abrir un chat privado, ¿aceptas?")) {
        var url = "/privado.html?nombre=" + user1 + "&sala=" + user2 + user1 + "&privado=true&idioma=" + idioma;
        var win = window.open(url, '_blank');
        win.focus();
    }
}

formEnviar.on('submit', function(e){ // Esto ocurre cuando enviamos un mensaje
    e.preventDefault();

    if(txtMensaje.val().trim().length === 0){
        return;
    }

    let textoRecortado = txtMensaje.val().substring(0, 255);

    if(textoRecortado.trim().length === 0){
        return;
    }

    socket.emit('crearMensaje', {
        nombre: nombre,
        mensaje: textoRecortado
    }, function (mensaje) {
        txtMensaje.val('').focus;
        renderizarMensajes(mensaje, true);
        scrollBottom();
    });
});