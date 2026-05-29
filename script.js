// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar carrito desde localStorage
    if (!localStorage.getItem('carrito')) {
        localStorage.setItem('carrito', JSON.stringify([]));
    }

    // Inicializar pedidos desde localStorage
    if (!localStorage.getItem('pedidos')) {
        localStorage.setItem('pedidos', JSON.stringify([]));
    }

    // Inicializar usuarios simulados (demo)
    if (!localStorage.getItem('usuarios')) {
        const usuariosDemo = [
            { id: 1, empresa: "Empresa Demo", email: "demo@aquanova.com", password: "123456", telefono: "5512345678", direccion: "Calle Demo 123", rfc: "DEMO801231XYZ" }
        ];
        localStorage.setItem('usuarios', JSON.stringify(usuariosDemo));
    }

    // Actualizar contador del carrito en toda la página
    actualizarContadorCarrito();

    // Actualizar información de usuario logueado
    actualizarSesionUI();

    // Cargar productos en el carrito (si estamos en carrito.html)
    if (window.location.pathname.includes('carrito.html')) {
        cargarCarrito();
    }

    // Cargar pedidos (si estamos en mis-pedidos.html)
    if (window.location.pathname.includes('mis-pedidos.html')) {
        cargarPedidos();
    }

    // Cargar detalle de pedido (si estamos en detalle-pedido.html)
    if (window.location.pathname.includes('detalle-pedido.html')) {
        cargarDetallePedido();
    }

    // Cargar confirmación (si estamos en confirmacion.html)
    if (window.location.pathname.includes('confirmacion.html')) {
        cargarConfirmacion();
    }

    // Evento para el botón de login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            iniciarSesion();
        });
    }

    // Evento para el formulario de registro
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', function (e) {
            e.preventDefault();
            registrarUsuario();
        });
    }

    // Evento para finalizar compra
    const finalizarBtn = document.getElementById('finalizarCompraBtn');
    if (finalizarBtn) {
        finalizarBtn.addEventListener('click', function () {
            finalizarCompra();
        });
    }

    // Eventos para botones "Agregar al carrito" en productos.html
    const botonesAgregar = document.querySelectorAll('.add-to-cart');
    botonesAgregar.forEach(btn => {
        btn.addEventListener('click', function (e) {
            const card = this.closest('.cardPro');
            const id = parseInt(card.dataset.id);
            const nombre = card.dataset.nombre;
            const precio = parseFloat(card.dataset.precio);
            const imagen = card.dataset.imagen;
            agregarAlCarrito(id, nombre, precio, imagen);
        });
    });
});

// ========== FUNCIONES DEL CARRITO ==========

function agregarAlCarrito(id, nombre, precio, imagen) {
    // Verificar si el usuario está logueado
    const usuarioLogueado = localStorage.getItem('usuarioActual');
    if (!usuarioLogueado) {
        if (confirm('Debes iniciar sesión para agregar productos al carrito. ¿Quieres iniciar sesión ahora?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    let carrito = JSON.parse(localStorage.getItem('carrito'));
    const productoExistente = carrito.find(item => item.id === id);

    if (productoExistente) {
        productoExistente.cantidad += 1;
        mostrarNotificacion('✓ Cantidad actualizada: ' + nombre);
    } else {
        carrito.push({
            id: id,
            nombre: nombre,
            precio: precio,
            imagen: imagen,
            cantidad: 1
        });
        mostrarNotificacion('✓ Agregado: ' + nombre);
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const contadores = document.querySelectorAll('#cartCount');
    contadores.forEach(contador => {
        if (contador) contador.textContent = totalItems;
    });
}

function cargarCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contenedor = document.getElementById('carrito-contenedor');
    const totalDiv = document.getElementById('carrito-total');
    const totalSpan = document.getElementById('totalPagar');

    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="carrito-vacio">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Tu carrito está vacío</p>
                <a href="productos.html" class="Seguir">← Seguir comprando</a>
            </div>
        `;
        if (totalDiv) totalDiv.style.display = 'none';
        return;
    }

    if (totalDiv) totalDiv.style.display = 'block';

    let total = 0;
    contenedor.innerHTML = '';
    contenedor.classList.add('contenedor');

    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="inner">
                <div class="front">
                    <img src="${item.imagen}" alt="${item.nombre}">
                    <h3>${item.nombre}</h3>
                </div>
                <div class="back">
                    <p>Precio: $${formatNumber(item.precio)}</p>
                    <p>Cantidad: 
                        <button class="btn-cantidad btn-menos" data-index="${index}">-</button>
                        <span class="cantidad-valor">${item.cantidad}</span>
                        <button class="btn-cantidad btn-mas" data-index="${index}">+</button>
                    </p>
                    <p>Subtotal: $${formatNumber(subtotal)}</p>
                    <button class="btn-eliminar" data-index="${index}">Eliminar</button>
                </div>
            </div>
        `;
        contenedor.appendChild(card);
    });

    if (totalSpan) totalSpan.textContent = formatNumber(total);

    // Eventos para botones de cantidad y eliminar
    document.querySelectorAll('.btn-mas').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            modificarCantidad(index, 1);
        });
    });

    document.querySelectorAll('.btn-menos').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            modificarCantidad(index, -1);
        });
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            eliminarDelCarrito(index);
        });
    });
}

