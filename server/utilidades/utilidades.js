const crearMensaje = ( nombre, mensaje ) => {
    return {
        nombre,
        mensaje,
        fecha: new Date().getTime()
    };
}

const crearMensajeConFecha = ( nombre, mensaje, fecha ) => {
    return {
        nombre,
        mensaje,
        fecha: fecha
    };
}

module.exports = {
    crearMensaje,
    crearMensajeConFecha
}