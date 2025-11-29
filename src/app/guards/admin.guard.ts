import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const usuario = this.authService.getUsuarioActual();

    if (usuario && usuario.es_admin) {
      return true;
    }

    // ❌ Si no es admin, redirige al inicio
    this.router.navigate(['/']);
    return false;
  }
}
