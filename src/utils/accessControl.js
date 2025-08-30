const accessControl = {
  admin: [
    '/ventas/panel',
    '/ventas',
    '/clientes',
    '/compras',
    '/compras/facturas',
    '/proveedores',
    '/tiendas',
    '/usuarios',
    '/formas-pago',
    '/dispositivos',
    '/lineas',
    '/departamentos',
    '/categorias',
    '/monedas',
    '/impuestos',
    '/cajas',
    '/inventarioConsulta',
    '/reportes'
  ],
  facturacion: [
    '/ventas',
    '/clientes',
    '/inventarioConsulta',
    '/compras',
    '/compras/facturas',
    '/proveedores',
    '/ventas/panel'
  ],
  contabilidad: [
    '/formas-pago',
    '/monedas',
    '/inventarioConsulta',
    '/impuestos',
    '/reportes'
  ],
  ventas: [
    '/ventas/panel',
    '/ventas',
    '/clientes', 
    '/categorias',
    '/inventarioConsulta',   
  ],
};
export default accessControl;
