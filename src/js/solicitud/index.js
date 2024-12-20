import { Dropdown } from "bootstrap";
import { ocultarLoader, Toast, validarFormulario, mostrarLoader } from "../funciones";
import Swal from "sweetalert2";
import DataTable from "datatables.net-bs5";
import { lenguaje } from "../lenguaje";

const formulario = document.getElementById('formularioSolicitud');
const btnGuardar = document.getElementById('btnGuardar');
const next_step = document.getElementById('next-step');

// Funciones para avanzar entre pasos
const nextStepBtn = document.getElementById('next-step');
const backStepBtn = document.getElementById('back-step');

// Asegurarse de que los elementos existan antes de añadir event listeners
if (nextStepBtn) {
    nextStepBtn.addEventListener('click', function () {
        // La navegación se manejará en la función siguiente()
    });
}

if (backStepBtn) {
    backStepBtn.addEventListener('click', function () {
        // Ocultar paso 2 y mostrar paso 1
        document.getElementById('step-2').style.display = 'none';
        document.getElementById('step-1').style.display = 'block';

        document.getElementById('sol_cred_catalogo').value = '';

        Toast.fire({
            icon: 'info',
            title: 'Ingrese Catálogo'
        });
    });
}
ocultarLoader();



// Funciones de validación
function emailIsValid(email) {
    const emailRegExp = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|live\.com|ejemplo\.com)$/;
    return emailRegExp.test(email);
}

function telefonoIsValid(telefono) {
    const telefonoRegExp = /^\d{8}$/;
    return telefonoRegExp.test(telefono);
}