function modificarCantidad(index, cambio) {
    let carrito = JSON.parse(localStorage.getItem('carrito'));
    if (carrito[index]) {
        carrito[index].cantidad += cambio;
        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1);
        }
        localStorage.setItem('carrito', JSON.stringify(carrito));
        cargarCarrito();
        actualizarContadorCarrito();
    }
}

function eliminarDelCarrito(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito'));
    const producto = carrito[index];
    if (confirm(`¿Eliminar "${producto.nombre}" del carrito?`)) {
        carrito.splice(index, 1);
        localStorage.setItem('carrito', JSON.stringify(carrito));
        cargarCarrito();
        actualizarContadorCarrito();
        mostrarNotificacion('🗑️ Producto eliminado');
    }
}

// ========== FUNCIONES DE PEDIDOS ==========

function finalizarCompra() {
    const usuarioLogueado = localStorage.getItem('usuarioActual');
    if (!usuarioLogueado) {
        alert('Debes iniciar sesión para finalizar la compra');
        window.location.href = 'login.html';
        return;
    }

    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    const usuario = JSON.parse(usuarioLogueado);
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

    let total = 0;
    const productos = carrito.map(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        return {
            id: item.id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: subtotal
        };
    });

    const nuevoPedido = {
        id: Date.now(),
        usuarioId: usuario.id,
        usuarioNombre: usuario.empresa,
        fecha: new Date().toLocaleString(),
        total: total,
        estado: 'En proceso',
        productos: productos
    };

    pedidos.unshift(nuevoPedido);
    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    // Guardar el último pedido para la confirmación
    localStorage.setItem('ultimoPedido', JSON.stringify(nuevoPedido));

    // Vaciar carrito
    localStorage.setItem('carrito', JSON.stringify([]));
    actualizarContadorCarrito();

    // Redirigir a confirmación
    window.location.href = 'confirmacion.html';
}

function cargarPedidos() {
    const usuarioLogueado = localStorage.getItem('usuarioActual');
    const contenedor = document.getElementById('pedidos-contenedor');

    if (!contenedor) return;

    if (!usuarioLogueado) {
        contenedor.innerHTML = `
            <div class="sin-pedidos">
                <i class="fa-solid fa-lock"></i>
                <p>Inicia sesión para ver tus pedidos</p>
                <a href="login.html" class="Seguir">Iniciar sesión →</a>
            </div>
        `;
        return;
    }

    const usuario = JSON.parse(usuarioLogueado);
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const misPedidos = pedidos.filter(p => p.usuarioId === usuario.id);

    if (misPedidos.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-pedidos">
                <i class="fa-solid fa-receipt"></i>
                <p>No tienes pedidos realizados</p>
                <a href="productos.html" class="Seguir">Ver productos →</a>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = '';
    contenedor.classList.add('pedidos-grid');

    misPedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-card';
        card.innerHTML = `
            <h3>Pedido #${pedido.id}</h3>
            <p><strong>Total:</strong> $${formatNumber(pedido.total)}</p>
            <p><strong>Estado:</strong> <span class="estado-${pedido.estado.replace(' ', '-')}">${pedido.estado}</span></p>
            <p><strong>Fecha:</strong> ${pedido.fecha}</p>
            <a class="btn-detalle" href="detalle-pedido.html?id=${pedido.id}">
                <span>Ver detalles</span>
            </a>
        `;
        contenedor.appendChild(card);
    });
}

