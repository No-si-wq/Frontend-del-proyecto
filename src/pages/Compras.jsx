import React, { useEffect, useState } from "react";
import {
  Layout, Menu, Button, Typography, Modal, message
} from "antd";
import {
  PlusOutlined, ReloadOutlined, SaveOutlined, UserAddOutlined, ShoppingCartOutlined
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProveedorForm from "../components/ProveedorForm";
import TablaCarrito from "../components/TablaCarrito";
import SelectorEntidad from "../components/SelectorEntidad";
import ModalSeleccionTienda from "../components/ModalSeleccionTienda";
import ModalIngresoPago from "../components/ModalIngresoPago";
import PanelResumenPago from "../components/PanelResumenPago";
import SelectorProductos from "../components/SelectorProductos";
import { useCarrito } from "../hooks/useCarrito";
import apiClient from '../api/axios';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Compras = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idCompra = searchParams.get("id");
  const esEdicion = Boolean(idCompra);
  const modoVista = searchParams.get("view") === "true";

  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modalProveedor, setModalProveedor] = useState(false);
  const [proveedorLoading, setProveedorLoading] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const [folio, setFolio] = useState("");
  const [metodosPago, setMetodosPago] = useState([]);
  const [modalSeleccionTienda, setModalSeleccionTienda] = useState(false);
  const [tiendasDisponibles, setTiendasDisponibles] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [mostradorSeleccionado, setMostradorSeleccionado] = useState(null);
  const compraHabilitada = Boolean(tiendaSeleccionada && mostradorSeleccionado);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [modalPanelConfirmar, setModalPanelConfirmar] = useState(false);
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

  const [compraData, setCompraData] = useState(null);

  const fetchFolio = async () => {
    try {
      const { data } = await apiClient.get('/api/compras/next-folio'); 
      setFolio(data.folio);
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
    const fetchProveedores = async () => {
      try {
        const res = await apiClient.get('/api/proveedores');
        setProveedores(res.data);
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
    fetchProveedores();
    fetchMetodosPago();
    if (!esEdicion) {
      fetchFolio(); 
    }
  }, []);

  useEffect(() => {
    if (esEdicion) {
      apiClient.get(`/api/compras/${idCompra}`)
      .then(({ data }) => {
        setFolio(data.folio);
        setProveedorSeleccionado(data.supplierId ?? null);
        setTiendaSeleccionada(data.storeId ?? null);
        setMostradorSeleccionado(data.cajaId ?? null);
        setPagosRecibidos(data.formasPago ?? []);

        const productosCompra = data.productos.map(p => ({
          id: p.productoId,
          name: p.producto ?? "Producto eliminado",
          description: "",
          price: p.price,
          cantidad: p.cantidad,
          total: p.price * p.cantidad,
          tax: { percent: 0 }
        }));

        setCompraData(productosCompra); 
        message.success("Compra cargada para edición");
    })
      .catch (err => {
        console.error(err);
        message.error("No se pudo cargar la compra");
      })
    };
  }, [esEdicion, idCompra]);

  useEffect(() => {
    if (!tiendaSeleccionada) return;

    const fetchProductos = async () => {
      try {
        const { data } = await apiClient.get(`/api/inventario/by-store/${tiendaSeleccionada}`);
        setProductos(data);
      } catch {
        message.error("No se pudieron cargar los productos");
      }
    };

    fetchProductos();
  }, [tiendaSeleccionada]);

  // Cargar carrito solo cuando los productos están listos
  useEffect(() => {
    if (esEdicion && productos.length && compraData) {
      setCarrito(compraData);
    }
  }, [esEdicion, productos, compraData]);

  // Forzar selección de tienda si no está
  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const { data } = await apiClient.get('/api/stores');
        setTiendasDisponibles(data);

        if (!esEdicion) {
          setModalSeleccionTienda(true);
        }
      } catch {
        message.error("No se pudieron cargar las tiendas");
      }
    };

    fetchTiendas();
  }, [esEdicion]);

  const handleRegistrar = async () => {
    if (!proveedorSeleccionado || carrito.length === 0) {
      message.warning("Completa todos los campos obligatorios");
      return;
    }

    setLoading(true);

    const url = esEdicion ? `/api/compras/${idCompra}` : '/api/compras';

    const payload = {
      supplierId: proveedorSeleccionado,
      storeId: tiendaSeleccionada,
      cajaId: mostradorSeleccionado,
      productos: carrito.map(({ id, cantidad, price }) => ({
        productoId: id,
        cantidad,
        price
      })),
      formasPago: pagosRecibidos
    };

    try {
      const response = esEdicion
        ? await apiClient.put(url, payload)
        : await apiClient.post(url, payload);

      message.success(esEdicion ? "Compra actualizada con éxito" : "Compra registrada con éxito");
      console.log("Compra registrada:", response.data);

      if (!esEdicion) {
        setCarrito([]);
        setPagosRecibidos([]);
        setProveedorSeleccionado(null);
        setModalPanelConfirmar(false);
        fetchFolio();
        setProductoSeleccionado(null);
      } else {
        navigate("/compras/facturas");
      }
    } catch (error) {
      console.error("Error al registrar compra:", error);
      const msg = error.response?.data?.error || "No se pudo registrar la compra";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const ribbon = (
    <Menu mode="horizontal" style={{ marginBottom: 8 }}>
      <Menu.Item key="nueva" icon={<PlusOutlined />} onClick={() => { setCarrito([]); setPagosRecibidos([]); 
        setProveedorSeleccionado(null); fetchFolio();
      }}>
        Nueva compra
      </Menu.Item>
      <Menu.Item key="guardar" icon={<SaveOutlined />} onClick={() => setModalPanelConfirmar(true)}>
        Registrar compra
      </Menu.Item>
      <Menu.Item key="recargar" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
        Recargar
      </Menu.Item>
      <Menu.Item key="proveedores" icon={<UserAddOutlined />} onClick={() => setModalProveedor(true)}>
        Nuevo proveedor
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
          <Title level={4}>Registro de Compras</Title>
          <Text type="secondary" style={{ fontSize: 18, fontWeight: "bold" }}>FOLIO: {folio}</Text>

          {!compraHabilitada && (
            <div style={{ background: "#fff3cd", padding: 16, margin: "16px 0", border: "1px solid #ffeeba", borderRadius: 6 }}>
              <Text strong>Debes seleccionar una tienda y un mostrador para comenzar.</Text>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span>Proveedor:</span>
              <SelectorEntidad
                label="Proveedor"
                value={proveedorSeleccionado}
                opciones={proveedores}
                onSelect={!esEdicion && !modoVista ? setProveedorSeleccionado : undefined}
                onNuevo={!esEdicion && !modoVista ? () => setModalProveedor(true) : undefined}
                disabled={esEdicion || modoVista}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span>Agregar producto:</span>
              <SelectorProductos
                productos={productos}
                value={productoSeleccionado}
                onChange={setProductoSeleccionado}
                onSelect={(producto) => {
                  agregarProducto(producto.id);
                  setProductoSeleccionado(null); 
                }}
                disabled={!compraHabilitada || modoVista}
              />
            </div>

            <TablaCarrito
              items={carrito}
              onCantidadChange={!modoVista ? cambiarCantidad : undefined}
              onEliminar={!modoVista ? eliminarDelCarrito : undefined}
              total={total}
            />

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              block
              style={{ fontSize: 24, height: 60 }}
              onClick={() => setModalPanelConfirmar(true)}
              disabled={!compraHabilitada || carrito.length === 0 || loading || modoVista}
            >
              REGISTRAR COMPRA
            </Button>
          </div>
        </div>
      </Content>

      {!modoVista && (
      <ProveedorForm
        visible={modalProveedor}
        onCreate={async values => {
          setProveedorLoading(true);
          try {
            const { data: nuevo } = await apiClient.post('/api/proveedores', values);

            setProveedores(prev => [...prev, nuevo]);
            setProveedorSeleccionado(nuevo.id);
            setModalProveedor(false);
            message.success("Proveedor agregado");
          } catch {
            message.error("Error al agregar proveedor");
          }
          setProveedorLoading(false);
        }}
        onCancel={() => setModalProveedor(false)}
        confirmLoading={proveedorLoading}
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
        open={modalPanelConfirmar}
        onCancel={() => setModalPanelConfirmar(false)}
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
          onConfirmarPago={handleRegistrar}
          onCancelar={() => setModalPanelConfirmar(false)}
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
          setTimeout(() => setModalPanelConfirmar(true), 250);
        }}
      />
    </Layout>
  );
};

export default Compras;