import React, { useState } from "react";
import { Card, Row, Col, InputNumber, Button, Typography, Form } from "antd";

const { Title, Text } = Typography;

export default function RecibidoEfectivoCard({ total, onCancel, onAceptar }) {
  const [importe, setImporte] = useState(total);
  // Puedes agregar más estados si luego necesitas los otros campos

  const handleOk = () => {
    if (importe < total) return; // puedes mostrar un mensaje si quieres
    onAceptar(importe);
  };

  return (
    <Card
      style={{
        maxWidth: 350,
        margin: "0 auto",
        borderRadius: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Title level={5} style={{ textAlign: "center", marginBottom: 18 }}>
        Efectivo
      </Title>
      <Form layout="vertical">
        <Form.Item label={<Text strong>Importe</Text>}>
          <InputNumber
            autoFocus
            min={0}
            value={importe}
            style={{ width: "100%" }}
            onChange={setImporte}
            formatter={v => `$ ${v}`}
            parser={v => v.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>
        {/* Los siguientes campos los puedes habilitar cuando los requieras */}
        {/* <Form.Item label="Número de autorización">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Número de documento">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Fecha de vencimiento">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Imp. moneda nacional">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Tipo de cambio">
          <Input disabled />
        </Form.Item> */}
      </Form>
      <Row justify="end" gutter={8}>
        <Col>
          <Button onClick={onCancel}>Cancelar</Button>
        </Col>
        <Col>
          <Button type="primary" style={{ minWidth: 80 }} onClick={handleOk} disabled={importe < total}>
            Aceptar
          </Button>
        </Col>
      </Row>
    </Card>
  );
}