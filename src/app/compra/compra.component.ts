import { Component, OnInit } from '@angular/core';
import { RifasService } from '../service/rifas.service';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

import { FormsModule } from '@angular/forms';

declare var paypal: any;

@Component({
  selector: 'app-compra',
  templateUrl: './compra.component.html',
  styleUrls: ['./compra.component.css'],
  standalone: true,
  imports: [CommonModule, AuthModalComponent, FormsModule]
})
export class CompraComponent implements OnInit {
  rifas: any[] = [];
  mostrarModal = false;
  usuario: any = null;
  cargando = false;
  ultimaRifaFinalizada: any = null;

  boletosSeleccionados: number[] = [];
  rifaSeleccionada: any = null;
  reservando = false;
  apartadoExitoso = false;
  mostrarModalExito = false;
  metodoPagoSeleccionado: 'paypal' | 'oxxo' | 'spei' = 'paypal';
  editandoRifa: any = null;

  constructor(
    private rifasService: RifasService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    this.obtenerRifas();
  }

  obtenerRifas(silent: boolean = false): void {
    if (!silent) {
      this.cargando = true;
    }

    // Guardar estado actual de las paginaciones
    const paginasGuardadas: { [key: number]: number } = {};
    this.rifas.forEach(r => {
      paginasGuardadas[r.id] = r.paginaActual || 1;
    });

    this.rifasService.getRifas().subscribe({
      next: (res: any) => {
        const rawRifas = res.rifas || [];
        this.rifas = rawRifas.filter((r: any) => r.estado === 'activa').map((r: any) => ({
          ...r,
          paginaActual: paginasGuardadas[r.id] || 1,
          boletosPorPagina: 10
        }));

        // Buscar última rifa finalizada (ordenando por ID o fecha si es posible, o simplemente revirtiendo)
        const finalizadas = rawRifas
          .filter((r: any) => r.estado === 'finalizada')
          .sort((a: any, b: any) => {
            // Intentar ordenar por ID o created_at
            const valA = a.created_at || a.id;
            const valB = b.created_at || b.id;
            return valA > valB ? -1 : 1;
          });

        if (finalizadas.length > 0) {
          const idUltima = finalizadas[0].id;
          // Tenemos que pedir los detalles completos para tener la lista de ganadores
          this.rifasService.getRifaPorId(idUltima).subscribe({
            next: (detalleRes) => {
              if (detalleRes.success) {
                this.ultimaRifaFinalizada = detalleRes.rifa;
              }
            }
          });
        }

        if (!silent) {
          this.cargando = false;
        }
      },
      error: (err: any) => {
        console.error('Error al cargar rifas:', err);
        this.toastr.error('No se pudieron cargar las rifas', 'Error');
        if (!silent) {
          this.cargando = false;
        }
      }
    });
  }

  abrirAuth(): void {
    this.mostrarModal = true;
  }

  cerrarAuth(): void {
    this.mostrarModal = false;
    this.usuario = this.authService.getUsuarioActual();
  }

  crearRifa(): void {
    const nuevaRifa = {
      nombre: 'Rifa de Prueba Admin',
      descripcion: 'Creada por administrador',
      precio: 50.00,
      cantidad_boletos: 10,
      cantidad_ganadores: 1,
      modo_finalizacion: 'manual',
      fecha_fin: '2025-12-31',
      admin_id: this.usuario?.id,
      premios: [{ titulo: 'Premio Único', cantidad: 1 }]
    };

    this.rifasService.crearRifa(nuevaRifa).subscribe({
      next: () => {
        this.toastr.success('Rifa creada correctamente', '¡Éxito!');
        this.obtenerRifas();
      },
      error: (err: any) => {
        console.error('Error creando rifa:', err);
        this.toastr.error('Hubo un problema al crear la rifa', 'Error');
      }
    });
  }

  getTotalPaginas(rifa: any): number {
    return Math.ceil((rifa.cantidad_boletos || 0) / (rifa.boletosPorPagina || 10));
  }

