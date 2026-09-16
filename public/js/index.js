class ConversorNotaciones {
    constructor() {
        // Definimos cuáles serán nuestros operadores permitidos
        // Usamos Set porque la búsqueda de elementos es más rápida que en un Array
        this.operadores = new Set(['+', '-', '*', '/', '^']);
        
        // Le indicamos al programa quién tiene prioridad, jerarquía de operaciones
        // La potencia (^) manda sobre la multiplicación, división, y estas sobre la suma y resta.
        this.jerarquia = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
    }

    // Función para saber si el texto que leemos es un operador válido
    esOperador(elemento) { 
        return this.operadores.has(elemento); 
    }

    separarEnTokens(expresion) {
        // Usamos una expresión regular para "romper" el texto en pedazos útiles
        // Separa letras y números de los operadores y paréntesis, ignorando espacios en blanco
        return expresion.match(/([a-zA-Z0-9]+|[\+\-\*\/\(\)\^])/g) || [];
    }

    identificarNotacion(tokens) {
        // Si el primer elemento es un operador, la notación obligatoriamente es Prefija
        // Si el último es un operador (y no es un paréntesis de cierre), es Postfija
        // Si no cumple ninguna de las dos, asumimos por descarte que es Infija
        return this.esOperador(tokens[0]) ? 'Prefija' : (this.esOperador(tokens[tokens.length - 1]) && tokens[tokens.length - 1] !== ')') ? 'Postfija' : 'Infija';
    }

    infijaAPostfija(tokens) {
        let salida = [], pila = [];
        
        // Leemos cada pedazo de la expresión de izquierda a derecha
        for (let token of tokens) {
            // Si es un número o letra, va directo al resultado final
            if (/[a-zA-Z0-9]/.test(token)) salida.push(token);
            
            // Si es un paréntesis que abre, lo guardamos en la pila para recordar que empezamos un nuevo bloque
            else if (token === '(') pila.push(token);
            
            // Si cerramos paréntesis, sacamos todo de la pila hacia el resultado hasta encontrar donde abrimos
            else if (token === ')') {
                while (pila.length && pila[pila.length - 1] !== '(') salida.push(pila.pop());
                // Eliminamos el paréntesis de apertura que quedó
                pila.pop(); 
            } 
            
            // Si es un operador revisamos la jerarquía
            // Si el operador en la pila tiene igual o mayor peso, lo sacamos primero
            else if (this.esOperador(token)) {
                while (pila.length && pila[pila.length - 1] !== '(' && this.jerarquia[pila[pila.length - 1]] >= this.jerarquia[token]) {
                    salida.push(pila.pop());
                }
                pila.push(token);
            }
        }
        
        // Al final, vaciamos lo que haya sobrado en la pila hacia el resultado
        while (pila.length) salida.push(pila.pop());
        return salida;
    }

    prefijaAPostfija(tokens) {
        let pila = [];
        // Como es prefija el truco es leer la expresión al revés de derecha a izquierda
        for (let i = tokens.length - 1; i >= 0; i--) {
            let token = tokens[i];
            
            // Si es operador, sacamos los dos últimos elementos agrupados y los unimos con el operador al final
            // Si no simplemente lo metemos a la pila como un arreglo nuevo.
            pila.push(this.esOperador(token) ? [...pila.pop(), ...pila.pop(), token] : [token]);
        }
        return pila.pop() || [];
    }

    postfijaAInfija(tokens) {
        let pila = [];
        // Recorremos de izquierda a derecha
        for (let token of tokens) {
            // Preparamos las variables temporales
            let op2, op1; 
            
            // Si es operador, sacamos los dos últimos números, letras y los encerramos en paréntesis con el operador en medio
            // Si es número o letra va directo a la pila
            this.esOperador(token) ? (op2 = pila.pop(), op1 = pila.pop(), pila.push(`(${op1} ${token} ${op2})`)) : pila.push(token);
        }
        return pila.pop() || '';
    }

    postfijaAPrefija(tokens) {
        let pila = [];
        for (let token of tokens) {
            let op2, op1;
            
            // Es similar al anterior pero ahora armamos el string poniendo el operador al inicio
            this.esOperador(token) ? (op2 = pila.pop(), op1 = pila.pop(), pila.push(`${token} ${op1} ${op2}`)) : pila.push(token);
        }
        return pila.pop() || '';
    }

    procesar(expresion) {
        const tokens = this.separarEnTokens(expresion);
        // Filtro por si envían un string vacío
        if (!tokens.length) return null; 

        const tipoOriginal = this.identificarNotacion(tokens);
        
        // Convertimos la entrada a Postfija dependiendo de lo que el usuario haya escrito
        let tokensPostfijos = tipoOriginal === 'Postfija' ? tokens 
            : tipoOriginal === 'Prefija' ? this.prefijaAPostfija(tokens) 
            : this.infijaAPostfija(tokens);

        // Devolvemos un objeto con todas las variantes procesadas
        return {
            detectada: tipoOriginal,
            infija: this.postfijaAInfija([...tokensPostfijos]),  
            prefija: this.postfijaAPrefija([...tokensPostfijos]),
            postfija: tokensPostfijos.join(' ')
        };
    }
}


