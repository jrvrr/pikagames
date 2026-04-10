import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import { PagoComponent } from './pago/pago.component';
import { CompraComponent } from './compra/compra.component';
import { AdminGuard } from './guards/admin.guard';
import { Error404Component } from './error404/error404.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'pago', component: PagoComponent },
  { path: 'compra', component: CompraComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
  { path: '**', component: Error404Component },
];
