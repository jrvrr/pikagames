import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  password: string = '';
  confirmPassword: string = '';
  mensaje: string = '';
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.error = 'Token de recuperación inválido o ausente.';
      }
    });
  }

  onSubmit() {
    if (!this.token) {
      this.error = 'Token inválido.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.mensaje = '';

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.mensaje = res.mensaje || 'Contraseña actualizada exitosamente.';
          setTimeout(() => {
            this.router.navigate(['/']); // redirect to login or home
          }, 3000);
        } else {
          this.error = res.error || 'Ocurrió un error al intentar cambiar la contraseña.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Error de conexión o token expirado. Inténtalo más tarde.';
        console.error(err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
