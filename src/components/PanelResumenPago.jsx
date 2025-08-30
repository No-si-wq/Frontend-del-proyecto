import React from "react";
import { Table, Card, Typography, Button, message } from "antd";

const { Text } = Typography;

/**
 * Componente reutilizable para mostrar el resumen de pago
 *
 * @param {Object} props
 * @param {Array} metodosPago - Lista de métodos de pago [{ key, descripcion }]
 * @param {number} subtotal
 * @param {number} impuestos
 * @param {number} total
 * @param {Array} pagosRecibidos - Lista de pagos [{ metodo, importe, abreviatura }]
 * @param {Function} onAgregarPago - función al hacer clic en un método de pago
 * @param {Function} onConfirmarPago - función al confirmar pago
 * @param {Function} onCancelar - función al cancelar
 */
const PanelResumenPago = ({
  metodosPago = [],
  subtotal = 0,
  impuestos = 0,
  total = 0,
  pagosRecibidos = [],
  onAgregarPago,
  onConfirmarPago,
  onCancelar
}) => {
  const totalRecibido = pagosRecibidos.reduce((acc, p) => acc + p.importe, 0);
  const cambio = +(totalRecibido - total).toFixed(2);

  const columnsFormasPago = [
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" }
  ];

  return (
    <div style={{ minWidth: 340, maxWidth: 350 }}>
      <Table
        columns={columnsFormasPago}
        dataSource={metodosPago}
        pagination={false}
        size="small"
        bordered
        style={{ marginBottom: 8 }}
        rowKey="key"
        onRow={record => ({
          onClick: () => {
            if (totalRecibido >= total) {
              message.warning("Ya se ha recibido el monto total");
              return;
            }
            onAgregarPago(record); 
          }
        })}
      />

      <Card
        type="inner"
        title="Resumen"
        style={{ marginBottom: 8 }}
        bodyStyle={{ padding: 16 }}
      >
        <ResumenItem label="Subtotal" value={subtotal} />
        <ResumenItem label="Descto" value={0} />
        <ResumenItem label="Impuestos" value={impuestos} />
        <ResumenItem label="Total" value={total} bold />
        <ResumenItem label="Recibido" value={totalRecibido} />
        <ResumenItem label="Cambio" value={cambio} />
      </Card>

      <Card
        type="inner"
        title="Pagos Registrados"
        style={{ marginBottom: 8 }}
        bodyStyle={{ padding: 8 }}
      >
        {pagosRecibidos.length === 0 ? (
          <Text type="secondary">Sin pagos registrados</Text>
        ) : (
          pagosRecibidos.map((p, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{p.metodo}</span>
              <span>{p.abreviatura} {p.importeOriginal.toFixed(2)}</span>

            </div>
          ))
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 8 }}>
        <Button onClick={onCancelar}>Cancelar</Button>
        <Button
          type="primary"
          disabled={totalRecibido < total}
          onClick={onConfirmarPago}
        >
          Confirmar
        </Button>
      </div>
    </div>
  );
};

const ResumenItem = ({ label, value, bold = false }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? "bold" : "normal" }}>
    <span>{label}</span>
    <span>L. {value.toFixed(2)}</span> 
  </div>
);

export default PanelResumenPago;