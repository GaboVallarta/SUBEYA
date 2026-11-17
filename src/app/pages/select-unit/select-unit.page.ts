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

  // Método para consultar Supabase
  async cargarDatosUnidad(nombreUnidad: string) {
    if (nombreUnidad === '###') return;

    try {
      // Suponiendo que tu tabla 'unidades' tiene columnas como 'nombre' (o 'codigo') y 'capacidad' / 'estado'
      const { data, error } = await this.supabaseService.getUnidades();

      if (error) {
        console.error('Error al consultar Supabase:', error);
        return;
      }

      if (data) {
        // Buscamos la unidad correspondiente en el arreglo devuelto por Supabase
        // (Ajusta la condición 'u.nombre' o 'u.codigo' según cómo nombras la columna en tu BD)
        const unidadEncontrada = data.find((u: any) => 
          u.nombre?.toLowerCase() === nombreUnidad.toLowerCase() || 
          u.codigo?.toLowerCase() === nombreUnidad.toLowerCase()
        );

        if (unidadEncontrada) {
          // Asignamos el estado real que viene de Supabase (ej. 'Vacío', 'Lleno', etc.)
          this.estadoCapacidad = unidadEncontrada.capacidad || unidadEncontrada.estado || 'Vacío';
        }
      }
    } catch (err) {
      console.error('Excepción al conectar con la API:', err);
    }
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