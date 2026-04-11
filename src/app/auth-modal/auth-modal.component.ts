import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { ToastrService } from 'ngx-toastr';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
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
  mostrarContrasena = false;
  loading = false;

  // Real-time validation helpers
  tieneMayuscula(): boolean {
    return /[A-Z]/.test(this.contrasena);
  }
  
  tieneNumero(): boolean {
    return /[0-9]/.test(this.contrasena);
  }
  
  cumpleLongitud(): boolean {
    return this.contrasena.length >= 8;
  }

  constructor(private authService: AuthService, private toastr: ToastrService) {}

  // 🔁 Cambiar entre login / registro
  alternarModo() {
    this.modo = this.modo === 'login' ? 'register' : 'login';
    this.mostrarContrasena = false; // Resetear visibilidad al cambiar
  }

  // 🛡️ Validaciones inmediatas (para eventos blur)
  validarNombre() {
    if (this.modo === 'register' && !this.nombre.trim()) {
      this.toastr.warning('El nombre es obligatorio', 'Campo incompleto');
    }
  }

  validarCorreo() {
    if (!this.correo.trim()) {
      this.toastr.warning('El correo es obligatorio', 'Campo incompleto');
    } else if (!this.correo.includes('@')) {
      this.toastr.warning('El correo debe incluir un @', 'Formato inválido');
    }
  }

  validarContrasena() {
    if (!this.contrasena.trim()) {
      this.toastr.warning('La contraseña es obligatoria', 'Campo incompleto');
    }
  }

  // 🚀 Enviar formulario (login o registro)
  enviar() {
    // 1. Validaciones Básicas de campos vacíos
    if (!this.correo.trim()) {
      this.toastr.warning('El correo es obligatorio', 'Campo incompleto');
      return;
    }
    if (!this.contrasena.trim()) {
      this.toastr.warning('la contraseña es obligatoria', 'Campo incompleto');
      return;
    }
    if (this.modo === 'register' && !this.nombre.trim()) {
      this.toastr.warning('El nombre es obligatorio', 'Campo incompleto');
      return;
    }

    // 2. Validación de Formato de Correo
    if (!this.correo.includes('@')) {
      this.toastr.warning('El correo debe ser válido (incluir @)', 'Formato inválido');
      return;
    }

    if (this.modo === 'register' && this.nombre.length > 20) {
      this.toastr.warning('El nombre no puede superar los 20 caracteres', 'Límite excedido');
      return;
    }
    if (this.correo.length > 40) {
      this.toastr.warning('El correo no puede superar los 40 caracteres', 'Límite excedido');
      return;
    }
    if (this.contrasena.length > 40) {
      this.toastr.warning('La contraseña no puede superar los 40 caracteres', 'Límite excedido');
      return;
    }

    // 4. Validación de Complejidad (solo para registro)
    if (this.modo === 'register') {
      if (!this.cumpleLongitud()) {
        this.toastr.error('La contraseña debe tener al menos 8 caracteres', 'Seguridad insuficiente');
        return;
      }
      if (!this.tieneMayuscula()) {
        this.toastr.error('La contraseña debe incluir al menos una mayúscula', 'Seguridad insuficiente');
        return;
      }
      if (!this.tieneNumero()) {
        this.toastr.error('La contraseña debe incluir al menos un número', 'Seguridad insuficiente');
        return;
      }
    }

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
