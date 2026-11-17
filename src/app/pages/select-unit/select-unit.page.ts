import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  menuOutline, 
  chevronDownOutline, 
  chevronUpOutline, 
  peopleOutline, 
  mapOutline, 
  locationOutline 
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-select-unit',
  templateUrl: './select-unit.page.html',
  styleUrls: ['./select-unit.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton, 
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class SelectUnitPage implements OnInit {
  numeroCamion: string = '###';
  menuAbierto: boolean = false;

  estadoCapacidad: string = 'Vacío';
  ultimaUbicacionTexto: string = '';
  paradas: any[] = [];

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef // <--- 1. Inyectado correctamente aquí
  ) {
    addIcons({ 
      menuOutline, 
      chevronDownOutline, 
      chevronUpOutline, 
      peopleOutline, 
      mapOutline, 
      locationOutline 
    });
  }

async ngOnInit() {
    const idRuta = this.route.snapshot.paramMap.get('id');
    // Leemos el nombre desde los queryParams (?nombre=C-110)
    const nombreVisual = this.route.snapshot.queryParamMap.get('nombre');

    if (idRuta) {
      this.numeroCamion = nombreVisual ? nombreVisual.toUpperCase() : 'UNIDAD';
      await this.cargarDatosPorIdRuta(idRuta);
      this.cdr.detectChanges();
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  // 2. Al seleccionar del menú, actualizamos el texto y refrescamos la vista de inmediato
  async seleccionarCamion(idRuta: string, nombreVisual: string) {
    this.numeroCamion = nombreVisual.toUpperCase();
    this.menuAbierto = false; 
    
    // Consultamos usando el ID de la ruta
    await this.cargarDatosPorIdRuta(idRuta);
    
    // Forzamos la actualización visual para que el contador cambie al instante
    this.cdr.detectChanges();
  }

  // Método específico para buscar por ID de ruta (el UUID que me pasaste)
  async cargarDatosPorIdRuta(rutaId: string) {
    console.log(`🔍 [DEBUG] Buscando unidad por ID de ruta: "${rutaId}"`);

    try {
      // Buscamos directamente en unidades filtrando por ruta_id
      const { data: unidadData, error: errorUnidad } = await this.supabaseService.getUnidades()
        .eq('ruta_id', rutaId)
        .single();

      if (errorUnidad || !unidadData) {
        console.warn(`⚠️ [DEBUG] No se encontró unidad para el ID de ruta: "${rutaId}"`, errorUnidad);
        return;
      }

      console.log('✅ [DEBUG] Unidad encontrada por ID:', unidadData);

      // Consultar la ocupación usando el ID de la unidad
      const ocupacion = await this.supabaseService.getUltimaOcupacion(unidadData.id);
      const totalPasajeros = ocupacion?.pasajeros_totales || 0;
      this.estadoCapacidad = this.calcularEstadoCapacidad(totalPasajeros);
      console.log(`📊 [DEBUG] Pasajeros totales: ${totalPasajeros} | Estado: "${this.estadoCapacidad}"`);

      // Consultar las paradas de la ruta
      const listaParadas = await this.supabaseService.getParadasPorRuta(rutaId);
      if (listaParadas.length > 0) {
        this.paradas = listaParadas;
      }

      // Consultar la última ubicación
      const ultimaUbicacion = await this.supabaseService.getUltimaUbicacion(unidadData.id);
      if (ultimaUbicacion && ultimaUbicacion.paradas) {
        const nombreParada = (ultimaUbicacion.paradas as any).nombre_parada;
        this.ultimaUbicacionTexto = `Última detección en: ${nombreParada}`;
      } else {
        this.ultimaUbicacionTexto = 'Sin registros recientes de ubicación';
      }

    } catch (err) {
      console.error('❌ [DEBUG] Excepción al buscar por ID:', err);
    }
  }

  // Método original por si se entra por URL con parámetro
  async cargarDatosUnidad(nombreUnidad: string) {
    if (nombreUnidad === '###') return;
    const unidad = await this.supabaseService.getUnidadPorNumero(nombreUnidad);
    if (unidad && unidad.rutas) {
      const rutaInfo: any = Array.isArray(unidad.rutas) ? unidad.rutas[0] : unidad.rutas;
      if (rutaInfo?.id) {
        await this.cargarDatosPorIdRuta(rutaInfo.id);
      }
    }
  }

  calcularEstadoCapacidad(pasajeros: number): string {
    if (pasajeros === 0) return 'Vacío';
    if (pasajeros <= 10) return 'Disponibilidad alta';
    if (pasajeros <= 20) return 'Disponibilidad media';
    if (pasajeros <= 30) return 'Disponibilidad baja';
    return 'Lleno';
  }

  obtenerEstiloEstado(estado: string) {
    switch (estado) {
      case 'Vacío':
        return { 'background': '#f1f5f9', 'color': '#475569', 'border': '1px solid #cbd5e1' };
      case 'Disponibilidad alta':
        return { 'background': '#dcfce7', 'color': '#166534', 'border': '1px solid #bbf7d0' };
      case 'Disponibilidad media':
        return { 'background': '#fef9c3', 'color': '#854d0e', 'border': '1px solid #fde047' };
      case 'Disponibilidad baja':
        return { 'background': '#ffedd5', 'color': '#9a3412', 'border': '1px solid #fed7aa' };
      case 'Lleno':
        return { 'background': '#fee2e2', 'color': '#991b1b', 'border': '1px solid #fecaca' };
      default:
        return { 'background': '#f1f5f9', 'color': '#475569', 'border': '1px solid #cbd5e1' };
    }
  }
}