function cargarDetallePedido() {
    const urlParams = new URLSearchParams(window.location.search);
    const pedidoId = parseInt(urlParams.get('id'));
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const pedido = pedidos.find(p => p.id === pedidoId);

    const pedidoIdSpan = document.getElementById('pedidoId');
    const detalleContainer = document.getElementById('detalleProductos');

    if (!pedidoIdSpan || !detalleContainer) return;

    if (!pedido) {
        pedidoIdSpan.textContent = 'No encontrado';
        detalleContainer.innerHTML = '<li>Pedido no encontrado</li>';
        return;
    }

    pedidoIdSpan.textContent = pedido.id;

    detalleContainer.innerHTML = '';
    pedido.productos.forEach(producto => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${producto.nombre} 
            - Cantidad: ${producto.cantidad} 
            - $${formatNumber(producto.precio)}
            <br><small>Subtotal: $${formatNumber(producto.subtotal)}</small>
        `;
        detalleContainer.appendChild(li);
    });

    // Agregar total al final
    const totalLi = document.createElement('li');
    totalLi.style.background = '#00ff88';
    totalLi.style.color = 'black';
    totalLi.style.fontWeight = 'bold';
    totalLi.innerHTML = `TOTAL DEL PEDIDO: $${formatNumber(pedido.total)}`;
    detalleContainer.appendChild(totalLi);
}

function cargarConfirmacion() {
    const ultimoPedido = JSON.parse(localStorage.getItem('ultimoPedido'));

    const pedidoNumero = document.getElementById('pedidoNumero');
    const pedidoTotal = document.getElementById('pedidoTotal');
    const productosLista = document.getElementById('productosLista');

    if (!pedidoNumero || !pedidoTotal || !productosLista) return;

    if (!ultimoPedido) {
        pedidoNumero.textContent = 'No disponible';
        pedidoTotal.textContent = '0';
        productosLista.innerHTML = '<li>No hay información del pedido</li>';
        return;
    }

    pedidoNumero.textContent = ultimoPedido.id;
    pedidoTotal.textContent = formatNumber(ultimoPedido.total);

    productosLista.innerHTML = '';
    ultimoPedido.productos.forEach(producto => {
        const li = document.createElement('li');
        li.innerHTML = `${producto.nombre} - Cantidad: ${producto.cantidad} - $${formatNumber(producto.precio)}`;
        productosLista.appendChild(li);
    });

    // Limpiar el último pedido para que no se muestre al recargar
    // localStorage.removeItem('ultimoPedido'); // Opcional
}

// ========== FUNCIONES DE USUARIO ==========

function iniciarSesion() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuario = usuarios.find(u => u.email === email && u.password === password);

    if (usuario) {
        const usuarioSesion = {
            id: usuario.id,
            empresa: usuario.empresa,
            email: usuario.email
        };
        localStorage.setItem('usuarioActual', JSON.stringify(usuarioSesion));
        window.location.href = 'productos.html';
    } else {
        if (errorDiv) {
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }
}

function registrarUsuario() {
    const empresa = document.getElementById('regEmpresa').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const telefono = document.getElementById('regTelefono').value;
    const direccion = document.getElementById('regDireccion').value;
    const rfc = document.getElementById('regRfc').value;
    const errorDiv = document.getElementById('regError');

    if (!empresa || !email || !password) {
        if (errorDiv) {
            errorDiv.textContent = 'Por favor completa todos los campos obligatorios';
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const existe = usuarios.find(u => u.email === email);

    if (existe) {
        if (errorDiv) {
            errorDiv.textContent = 'Este correo ya está registrado';
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
        return;
    }

    const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;

    const nuevoUsuario = {
        id: nuevoId,
        empresa: empresa,
        email: email,
        password: password,
        telefono: telefono,
        direccion: direccion,
        rfc: rfc
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    // Iniciar sesión automáticamente
    const usuarioSesion = {
        id: nuevoId,
        empresa: empresa,
        email: email
    };
    localStorage.setItem('usuarioActual', JSON.stringify(usuarioSesion));

    // Redirigir a productos
    window.location.href = 'productos.html';
}

function actualizarSesionUI() {
    const usuarioLogueado = localStorage.getItem('usuarioActual');
    const userGreeting = document.getElementById('userGreeting');
    const authLink = document.getElementById('authLink');

    if (usuarioLogueado && userGreeting && authLink) {
        const usuario = JSON.parse(usuarioLogueado);
        userGreeting.textContent = `Hola, ${usuario.empresa}!!`;
        authLink.textContent = 'Cerrar sesión';
        authLink.href = '#';
        authLink.addEventListener('click', function (e) {
            e.preventDefault();
            cerrarSesion();
        });
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    mostrarNotificacion('👋 Sesión cerrada');
    window.location.href = 'index.html';
}

// ========== FUNCIONES DE UTILIDAD ==========

function formatNumber(numero) {
    return numero.toLocaleString('es-MX');
}

function mostrarNotificacion(mensaje) {
    // Crear notificación flotante
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-flotante';
    notificacion.innerHTML = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #00ff88;
        color: black;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 9999;
        animation: fadeInOut 2s ease-in-out;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.remove();
    }, 2000);
}

// Agregar animación CSS dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(100px); }
        15% { opacity: 1; transform: translateX(0); }
        85% { opacity: 1; transform: translateX(0); }
        100% { opacity: 0; transform: translateX(100px); }
    }
`;
document.head.appendChild(style);