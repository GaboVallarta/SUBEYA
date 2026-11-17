import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton, 
    IonIcon 
  ],
})
export class HomePage {

  constructor(private router: Router) {
    addIcons({ menuOutline });
  }

  // Ahora mandamos el ID de la ruta y el nombre visual como parámetros de navegación
  seleccionarYRedirigir(idRuta: string, nombreVisual: string) {
    this.router.navigate(['/select-unit', idRuta], {
      queryParams: { nombre: nombreVisual }
    });
  }
}