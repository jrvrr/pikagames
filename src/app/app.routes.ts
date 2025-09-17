import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import { PagoComponent } from './pago/pago.component';
import { CompraComponent } from './compra/compra.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'pago', component: PagoComponent },
  { path: 'compra', component: CompraComponent }
];