// Modificación de la función guardar
const guardar = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
        title: "Confirmación",
        text: "Revise bien la Información ya que esta acción es Irreversible. ¿Está Seguro que desea continuar?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, Generar Solicitud",
        cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;
    mostrarLoader();

    // Obtener referencias a los campos de correo y teléfono
    const correoInput = document.getElementById('sol_cred_correo');
    const telefonoInput = document.getElementById('sol_cred_telefono');

    // Validar correo electrónico
    const correo = correoInput.value.trim();
    if (!correo) {
        ocultarLoader();
        Swal.fire({
            title: "Correo vacío",
            text: "El correo electrónico es obligatorio.",
            icon: "info"
        });
        correoInput.classList.add('is-invalid');
        return;
    }

    if (!emailIsValid(correo)) {
        ocultarLoader();
        Swal.fire({
            title: "Correo inválido",
            text: "El correo electrónico no es válido. Use solo dominios permitidos.",
            icon: "error"
        });
        correoInput.classList.add('is-invalid');
        return;
    } else {
        correoInput.classList.remove('is-invalid');
    }

    // Validar teléfono
    const telefono = telefonoInput.value.trim();
    if (!telefono) {
        ocultarLoader();
        Swal.fire({
            title: "Teléfono vacío",
            text: "El número de teléfono es obligatorio.",
            icon: "info"
        });
        telefonoInput.classList.add('is-invalid');
        return;
    }

    if (!telefonoIsValid(telefono)) {
        ocultarLoader();
        Swal.fire({
            title: "Teléfono inválido",
            text: "El número de teléfono debe tener exactamente 8 dígitos.",
            icon: "error"
        });
        telefonoInput.classList.add('is-invalid');
        return;
    } else {
        telefonoInput.classList.remove('is-invalid');
    }

    const camposRequeridos = [
        'sol_cred_catalogo',
        'sol_cred_correo',
        'sol_cred_telefono',
        'sol_cred_usuario'
    ];

    if (!validarFormulario(formulario, ['solicitud_id'], camposRequeridos)) {
        Swal.fire({
            title: "Campos vacíos",
            text: "Debe llenar todos los campos requeridos",
            icon: "info",
        });
        ocultarLoader();
        return;
    }

    // Modificado para obtener tanto el valor como el texto de los módulos
    const moduloSelects = document.querySelectorAll('select[name="modulos[]"]');
    const justificacionInputs = document.querySelectorAll('input[name="justificaciones[]"]');

    // Obtener las descripciones de los módulos en lugar de los códigos
    const modulos = Array.from(moduloSelects)
        .map(select => {
            const selectedOption = select.options[select.selectedIndex];
            return selectedOption.text.trim(); // Obtener el texto en lugar del value
        })
        .filter(modulo => modulo !== 'Seleccione...');

    const justificaciones = Array.from(justificacionInputs)
        .map(input => input.value.trim())
        .filter(justificacion => justificacion !== '');

    if (modulos.length === 0 || justificaciones.length === 0 || modulos.length !== justificaciones.length) {
        Swal.fire({
            title: "Datos Incompletos",
            text: "Debe llenar todos los módulos con sus justificaciones correspondientes.",
            icon: "info"
        });
        return;
    }

    if (modulos.length > 4) {
        Swal.fire({
            title: "Límite Excedido",
            text: "Solo puede solicitar un máximo de 4 módulos",
            icon: "warning"
        });
        return;
    }

    try {
        const formData = new FormData(formulario);
        const dataToSend = new FormData();

        // Añadir campos básicos
        dataToSend.append('sol_cred_catalogo', formData.get('sol_cred_catalogo'));
        dataToSend.append('sol_cred_correo', formData.get('sol_cred_correo'));
        dataToSend.append('sol_cred_telefono', formData.get('sol_cred_telefono'));
        dataToSend.append('sol_cred_usuario', formData.get('sol_cred_usuario'));
        dataToSend.append('sol_cred_fecha_solicitud', new Date().toISOString().split('T')[0]);

        // Guardar las descripciones de los módulos y sus justificaciones
        dataToSend.append('modulos', JSON.stringify(modulos));
        dataToSend.append('justificaciones', JSON.stringify(justificaciones));

        const url = "/AccessEntry-Autocom/API/solicitud/guardar";
        const config = {
            method: 'POST',
            body: dataToSend
        };

        const respuesta = await fetch(url, config);
        const data = await respuesta.json();

        ocultarLoader();

        if (data.codigo === 1) {
            formulario.reset();
            document.getElementById('step-2').style.display = 'none';
            document.getElementById('step-1').style.display = 'block';

            Swal.fire({
                title: "Solicitud Generada con Éxito",
                text: "Su solicitud ha sido registrada. Actualmente se encuentra en proceso. Será notificado oportunamente sobre cualquier actualización respecto al estado de su solicitud.",
                icon: "success",
                footer: '<a href="/AccessEntry-Autocom/estado">Ver Estado de Solicitud</a>',
            });
        } else {
            console.error(data.detalle);
            Swal.fire({
                title: "Error",
                text: data.detalle || "Ocurrió un error al guardar la solicitud.",
                icon: "error",
            });
        }
    } catch (error) {
        console.error('Error al guardar la solicitud:', error);
        ocultarLoader();
        Swal.fire({
            title: "Error",
            text: "Hubo un problema al procesar la solicitud. Inténtelo de nuevo más tarde.",
            icon: "error",
        });
    }
    ocultarLoader();

};

