import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { ToastrService } from 'ngx-toastr';

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

  constructor(private authService: AuthService, private toastr: ToastrService) {}

  // 🔁 Cambiar entre login / registro
  alternarModo() {
    this.modo = this.modo === 'login' ? 'register' : 'login';
  }

  // 🚀 Enviar formulario (login o registro)
  enviar() {
    this.loading = true;

    if (this.modo === 'login') {
      this.authService.login(this.correo, this.contrasena).subscribe({
        next: (res) => {
          this.loading = false;
          this.toastr.success('Has iniciado sesión', '¡Bienvenido!');
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
          this.toastr.error('Credenciales incorrectas o error en el servidor', 'Error de sesión');
          console.error(err);
        }
      });
    } else {
      // Registro
      this.authService.register(this.nombre, this.correo, this.contrasena).subscribe({
        next: (res) => {
          this.loading = false;
          this.toastr.success('Cuenta creada. Ya puedes iniciar sesión.', '¡Registro Exitoso!');
          this.alternarModo();
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Ocurrió un error al registrar el usuario', 'Error');
          console.error(err);
        }
      });
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
