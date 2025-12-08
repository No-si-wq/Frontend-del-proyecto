import React, { useState, useEffect } from "react";
import {
  Button,
  message,
  Input,
  Form,
  Modal,
  Typography,
  Progress,
} from "antd";
import {
  UploadOutlined,
  LockOutlined,
  ReloadOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axios";
import { io } from "socket.io-client";

const { Title } = Typography;

const RestoreButton = () => {
  const [file, setFile] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

    useEffect(() => {
    const socket = io();
    socket.on("backup-progress", (data) => {
      if (data.total) setProgress(Math.floor((data.bytes / data.total) * 100));
      else setProgress(0);
    });

    return () => socket.disconnect();
  }, []);

  const handleFileSelect = async () => {
    try {
      const filePath = await window.electronAPI.invoke("select-restore-file");
      if (!filePath) return;
      setFile({ path: filePath, name: filePath.split(/[\\/]/).pop() });
      message.success(`Archivo seleccionado: ${filePath.split(/[\\/]/).pop()}`);
    } catch (err) {
      console.error(err);
      message.error("Error al seleccionar archivo");
    }
  };

  const handleRestore = async () => {
    if (!file) {
      message.warning("Selecciona un archivo de respaldo");
      return;
    }

    const values = await form.validateFields();
    const password = values.password || "";

    try {
      setLoading(true);
      setProgress(0);

      const verifyRes = await apiClient.post("/api/respaldo/restore", {
        filePath: file.path,
        password,
        verifyOnly: true,
      });

      if (!verifyRes.data.valid) {
        message.error("Contraseña incorrecta o archivo corrupto");
        setLoading(false);
        return;
      }

      Modal.confirm({
        title: "¿Deseas restaurar el respaldo?",
        content: "Esto sobrescribirá los datos actuales de la base de datos.",
        okText: "Restaurar",
        cancelText: "Cancelar",
        onOk: async () => {
          try {
            await apiClient.post("/api/respaldo/restore", {
              filePath: file.path,
              password,
            });
            message.success("Restauración completada correctamente");
            setFile(null);
            form.resetFields();
            setProgress(100);
          } catch (err) {
            console.error(err);
            message.error("Error al restaurar respaldo");
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (err) {
      console.error(err);
      message.error("Error al verificar el respaldo");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #d9d9d9",
        backgroundColor: "#f5f5f5",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate("/home")}>
          Inicio
        </Button>
      </div>

      <Title level={4} style={{ marginBottom: 24 }}>
        Restauración de Respaldo
      </Title>

      <Form form={form} layout="vertical">
      <Form.Item
        label="Archivo de respaldo (.backup)" required>
        <Button
          icon={<UploadOutlined />}
          onClick={handleFileSelect}  
        >
          Seleccionar respaldo
        </Button>

        {file && (
          <div style={{ marginTop: 8, fontStyle: "italic" }}>
            Archivo: <strong>{file.name}</strong>
          </div>
        )}
      </Form.Item>

        <Form.Item name="password" label="Contraseña (si aplica)">
          <Input.Password prefix={<LockOutlined />} 
          placeholder="Contraseña del respaldo"
          disabled={loading}
          />
        </Form.Item>

        {loading && (
          <Form.Item>
            <Progress percent={progress} status="active" />
          </Form.Item>
        )}

        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleRestore} 
            disabled={!file}
            loading={loading}
          >
            Restaurar Respaldo
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RestoreButton;