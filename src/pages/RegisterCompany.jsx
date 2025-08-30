import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, Alert } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

const { Title } = Typography;

const containerStyle = {
  minHeight: '100vh',
  minWidth: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
  padding: '0',
  margin: '0',
  position: 'fixed',
  top: 0,
  left: 0,
};

const cardStyle = {
  width: '100%',
  maxWidth: 450,
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
  padding: '24px 16px',
};

const RegisterCompany = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/auth/register-company', {
        username: values.username,
        email: values.email,
        password: values.password,
        role: "admin", 
        companyName: values.companyName,
        companyDbName: values.companyDbName,
      });

      if (response.status === 201) { 
        navigate('/login');
      } else {
        throw new Error('Error al registrar la empresa');
      }
    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Card style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>Registro de Empresa</Title>
        </div>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form
          name="register_company"
          onFinish={onFinish}
          layout="vertical"
          style={{ width: '100%' }}
        >
          <Form.Item
            name="companyName"
            label="Nombre de la Empresa"
            rules={[{ required: true, message: 'Por favor, ingresa el nombre de la empresa' }]}
            style={{ marginBottom: 16 }}
          >
            <Input prefix={<ShopOutlined />} placeholder="Mi Empresa S.A." size="large" />
          </Form.Item>
          <Form.Item
            name="companyDbName"
            label="Nombre de la Base de Datos"
            rules={[{ required: true, message: 'Por favor, ingresa el nombre de la base de datos' }]}
            style={{ marginBottom: 16 }}
          >
            <Input prefix={<DatabaseOutlined />} placeholder="mi_empresa_db" size="large" />
          </Form.Item>
          <Form.Item
            name="username"
            label="Usuario (Admin)"
            rules={[{ required: true, message: 'Por favor, ingresa un usuario' }]}
            style={{ marginBottom: 16 }}
          >
            <Input prefix={<UserOutlined />} placeholder="usuario_admin" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[{ required: true, message: 'Por favor, ingresa un correo electrónico', type: 'email' }]}
            style={{ marginBottom: 16 }}
          >
            <Input prefix={<UserOutlined />} placeholder="correo@empresa.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: true, message: 'Por favor, ingresa una contraseña' }]}
            style={{ marginBottom: 16 }}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Registrar Empresa
            </Button>
          </Form.Item>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterCompany;