// Modificación de la función agregarModulo
const agregarModulo = async () => {
    mostrarLoader();
    const container = document.getElementById('modulos-container');
    const modulosActuales = container.querySelectorAll('.modulo-grupo').length;

    if (modulosActuales >= 4) {
        Swal.fire({
            title: "Límite Alcanzado",
            text: "Solo puede solicitar un máximo de 4 módulos",
            icon: "warning"
        });
        ocultarLoader();
        return;
    }

    try {
        const response = await fetch("/AccessEntry-Autocom/API/solicitud/obtenerModulos");
        const data = await response.json();

        if (data.codigo !== 1) {
            throw new Error("No se pudieron obtener los módulos");
        }

        const modulos = data.modulos;

        const nuevoModulo = document.createElement('div');
        nuevoModulo.className = 'modulo-grupo mb-2';
        nuevoModulo.innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <label for="modulos[]" class="form-label">Seleccione Módulo</label>
                    <select name="modulos[]" id="modulos[]" class="form-control modulo-select">
                        <option value="#">Seleccione...</option>
                        ${modulos.map(modulo =>
            `<option value="${modulo.gma_desc}">${modulo.gma_desc}</option>`
        ).join('')}
                    </select>
                </div>
                <div class="col-md-5">
                    <label for="justificaciones[]" class="form-label">Justificación</label>
                    <input type="text" 
                        name="justificaciones[]" 
                        id="justificaciones[]" 
                        class="form-control justificacion-input" 
                        placeholder="Justificación"
                        maxlength="200"
                    >
                </div>
                <div class="col-md-2 d-flex align-items-start justify-content-left mt-4">
                    <button type="button" class="btn btn-danger btn-remove-modulo">
                        <i class="bi bi-x-circle-fill"></i>
                    </button>
                </div>
            </div>`;

        container.appendChild(nuevoModulo);

        const removeButtons = document.querySelectorAll('.btn-remove-modulo');
        removeButtons.forEach((btn, index) => {
            btn.style.display = index === 0 ? 'none' : 'block';
        });

    } catch (error) {
        console.error('Error al obtener módulos:', error);
        Swal.fire({
            title: "Error",
            text: "No se pudieron cargar los módulos",
            icon: "error"
        });
    } finally {
        ocultarLoader(); // Asegurarse de ocultar el loader independientemente del resultado
    }
};



// Manejar la eliminación de módulos
document.addEventListener('click', function (e) {
    if (e.target.closest('.btn-remove-modulo')) {
        const moduloGrupo = e.target.closest('.modulo-grupo');
        const container = document.getElementById('modulos-container');

        // Eliminar el módulo seleccionado
        if (container.children.length > 1) {
            moduloGrupo.remove();

            // Actualizar la visibilidad de los botones de eliminar después de eliminar un módulo
            const removeButtons = document.querySelectorAll('.btn-remove-modulo');
            removeButtons.forEach((btn, index) => {
                if (index === 0) {
                    // Asegurarse de que el primer campo siga ocultando el botón de eliminar
                    btn.style.display = 'none';
                } else {
                    // Mostrar el botón de eliminar para los campos restantes
                    btn.style.display = 'block';
                }
            });
        }
    }
});






const siguiente = async (e) => {
    e.preventDefault();

    // Mostrar el loader al inicio
    mostrarLoader();

    // Establecer la fecha actual en el campo de fecha
    const fechaActual = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    document.getElementById('sol_cred_fecha_solicitud').value = fechaActual;

    // Obtener el valor del catálogo
    const catalogo = formulario.sol_cred_catalogo.value.trim();

    // Validar que se haya ingresado un catálogo
    if (!catalogo) {
        Swal.fire({
            title: "Campo vacío",
            text: "Debe ingresar un número de catálogo",
            icon: "warning"
        });

        // Ocultar el loader cuando hay un error
        ocultarLoader();
        return;
    }

    try {
        // Verificar si existe el catálogo
        const body = new FormData(formulario);
        const url = "/AccessEntry-Autocom/API/solicitud/catalogoExiste";
        const config = {
            method: 'POST',
            body
        };

        const respuesta = await fetch(url, config);
        const data = await respuesta.json();

        // Ocultar el loader después de recibir la respuesta
        ocultarLoader();

        if (data.codigo === 1) {
            // El catálogo existe, obtener los datos del personal
            const urlDatos = "/AccessEntry-Autocom/API/solicitud/obtenerDatosPersonal";
            const respuestaDatos = await fetch(urlDatos, config);
            const datosPersonal = await respuestaDatos.json();
            console.log("Respuesta completa:", datosPersonal);

            if (datosPersonal.codigo === 1) {
                // Llenar los campos con los datos obtenidos
                document.getElementById('nombres_completos').value = datosPersonal.datos.NOMBRES_COMPLETOS;
                document.getElementById('puesto').value = datosPersonal.datos.PUESTO;

                // Mostrar el segundo paso
                document.getElementById('step-1').style.display = 'none';
                document.getElementById('step-2').style.display = 'block';

                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Catalogo Verificado",
                    text: "Compruebe los datos del solicitante y complete los campos para realizar la Solicitud.",
                    showConfirmButton: true,
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: "No se pudieron obtener los datos del personal",
                    icon: "error"
                });
            }
        } else {
            Swal.fire({
                title: "Catálogo no encontrado",
                text: "El número de catálogo ingresado no existe.",
                icon: "error"
            });
        }

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: "Error",
            text: "Ocurrio un problema al verificar el catálogo",
            icon: "error"
        });

        // Ocultar el loader en caso de error
        ocultarLoader();
    }
};





// Event Listeners
formulario.addEventListener('submit', guardar);
next_step.addEventListener('click', siguiente);
document.getElementById('agregar-modulo').addEventListener('click', agregarModulo);