  cambiarPagina(rifa: any, delta: number): void {
    if (!rifa.paginaActual) {
      rifa.paginaActual = 1;
    }
    const nuevaPagina = rifa.paginaActual + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.getTotalPaginas(rifa)) {
      rifa.paginaActual = nuevaPagina;
    }
  }

  generarBoletos(cantidad: number): number[] {
    return Array.from({ length: cantidad }, (_, i) => i + 1);
  }

  seleccionarBoleto(rifa: any, num: number): void {
    if (!this.usuario) {
      this.abrirAuth();
      return;
    }

    if (this.usuario.es_admin) {
      this.toastr.warning('Los administradores no pueden comprar boletos', 'Aviso');
      return;
    }

    if (rifa.boletos_ocupados?.includes(num)) {
      this.toastr.error('Ese boleto ya está ocupado', 'Ocupado');
      return;
    }

    // Si cambiamos de rifa, limpiamos la selección anterior
    if (this.rifaSeleccionada && this.rifaSeleccionada.id !== rifa.id) {
      this.boletosSeleccionados = [];
    }

    this.rifaSeleccionada = rifa;
    this.apartadoExitoso = false;

    // Toggle: agregar o quitar del arreglo
    const idx = this.boletosSeleccionados.indexOf(num);
    if (idx > -1) {
      this.boletosSeleccionados.splice(idx, 1);
    } else {
      this.boletosSeleccionados.push(num);
    }

    // Re-renderizar PayPal si hay boletos seleccionados y el método es PayPal
    if (this.boletosSeleccionados.length > 0 && this.metodoPagoSeleccionado === 'paypal') {
      setTimeout(() => this.renderizarPayPal(rifa, this.boletosSeleccionados), 100);
    }
  }

  esBoletoSeleccionado(rifa: any, num: number): boolean {
    return this.rifaSeleccionada?.id === rifa.id && this.boletosSeleccionados.includes(num);
  }

  getTotalSeleccionado(): number {
    if (!this.rifaSeleccionada) return 0;
    return this.boletosSeleccionados.length * (this.rifaSeleccionada.precio || 0);
  }

  seleccionarMetodo(metodo: 'paypal' | 'oxxo' | 'spei'): void {
    this.metodoPagoSeleccionado = metodo;
    this.apartadoExitoso = false;
    
    if (metodo === 'paypal' && this.boletosSeleccionados.length > 0) {
      setTimeout(() => {
        this.renderizarPayPal(this.rifaSeleccionada, this.boletosSeleccionados);
      }, 100);
    }
  }

  apartarPorTransferencia(rifa: any): void {
    if (!this.usuario) {
      this.abrirAuth();
      return;
    }

    if (this.boletosSeleccionados.length === 0) {
      this.toastr.warning('Selecciona al menos un boleto', 'Aviso');
      return;
    }

    this.reservando = true;
    const payload = {
      user_id: this.usuario.id,
      boletos: this.boletosSeleccionados
    };

    this.rifasService.apartarBoleto(rifa.id, payload).subscribe({
      next: (res) => {
        this.reservando = false;
        if (res.success) {
          const nums = this.boletosSeleccionados.map(n => `#${n}`).join(', ');
          this.toastr.success(`Boleto(s) ${nums} apartado(s). Envía el comprobante por WhatsApp.`, '¡Boleto(s) Apartado(s)!');
          this.apartadoExitoso = true;
          this.mostrarModalExito = true;
          this.obtenerRifas(true);
        } else {
          this.toastr.error(res.error || 'No se pudo apartar el boleto', 'Error');
        }
      },
      error: (err) => {
        this.reservando = false;
        console.error('Error al apartar:', err);
        const mensajeError = err.error?.error || 'Error de conexión o el boleto ya fue tomado';
        this.toastr.error(mensajeError, 'Error');
      }
    });
  }

  generarLinkWhatsapp(rifa: any): string {
    const phone = '525620980834';
    const nums = this.boletosSeleccionados.map(n => `#${n}`).join(', ');
    const text = `Hola Pika Games! 👋 He apartado el/los boleto(s) ${nums} para la rifa de "${rifa.nombre}" mediante ${this.metodoPagoSeleccionado.toUpperCase()}. Aquí adjunto mi comprobante de pago.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  renderizarPayPal(rifa: any, boletos: number[]): void {
    const containerId = `#paypal-button-container-${rifa.id}`;

    const contenedor = document.querySelector(containerId);
    if (contenedor) contenedor.innerHTML = "";

    // Por ahora PayPal maneja un boleto a la vez; tomamos el primero si hay varios
    // TODO: Si el backend soporta orden multi-boleto, actualizar aquí
    const primerBoleto = boletos[0];
    const montoTotal = ((rifa.precio || 50) * boletos.length).toFixed(2);

    paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "paypal"
      },

      createOrder: async (data: any, actions: any) => {
        try {
          const payload = {
            rifa_id: rifa.id,
            numero: primerBoleto,
            monto: montoTotal,
            usuario_id: this.usuario.id
          };
          console.log('=== CREAR ORDEN PAYPAL ===');
          console.log('Rifa:', rifa);
          console.log('Usuario:', this.usuario);
          console.log('Boletos seleccionados:', boletos);
          console.log('Payload enviado:', JSON.stringify(payload, null, 2));
          
          const res = await firstValueFrom(this.rifasService.crearOrdenPaypal(payload));
          console.log('Respuesta de crear-orden:', res);
          return res.orderId;
        } catch (error: any) {
          console.error("❌ Error al crear la orden:", error);
          console.error("Status:", error.status);
          console.error("Body:", error.error);
          console.error("Mensaje completo:", error.message);
          this.toastr.error('No se pudo iniciar el pago porque el boleto no está disponible.', 'Boleto ocupado');
          throw error;
        }
      },

      onApprove: async (data: any, actions: any) => {
        try {
          const payload = {
            orderID: data.orderID,
            usuario_id: this.usuario.id,
            rifa_id: rifa.id,
            numero: primerBoleto
          };
          const res = await firstValueFrom(this.rifasService.capturarPagoPaypal(payload));
          
          if (res.success) {
            const nums = boletos.map(n => `#${n}`).join(', ');
            this.toastr.success(`Boleto(s) ${nums} comprado(s) con éxito`, '¡Compra Exitosa!');
            this.boletosSeleccionados = [];
            this.rifaSeleccionada = null;
            this.obtenerRifas(true);
          } else {
            this.toastr.error('No se pudo completar el pago', 'Error');
          }
        } catch (error) {
          console.error("Error al capturar el pago:", error);
          this.toastr.error('Hubo un error al confirmar el pago', 'Error');
        }
      },

      onError: (err: any) => {
        console.error("Error PayPal:", err);
        this.toastr.warning('El pago fue cancelado o hubo un problema de conexión', 'Pago Incompleto');
      }

    }).render(containerId);
  }



  editarRifa(rifa: any): void {
    this.editandoRifa = { ...rifa };
  }

  guardarEdicionRapida(): void {
    if (!this.editandoRifa) return;
    
    this.cargando = true;
    const updateData = {
      nombre: this.editandoRifa.nombre,
      descripcion: this.editandoRifa.descripcion,
      precio: Number(this.editandoRifa.precio)
    };

    this.rifasService.editarRifa(this.editandoRifa.id, updateData).subscribe({
      next: () => {
        this.toastr.success('Rifa actualizada correctamente');
        this.editandoRifa = null;
        this.obtenerRifas();
      },
      error: () => {
        this.toastr.error('Error al actualizar la rifa');
        this.cargando = false;
      }
    });
  }

  eliminarRifaConfirm(id: string): void {
    Swal.fire({
      title: '¿Eliminar Rifa?',
      text: 'Esta acción borrará permanentemente la rifa y toda su información. ¡No se puede deshacer!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar permanentemente',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.rifasService.eliminarRifa(id).subscribe({
          next: () => {
            this.toastr.success('Rifa eliminada');
            this.obtenerRifas();
          },
          error: (err) => {
            const msg = err.error?.error || 'Error al eliminar';
            Swal.fire('Error', msg, 'error');
            this.cargando = false;
          }
        });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.usuario = null;
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.apartadoExitoso = false;
    this.boletosSeleccionados = [];
    this.rifaSeleccionada = null;
  }
}