// Instanciamos el conversor (la clase debe estar arriba)
const conversor = new ConversorNotaciones();
    
// Obtenemos los valores directos del HTML con su ID
const btnAnalizar = document.getElementById('btnAnalizar');
const btnLimpiar = document.getElementById('btnLimpiar'); 
const entradaExpresion = document.getElementById('exprInput');
const contenedorResultados = document.getElementById('resultados');

// Procesar la entrada cuándo se use el botón de análizar
btnAnalizar.addEventListener('click', () => {
    procesarEntrada();
});

// Acción del botón limpiar
btnLimpiar.addEventListener('click', () => {
    entradaExpresion.value = ''; 
    contenedorResultados.innerHTML = ''; 
    contenedorResultados.classList.add('d-none'); 
    entradaExpresion.focus(); // Agregué el focus para mayor comodidad
});

// Lógica encargada de validar y procesar lo que escribió el usuario, es el filtro inicial
function procesarEntrada() {
    const textoEntrada = entradaExpresion.value.trim();
    
    if (!textoEntrada) {
        mostrarError('Por favor, ingresa una expresión válida.');
        return;
    }

    try {
        const resultado = conversor.procesar(textoEntrada);
        // Si el procesamiento es exitoso mostramos el resultado, si no, lanzamos error 
        resultado ? mostrarExito(resultado) : mostrarError('No se pudo interpretar la expresión.');
    } catch (error) {
        // Este catch atrapa errores graves como que falte un paréntesis o un operador inválido
        mostrarError('Error de sintaxis. Revisa los operadores y paréntesis.');
    }
}

// Mandamos el HTML
function mostrarExito(resultado) {
    contenedorResultados.classList.remove('d-none');
    contenedorResultados.innerHTML = `
        <div class="alert alert-success d-flex align-items-center mb-3">
            <strong>Tipo detectado:</strong> <span class="ms-2 badge bg-success fs-6">${resultado.detectada}</span>
        </div>
        <ul class="list-group list-group-flush border rounded">
            <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                <span class="text-secondary fw-bold">Infija</span>
                <span class="badge bg-dark rounded-pill fs-6 px-3 py-2 text-monospace">${resultado.infija}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                <span class="text-secondary fw-bold">Prefija</span>
                <span class="badge bg-dark rounded-pill fs-6 px-3 py-2 text-monospace">${resultado.prefija}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                <span class="text-secondary fw-bold">Postfija</span>
                <span class="badge bg-dark rounded-pill fs-6 px-3 py-2 text-monospace">${resultado.postfija}</span>
            </li>
        </ul>
    `;
}

// Mostrar advertencias al usuario
function mostrarError(mensaje) {
    contenedorResultados.classList.remove('d-none');
    contenedorResultados.innerHTML = `<div class="alert alert-danger mb-0">${mensaje}</div>`;
}