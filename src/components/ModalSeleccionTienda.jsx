import React from "react";
import { Modal, Select, message } from "antd";

/**
 * Modal para seleccionar tienda y mostrador
 * 
 * @param {boolean} open
 * @param {Array} tiendas
 * @param {number|null} tiendaSeleccionada
 * @param {number|null} mostradorSeleccionado
 * @param {Function} onSeleccion - (tiendaId, cajaId)
 * @param {Function} onClose
 */
const ModalSeleccionTienda = ({
  open,
  tiendas,
  tiendaSeleccionada,
  mostradorSeleccionado,
  onSeleccion,
  onClose
}) => {
  const handleOk = () => {
    if (!tiendaSeleccionada || !mostradorSeleccionado) {
      message.warning("Selecciona tienda y mostrador");
      return;
    }
    onSeleccion(tiendaSeleccionada, mostradorSeleccionado);
    onClose();
  };

  const tiendaActual = tiendas.find(t => t.id === tiendaSeleccionada);

  return (
    <Modal
      open={open}
      title="Selecciona la Tienda y Mostrador"
      onCancel={onClose}
      onOk={handleOk}
    >
      <div style={{ marginBottom: 12 }}>
        <label>Tienda:</label>
        <Select
          style={{ width: "100%" }}
          placeholder="Selecciona una tienda"
          value={tiendaSeleccionada}
          onChange={(val) => onSeleccion(val, null)}
        >
          {tiendas.map(tienda => (
            <Select.Option key={tienda.id} value={tienda.id}>
              {tienda.nombre}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div>
        <label>Mostrador:</label>
        <Select
          style={{ width: "100%" }}
          placeholder="Selecciona un mostrador"
          value={mostradorSeleccionado}
          onChange={(val) => onSeleccion(tiendaSeleccionada, val)}
          disabled={!tiendaActual}
        >
          {tiendaActual?.cajas?.map(caja => (
            <Select.Option key={caja.id} value={caja.id}>
              {caja.descripcion || caja.numeroDeCaja}
            </Select.Option>
          ))}
        </Select>
      </div>
    </Modal>
  );
};

export default ModalSeleccionTienda;