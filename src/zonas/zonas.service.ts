import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ZonaEntrega } from './zonas.entity';
import { CrearZonaDto } from './dto/crear-zona.dto';
import { CalcularTarifaDto } from './dto/calcular-tarifa.dto';
import { AsignarZonaDto } from './dto/asignar-zona.dto';
import { OptimizarRutaDto } from './dto/optimizar-ruta.dto';
import { Vendedor } from '../vendedores/vendedor.entity';
import { DireccionUsuario } from '../usuarios/direccion.entity';
import { Pedido } from '../pedidos/pedido.entity';

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(ZonaEntrega)
    private readonly zonaRepositorio: Repository<ZonaEntrega>,
    @InjectRepository(Vendedor)
    private readonly vendedorRepositorio: Repository<Vendedor>,
    @InjectRepository(DireccionUsuario)
    private readonly direccionRepositorio: Repository<DireccionUsuario>,
    @InjectRepository(Pedido)
    private readonly pedidoRepositorio: Repository<Pedido>,
  ) {}

  async crearZona(datos: CrearZonaDto): Promise<ZonaEntrega> {
    const zona = this.zonaRepositorio.create(datos);
    return this.zonaRepositorio.save(zona);
  }

  async listarZonas(): Promise<ZonaEntrega[]> {
    return this.zonaRepositorio.find({
      order: { nombre: 'ASC' }
    });
  }

  async listarZonasActivas(): Promise<ZonaEntrega[]> {
    return this.zonaRepositorio.find({
      where: { esta_activa: true },
      order: { nombre: 'ASC' }
    });
  }

  async obtenerZonaPorId(zona_id: string): Promise<ZonaEntrega> {
    const zona = await this.zonaRepositorio.findOne({ where: { zona_id } });
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }
    return zona;
  }

  async actualizarZona(zona_id: string, datos: Partial<CrearZonaDto>): Promise<ZonaEntrega> {
    const zona = await this.zonaRepositorio.findOne({ where: { zona_id } });
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }

    Object.assign(zona, datos);
    return this.zonaRepositorio.save(zona);
  }

  async eliminarZona(zona_id: string): Promise<void> {
    const zona = await this.zonaRepositorio.findOne({ where: { zona_id } });
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }

    // Verificar que no haya vendedores asignados
    const vendedoresAsignados = await this.vendedorRepositorio.count({
      where: { zona_asignada_id: zona_id }
    });

    if (vendedoresAsignados > 0) {
      throw new BadRequestException('No se puede eliminar la zona porque tiene vendedores asignados');
    }

    await this.zonaRepositorio.remove(zona);
  }

  async calcularTarifa(datos: CalcularTarifaDto): Promise<{
    tarifa_base: number;
    tarifa_adicional: number;
    tarifa_total: number;
    tiempo_estimado: number;
  }> {
    const zona = await this.zonaRepositorio.findOne({ where: { zona_id: datos.zona_id } });
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }

    // Calcular distancia entre origen y destino
    const distancia = this.calcularDistancia(
      datos.latitud_origen,
      datos.longitud_origen,
      datos.latitud_destino,
      datos.longitud_destino
    );

    // Tarifa base de la zona
    const tarifaBase = zona.tarifa_envio;

    // Tarifa adicional por peso (cada 500g adicionales)
    const pesoAdicional = Math.max(0, (datos.peso_total_g || 0) - 500);
    const tarifaAdicional = Math.ceil(pesoAdicional / 500) * 5; // 5 Bs por cada 500g adicional

    const tarifaTotal = tarifaBase + tarifaAdicional;

    // Tiempo estimado (15 minutos base + 5 minutos por km)
    const tiempoEstimado = 15 + Math.ceil(distancia) * 5;

    return {
      tarifa_base: tarifaBase,
      tarifa_adicional: tarifaAdicional,
      tarifa_total: tarifaTotal,
      tiempo_estimado: tiempoEstimado
    };
  }

  async asignarVendedorAZona(vendedor_id: string, datos: AsignarZonaDto): Promise<Vendedor> {
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id } });
    if (!vendedor) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    const zona = await this.zonaRepositorio.findOne({ where: { zona_id: datos.zona_id } });
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }

    vendedor.zona_asignada_id = datos.zona_id;
    return this.vendedorRepositorio.save(vendedor);
  }

  async removerVendedorDeZona(vendedor_id: string): Promise<Vendedor> {
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id } });
    if (!vendedor) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    vendedor.zona_asignada_id = null;
    return this.vendedorRepositorio.save(vendedor);
  }

  async listarVendedoresEnZona(zona_id: string): Promise<Vendedor[]> {
    return this.vendedorRepositorio.find({
      where: { zona_asignada_id: zona_id },
      relations: ['usuario']
    });
  }

  async optimizarRutaParaVendedor(
    vendedor_id: string,
    pedidos_ids: string[],
  ): Promise<any> {
    // Obtener vendedor con ubicación actual
    const vendedor = await this.vendedorRepositorio.findOne({
      where: { vendedor_id },
    });

    if (!vendedor) {
      throw new BadRequestException('Vendedor no encontrado');
    }

    if (!vendedor.latitud_actual || !vendedor.longitud_actual) {
      throw new BadRequestException('Vendedor no tiene ubicación actual');
    }

    // Obtener pedidos con direcciones de entrega
    const pedidos = await this.pedidoRepositorio.find({
      where: { pedido_id: In(pedidos_ids) },
      relations: ['direccion_entrega'],
    });

    if (pedidos.length === 0) {
      throw new BadRequestException('No se encontraron pedidos');
    }

    // Punto inicial (ubicación del vendedor)
    const puntoInicial = {
      latitud: vendedor.latitud_actual,
      longitud: vendedor.longitud_actual,
    };

    // Puntos de entrega (direcciones de los pedidos)
    const puntosEntrega = pedidos.map((pedido) => ({
      pedido_id: pedido.pedido_id,
      latitud: pedido.direccion_entrega.latitud,
      longitud: pedido.direccion_entrega.longitud,
      direccion: pedido.direccion_entrega.calle_avenida,
    }));

    // Algoritmo simple de optimización (Nearest Neighbor)
    const rutaOptimizada = this.calcularRutaMasCorta(
      puntoInicial,
      puntosEntrega,
    );

    return {
      vendedor_id,
      punto_inicial: puntoInicial,
      ruta_optimizada: rutaOptimizada,
      distancia_total: this.calcularDistanciaTotal(rutaOptimizada),
      tiempo_estimado: this.calcularTiempoEstimado(rutaOptimizada),
    };
  }

  async buscarZonaPorCoordenadas(latitud: number, longitud: number): Promise<ZonaEntrega | null> {
    const zonas = await this.zonaRepositorio.find({
      where: { esta_activa: true }
    });

    for (const zona of zonas) {
      if (this.puntoEnPoligono(latitud, longitud, zona.coordenadas_poligono)) {
        return zona;
      }
    }

    return null;
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private estimarTiempoEntrega(distanciaKm: number): number {
    // 15 minutos base + 5 minutos por km
    return 15 + Math.ceil(distanciaKm) * 5;
  }

  private puntoEnPoligono(lat: number, lon: number, poligonoGeoJSON: string): boolean {
    try {
      const poligono = JSON.parse(poligonoGeoJSON);
      const coordenadas = poligono.coordinates[0]; // Primer anillo del polígono
      
      let dentro = false;
      for (let i = 0, j = coordenadas.length - 1; i < coordenadas.length; j = i++) {
        const xi = coordenadas[i][0];
        const yi = coordenadas[i][1];
        const xj = coordenadas[j][0];
        const yj = coordenadas[j][1];
        
        if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
          dentro = !dentro;
        }
      }
      
      return dentro;
    } catch (error) {
      return false;
    }
  }

  private calcularRutaMasCorta(
    puntoInicial: { latitud: number; longitud: number },
    puntosEntrega: Array<{
      pedido_id: string;
      latitud: number;
      longitud: number;
      direccion: string;
    }>,
  ): Array<{
    orden: number;
    pedido_id: string;
    latitud: number;
    longitud: number;
    direccion: string;
    distancia_desde_anterior: number;
  }> {
    const ruta: Array<{
      orden: number;
      pedido_id: string;
      latitud: number;
      longitud: number;
      direccion: string;
      distancia_desde_anterior: number;
    }> = [];

    let puntoActual = puntoInicial;
    let puntosRestantes = [...puntosEntrega];

    for (let i = 0; i < puntosEntrega.length; i++) {
      // Encontrar el punto más cercano
      let puntoMasCercano = puntosRestantes[0];
      let distanciaMinima = this.calcularDistancia(
        puntoActual.latitud, puntoActual.longitud,
        puntoMasCercano.latitud, puntoMasCercano.longitud,
      );

      for (let j = 1; j < puntosRestantes.length; j++) {
        const distancia = this.calcularDistancia(
          puntoActual.latitud, puntoActual.longitud,
          puntosRestantes[j].latitud, puntosRestantes[j].longitud,
        );

        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          puntoMasCercano = puntosRestantes[j];
        }
      }

      // Agregar a la ruta
      ruta.push({
        orden: i + 1,
        pedido_id: puntoMasCercano.pedido_id,
        latitud: puntoMasCercano.latitud,
        longitud: puntoMasCercano.longitud,
        direccion: puntoMasCercano.direccion,
        distancia_desde_anterior: distanciaMinima,
      });

      // Actualizar punto actual y remover de puntos restantes
      puntoActual = {
        latitud: puntoMasCercano.latitud,
        longitud: puntoMasCercano.longitud,
      };
      puntosRestantes = puntosRestantes.filter(
        (p) => p.pedido_id !== puntoMasCercano.pedido_id,
      );
    }

    return ruta;
  }

  private calcularDistanciaTotal(ruta: Array<{ distancia_desde_anterior: number }>): number {
    let distanciaTotal = 0;
    for (const punto of ruta) {
      distanciaTotal += punto.distancia_desde_anterior;
    }
    return distanciaTotal;
  }

  private calcularTiempoEstimado(ruta: Array<{ distancia_desde_anterior: number }>): number {
    let tiempoEstimado = 0;
    for (const punto of ruta) {
      tiempoEstimado += this.estimarTiempoEntrega(punto.distancia_desde_anterior);
    }
    return tiempoEstimado;
  }
} 