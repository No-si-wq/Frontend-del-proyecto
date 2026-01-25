import { useState, useEffect, useRef } from "react";
import { fetchStores } from "../api/storesAPI";

export const useTiendas = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cacheRef = useRef(null);

  const buildTree = (stores) =>
    stores.map((tienda) => ({
      id: tienda.id,
      clave: tienda.clave,
      title: tienda.nombre,
      key: `store-${tienda.id}`,
      icon: "shop",
      children: [
        {
          title: "Cajas",
          key: `store-${tienda.id}-cajas`,
          icon: "appstore",
          storeId: tienda.id,
          tipo: "cajas",
        },
        {
          title: "Inventario",
          key: `store-${tienda.id}-inventario`,
          icon: "database",
          storeId: tienda.id,
          tipo: "inventario",
        },
        {
          title: "Políticas",
          key: `store-${tienda.id}-politicas`,
          icon: "percentage",
          storeId: tienda.id,
          tipo: "politicas",
        },
      ],
    }));

  const fetchTiendas = async (force = false) => {
    if (cacheRef.current && !force) {
      setTreeData(cacheRef.current);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchStores();

      if (!Array.isArray(data)) {
        throw new Error("Formato inválido de tiendas");
      }

      const tree = buildTree(data);
      cacheRef.current = tree;
      setTreeData(tree);
    } catch (err) {
      console.error("Error al obtener tiendas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    cacheRef.current = null;
  };

  useEffect(() => {
    fetchTiendas();
  }, []);

  return {
    treeData,
    loading,
    error,
    fetchTiendas,
    clearCache,
  };
};