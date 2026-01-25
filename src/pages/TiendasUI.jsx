import React, { useState, useEffect } from "react";
import { Layout, Tabs, Typography, message } from "antd";
import {
  ShopOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { useTiendas } from "../hooks/useTiendas";
import {
  createStore,
  updateStore,
  deleteStore,
} from "../api/storesAPI";
import SidebarMenu from "../components/SidebarMenu";
import InventarioView from "../components/InventarioView";
import CajasView from "../components/CajasView";

const { Sider, Content } = Layout;
const { Title } = Typography;

const getIcon = (iconName) => {
  switch (iconName) {
    case "shop":
      return <ShopOutlined />;
    case "appstore":
      return <AppstoreOutlined />;
    case "database":
      return <DatabaseOutlined />;
    case "percentage":
      return <PercentageOutlined />;
    default:
      return null;
  }
};

const extractStoreIdFromKey = (key) => {
  const match = key?.match(/^store-(\d+)/);
  return match ? Number(match[1]) : null;
};

const TiendasUI = () => {
  const { treeData, fetchTiendas } = useTiendas();
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  useEffect(() => {
    fetchTiendas();
  }, []);

  useEffect(() => {
    setSelectedStoreId(extractStoreIdFromKey(selectedKey));
  }, [selectedKey]);

  const handleCreate = async (data) => {
    try {
      await createStore(data);
      await fetchTiendas();
      message.success("Tienda creada con éxito");
    } catch {
      message.error("Error al crear tienda");
    }
  };

  const handleUpdate = async (id, values) => {
    try {
      await updateStore(id, values);
      await fetchTiendas();
      message.success("Tienda actualizada");
    } catch {
      message.error("Error al actualizar tienda");
    }
  };

  const handleDelete = async () => {
    if (!selectedStoreId) {
      message.warning("Selecciona una tienda");
      return;
    }

    try {
      await deleteStore(selectedStoreId);
      await fetchTiendas();
      setSelectedKey(null);
      message.success("Tienda eliminada");
    } catch {
      message.error("No se pudo eliminar la tienda");
    }
  };

  const renderContent = () => {
    if (!selectedKey)
      return <Title level={4}>Seleccione una tienda o módulo</Title>;

    const modulo = selectedKey.split("-")[2];

    switch (modulo) {
      case "inventario":
        return <InventarioView storeId={selectedStoreId} />;
      case "cajas":
        return <CajasView storeId={selectedStoreId} />;
      case "politicas":
        return <p>Políticas</p>;
      default:
        return <p>Resumen</p>;
    }
  };

  const renderTreeWithIcons = (data) =>
    data.map((node) => ({
      ...node,
      icon: getIcon(node.icon),
      children: node.children
        ? renderTreeWithIcons(node.children)
        : [],
    }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={300} theme="light" style={{ padding: "16px 0" }}>
        <SidebarMenu
          treeData={renderTreeWithIcons(treeData)}
          selectedKey={selectedKey}
          onSelect={(keys) => setSelectedKey(keys[0])}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReload={fetchTiendas}
          selectedStoreId={selectedStoreId}
        />
      </Sider>

      <Layout>
        <Content style={{ padding: 24 }}>
          <Tabs
            type="card"
            items={[
              { key: "1", label: "Gestión", children: renderContent() },
              { key: "2", label: "Configuración", children: <p>Config</p> },
            ]}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default TiendasUI;