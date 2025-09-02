import React, { useEffect, useState } from "react";
import {
  Layout, Menu, Button, Typography, message, Modal
} from "antd";
import {
  PlusOutlined, ReloadOutlined, SaveOutlined, UserAddOutlined, ShoppingCartOutlined, DollarOutlined
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

import ClienteForm from "../components/ClienteForm";
import TablaCarrito from "../components/TablaCarrito";
import SelectorEntidad from "../components/SelectorEntidad";
import SelectorProductos from "../components/SelectorProductos";
import ModalSeleccionTienda from "../components/ModalSeleccionTienda";
import ModalIngresoPago from "../components/ModalIngresoPago";
import PanelResumenPago from "../components/PanelResumenPago";
import { useCarrito } from "../hooks/useCarrito";
import apiClient from "../api/axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Ventas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idVenta = searchParams.get("id");
  const modoVista = searchParams.get("view") === "true";

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalCliente, setModalCliente] = useState(false);
  const [clienteLoading, setClienteLoading] = useState(false);

  const [folio, setFolio] = useState("");
  const [metodosPago, setMetodosPago] = useState([]);
  const [modalSeleccionTienda, setModalSeleccionTienda] = useState(false);
  const [tiendasDisponibles, setTiendasDisponibles] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [mostradorSeleccionado, setMostradorSeleccionado] = useState(null);
  const ventaHabilitada = Boolean(tiendaSeleccionada && mostradorSeleccionado);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null); 
  const esEdicion = Boolean(idVenta);

  const [modalPanelPago, setModalPanelPago] = useState(false);
  const [modalRecibido, setModalRecibido] = useState(false);
  const [pagosRecibidos, setPagosRecibidos] = useState([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);
  const [valorIngreso, setValorIngreso] = useState(0);
  const [loading, setLoading] = useState(false);
  const [monedas, setMonedas] = useState([]);

  const {
    carrito,
    setCarrito,
    agregarProducto,
    cambiarCantidad,
    eliminarDelCarrito,
    subtotal,
    impuestos,
    total
  } = useCarrito(productos);

  useEffect(() => {
    if (esEdicion) {
      apiClient.get(`/api/ventas/${idVenta}`)
        .then(({ data }) => {
          setFolio(data.folio);
          setClienteSeleccionado(data.clienteId ?? null);
          setTiendaSeleccionada(data.storeId ?? null);
          setMostradorSeleccionado(data.cajaId ?? null);
          setPagosRecibidos(data.formasPago ?? []);

          const productosVenta = data.productos.map(p => ({
            id: p.productoId,
            name: p.producto ?? "Producto eliminado",
            description: "",
            price: p.price,
            cantidad: p.cantidad,
            total: p.price * p.cantidad,
            tax: { percent: 0 }
          }));

          setCarrito(productosVenta);
          message.success("Venta cargada correctamente");
        })
        .catch(err => {
          console.error("Error al cargar venta:", err);
          message.error("No se pudo cargar la venta para edición");
        });
    }
  }, [esEdicion, idVenta]);

    const fetchFolio = async () => {
      try {
      const res = await apiClient.get('/api/ventas/next-folio');
      setFolio(res.data.folio);
      } catch {
        setFolio("ERROR");
      }
    };

  const fetchCurrencies = async () => {
    try {
      const res = await apiClient.get('/api/currencies');
        setMonedas(res.data.data);  
      } catch (error) {
        message.error("Error al cargar las monedas");
        console.error(error);
      }
    };

  useEffect(() => {
  if (modalRecibido) {
    fetchCurrencies();
  }
}, [modalRecibido]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await apiClient.get('/api/clientes');
        setClientes(res.data);
      } catch {
        message.error("No se pudieron cargar los clientes");
      }
    };
    const fetchMetodosPago = async () => {
      try {
      const res = await apiClient.get('/api/payment-methods');
      setMetodosPago(res.data.data);
      } catch {
        message.error("No se pudieron cargar los métodos de pago");
      }
    };
    fetchClientes();
    fetchMetodosPago();
    if (!esEdicion) {
      fetchFolio();
    }
  }, []);

  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const res = await apiClient.get('/api/stores');
        setTiendasDisponibles(res.data);
        if (!idVenta) setModalSeleccionTienda(true);
      } catch {
        message.error("No se pudieron cargar las tiendas");
      }
    };
    fetchTiendas();
  }, [idVenta]);

  useEffect(() => {
    const fetchProductos = async () => {
      if (!tiendaSeleccionada) return;
      try {
        const res = await apiClient.get(`/api/inventario/by-store/${tiendaSeleccionada}`);
        setProductos(res.data);
      } catch {
        message.error("No se pudieron cargar los productos");
      }
    };
    if (tiendaSeleccionada) fetchProductos();
  }, [tiendaSeleccionada]);

  const handleRegistrarVenta = async () => {
    if (!clienteSeleccionado || carrito.length === 0) {
      message.warning("Completa todos los campos obligatorios");
      return;
    }

    setLoading(true);

    const url = esEdicion ? `/api/ventas/${idVenta}` : "/api/ventas";

    const payload = {
      clienteId: clienteSeleccionado,
      storeId: tiendaSeleccionada,
      cajaId: mostradorSeleccionado,
      productos: carrito.map(({ id, cantidad }) => ({ productoId: id, cantidad })),
      formasPago: pagosRecibidos,
    };

    try {
      if (esEdicion) {
        await apiClient.put(url, payload);
        message.success("Venta actualizada correctamente");
        navigate("/ventas/panel");
      } else {
        await apiClient.post(url, payload);
        message.success("Venta registrada correctamente");
        setCarrito([]);
        setPagosRecibidos([]);
        setClienteSeleccionado(null);
        setModalPanelPago(false);
        fetchFolio();
        setProductoSeleccionado(null); 
      }
    } catch (error) {
      console.error("Error al registrar venta:", error);
      message.error("No se pudo registrar la venta");
    } finally {
      setLoading(false);
    }
  };

  const ribbon =  (
    <Menu mode="horizontal" style={{ marginBottom: 8 }}>
      <Menu.Item key="nueva" icon={<PlusOutlined />} onClick={() => { setCarrito([]); setPagosRecibidos([]); }}>
        Nueva venta
      </Menu.Item>
      <Menu.Item key="guardar" icon={<SaveOutlined />} onClick={() => setModalPanelPago(true)}>
        Pagar
      </Menu.Item>
      <Menu.Item key="recargar" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
        Recargar
      </Menu.Item>
      <Menu.Item key="clientes" icon={<UserAddOutlined />} onClick={() => setModalCliente(true)}>
        Nuevo cliente
      </Menu.Item>
      <Menu.Item key="inicio" icon={<ShoppingCartOutlined />} onClick={() => navigate("/home")} style={{ float: "right" }}>
        Ir al inicio
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#f4f6fa", padding: "0 16px", boxShadow: "0 1px 4px #eee" }}>{ribbon}</Header>
      <Content style={{ padding: 16, background: "#eaf0fb" }}>
        <div style={{ maxWidth: 1200, margin: "auto", background: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 2px 8px #d5deef" }}>
          <Title level={4}>Punto de Venta</Title>
          <Text type="secondary" style={{ fontSize: 18, fontWeight: "bold" }}>FOLIO: {folio}</Text>
          {!ventaHabilitada && (
            <div style={{ background: "#fff3cd", padding: 16, margin: "16px 0", border: "1px solid #ffeeba", borderRadius: 6 }}>
              <Text strong>Debes seleccionar una tienda y un mostrador para comenzar</Text>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span>Cliente:</span>
              <SelectorEntidad
                label="Cliente"
                value={clienteSeleccionado}
                opciones={clientes}
                onSelect={!esEdicion && !modoVista ? setClienteSeleccionado : undefined}
                onNuevo={!esEdicion && !modoVista ? () => setModalCliente(true) : undefined}
                disabled={modoVista || esEdicion}
                
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span>Agregar producto:</span>
              <SelectorProductos
                productos={productos}
                onSelect={!modoVista ? (producto) => {
                  agregarProducto(producto.id);
                  setProductoSeleccionado(null);
                } : undefined}
                value={productoSeleccionado}
                onChange={!modoVista ? setProductoSeleccionado : undefined}
                disabled={!ventaHabilitada || modoVista}
              />
            </div>

            <TablaCarrito
              items={carrito}
              onCantidadChange={!modoVista ? cambiarCantidad : undefined}
              onEliminar={!modoVista ? eliminarDelCarrito : undefined}
              total={total}
              soloLectura={modoVista}
            />

            <Button
              type="primary"
              size="large"
              icon={<DollarOutlined />}
              block
              style={{ fontSize: 24, height: 60 }}
              onClick={() => setModalPanelPago(true)}
              disabled={!ventaHabilitada || carrito.length === 0 || loading || modoVista}
            >
              PAGAR
            </Button>
          </div>
        </div>
      </Content>

      {!modoVista && (
      <ClienteForm
        visible={modalCliente}
        onCreate={async values => {
          setClienteLoading(true);
          try {
              const res = await apiClient.post('/api/clientes', values);
              setClientes(prev => [...prev, res.data]);
              setClienteSeleccionado(res.data.id);
              setModalCliente(false);
              message.success("Cliente agregado");
          } catch {
            message.error("Error al agregar cliente");
          }
          setClienteLoading(false);
        }}
        onCancel={() => setModalCliente(false)}
        confirmLoading={clienteLoading}
      />)}

      <ModalSeleccionTienda
        open={modalSeleccionTienda}
        tiendas={tiendasDisponibles}
        tiendaSeleccionada={tiendaSeleccionada}
        mostradorSeleccionado={mostradorSeleccionado}
        onSeleccion={(tiendaId, cajaId) => {
          setTiendaSeleccionada(tiendaId);
          setMostradorSeleccionado(cajaId);
        }}
        onClose={() => setModalSeleccionTienda(false)}
      />

      <Modal
        open={modalPanelPago}
        onCancel={() => setModalPanelPago(false)}
        footer={null}
        width={400}
        centered
        destroyOnClose
      >
        <PanelResumenPago
          metodosPago={metodosPago.map(mp => ({ key: mp.id, descripcion: `${mp.clave} - ${mp.descripcion}` }))}
          subtotal={subtotal}
          impuestos={impuestos}
          total={total}
          pagosRecibidos={pagosRecibidos}
          onAgregarPago={(metodoPagoSeleccionado) => {
            setMetodoSeleccionado(metodoPagoSeleccionado);
            setTimeout(() => setModalRecibido(true), 250);
          }}
          onConfirmarPago={handleRegistrarVenta}
          onCancelar={() => setModalPanelPago(false)}
        />
      </Modal>

      <ModalIngresoPago
        open={modalRecibido}
        onCancel={() => {
          setModalRecibido(false);
          setMetodoSeleccionado(null);
          setValorIngreso(0);
        }}
        valorIngreso={valorIngreso}
        setValorIngreso={setValorIngreso}
        metodoPago={metodoSeleccionado}
        monedas={monedas}
        onAceptar={({ valorOriginal, valorConvertido, moneda, metodo }) => {
          setPagosRecibidos(prev => [
            ...prev,
            {
              metodo: metodo.descripcion,
              importe: valorConvertido,
              importeOriginal: valorOriginal,
              abreviatura: moneda.abreviatura
            }
          ]);
          setModalRecibido(false);
          setTimeout(() => setModalPanelPago(true), 250);
        }}
      />
    </Layout>
  );
};

export default Ventas;