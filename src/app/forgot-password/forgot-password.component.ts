import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  correo: string = '';
  mensaje: string = '';
  error: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.correo) {
      this.error = 'Por favor ingresa tu correo.';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.mensaje = '';

    this.authService.forgotPassword(this.correo).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.mensaje = res.mensaje || 'Si el correo existe, recibirás un enlace de recuperación.';
        } else {
          this.error = res.error || 'Ocurrió un error al intentar recuperar la contraseña.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Error de conexión. Inténtalo más tarde.';
        console.error(err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/']); // or where the login is usually shown
  }
}
