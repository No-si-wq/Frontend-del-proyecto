import { useState, useMemo } from "react";

export const useCarrito = (productosDisponibles = []) => {
  const [carrito, setCarrito] = useState([]);

  const agregarProducto = (productoInput) => {
    const id = typeof productoInput === "object" ? productoInput.id : productoInput;
    const producto = typeof productoInput === "object"
      ? productoInput
      : productosDisponibles.find(p => p.id === id);

    if (!producto) return;

    const existe = carrito.find(item => item.id === id);
    if (existe) {
      const nuevoCarrito = carrito.map(item =>
        item.id === id
          ? { ...item, cantidad: item.cantidad + 1, total: (item.cantidad + 1) * item.price }
          : item
      );
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1, total: producto.price }]);
    }
  };

  const cambiarCantidad = (id, cantidad) => {
    const nuevoCarrito = carrito.map(item =>
      item.id === id
        ? { ...item, cantidad, total: cantidad * item.price }
        : item
    );
    setCarrito(nuevoCarrito);
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const subtotal = useMemo(() => {
    return carrito.reduce((acc, item) => {
      const taxRate = item.tax?.percent ?? 0;
      const priceSinImpuesto = item.price / (1 + taxRate);
      return acc + priceSinImpuesto * item.cantidad;
    }, 0);
  }, [carrito]);

  const impuestos = useMemo(() => {
    return carrito.reduce((acc, item) => {
      const taxRate = item.tax?.percent ?? 0;
      const priceSinImpuesto = item.price / (1 + taxRate);
      const impuestoItem = (item.price - priceSinImpuesto) * item.cantidad;
      return acc + impuestoItem;
    }, 0);
  }, [carrito]);

  const total = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.total, 0);
  }, [carrito]);

  return {
    carrito,
    setCarrito,
    agregarProducto,
    cambiarCantidad,
    eliminarDelCarrito,
    subtotal,
    impuestos,
    total,
  };
};