import React, { useState } from "react";
import { Form, Input, Button, message, Typography, Modal } from "antd";
import { DownloadOutlined, LockOutlined, HomeOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axios";

const { Title } = Typography;

const BackupButton = () => {
  const [form] = Form.useForm();
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  const handleSelectPath = async () => {
    try {
      const values = form.getFieldsValue();
      const defaultPath = values.filename?.endsWith(".backup")
        ? values.filename
        : `${values.filename || "respaldo"}.backup`;

      const filePath = await window.electronAPI.invoke("select-backup-path", { defaultPath });
      if (filePath) {
        form.setFieldsValue({ filename: filePath });
      }
    } catch (err) {
      console.error("Error seleccionando ruta:", err);
      message.error("No se pudo seleccionar la ruta");
    }
  };

  const handleBackup = async () => {
    try {
      const values = await form.validateFields();

      if (!values.filename) {
        message.warning("Selecciona una ruta de destino para el respaldo");
        return;
      }

      Modal.confirm({
        title: "¿Deseas generar un respaldo?",
        content: "Esto creará un archivo de respaldo de la base de datos.",
        okText: "Generar",
        cancelText: "Cancelar",
        onOk: async () => {
          setDownloading(true);
          try {
            let filename = values.filename;
            if (!filename.endsWith(".backup")) {
              filename = filename.replace(/\.[^/.]+$/, "") + ".backup";
            }

            const response = await apiClient.get("/api/respaldo/backup", {
              params: {
                filename,
                password: values.password || "",
              },
              responseType: "arraybuffer",
            });

            const result = await window.electronAPI.invoke("save-backup-file", {
              filePath: filename,
              data: response.data,
            });

            if (result.success) {
              message.success("Respaldo guardado correctamente.");
              form.resetFields();
            } else {
              message.error(`Error al guardar: ${result.error}`);
            }
          } catch (err) {
            console.error(err);
            message.error("Error al generar el respaldo");
          } finally {
            setDownloading(false);
          }
        },
      });
    } catch {
      message.error("Por favor completa los campos obligatorios");
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        border: "1px solid #d9d9d9",
        display: "flex",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div style={{ flex: 1, backgroundColor: "#f9f9f9", padding: 24 }}>
        <Button
          icon={<HomeOutlined />}
          onClick={() => navigate("/home")}
          style={{ marginBottom: 16 }}
        >
          Inicio
        </Button>

        <Title level={4}>Generación de respaldo</Title>

        <Form form={form} layout="vertical">
          <Form.Item
            name="filename"
            label="Destino del archivo .backup"
            rules={[{ required: true, message: "Selecciona una ruta de destino" }]}
          >
            <Input
              readOnly
              placeholder="Selecciona destino..."
              addonAfter={
                <Button icon={<FolderOpenOutlined />} onClick={handleSelectPath} />
              }
            />
          </Form.Item>

          <Form.Item name="password" label="Proteger con contraseña (opcional)">
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Contraseña del respaldo"
            />
          </Form.Item>

          <Form.Item style={{ textAlign: "right" }}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleBackup}
              loading={downloading}
            >
              Generar Respaldo
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default BackupButton;