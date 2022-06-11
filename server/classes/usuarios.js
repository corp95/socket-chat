class Usuarios { //Creamos la clase usuarios

    constructor() { //Inicializamos en el constructor
        this.personas = [];
    }

    agregarPersona(id, nombre, sala, idioma){ //Creamos un método para agregar personas que recibe el id y el nombre y el idioma
        let persona = { id, nombre, sala, idioma };
        this.personas.push(persona);
        return this.personas;
    }

    getPersona( id ) { //Recibimos un id y regresamos el primer elemento que coincida
        let persona = this.personas.filter( persona => {
            return persona.id === id
        })[0];

        return persona;
    }

    getPersonas() {
        return this.personas;
    }

    getPersonasPorSala( sala ) {
        let personasEnSala = this.personas.filter( persona => persona.sala ===sala)
        return personasEnSala;
    }

    borrarPersona( id ) { //Aquí recibimos un id y borramos un usuario
        let personaBorrada = this.getPersona(id);

        this.personas = this.personas.filter( persona => {
            return persona.id != id
        });

        return personaBorrada;
    }

}

module.exports = {
    Usuarios
}