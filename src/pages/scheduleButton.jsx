import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Steps, message, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";
import apiClient from "../api/axios";

const { Step } = Steps;
const { Text } = Typography;

const ScheduleBackup = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [backupDir, setBackupDir] = useState("");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBackupDir = async () => {
      try {
        const dir = await window.electronAPI.getBackupDir();
        setBackupDir(dir);
      } catch (err) {
        console.error("No se pudo obtener la carpeta de backups:", err);
      }
    };

    fetchBackupDir();
  }, []);

  const next = async () => {
    try {
      await form.validateFields();
      setStep(step + 1);
    } catch {}
  };

  const prev = () => setStep(step - 1);

  const handleSchedule = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      setLoading(true);

      await apiClient.post("/api/respaldo/schedule-backup", {
        schedule: values.schedule,
        password: values.password || "",
        options: ["dbOnly"],
      });

      message.success("Respaldo automático programado correctamente.");
      form.resetFields();
      setStep(0);
    } catch (err) {
      console.error(err);
      message.error("Error al programar respaldo, asegurese de ingresar bien el formato CRON");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <Button icon={<HomeOutlined />} onClick={() => navigate("/home")}>
        Inicio
      </Button>
      <Card title="Asistente de respaldos automáticos" style={{ marginTop: 16 }}>
        <Steps current={step} size="small" style={{ marginBottom: 24 }}>
          <Step title="Contraseña" />
          <Step title="Programación" />
        </Steps>

        <Form form={form} layout="vertical">
          {step === 0 && (
            <Form.Item name="password" label="Contraseña (opcional)">
              <Input.Password placeholder="Protege con contraseña" />
            </Form.Item>
          )}

          {step === 1 && (
            <>
              <Form.Item
                name="schedule"
                label="Hora de respaldo (expresión CRON)"
                rules={[{ required: true, message: "Ingresa programación tipo cron" }]}
              >
                <Input placeholder="Ej: 0 2 * * *" />
              </Form.Item>

              <Form.Item label="Directorio de respaldo">
                <Input value={backupDir} disabled />
              </Form.Item>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            {step > 0 && <Button onClick={prev}>Anterior</Button>}
            {step < 1 ? (
              <Button type="primary" onClick={next}>Siguiente</Button>
            ) : (
              <Button type="primary" onClick={handleSchedule} loading={loading}>
                Finalizar
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ScheduleBackup;