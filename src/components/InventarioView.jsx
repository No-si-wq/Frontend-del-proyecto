import React, { useState, useEffect } from "react";
import {
  Table, Tabs, Space, Button, Input, message, Modal, Form, Select, InputNumber
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, FileExcelOutlined, SearchOutlined, AppstoreOutlined
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useInventario } from "../hooks/useInventario";
import apiClient from "../api/axios";

const { TabPane } = Tabs;

const InventarioView = ({ storeId }) => {
  const {
    productos, categorias = [], taxOptions = [], loading, fetchProductos
  } = useInventario(storeId);

  const [busqueda, setBusqueda] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [precioFinal, setPrecioFinal] = useState(0);
  const [form] = Form.useForm();

  // Filtrar productos cuando cambian busqueda o productos
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

  // Sincronizar formulario con producto seleccionado cuando se abre modal de edición
  useEffect(() => {
    if (editMode && selectedProducto) {
      const tax = selectedProducto.tax?.percent ?? 0;
      const precioSinImpuesto = selectedProducto.price / (1 + tax);

      form.setFieldsValue({
        name: selectedProducto.name,
        sku: selectedProducto.sku,
        quantity: selectedProducto.quantity,
        price: precioSinImpuesto.toFixed(2),
        taxId: selectedProducto.tax?.id || null,
        categoryId: selectedProducto.category?.id || null,
      });

      setPrecioFinal(selectedProducto.price.toFixed(2));
    } else {
      form.resetFields();
    }
  }, [editMode, selectedProducto, form]);

  // Exportar a Excel
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
      Categoría: p.category?.name || "Sin categoría"
    };
  });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer]), "Inventario.xlsx");
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedProducto(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = () => {
    if (!selectedProducto) return;
    setEditMode(true);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedProducto) return;

    Modal.confirm({
      title: "Eliminar producto",
      content: `¿Desea eliminar "${selectedProducto.name}"?`,
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await apiClient.delete(`/api/inventario/${selectedProducto.id}`);
          message.success("Producto eliminado");
          setSelectedProducto(null);
          fetchProductos();
        } catch (error) {
          console.error("Error al eliminar producto:", error);
          message.error("Error al eliminar producto");
        }
      }
    });
  };

  const onFinish = async (values) => {
    const impuesto = taxOptions.find(t => t.value === values.taxId);
    const percent = impuesto?.percent || 0;
    const precioConImpuesto = parseFloat(values.price) * (1 + percent);

    const payload = {
      name: values.name,
      sku: values.sku,
      quantity: Number(values.quantity),
      price: precioConImpuesto,
      taxId: values.taxId,
      categoryId: values.categoryId || null,
      storeId,
    };

    try {
      let response;
      if (editMode) {
        response = await apiClient.put(`/api/inventario/${selectedProducto.id}`, payload);
      } else {
        response = await apiClient.post(`/api/inventario/tienda/${storeId}`, payload);
      }

      const productoGuardado = response.data;
      message.success(editMode ? "Producto actualizado" : "Producto creado");
      setModalVisible(false);
      form.resetFields();
      setSelectedProducto(null);
      await fetchProductos();

      if (editMode) {
        setSelectedProducto(productoGuardado);
      }
    } catch (error) {
      console.error("Error al guardar producto:", error.response?.data || error.message);
      message.error("Error al guardar el producto");
    }
  };

  
  const columns = [
    { title: "Nombre", dataIndex: "name", key: "name" },
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Cantidad", dataIndex: "quantity", key: "quantity" },
    {
      title: "Precio (con impuesto)",
      dataIndex: "price",
      key: "price",
      render: v => `L. ${v.toFixed(2)}`
    },
    {
      title: "Impuesto",
      dataIndex: "tax",
      key: "tax",
      render: (t, record) =>
        t?.percent != null
          ? `(${(t.percent * 100).toFixed(2)}%) - L. ${(record.price * t.percent).toFixed(2)}`
          : "Sin impuesto"
    },
    {
      title: "Categoría",
      key: "category",
      render: (_, r) => r.category?.name || "Sin categoría"
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Tabs defaultActiveKey="1" type="card" style={{ marginBottom: 16 }}>
        <TabPane tab={<><AppstoreOutlined /> Archivo</>} key="1">
          <Space wrap>
            <Button 
              onClick={openAddModal} 
              icon={<PlusOutlined />} 
              disabled={!storeId} 
              title={!storeId ? "Selecciona una tienda primero" : ""}
            >
              Añadir
            </Button>
            <Button onClick={openEditModal} icon={<EditOutlined />} disabled={!selectedProducto}>
              Editar
            </Button>
            <Button onClick={handleDelete} icon={<DeleteOutlined />} disabled={!selectedProducto}>
              Eliminar
            </Button>
            <Button onClick={fetchProductos} icon={<ReloadOutlined />}>Actualizar</Button>
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
      </Tabs>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={productosFiltrados}
        loading={loading}
        onRow={record => ({
          onClick: () => setSelectedProducto(record),
        })}
        rowClassName={record => (selectedProducto?.id === record.id ? "ant-table-row-selected" : "")}
        pagination={{ pageSize: 12 }}
        onChange={(pagination, filters, sorter) => {
          fetchProductos(); 
        }}
      />


      <Modal
        open={modalVisible}
        title={editMode ? "Editar Producto" : "Agregar Producto"}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedProducto(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[
            { required: true, message: "El SKU es obligatorio" }, 
            { type: "string", pattern: /^[0-9]+$/, message: "El SKU debe ser un número" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="quantity" label="Cantidad" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Precio (sin impuesto)"
            rules={[
              { required: true, message: "El precio es obligatorio" },
              { type: "number", min: 0, message: "El precio debe ser mayor o igual a 0" }
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={0.01}
              onChange={(value) => {
                const impuesto = taxOptions.find(t => t.value === form.getFieldValue("taxId"));
                const porcentaje = impuesto?.percent || 0;
                const precioConImpuesto = parseFloat(value || 0) * (1 + porcentaje);
                setPrecioFinal(precioConImpuesto.toFixed(2));
              }}
            />
          </Form.Item>
          <Form.Item name="taxId" label="Impuesto">
            <Select
              placeholder="Seleccione un impuesto"
              allowClear
              options={taxOptions}
              onChange={(value) => {
                const precioBase = form.getFieldValue("price");
                const impuesto = taxOptions.find(t => t.value === value);
                const porcentaje = impuesto?.percent || 0;
                const precioConImpuesto = parseFloat(precioBase || 0) * (1 + porcentaje);
                setPrecioFinal(precioConImpuesto.toFixed(2));
              }}
            />
          </Form.Item>
          <Form.Item label="Precio con impuesto">
            <Input value={`L. ${precioFinal}`} disabled />
          </Form.Item>
          <Form.Item name="categoryId" label="Categoría">
            <Select placeholder="Seleccione una categoría" allowClear>
              {categorias.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} >
            {editMode ? "Actualizar" : "Guardar"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default InventarioView;