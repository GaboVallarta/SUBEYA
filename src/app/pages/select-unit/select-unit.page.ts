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

  // Estado inicial de capacidad (puede ser: 'Vacío', 'Disponibilidad alta', 'Disponibilidad media', 'Disponibilidad baja', 'Lleno')
  estadoCapacidad: string = 'Vacío';

  // Paradas preparadas para cuando conectemos las coordenadas de la BD
  paradas: any[] = [
    { id: 1, nombre: 'Parada #1', estado: 'Pendiente' },
    { id: 2, nombre: 'Parada #2', estado: 'Pendiente' },
    { id: 'last', nombre: 'Última parada del camión', estado: 'Destino final' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {
    addIcons({ 
      menuOutline, 
      chevronDownOutline, 
      chevronUpOutline, 
      peopleOutline, 
      mapOutline, 
      locationOutline 
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.numeroCamion = id.toUpperCase();
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  seleccionarCamion(unidad: string) {
    this.numeroCamion = unidad.toUpperCase();
    this.menuAbierto = false; 
  }

  // Función para dar estilo/color dinámico según el estado de la capacidad
  obtenerEstiloEstado(estado: string) {
    switch (estado) {
      case 'Vacío':
        return { 'background': '#f1f5f9', 'color': '#475569', 'border': '1px solid #cbd5e1' };
      case 'Disponibilidad alta':
        return { 'background': '#dcfce7', 'color': '#166534', 'border': '1px solid #bbf7d0' };
      case 'Disponibilidad media':
        return { 'background': '#fef9c3', 'color': '#854d0e', 'border': '1px solid #fde047' }; // Amarillo claro
      case 'Disponibilidad baja':
        return { 'background': '#ffedd5', 'color': '#9a3412', 'border': '1px solid #fed7aa' }; // Naranja
      case 'Lleno':
        return { 'background': '#fee2e2', 'color': '#991b1b', 'border': '1px solid #fecaca' }; // Rojo
      default:
        return { 'background': '#f1f5f9', 'color': '#475569', 'border': '1px solid #cbd5e1' };
    }
  }
}