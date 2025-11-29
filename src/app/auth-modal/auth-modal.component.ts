import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent {
  @Output() cerrar = new EventEmitter<void>();

  // Variables del formulario
  modo: 'login' | 'register' = 'login';
  nombre = '';
  correo = '';
  contrasena = '';

  loading = false;
  mensaje = '';

  constructor(private authService: AuthService) {}

  // 🔁 Cambiar entre login / registro
  alternarModo() {
    this.modo = this.modo === 'login' ? 'register' : 'login';
    this.mensaje = '';
  }

  // 🚀 Enviar formulario (login o registro)
  enviar() {
    this.loading = true;
    this.mensaje = '';

    if (this.modo === 'login') {
      this.authService.login(this.correo, this.contrasena).subscribe({
        next: (res) => {
          this.loading = false;
          this.mensaje = 'Inicio de sesión exitoso ✅';
          this.cerrar.emit();

          // 🔍 Si el usuario es admin → redirigir al panel
          if (res.usuario?.es_admin) {
            window.location.href = '/admin';
          } else {
            window.location.reload();
          }
        },
        error: (err) => {
          this.loading = false;
          this.mensaje = 'Error al iniciar sesión ❌';
          console.error(err);
        }
      });
    } else {
      // Registro
      this.authService.register(this.nombre, this.correo, this.contrasena).subscribe({
        next: (res) => {
          this.loading = false;
          this.mensaje = 'Usuario registrado correctamente ✅';
          this.alternarModo();
        },
        error: (err) => {
          this.loading = false;
          this.mensaje = 'Error al registrar usuario ❌';
          console.error(err);
        }
      });
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
