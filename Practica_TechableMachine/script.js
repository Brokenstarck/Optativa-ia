
const URL_MODELO = .modelo;

let modelo;
let webcam;
let camaraActiva = false;
let analizandoCamara = false;
let ultimaPrediccion = null;
let ultimoRegistro = ;
let frameId = null;

const selectorImagen = document.getElementById(selector-imagen);
const vistaPrevia = document.getElementById(vista-previa);
const resultado = document.getElementById(resultado);
const predicciones = document.getElementById(predicciones);
const estado = document.getElementById(estado);
const camaraDiv = document.getElementById(camara);
const botonAnalizar = document.getElementById(analizar);
const botonIniciar = document.getElementById(iniciar);
const botonDetener = document.getElementById(detener);
const umbral = document.getElementById(umbral);
const valorUmbral = document.getElementById(valor-umbral);
const historial = document.getElementById(historial);

 Cargar el modelo
async function cargarModelo() {
    try {
        modelo = await tmImage.load(
            URL_MODELO + model.json,
            URL_MODELO + metadata.json
        );

        estado.textContent =
            `Modelo cargado ${modelo.getTotalClasses()} categorías`;

        botonAnalizar.disabled = false;
    } catch (error) {
        estado.textContent =
            No se ha podido cargar el modelo. Revisa la carpeta modelo.;
        console.error(error);
    }
}

 Mostrar las predicciones y aplicar el umbral
function mostrarPredicciones(prediction, origen) {
    const mejor = prediction.reduce((a, b) =
        b.probability  a.probability  b  a
    );

    const porcentaje = mejor.probability  100;
    const minimo = Number(umbral.value);

    if (porcentaje = minimo) {
        resultado.textContent =
            `¡Coincidencia! ${mejor.className} (${porcentaje.toFixed(1)} %)`;
    } else {
        resultado.textContent =
            `No hay coincidencia suficiente. Mejor resultado ` +
            `${mejor.className} (${porcentaje.toFixed(1)} %)`;
    }

    predicciones.replaceChildren();

    prediction.forEach(p = {
        const contenedor = document.createElement(div);
        contenedor.className = prediccion;

        const texto = document.createElement(p);
        texto.textContent =
            `${p.className} ${(p.probability  100).toFixed(1)} %`;

        const barra = document.createElement(div);
        barra.className = barra;

        const progreso = document.createElement(div);
        progreso.className = progreso;
        progreso.style.width =
            `${Math.max(0, Math.min(100, p.probability  100))}%`;

        barra.appendChild(progreso);
        contenedor.append(texto, barra);
        predicciones.appendChild(contenedor);
    });

    ultimaPrediccion = {
        clase mejor.className,
        confianza porcentaje,
        origen
    };

    guardarResultado(ultimaPrediccion);
}

 Clasificar una imagen subida
selectorImagen.addEventListener(change, evento = {
    const archivo = evento.target.files[0];

    if (!archivo) return;

    if (!archivo.type.startsWith(image)) {
        resultado.textContent = Selecciona un archivo de imagen válido.;
        return;
    }

    const lector = new FileReader();

    lector.onload = eventoLectura = {
        vistaPrevia.onload = async () = {
            if (!modelo) return;

            try {
                const prediccion = await modelo.predict(vistaPrevia);
                mostrarPredicciones(prediccion, Imagen subida);
            } catch (error) {
                console.error(error);
                resultado.textContent = Error al analizar la imagen.;
            }
        };

        vistaPrevia.src = eventoLectura.target.result;
    };

    lector.readAsDataURL(archivo);
});

 Botón para analizar la imagen seleccionada
botonAnalizar.addEventListener(click, async () = {
    if (!modelo  !vistaPrevia.complete 
        !vistaPrevia.naturalWidth) {
        resultado.textContent = Primero selecciona una imagen.;
        return;
    }

    try {
        const prediccion = await modelo.predict(vistaPrevia);
        mostrarPredicciones(prediccion, Imagen subida);
    } catch (error) {
        console.error(error);
        resultado.textContent = No se pudo analizar la imagen.;
    }
});

 Iniciar la cámara
botonIniciar.addEventListener(click, async () = {
    if (!modelo  camaraActiva) return;

    try {
        webcam = new tmImage.Webcam(400, 300, true);
        await webcam.setup();
        await webcam.play();

        camaraDiv.replaceChildren(webcam.canvas);
        camaraActiva = true;
        botonIniciar.disabled = true;
        botonDetener.disabled = false;
        estado.textContent = Cámara activa;

        bucleCamara();
    } catch (error) {
        console.error(error);
        estado.textContent =
            No se pudo acceder a la cámara. Comprueba los permisos.;
    }
});

 Analizar continuamente los fotogramas
async function bucleCamara() {
    if (!camaraActiva  analizandoCamara) return;

    analizandoCamara = true;

    try {
        webcam.update();
        const prediction = await modelo.predict(webcam.canvas);

        if (camaraActiva) {
            mostrarPredicciones(prediction, Cámara);
        }
    } catch (error) {
        console.error(error);
    } finally {
        analizandoCamara = false;
    }

    if (camaraActiva) {
        frameId = requestAnimationFrame(bucleCamara);
    }
}

 Detener la cámara
botonDetener.addEventListener(click, detenerCamara);

function detenerCamara() {
    camaraActiva = false;

    if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
    }

    if (webcam) {
        webcam.stop();
        camaraDiv.replaceChildren();
        webcam = null;
    }

    botonIniciar.disabled = false;
    botonDetener.disabled = true;
    estado.textContent = Cámara detenida;
}

window.addEventListener(pagehide, detenerCamara);

 Actualizar el umbral
umbral.addEventListener(input, () = {
    valorUmbral.textContent = `${umbral.value}%`;

    if (ultimaPrediccion) {
        const { clase, confianza } = ultimaPrediccion;

        resultado.textContent = confianza = Number(umbral.value)
             `¡Coincidencia! ${clase} (${confianza.toFixed(1)} %)`
             `Confianza insuficiente ${clase} (${confianza.toFixed(1)} %)`;
    }
});

 Guardar y mostrar el historial
function guardarResultado(dato) {
    const registro = {
        ...dato,
        fecha new Date().toLocaleString(es-ES)
    };

     Evitar guardar decenas de resultados por segundo con la cámara
    const clave = `${registro.origen}-${registro.clase}`;

    if (clave === ultimoRegistro && registro.origen === Cámara) {
        return;
    }

    ultimoRegistro = clave;

    try {
        const datos = JSON.parse(
            localStorage.getItem(historialIA)  []
        );

        datos.unshift(registro);
        localStorage.setItem(
            historialIA,
            JSON.stringify(datos.slice(0, 50))
        );

        mostrarHistorial();
    } catch (error) {
        console.error(No se pudo guardar el historial, error);
    }
}

function mostrarHistorial() {
    historial.replaceChildren();

    let datos = [];

    try {
        datos = JSON.parse(
            localStorage.getItem(historialIA)  []
        );
    } catch {
        datos = [];
    }

    datos.forEach(dato = {
        const elemento = document.createElement(li);
        elemento.textContent =
            `${dato.fecha} — ${dato.clase} — ` +
            `${dato.confianza.toFixed(1)} % — ${dato.origen}`;

        historial.appendChild(elemento);
    });
}

document.getElementById(limpiar).addEventListener(click, () = {
    localStorage.removeItem(historialIA);
    mostrarHistorial();
});

 Inicializar la aplicación
botonAnalizar.disabled = true;
valorUmbral.textContent = `${umbral.value}%`;
mostrarHistorial();
cargarModelo();
