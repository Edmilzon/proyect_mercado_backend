export class DashboardVendedorDto {
  total_productos: number;
  productos_activos: number;
  productos_sin_stock: number;
  
  total_pedidos: number;
  pedidos_pendientes: number;
  pedidos_confirmados: number;
  pedidos_en_preparacion: number;
  pedidos_en_ruta: number;
  pedidos_entregados: number;
  pedidos_cancelados: number;
  
  calificacion_promedio: number;
  total_resenas: number;
  resenas_pendientes: number;
  
  ventas_hoy: number;
  ventas_semana: number;
  ventas_mes: number;
  
  mensajes_no_leidos: number;
  conversaciones_activas: number;
} 