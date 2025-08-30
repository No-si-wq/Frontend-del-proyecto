import React from "react";
import { Table, InputNumber, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

/**
 * Componente de tabla para mostrar productos en el carrito
 * 
 * @param {Array} items - Lista de productos en el carrito
 * @param {Function} onCantidadChange - Función para cambiar la cantidad de un producto
 * @param {Function} onEliminar - Función para eliminar un producto del carrito
 * @param {number} total - Total general de la venta/compra
 * @param {boolean} mostrarResumen - Si se debe mostrar la fila de resumen
 */
const TablaCarrito = ({
  items,
  onCantidadChange,
  onEliminar,
  total,
  mostrarResumen = true,
}) => {
  const columns = [
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 100,
      render: (text, record) => (
        <InputNumber
          min={1}
          value={record.cantidad}
          onChange={value => onCantidadChange(record.id, value)}
        />
      ),
    },
    { title: "Artículo", dataIndex: "name", key: "name", width: 150 },
    { title: "Descripción", dataIndex: "description", key: "description", width: 200 },
    { title: "Precio", dataIndex: "price", key: "price", width: 100 },
    { title: "Total", dataIndex: "total", key: "total", width: 100 },
    {
      title: "",
      dataIndex: "id",
      width: 50,
      render: (id) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          size="small"
          onClick={() => onEliminar(id)}
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowKey="id"
      pagination={false}
      size="small"
      scroll={{ x: true }}
      summary={() =>
        mostrarResumen && (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={4}>
              <b>Total:</b>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1}>
              <b>L. {total.toFixed(2)}</b>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} />
          </Table.Summary.Row>
        )
      }
    />
  );
};

export default TablaCarrito;