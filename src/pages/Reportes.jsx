import React, { useState } from "react";
import {
  DatePicker,
  Button,
  Card,
  Typography,
  message,
  Space,
  Table,
} from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axios";

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function Reportes() {
  const navigate = useNavigate();
  const [dates, setDates] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);

  const columnsVentas = [
    { title: "FOLIO", dataIndex: "folio", key: "folio" },
    {
      title: "Fecha",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (t) => dayjs(t).format("YYYY-MM-DD"),
    },
    { title: "Cliente", dataIndex: ["client", "name"], key: "cliente" },
    { title: "RTN", dataIndex: ["client", "rtn"], key: "rtn" },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (t) => `L. ${t?.toFixed(2) ?? "0.00"}`,
    },
  ];

  const columnsCompras = [
    { title: "FOLIO", dataIndex: "folio", key: "folio" },
    {
      title: "Fecha",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (t) => dayjs(t).format("YYYY-MM-DD"),
    },
    { title: "Proveedor", dataIndex: ["supplier", "name"], key: "proveedor" },
    { title: "RTN", dataIndex: ["supplier", "rtn"], key: "rtn" },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (t) => `L. ${t?.toFixed(2) ?? "0.00"}`,
    },
  ];

  const validarRango = () => {
    if (!dates || dates.length !== 2) {
      message.warning("Selecciona un rango de fechas válido.");
      return false;
    }
    return true;
  };

  const consultarDatos = async () => {
    if (!validarRango()) return;

    setLoadingDatos(true);
    const [from, to] = dates.map((d) => d.format("YYYY-MM-DD"));

    try {
      const { data } = await apiClient.get("/api/reports/datos", {
        params: { from, to },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setVentas(data.ventas || []);
      setCompras(data.compras || []);
    } catch (error) {
      console.error("Error al consultar datos:", error);
      message.error("Ocurrió un error al obtener los datos.");
    } finally {
      setLoadingDatos(false);
    }
  };

  const descargarPDF = async (tipo) => {
    if (!validarRango()) return;

    const [from, to] = dates.map((d) => d.format("YYYY-MM-DD"));

    try {
      const { data } = await apiClient.get(`/api/reports/${tipo}`, {
        params: { from, to },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        responseType: "blob",
      });

      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_${tipo}_${from}_a_${to}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      message.error("Error al descargar el archivo PDF.");
    }
  };

  const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
  const totalCompras = compras.reduce((sum, c) => sum + (c.total || 0), 0);
  const diferencia = totalVentas - totalCompras;

  return (
    <Card>
      <Button
        type="default"
        onClick={() => navigate("/home")}
        style={{ marginBottom: 16 }}
      >
        Ir al inicio
      </Button>
      <Title level={2}>Reportes de Compras y Ventas</Title>

      <Space style={{ marginBottom: 16 }} wrap>
        <RangePicker
          onChange={setDates}
          format="YYYY-MM-DD"
          allowClear
          value={dates}
        />
        <Button type="primary" onClick={consultarDatos} loading={loadingDatos}>
          Consultar
        </Button>
        <Button onClick={() => descargarPDF("ventas")} type="dashed">
          Descargar PDF Ventas
        </Button>
        <Button onClick={() => descargarPDF("compras")} type="dashed">
          Descargar PDF Compras
        </Button>
      </Space>

      <Card title="Ventas" style={{ marginTop: 24 }}>
        <Table
          dataSource={ventas}
          columns={columnsVentas}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card title="Compras" style={{ marginTop: 24 }}>
        <Table
          dataSource={compras}
          columns={columnsCompras}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>
          Total Ventas:{" "}
          <span style={{ color: "#389e0d" }}> L. {totalVentas.toFixed(2)}</span>
          <br />
          Total Compras:{" "}
          <span style={{ color: "#cf1322" }}>L. {totalCompras.toFixed(2)}</span>
          <br />
          Diferencia:{" "}
          <span style={{ color: diferencia >= 0 ? "green" : "red" }}>
            L. {diferencia.toFixed(2)}
          </span>
        </Title>
      </Card>
    </Card>
  );
}
