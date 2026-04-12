import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RifasService } from '../service/rifas.service';
import { AuthService } from '../service/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  rifas: any[] = [];
  rifasActivas: any[] = [];
  historialRifas: any[] = [];
  currentTab: 'crear' | 'activas' | 'historial' = 'activas';

  nuevaRifa: {
    nombre: string;
    descripcion: string;
    precio: number;
    cantidad_boletos: number;
    cantidad_ganadores: number;
    modo_finalizacion: string;
    fecha_fin: string | null;     
    premios: { titulo: string; cantidad: number }[];
  } = {
    nombre: '',
    descripcion: '',
    precio: 50.00,
    cantidad_boletos: 0,
    cantidad_ganadores: 1,
    modo_finalizacion: 'manual',
    fecha_fin: null,             
    premios: [{ titulo: '', cantidad: 1 }]
  };

  usuario: any = null;
  cargando = false;
  editando: any = null;

  constructor(
    private rifasService: RifasService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    if (!this.usuario?.es_admin) {
      this.toastr.error('Solo los administradores pueden acceder aquí.');
      window.location.href = '/';
    }
    this.obtenerRifas();
    
    // Exponer métodos para el modal de detalles
    (window as any).adminComponent = this;
  }

  obtenerRifas(): void {
    this.cargando = true;
    this.rifasService.getRifas().subscribe({
      next: (res) => {
        this.rifas = res.rifas || [];
        this.rifasActivas = this.rifas.filter(r => r.estado === 'activa');
        this.historialRifas = this.rifas.filter(r => r.estado !== 'activa');
        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Error al cargar las rifas');
        this.cargando = false;
      }
    });
  }

  suspenderRifa(id: string): void {
    Swal.fire({
      title: '¿Suspender Rifa?',
      text: '¿Estás seguro de que deseas suspender esta rifa?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, suspender',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.rifasService.cambiarEstado(id, 'suspendida').subscribe({
          next: () => {
            this.toastr.success('Rifa suspendida correctamente');
            this.obtenerRifas();
          },
          error: (err) => {
            const serverResponse = err.error?.error || err.statusText || 'Error desconocido';
            Swal.fire('Error del Servidor', `Código: ${err.status}\nMensaje: ${serverResponse}`, 'error');
            this.cargando = false;
          }
        });
      }
    });
  }

  activarRifa(id: string): void {
    Swal.fire({
      title: '¿Re-Activar Rifa?',
      text: '¿Estás seguro de reactivar esta rifa?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.rifasService.cambiarEstado(id, 'activa').subscribe({
          next: () => {
            this.toastr.success('Rifa activada correctamente');
            this.obtenerRifas();
          },
          error: (err) => {
            const serverResponse = err.error?.error || err.statusText || 'Error desconocido';
            Swal.fire('Error del Servidor', `Código: ${err.status}\nMensaje: ${serverResponse}`, 'error');
            this.cargando = false;
          }
        });
      }
    });
  }

  eliminarRifaConfirm(id: string): void {
    Swal.fire({
      title: '¿Eliminar Definitivamente?',
      text: 'Esta acción borrará la rifa y TODOS sus boletos, premios y compras vinculadas. ¡Esto no se puede deshacer!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.rifasService.eliminarRifa(id).subscribe({
          next: () => {
            this.toastr.success('Rifa eliminada a nivel base de datos');
            this.obtenerRifas();
          },
          error: (err: any) => {
            const serverResponse = err.error?.error || err.statusText || 'Error desconocido';
            Swal.fire('Error al eliminar', `Código: ${err.status}\nMensaje: ${serverResponse}`, 'error');
            this.cargando = false;
          }
        });
      }
    });
  }

  terminarRifa(id: string): void {
    Swal.fire({
      title: '¿Elegir ganadores?',
      text: 'Esta acción es irreversible y finalizará la rifa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, terminar y elegir'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.rifasService.elegirGanador(id).subscribe({
          next: (res) => {
            this.obtenerRifas();
            
            // Format HTML details to show the winners
            let winnersHtml = '<ul style="text-align: left; list-style: none; padding: 0;">';
            res.ganadores.forEach((g: any) => {
              winnersHtml += `<li>🎉 <b>Premio:</b> ${g.premio} <br>🎟️ <b>Boleto:</b> ${g.numero_boleto} <br>👤 <b>Ganador:</b> ${g.ganador_nombre}</li><hr>`;
            });
            winnersHtml += '</ul>';

            Swal.fire({
              title: '¡Rifa Finalizada!',
              html: `¡Hemos elegido a los afortunados! <br><br> ${winnersHtml}`,
              icon: 'success'
            });
          },
          error: (err) => {
            this.toastr.error(err?.error?.error || 'Error al terminar la rifa');
            this.cargando = false;
          }
        });
      }
    });
  }

  verDetalles(id: string): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Buscando participantes y ganadores',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.rifasService.getRifaPorId(id).subscribe({
      next: (res) => {
        if (!res.success) {
          Swal.fire('Error', 'No se pudo cargar la info', 'error');
          return;
        }

        const data = res.rifa;
        let html = '';

        const disponibles = data.cantidad_boletos - (data.participantes ? data.participantes.length : 0);
        html += `<div style="text-align: center; margin-bottom: 20px;">
                   <span style="font-size: 1.2rem; background: var(--nin-yellow); padding: 5px 15px; border: 2px solid #000; border-radius: 8px; font-weight: 900; box-shadow: 3px 3px 0 #000;">
                     Boletos Libres: ${disponibles} de ${data.cantidad_boletos}
                   </span>
                 </div>`;

        if (data.ganadores && data.ganadores.length > 0) {
          html += '<h3 style="color:var(--nin-red); font-weight:900;">🏆 GANADORES 🏆</h3>';
          html += '<ul style="text-align: left; list-style: none; padding: 0;">';
          data.ganadores.forEach((g: any) => {
            html += `<li>🎁 <b>${g.premio}</b> <br>🎟️ Número: ${g.numero_boleto} <br>👤 ${g.ganador_nombre} <br>📧 <small>${g.ganador_email}</small></li><hr style="margin:8px 0; border-top:2px solid #000;">`;
          });
          html += '</ul><br>';
        }

        if (data.participantes && data.participantes.length > 0) {
          html += `<h4 style="color:var(--nin-blue); font-weight:800; margin-top:20px;">👥 PARTICIPANTES (${data.participantes.length})</h4>`;
          html += '<div style="max-height: 350px; overflow-y: auto; border: 2px solid #000; padding:10px; border-radius: 8px; text-align: left;">';
          html += '<ul style="list-style: none; padding: 0; margin: 0;">';
          data.participantes.forEach((p: any) => {
            const isVendido = p.estado === 'VENDIDO';
            let statusIcon = isVendido ? '💰' : '⏳';
            let actions = '';
            
            if (!isVendido) {
              actions = `
                <div style="margin-top:5px; display:flex; gap:5px;">
                  <button onclick="window.adminComponent.confirmarPagoManual('${data.id}', ${p.numero})" 
                          style="background:#387F39; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer; font-weight:bold;">
                    CONFIRMAR PAGO
                  </button>
                  <button onclick="window.adminComponent.eliminarParticipante('${data.id}', ${p.numero})" 
                          style="background:#dc3545; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer; font-weight:bold;">
                    LIBERAR
                  </button>
                </div>
              `;
            }

            html += `<li style="margin-bottom:12px; border-bottom:1px dashed #ccc; padding-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <span>${statusIcon} <b>#${p.numero}</b> - ${p.nombre}</span>
                        </div>
                        <small style="color:#666;">${p.email}</small>
                        ${actions}
                     </li>`;
          });
          html += '</ul></div>';
        } else {
          html += '<p>No hubo participantes.</p>';
        }

        Swal.fire({
          title: `Detalles de ${data.nombre}`,
          html: html,
          width: '600px',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#008CBA'
        });
      },
      error: () => {
        Swal.fire('Error', 'Error al obtener detalles', 'error');
      }
    });
  }

  confirmarPagoManual(idRifa: string, numero: number): void {
    Swal.fire({
      title: '¿Confirmar Pago?',
      text: `¿Deseas marcar el boleto #${numero} como VENDIDO?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rifasService.confirmarPagoManual(idRifa, numero).subscribe({
          next: () => {
            this.toastr.success('Boleto confirmado exitosamente');
            this.verDetalles(idRifa); // Recargar modal
          },
          error: (err) => {
            this.toastr.error('Error al confirmar el pago');
            console.error(err);
          }
        });
      }
    });
  }

  eliminarParticipante(idRifa: string, numero: number): void {
    Swal.fire({
      title: '¿Liberar Boleto?',
      text: `¿Deseas eliminar la reserva del boleto #${numero}? Volverá a estar disponible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rifasService.eliminarParticipante(idRifa, numero).subscribe({
          next: () => {
            this.toastr.success('Boleto liberado');
            this.verDetalles(idRifa); // Recargar modal
          },
          error: (err) => {
            this.toastr.error('Error al liberar el boleto');
            console.error(err);
          }
        });
      }
    });
  }

  agregarPremio(): void {
    this.nuevaRifa.premios.push({ titulo: '', cantidad: 1 });
  }

  eliminarPremio(index: number): void {
    this.nuevaRifa.premios.splice(index, 1);
  }

  crearRifa(): void {
    if (!this.usuario?.es_admin) {
      this.toastr.error('Solo los administradores pueden crear rifas.');
      return;
    }

    // VALIDACIONES
    if (!this.nuevaRifa.nombre.trim()) { this.toastr.warning("El nombre es obligatorio."); return; }
    if (!this.nuevaRifa.descripcion.trim()) { this.toastr.warning("La descripción es obligatoria."); return; }
    if (!this.nuevaRifa.precio || this.nuevaRifa.precio <= 0) { this.toastr.warning("El precio del boleto es inválido."); return; }
    if (this.nuevaRifa.cantidad_boletos <= 0) { this.toastr.warning("Cantidad de boletos inválida."); return; }
    if (this.nuevaRifa.cantidad_ganadores <= 0) { this.toastr.warning("Cantidad de ganadores inválida."); return; }

    for (let p of this.nuevaRifa.premios) {
      if (!p.titulo.trim()) { this.toastr.warning("Todos los premios deben tener título."); return; }
      if (p.cantidad <= 0) { this.toastr.warning("Cantidad de premio inválida."); return; }
    }

    let fechaFinEnviada: string | null = null;

    if (this.nuevaRifa.modo_finalizacion === "fecha") {
      if (!this.nuevaRifa.fecha_fin?.trim()) {
        this.toastr.warning("Debes seleccionar una fecha de finalización.");
        return;
      }

      fechaFinEnviada = `${this.nuevaRifa.fecha_fin}T23:59:59`;
    }

    if (this.nuevaRifa.modo_finalizacion === "manual") {
      fechaFinEnviada = null;
    }

    const nuevaRifaData = {
      ...this.nuevaRifa,
      precio: Number(this.nuevaRifa.precio),
      fecha_fin: fechaFinEnviada,   
      premios: this.nuevaRifa.premios.map(p => ({
        titulo: p.titulo.trim(),
        cantidad: Number(p.cantidad)
      })),
      admin_id: this.usuario.id
    };

    this.rifasService.crearRifa(nuevaRifaData).subscribe({
      next: () => {
        this.toastr.success('Rifa creada correctamente');
        this.obtenerRifas();

        // RESET
        this.nuevaRifa = {
          nombre: '',
          descripcion: '',
          precio: 50.00,
          cantidad_boletos: 0,
          cantidad_ganadores: 1,
          modo_finalizacion: 'manual',
          fecha_fin: null,
          premios: [{ titulo: '', cantidad: 1 }]
        };
      },
      error: () => this.toastr.error('Error al crear la rifa')
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }

  editar(rifa: any): void {
    Swal.fire({
      title: 'Cargando información fresca...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.rifasService.getRifaPorId(rifa.id).subscribe({
      next: (res) => {
        if (!res.success) {
          Swal.fire('Error', 'No se pudo cargar la información para editar', 'error');
          return;
        }

        const dataFresca = res.rifa;
        Swal.close();

        this.editando = {
          ...dataFresca,
          precio: dataFresca.precio || 50.00,
          premios: dataFresca.premios && Array.isArray(dataFresca.premios) && dataFresca.premios.length > 0
            ? dataFresca.premios.map((p: any) => ({
                id: p.id,
                titulo: p.titulo,
                cantidad: p.cantidad
              }))
            : [{ titulo: '', cantidad: 1 }]
        };

        if (this.editando.fecha_fin) {
          const fecha = new Date(this.editando.fecha_fin);
          this.editando.fecha_fin = fecha.toISOString().substring(0, 10);
        }
      },
      error: () => {
        Swal.fire('Error', 'Error al obtener detalles para editar', 'error');
      }
    });
  }

  agregarPremioEdicion(): void {
    if (!this.editando.premios) this.editando.premios = [];
    this.editando.premios.push({ titulo: '', cantidad: 1 });
  }

  eliminarPremioEdicion(index: number): void {
    if (!this.editando.premios) return;
    this.editando.premios.splice(index, 1);
  }

  guardarEdicion(): void {
    if (!this.editando) return;
    if (!this.editando.nombre.trim()) { this.toastr.warning("El nombre es obligatorio."); return; }
    if (!this.editando.descripcion.trim()) { this.toastr.warning("La descripción es obligatoria."); return; }
    if (!this.editando.precio || this.editando.precio <= 0) { this.toastr.warning("Precio de boleto inválido."); return; }
    if (this.editando.cantidad_boletos <= 0) { this.toastr.warning("Boletos inválidos."); return; }

    for (let p of this.editando.premios) {
      if (!p.titulo.trim()) { this.toastr.warning("Todos los premios deben tener título."); return; }
      if (p.cantidad <= 0) { this.toastr.warning("Cantidad inválida."); return; }
    }

    const dataActualizada = {
      ...this.editando,
      precio: Number(this.editando.precio),
      fecha_fin:
        this.editando.modo_finalizacion === 'fecha'
          ? `${this.editando.fecha_fin}T23:59:59`
          : null
    };

    this.rifasService.editarRifa(this.editando.id, dataActualizada).subscribe({
      next: () => {
        this.toastr.success("Rifa actualizada correctamente");
        this.obtenerRifas();
        this.editando = null;
      },
      error: (err) => {
        console.error(err);
        this.toastr.error("Error al actualizar la rifa");
      }
    });
  }
}
