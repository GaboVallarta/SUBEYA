import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonCol, IonGrid, IonRow } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, IonCol, IonGrid, IonRow],
})
export class AppComponent {
  constructor() {}
}
