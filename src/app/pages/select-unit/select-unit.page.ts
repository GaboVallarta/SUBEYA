import { Component, OnInit } from '@angular/core';
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
import { SupabaseService } from '../../services/supabase'; // Ajusta la ruta relativa según dónde tengas tu servicio

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

  // Estado inicial de capacidad
  estadoCapacidad: string = 'Vacío';

  paradas: any[] = [
    { id: 1, nombre: 'Parada #1', estado: 'Pendiente' },
    { id: 2, nombre: 'Parada #2', estado: 'Pendiente' },
    { id: 'last', nombre: 'Última parada del camión', estado: 'Destino final' }
  ];

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private supabaseService: SupabaseService // Inyectamos el servicio
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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.numeroCamion = id.toUpperCase();
    }
    // Cargamos los datos de la unidad al iniciar
    await this.cargarDatosUnidad(this.numeroCamion);
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  async seleccionarCamion(unidad: string) {
    this.numeroCamion = unidad.toUpperCase();
    this.menuAbierto = false; 
    await this.cargarDatosUnidad(this.numeroCamion);
  }

 // Método para consultar Supabase con depuración estilo "cout"
  async cargarDatosUnidad(nombreUnidad: string) {
    if (nombreUnidad === '###') {
      console.log('🛑 [DEBUG] No se consulta nada, el camión está en "###"');
      return;
    }

    console.log(`🔍 [DEBUG] Intentando buscar en Supabase la unidad: "${nombreUnidad}"`);

    try {
      // 1. Probemos usando el método específico que creamos para buscar por número económico
      const unidad = await this.supabaseService.getUnidadPorNumero(nombreUnidad);
      console.log('📦 [DEBUG] Resultado crudo de getUnidadPorNumero:', unidad);

      if (!unidad) {
        console.warn(`⚠️ [DEBUG] No se encontró ninguna unidad con el número económico: "${nombreUnidad}" en la tabla 'unidades'.`);
        return;
      }

      console.log('✅ [DEBUG] Unidad encontrada en la BD:', unidad);
      console.log('🆔 [DEBUG] ID de la unidad (UUID):', unidad.id);
      
      // Hacemos un cast seguro por si Supabase lo infiere como arreglo
      const rutaInfo: any = Array.isArray(unidad.rutas) ? unidad.rutas[0] : unidad.rutas;
      console.log('🗺️ [DEBUG] Información de la ruta asociada:', rutaInfo);

      // 2. Consultar la ocupación usando el ID real de la unidad
      const ocupacion = await this.supabaseService.getUltimaOcupacion(unidad.id);
      console.log('👥 [DEBUG] Último registro de ocupación obtenido:', ocupacion);
      
      const totalPasajeros = ocupacion?.pasajeros_totales || 0;
      this.estadoCapacidad = this.calcularEstadoCapacidad(totalPasajeros);
      console.log(`📊 [DEBUG] Pasajeros totales: ${totalPasajeros} | Estado asignado: "${this.estadoCapacidad}"`);

      // 3. Consultar las paradas de la ruta usando rutaInfo.id
      if (rutaInfo?.id) {
        const listaParadas = await this.supabaseService.getParadasPorRuta(rutaInfo.id);
        console.log('🚏 [DEBUG] Paradas obtenidas para esta ruta:', listaParadas);
        if (listaParadas.length > 0) {
          this.paradas = listaParadas;
        }
      }

      // 4. Consultar la última ubicación detectada
      const ultimaUbicacion = await this.supabaseService.getUltimaUbicacion(unidad.id);
      console.log('📍 [DEBUG] Última ubicación registrada:', ultimaUbicacion);

    } catch (err) {
      console.error('❌ [DEBUG] Excepción crítica al conectar con la API de Supabase:', err);
    }
  }

  // Función auxiliar para traducir los pasajeros a tus 5 estados
  calcularEstadoCapacidad(pasajeros: number): string {
    console.log(`🧮 [DEBUG] Calculando estado para ${pasajeros} pasajeros...`);
    if (pasajeros === 0) return 'Vacío';
    if (pasajeros <= 10) return 'Disponibilidad alta';
    if (pasajeros <= 20) return 'Disponibilidad media';
    if (pasajeros <= 30) return 'Disponibilidad baja';
    return 'Lleno';
  }

  // Función para dar estilo/color dinámico según el estado de la capacidad
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