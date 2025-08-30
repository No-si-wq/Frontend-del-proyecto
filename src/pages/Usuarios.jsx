import React, { useEffect, useState, useContext } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import apiClient from '../api/axios';

const { TabPane } = Tabs;

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/usuarios');
      setUsuarios(res.data);
    } catch {
      message.error("Error al cargar usuarios");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Eliminar usuario
  const onDelete = async () => {
    if (!selectedUsuario) return;
    Modal.confirm({
      title: "¿Está seguro que desea eliminar el usuario?",
      content: `Usuario: ${selectedUsuario.username}`,
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await apiClient.delete(`/api/usuarios/${selectedUsuario.id}`);
          message.success("Usuario eliminado");
          setSelectedUsuario(null);
          fetchUsuarios();
        } catch {
          message.error("No se pudo eliminar el usuario");
        }
      },
    });
  };

    const openCreateModal = () => {
    setEditMode(false);
    setSelectedUsuario(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = () => {
    if (!selectedUsuario) return;
    setEditMode(true);
    form.setFieldsValue({
      username: selectedUsuario.username,
      email: selectedUsuario.email,
      password: "", 
      role: selectedUsuario.role,
    });
    setModalVisible(true);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const dataToSend = { ...values };
      if (editMode && !values.password) {
        delete dataToSend.password;
      }
      
      if (editMode && selectedUsuario) {
        await apiClient.put(`/api/usuarios/${selectedUsuario.id}`, dataToSend);
        message.success("Usuario actualizado exitosamente");
      } else {
        await apiClient.post("/api/usuarios", dataToSend);
        message.success("Usuario creado exitosamente");
      }
      setModalVisible(false);
      fetchUsuarios();
      form.resetFields();
      setSelectedUsuario(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Error al guardar el usuario";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tabla
  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Usuario", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Rol", dataIndex: "role", key: "role" },
    {
      title: "Creado",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => new Date(v).toLocaleString(),
    },
  ];

  // Ribbon
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
            <UserOutlined />
            Archivo
          </span>
        }
        key="1"
      >
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
          <Tooltip title="Agregar usuario">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Añadir
            </Button>
          </Tooltip>
          <Tooltip title="Editar usuario">
            <Button
              icon={<EditOutlined />}
              disabled={!selectedUsuario}
              onClick={openEditModal}
            >
              Editar
            </Button>
          </Tooltip>
          <Tooltip title="Eliminar usuario">
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!selectedUsuario}
              onClick={onDelete}
            >
              Eliminar
            </Button>
          </Tooltip>
          <Tooltip title="Actualizar lista">
            <Button icon={<ReloadOutlined />} onClick={fetchUsuarios}>
              Actualizar
            </Button>
          </Tooltip>
        </Space>
      </TabPane>
      <TabPane
        tab={
          <span>
            <TeamOutlined />
            Acciones
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
        <Table
          columns={columns}
          dataSource={usuarios}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
          onClick: () => setSelectedUsuario(record),
        })}
        rowClassName={(record) => (selectedUsuario?.id === record.id ? "ant-table-row-selected" : "")}
          style={{ background: "white", borderRadius: 4 }}
        />
      </div>
      <Modal
        title={editMode ? "Editar Usuario" : "Añadir Usuario"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedUsuario(null);
        }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="username"
            label="Usuario"
            rules={[{ required: true, message: "Ingrese el nombre de usuario" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Ingrese el correo electrónico" },
              { type: "email", message: "Correo no válido" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={editMode ? "Nueva contraseña" : "Contraseña"}
            rules={[{ required: true, message: "Ingrese la contraseña" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: "Seleccione un rol" }]}
          >
            <Select placeholder="Seleccione un rol">
              <Select.Option value="admin">Administrador</Select.Option>
              <Select.Option value="facturacion">Facturación</Select.Option>
              <Select.Option value="ventas">Ventas</Select.Option>
              <Select.Option value="contabilidad">Contabilidad</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Usuarios;