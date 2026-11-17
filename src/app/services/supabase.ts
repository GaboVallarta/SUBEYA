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

  // 1. Obtener todas las unidades (para el menú desplegable o listados)
  getUnidades() {
    return this.supabase.from('unidades').select('*');
  }

  // 2. Obtener una unidad específica por su número económico (ej. 'C-110')
  async getUnidadPorNumero(numeroEconomico: string) {
    const { data, error } = await this.supabase
      .from('unidades')
      .select(`
        id,
        numero_economico,
        estado_actual,
        rutas (
          id,
          codigo,
          descripcion
        )
      `)
      .ilike('numero_economico', numeroEconomico)
      .single();

    if (error) {
      console.error('Error al obtener unidad:', error);
      return null;
    }
    return data;
  }

  // 3. Obtener el último registro de ocupación para saber los pasajeros
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

  // 4. Obtener las paradas de una ruta ordenadas por su campo 'orden'
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

  // 5. Obtener la última ubicación registrada del camión (última parada detectada)
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