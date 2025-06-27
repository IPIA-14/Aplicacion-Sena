const API_URL = "https://raw.githubusercontent.com/CesarMCuellarCha/apis/refs/heads/main/SENA-CTPI.matriculados.json";
const VALID_PASSWORD = 'adso2993013'; // Contraseña fija

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formulario-inicio');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const usuario = document.getElementById('usuario')?.value || '';
            const contrasena = document.getElementById('contrasena')?.value || '';

            console.log('Intentando iniciar sesión - Usuario:', usuario, 'Contraseña:', contrasena); // Depuración
            if (contrasena === VALID_PASSWORD) {
                localStorage.setItem('username', usuario);
                console.log('Autenticación exitosa, mostrando interfaz'); // Depuración
                await contenedorAprendices(usuario);
            } else {
                alert('Contraseña o usuarios incorrectos');
                
            }
        });
    }

    const salirBtn = document.getElementById('boton-salir');
    if (salirBtn) {
        salirBtn.addEventListener('click', function() {
            localStorage.clear();
            document.getElementById('contenedor-principal').style.display = 'none';
            document.getElementById('contenedor-inicio').style.display = 'block';
            alert("Estas seguro de salir?"); 
        });
    } 
});

async function contenedorAprendices(usuario) {
    const mainContainer = document.getElementById('contenedor-principal');
    const loginContainer = document.getElementById('contenedor-inicio');
    if (mainContainer && loginContainer && document.getElementById('nombre-usuario')) {
        loginContainer.style.display = 'none';
        mainContainer.style.display = 'block';
        document.getElementById('nombre-usuario').textContent = usuario;
        console.log(usuario); 

        const data = await cargarAprendices();
        await obtenerFicha(data);
    } 
}

async function cargarAprendices() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Los datos recibidos no son un array válido');
        }
        console.log('Datos cargados exitosamente:', data); // Depuración
        return data;
    } catch (error) {
        console.error('Error al obtener datos:', error);
       
    }
}

async function obtenerFicha(data) {
    try {
        const select = document.getElementById('selector-ficha');
        if (select) {
            select.innerHTML = '<option value="">Seleccionar ficha</option>';

            const fichasUnicas = new Set(data.map(item => String(item['FICHA'])));
            fichasUnicas.forEach(ficha => {
                const opcion = document.createElement('option');
                opcion.value = ficha;
                opcion.text = ficha;
                select.appendChild(opcion);
            });

            select.addEventListener('change', handleFichaChange);
        }
    } catch (error) {
        console.error('Error al obtener códigos de ficha:', error);
        const select = document.getElementById('selector-ficha');
        if (select) {
            select.innerHTML = '<option value="" disabled>No se pudieron cargar las fichas debido a un error.</option>';
            alert('Error al cargar las fichas: ' + error.message);
        }
    }
}

async function handleFichaChange() {
    const select = document.getElementById('selector-ficha');
    const codigoFicha = select.value;
    if (codigoFicha) {
        const data = await cargarAprendices();
        const filteredData = data.filter(item => String(item['FICHA']) === String(codigoFicha));

        if (filteredData.length > 0) {
            const programa = filteredData[0]['PROGRAMA'] !== undefined ? filteredData[0]['PROGRAMA'] : 'No disponible';

            if (codigoFicha === '3173001' && programa === 'No disponible') {
                programa = 'Análisis y Desarrollo de Software';
                console.log('Forzado nombre de programa para ficha 3173001:', programa);
            }

            console.log('Claves disponibles en filteredData[0]:', Object.keys(filteredData[0]));
            console.log('Valor de PROGRAMA:', programa);

            const nivel = filteredData[0]['NIVEL_DE_FORMACION'] || 'No especificado';
            const estadoFicha = filteredData[0]['ESTADO_FICHA'] || 'Activa';

            localStorage.setItem('codigoFicha', codigoFicha);
            localStorage.setItem('nombrePrograma', programa);
            localStorage.setItem('nivelFormacion', nivel);
            localStorage.setItem('estadoFicha', estadoFicha);

            document.getElementById('nombre-programa').textContent = programa;
            renderTablaAprendices(filteredData);
        } else {
            alert('No se encontraron datos para la ficha seleccionada.');
            document.getElementById('nombre-programa').textContent = 'No disponible';
            document.getElementById('cuerpo-tabla-aprendices').innerHTML = '';
        }
    } else {
        document.getElementById('nombre-programa').textContent = '';
        document.getElementById('cuerpo-tabla-aprendices').innerHTML = '';
    }
}

document.getElementById('boton-buscar-ficha')?.addEventListener('click', () => {
    const inputFicha = document.getElementById('buscar-ficha')?.value.trim();
    const selector = document.getElementById('selector-ficha'); // corregido aquí

    if (inputFicha && selector) {
        const opciones = Array.from(selector.options).map(op => op.value);
        if (opciones.includes(inputFicha)) {
            selector.value = inputFicha;
            selector.dispatchEvent(new Event('change'));
        } else {
            alert('Ficha no encontrada');
        }
    } else {
        alert('Por favor ingrese un código de ficha válido');
    }
});


function renderTablaAprendices(data) {
    const tableBody = document.getElementById('cuerpo-tabla-aprendices');
    if (tableBody) {
        tableBody.innerHTML = '';

        data.forEach(aprendiz => {
            let estadoKey = 'ESTADO_APRENDIZ';
            let estado = estadoKey ? String(aprendiz[estadoKey]).trim() : '';
            console.log('Estado del aprendiz:', estado);

            let row = document.createElement('tr');

            if (estado.toLowerCase() === 'retiro voluntario') {
                row.classList.add('retiro-voluntario');
            }

            row.innerHTML = `
                <td>${aprendiz['TIPO_DOCUMENTO'] || ''}</td>
                <td>${aprendiz['NUMERO_DOCUMENTO'] || ''}</td>
                <td>${aprendiz['NOMBRE'] || ''}</td>
                <td>${aprendiz['PRIMER_APELLIDO'] || ''}</td>
                <td>${aprendiz['SEGUNDO_APELLIDO'] || ''}</td>
                <td>${estado}</td>
            `;

            tableBody.appendChild(row);
        });
    }
}
