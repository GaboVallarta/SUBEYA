import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'select-unit/:id',
    loadComponent: () => import('./pages/select-unit/select-unit.page').then(m => m.SelectUnitPage)
  }
];