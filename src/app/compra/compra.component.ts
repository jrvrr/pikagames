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

  boletoSeleccionado: number | null = null;
  rifaSeleccionada: any = null;
  reservando = false;
  apartadoExitoso = false;
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

  obtenerRifas(): void {
    this.cargando = true;
    this.rifasService.getRifas().subscribe({
      next: (res: any) => {
        const rawRifas = res.rifas || [];
        this.rifas = rawRifas.filter((r: any) => r.estado === 'activa').map((r: any) => ({
          ...r,
          boletosVisibles: 20
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

        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar rifas:', err);
        this.toastr.error('No se pudieron cargar las rifas', 'Error');
        this.cargando = false;
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

  verMasBoletos(rifa: any): void {
    if (!rifa.boletosVisibles) {
      rifa.boletosVisibles = 20;
    }
    rifa.boletosVisibles += 20;
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

    this.boletoSeleccionado = num;
    this.rifaSeleccionada = rifa;
    this.apartadoExitoso = false;
    
    // NO renderizar PayPal automáticamente aquí para evitar errores prematuros
    // Solo se renderizará si el usuario lo elige explícitamente o es el default
    if (this.metodoPagoSeleccionado === 'paypal') {
      setTimeout(() => this.renderizarPayPal(rifa, num), 100);
    }
  }

  seleccionarMetodo(metodo: 'paypal' | 'oxxo' | 'spei'): void {
    this.metodoPagoSeleccionado = metodo;
    this.apartadoExitoso = false; // Resetear éxito si cambia de método
    
    if (metodo === 'paypal' && this.boletoSeleccionado) {
      setTimeout(() => {
        this.renderizarPayPal(this.rifaSeleccionada, this.boletoSeleccionado!);
      }, 100);
    }
  }

  apartarPorTransferencia(rifa: any, num: number): void {
    if (!this.usuario) {
      this.abrirAuth();
      return;
    }

    this.reservando = true;
    const payload = {
      user_id: this.usuario.id,
      boletos: [num] // El backend espera un arreglo de números
    };

    this.rifasService.apartarBoleto(rifa.id, payload).subscribe({
      next: (res) => {
        this.reservando = false;
        if (res.success) {
          this.toastr.success(`Boleto #${num} apartado. Envía el comprobante por WhatsApp.`, '¡Boleto Apartado!');
          this.apartadoExitoso = true;
          // Actualizamos la lista para que el boleto aparezca ocupado para otros
          this.obtenerRifas();
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

  generarLinkWhatsapp(rifa: any, num: number): string {
    const phone = '525620980834';
    const text = `Hola Pika Games! 👋 He apartado el boleto #${num} para la rifa de "${rifa.nombre}" mediante ${this.metodoPagoSeleccionado.toUpperCase()}. Aquí adjunto mi comprobante de pago.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  renderizarPayPal(rifa: any, boleto: number): void {
    const containerId = `#paypal-button-container-${rifa.id}`;

    const contenedor = document.querySelector(containerId);
    if (contenedor) contenedor.innerHTML = "";

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
            numero: boleto,
            monto: rifa.precio || "50.00",
            usuario_id: this.usuario.id
          };
          console.log('Payload enviado a crear-orden:', payload);
          const res = await firstValueFrom(this.rifasService.crearOrdenPaypal(payload));
          return res.orderId;
        } catch (error) {
          console.error("Error al crear la orden", error);
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
            numero: boleto
          };
          const res = await firstValueFrom(this.rifasService.capturarPagoPaypal(payload));
          
          if (res.success) {
            this.toastr.success(`Boleto #${boleto} comprado con éxito`, '¡Compra Exitosa!');
            this.boletoSeleccionado = null;
            this.rifaSeleccionada = null;
            this.obtenerRifas();
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
}
