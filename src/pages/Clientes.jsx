import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  HomeOutlined,
  EditOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  SearchOutlined,
  TeamOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/Permisos";
import apiClient from '../api/axios';

const { TabPane } = Tabs;

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const { canDeleteClientes } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error("Error al cargar clientes", error);
      message.error("Error al cargar clientes");
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditMode(false);
    setSelectedCliente(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = () => {
    if (!selectedCliente) return;
    setEditMode(true);
    form.setFieldsValue({
      name: selectedCliente.name,
      rtn: selectedCliente.rtn,
      email: selectedCliente.email,
      phone: selectedCliente.phone,
      address: selectedCliente.address,
    });
    setModalVisible(true);
  };

  const onFinish = async (values) => {
    try {
      if (editMode) {
        // Usar apiClient para la solicitud PUT
        await apiClient.put(`/api/clientes/${selectedCliente.id}`, values);
        message.success("Cliente actualizado exitosamente");
      } else {
        // Usar apiClient para la solicitud POST
        await apiClient.post('/api/clientes', values);
        message.success("Cliente añadido exitosamente");
      }
      setModalVisible(false);
      fetchClientes();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      message.error("Error al guardar cliente");
    }
  };

    const handleDelete = async (id) => {
    try {
      // Usar apiClient para la solicitud DELETE
      await apiClient.delete(`/api/clientes/${id}`);
      message.success("Cliente eliminado exitosamente");
      fetchClientes();
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      message.error("Error al eliminar cliente");
    }
  };

  const columns = [
    { title: "Código", dataIndex: "id", key: "id" },
    { title: "Nombre", dataIndex: "name", key: "name" },
    { title: "RTN", dataIndex: "rtn", key: "rtn" },
    { title: "Correo", dataIndex: "email", key: "email" },
    { title: "Teléfono", dataIndex: "phone", key: "phone" },
    { title: "Dirección", dataIndex: "address", key: "address" },
  ];

  const ribbonActions = (
    <Tabs defaultActiveKey="1" type="card" style={{ marginBottom: 16 }}>
      <TabPane tab={<span><AppstoreOutlined /> Archivo</span>} key="1">
        <Space wrap>
          <Tooltip title="Ir al inicio">
            <Button icon={<HomeOutlined />} onClick={() => navigate("/home")}>
              Inicio
            </Button>
          </Tooltip>
          <Tooltip title="Agregar cliente">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Añadir
            </Button>
          </Tooltip>
          <Tooltip title="Editar cliente">
            <Button icon={<EditOutlined />} disabled={!selectedCliente} onClick={openEditModal}>
              Editar
            </Button>
          </Tooltip>
          <Tooltip title="Eliminar cliente">
            <Button danger icon={<DeleteOutlined />} disabled={!selectedCliente} 
            hidden={!canDeleteClientes} onClick={handleDelete}>
              Eliminar
            </Button>
          </Tooltip>
          <Tooltip title="Actualizar">
            <Button icon={<ReloadOutlined />} onClick={fetchClientes}>
              Actualizar
            </Button>
          </Tooltip>
        </Space>
      </TabPane>
      <TabPane tab={<span><TeamOutlined /> Catálogos</span>} key="2">
        <Space><Button icon={<SearchOutlined />}>Buscar</Button></Space>
      </TabPane>
      <TabPane tab={<span><SettingOutlined /> Configuración</span>} key="3">
        <Space><Button icon={<SettingOutlined />}>Opciones</Button></Space>
      </TabPane>
    </Tabs>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f5ff 0%, #fffbe6 100%)", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", background: "#f9f9f9", borderRadius: 8, padding: 16, boxShadow: "0 2px 8px #dbeafe50" }}>
        {ribbonActions}
        <Table
          columns={columns}
          dataSource={clientes}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => setSelectedCliente(record),
          })}
          rowClassName={(record) => (selectedCliente?.id === record.id ? "ant-table-row-selected" : "")}
          style={{ background: "white", borderRadius: 4 }}
        />
      </div>

      <Modal
        title={editMode ? "Editar Cliente" : "Añadir Cliente"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedCliente(null);
        }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rtn" label="RTN" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Correo">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Teléfono" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Dirección" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Clientes;