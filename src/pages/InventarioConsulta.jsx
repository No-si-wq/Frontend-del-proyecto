import React, { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  message,
  Tooltip,
  Space,
  Tabs,
  Input,
} from "antd";
import {
  ReloadOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
  HomeOutlined,
  TeamOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import apiClient from '../api/axios';

const { TabPane } = Tabs;

const InventarioConsulta = () => {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(false);

    useEffect(() => {
      const term = busqueda.trim().toLowerCase();
      setProductosFiltrados(
        term
          ? productos.filter(p =>
              [p.name ]
                .some(s => s?.toLowerCase().includes(term))
            )
          : productos
      );
    }, [busqueda, productos]);

  // Obtener tiendas al iniciar
  useEffect(() => {
    fetchTiendas();
  }, []);

  // Cargar inventario cuando cambia la tienda seleccionada
  useEffect(() => {
    if (storeId !== null) {
      console.log("Consultando productos para tienda:", storeId);
      fetchProductos(storeId);
    }
  }, [storeId]);

  const fetchTiendas = async () => {
    try {
      const res = await apiClient.get('/api/stores');
      console.log("Tiendas cargadas:", res.data);
      setTiendas(res.data);
      if (res.data.length > 0) setStoreId(res.data[0].id);
    } catch (error) {
      console.error("Error al cargar tiendas:", error);
      message.error("Error al cargar tiendas");
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/inventarios/tienda/${storeId}`);
      if (!Array.isArray(res.data)) throw new Error("Formato inválido");
      setProductos(res.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      message.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const rows = productosFiltrados.map(p => {
      const impuesto = p.tax?.percent ? p.price * p.tax.percent : 0;
      return {
        Nombre: p.name,
        SKU: p.sku,
        Cantidad: p.quantity,
        Precio: p.price.toFixed(2),
        Impuesto: p.tax?.percent != null ? `${(p.tax.percent * 100).toFixed(2)}%` : "0%",
        "Monto Impuesto": impuesto.toFixed(2),
        "Precio con impuesto": (p.price + impuesto).toFixed(2),
        Categoría: p.category?.name || "Sin categoría",
        Tienda: p.store?.name || "Sin tienda",
      };
    });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer]), "ConsultaInventario.xlsx");
    };

  const columns = [
    { title: "Nombre", dataIndex: "name", key: "name" },
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Cantidad", dataIndex: "quantity", key: "quantity" },
    {
      title: "Precio",
      dataIndex: "price",
      key: "price",
      render: (value) =>
        `L. ${!isNaN(Number(value)) ? Number(value).toFixed(2) : "0.00"}`,
    },
    {
      title: "Impuesto",
      dataIndex: "tax",
      key: "tax",
      render: (tax) => {
        if (!tax || typeof tax.percent !== "number") return "Sin impuesto";
        const percent = Number(tax.percent);
        return isNaN(percent) ? "Sin impuesto" : `(${(percent * 100).toFixed(2)}%)`;
      },
    },
    {
      title: "Categoría",
      dataIndex: "category",
      key: "category",
      render: (cat) =>
        cat && typeof cat.name === "string" ? cat.name : "Sin categoría",
    },
    {
      title: "Tienda",
      dataIndex: "store",
      key: "store",
      render: (store) =>
        store && typeof store.name === "string" ? store.name : "Sin tienda",
    },
  ];

  const ribbonActions = (
    <Tabs
      defaultActiveKey="1"
      type="card"
      style={{ marginBottom: 16 }}
      tabBarStyle={{ marginBottom: 0 }}
    >
      <TabPane
        tab={
          <span>
            <AppstoreOutlined />
            Archivo
          </span>
        }
        key="1"
      >
        <br />
        <Space>
          <Tooltip title="Ir al inicio">
            <Button
              icon={<HomeOutlined />}
              onClick={() => navigate("/home")}
              style={{ background: "#f5f5f5" }}
            >
              Inicio
            </Button>
          </Tooltip>
          <Tooltip title="Actualizar inventario">
            <Button icon={<ReloadOutlined />} onClick={() => fetchProductos(storeId)}>
              Actualizar
            </Button>
          </Tooltip>
            <Button onClick={exportToExcel} icon={<FileExcelOutlined />}>Excel</Button>
            <Input
              placeholder="Buscar..."
              prefix={<SearchOutlined />}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              allowClear
              style={{ width: 300 }}
            />
        </Space>
      </TabPane>
      <TabPane
        tab={
          <span>
            <TeamOutlined />
            Catálogos
          </span>
        }
        key="2"
      >
        <Space>
          <Button icon={<SearchOutlined />}>Buscar</Button>
        </Space>
      </TabPane>
      <TabPane
        tab={
          <span>
            <SettingOutlined />
            Configuración
          </span>
        }
        key="3"
      >
        <Space>
          <Button icon={<SettingOutlined />}>Opciones</Button>
        </Space>
      </TabPane>
    </Tabs>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #f0f5ff 0%, #fffbe6 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          background: "#e7eaf6",
          borderRadius: 8,
          boxShadow: "0 2px 8px #dbeafe50",
          padding: 16,
        }}
      >
        {ribbonActions}

        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>Seleccionar tienda:</span>
          <Select
            value={storeId}
            onChange={(value) => setStoreId(value)}
            style={{ width: 240 }}
          >
            {tiendas.map((t) => (
              <Select.Option key={t.id} value={t.id}>
                {t.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={productosFiltrados}
          loading={loading}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 12 }}
          style={{ background: "white", borderRadius: 4 }}
        />
      </div>
    </div>
  );
};

export default InventarioConsulta;