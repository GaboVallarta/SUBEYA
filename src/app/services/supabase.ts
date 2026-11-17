import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  getUnidades() {
    return this.supabase.from('unidades').select('*');
  }

  // Buscar la unidad y su ruta relacionada usando el código (ej. 'C110' o 'B72')
  async getUnidadPorNumero(numeroEconomico: string) {
    // Limpiamos el texto para que 'C-110' busque 'C110' o similar de forma flexible
    const codigoBusqueda = numeroEconomico.replace(/-/g, '').trim(); // Convierte 'C-110' en 'C110'

    const { data, error } = await this.supabase
      .from('unidades')
      .select(`
        id,
        numero_economico,
        estado_actual,
        rutas!inner (
          id,
          codigo,
          descripcion
        )
      `)
      .ilike('rutas.codigo', `%${codigoBusqueda}%`); // Buscamos dentro de la tabla de rutas asociada

    if (error) {
      console.error('Error al obtener unidad:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0]; // Devolvemos el primer resultado encontrado
    }
    
    return null;
  }

  async getUltimaOcupacion(unidadId: string) {
    const { data, error } = await this.supabase
      .from('registros_ocupacion')
      .select('pasajeros_totales, fecha_hora')
      .eq('unidad_id', unidadId)
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return { pasajeros_totales: 0 };
    }
    return data;
  }

  async getParadasPorRuta(rutaId: string) {
    const { data, error } = await this.supabase
      .from('paradas')
      .select('*')
      .eq('ruta_id', rutaId)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error al obtener paradas:', error);
      return [];
    }
    return data;
  }

  async getUltimaUbicacion(unidadId: string) {
    const { data, error } = await this.supabase
      .from('registros_ubicacion')
      .select(`
        fecha_hora,
        paradas (
          nombre_parada,
          orden
        )
      `)
      .eq('unidad_id', unidadId)
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }
    return data;
  }
}