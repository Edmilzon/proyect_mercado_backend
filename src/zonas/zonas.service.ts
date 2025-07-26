import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZonaEntrega } from './zonas.entity';
import { CrearZonaDto } from './dto/crear-zona.dto';
import { Vendedor } from '../vendedores/vendedor.entity';
import { DireccionUsuario } from '../usuarios/direccion.entity';

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(ZonaEntrega)
    private readonly zonaRepositorio: Repository<ZonaEntrega>,
    @InjectRepository(Vendedor)
    private readonly vendedorRepositorio: Repository<Vendedor>,
    @InjectRepository(DireccionUsuario)
    private readonly direccionRepositorio: Repository<DireccionUsuario>,
  ) {}

  async crearZona(datos: CrearZonaDto): Promise<ZonaEntrega> {
    const existente = await this.zonaRepositorio.findOne({ where: { nombre: datos.nombre } });
    if (existente) {
      throw new BadRequestException('Ya existe una zona con ese nombre');
    }
    
    const zona = this.zonaRepositorio.create({
      ...datos,
      tarifa_envio: datos.tarifa_envio ?? 0.00,
      esta_activa: datos.esta_activa ?? true,
    });
    
    return this.zonaRepositorio.save(zona);
  }

  async listarZonas(): Promise<ZonaEntrega[]> {
    return this.zonaRepositorio.find({ order: { nombre: 'ASC' } });
  }

  async buscarPorId(zona_id: string): Promise<ZonaEntrega | undefined> {
    const zona = await this.zonaRepositorio.findOne({ where: { zona_id } });
    return zona ?? undefined;
  }

  async listarZonasActivas(): Promise<ZonaEntrega[]> {
    return this.zonaRepositorio.find({ 
      where: { esta_activa: true }, 
      order: { nombre: 'ASC' } 
    });
  }

  async actualizarZona(zona_id: string, datos: Partial<CrearZonaDto>): Promise<ZonaEntrega> {
    const zona = await this.buscarPorId(zona_id);
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }

    if (datos.nombre && datos.nombre !== zona.nombre) {
      const existente = await this.zonaRepositorio.findOne({ where: { nombre: datos.nombre } });
      if (existente) {
        throw new BadRequestException('Ya existe una zona con ese nombre');
      }
    }

    Object.assign(zona, datos);
    return this.zonaRepositorio.save(zona);
  }

  async eliminarZona(zona_id: string): Promise<void> {
    const zona = await this.buscarPorId(zona_id);
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }

    // Verificar si hay vendedores asignados a esta zona
    const vendedoresAsignados = await this.vendedorRepositorio.find({ 
      where: { zona_asignada_id: zona_id } 
    });
    if (vendedoresAsignados.length > 0) {
      throw new BadRequestException('No se puede eliminar una zona que tiene vendedores asignados');
    }

    await this.zonaRepositorio.remove(zona);
  }

  async calcularTarifaEnvio(
    latitud_origen: number, 
    longitud_origen: number, 
    latitud_destino: number, 
    longitud_destino: number,
    peso_total_g: number = 0,
    zona_id?: string
  ): Promise<{
    tarifa_envio: number;
    zona_nombre?: string;
    distancia_km: number;
    tiempo_estimado_minutos: number;
  }> {
    // Si se proporciona zona_id, usar la tarifa de esa zona
    if (zona_id) {
      const zona = await this.buscarPorId(zona_id);
      if (zona && zona.esta_activa) {
        const distancia = this.calcularDistancia(latitud_origen, longitud_origen, latitud_destino, longitud_destino);
        const tiempoEstimado = this.estimarTiempoEntrega(distancia);
        
        return {
          tarifa_envio: zona.tarifa_envio,
          zona_nombre: zona.nombre,
          distancia_km: distancia,
          tiempo_estimado_minutos: tiempoEstimado,
        };
      }
    }

    // Calcular distancia
    const distancia = this.calcularDistancia(latitud_origen, longitud_origen, latitud_destino, longitud_destino);
    
    // Calcular tarifa basada en distancia y peso
    let tarifaBase = 0;
    if (distancia <= 5) {
      tarifaBase = 10; // Envío local
    } else if (distancia <= 15) {
      tarifaBase = 20; // Envío cercano
    } else if (distancia <= 30) {
      tarifaBase = 35; // Envío medio
    } else {
      tarifaBase = 50; // Envío lejano
    }

    // Ajustar por peso
    const tarifaPeso = Math.max(0, (peso_total_g - 1000) / 1000) * 5; // 5 Bs por kg adicional
    const tarifaFinal = tarifaBase + tarifaPeso;

    const tiempoEstimado = this.estimarTiempoEntrega(distancia);

    return {
      tarifa_envio: tarifaFinal,
      distancia_km: distancia,
      tiempo_estimado_minutos: tiempoEstimado,
    };
  }

  async asignarVendedorAZona(vendedor_id: string, zona_id: string): Promise<Vendedor> {
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id } });
    if (!vendedor) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    const zona = await this.buscarPorId(zona_id);
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }

    if (!zona.esta_activa) {
      throw new BadRequestException('No se puede asignar a una zona inactiva');
    }

    vendedor.zona_asignada_id = zona_id;
    return this.vendedorRepositorio.save(vendedor);
  }

  async removerVendedorDeZona(vendedor_id: string): Promise<Vendedor> {
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id } });
    if (!vendedor) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    vendedor.zona_asignada_id = null as any;
    return this.vendedorRepositorio.save(vendedor);
  }

  async listarVendedoresPorZona(zona_id: string): Promise<Vendedor[]> {
    const zona = await this.buscarPorId(zona_id);
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }

    return this.vendedorRepositorio.find({ 
      where: { zona_asignada_id: zona_id },
      order: { calificacion_promedio: 'DESC' }
    });
  }

  async encontrarZonaPorCoordenadas(latitud: number, longitud: number): Promise<ZonaEntrega | null> {
    // Buscar zona que contenga las coordenadas
    const zonas = await this.listarZonasActivas();
    
    for (const zona of zonas) {
      if (this.coordenadasEnPoligono(latitud, longitud, zona.coordenadas_poligono)) {
        return zona;
      }
    }
    
    return null;
  }

  async optimizarRuta(vendedor_id: string, pedidos_ids: string[]): Promise<{
    ruta_optimizada: string[];
    distancia_total: number;
    tiempo_estimado: number;
  }> {
    const vendedor = await this.vendedorRepositorio.findOne({ where: { vendedor_id } });
    if (!vendedor) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    // Obtener direcciones de los pedidos
    const direcciones = await this.direccionRepositorio
      .createQueryBuilder('direccion')
      .where('direccion.direccion_id IN (:...pedidos_ids)', { pedidos_ids })
      .getMany();

    // Algoritmo simple de optimización (Nearest Neighbor)
    const rutaOptimizada = this.algoritmoVecinoMasCercano(
      { latitud: vendedor.latitud_actual, longitud: vendedor.longitud_actual },
      direcciones.map(d => ({ latitud: d.latitud, longitud: d.longitud, id: d.direccion_id }))
    );

    // Calcular distancia total
    let distanciaTotal = 0;
    let puntoActual = { latitud: vendedor.latitud_actual, longitud: vendedor.longitud_actual };
    
    for (const punto of rutaOptimizada) {
      distanciaTotal += this.calcularDistancia(
        puntoActual.latitud, puntoActual.longitud,
        punto.latitud, punto.longitud
      );
      puntoActual = punto;
    }

    const tiempoEstimado = this.estimarTiempoEntrega(distanciaTotal);

    return {
      ruta_optimizada: rutaOptimizada.map(p => p.id),
      distancia_total: distanciaTotal,
      tiempo_estimado: tiempoEstimado,
    };
  }

  // Métodos auxiliares privados
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  private estimarTiempoEntrega(distancia_km: number): number {
    // Estimación basada en distancia (en minutos)
    if (distancia_km <= 5) return 30; // 30 minutos para envíos locales
    if (distancia_km <= 15) return 60; // 1 hora para envíos cercanos
    if (distancia_km <= 30) return 120; // 2 horas para envíos medios
    return 240; // 4 horas para envíos lejanos
  }

  private coordenadasEnPoligono(latitud: number, longitud: number, poligonoGeoJSON: string): boolean {
    try {
      // Implementación simplificada - en producción usar una librería como Turf.js
      // Por ahora, asumimos que las coordenadas están en el formato correcto
      const poligono = JSON.parse(poligonoGeoJSON);
      
      // Algoritmo simple de punto en polígono (Ray Casting)
      // Esta es una implementación básica, en producción usar una librería especializada
      return true; // Placeholder
    } catch (error) {
      console.error('Error al verificar coordenadas en polígono:', error);
      return false;
    }
  }

  private algoritmoVecinoMasCercano(
    puntoInicial: { latitud: number; longitud: number },
    puntos: Array<{ latitud: number; longitud: number; id: string }>
  ): Array<{ latitud: number; longitud: number; id: string }> {
    const ruta: Array<{ latitud: number; longitud: number; id: string }> = [];
    const puntosRestantes = [...puntos];
    let puntoActual = puntoInicial;

    while (puntosRestantes.length > 0) {
      let indiceMasCercano = 0;
      let distanciaMinima = Infinity;

      for (let i = 0; i < puntosRestantes.length; i++) {
        const distancia = this.calcularDistancia(
          puntoActual.latitud, puntoActual.longitud,
          puntosRestantes[i].latitud, puntosRestantes[i].longitud
        );

        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          indiceMasCercano = i;
        }
      }

      const puntoMasCercano = puntosRestantes.splice(indiceMasCercano, 1)[0];
      ruta.push(puntoMasCercano);
      puntoActual = puntoMasCercano;
    }

    return ruta;
  }
} 