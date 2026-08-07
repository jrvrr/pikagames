import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RifasService } from '../service/rifas.service';
import { AuthService } from '../service/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import {
  NgApexchartsModule,
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexTheme,
  ApexLegend,
  ApexPlotOptions,
  ApexTooltip,
  ApexResponsive
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries | any;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  fill: ApexFill;
  markers: ApexMarkers;
  yaxis: ApexYAxis | ApexYAxis[];
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  theme: ApexTheme;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  responsive: ApexResponsive[];
  labels: any;
  colors: any;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  rifas: any[] = [];
  rifasActivas: any[] = [];
  historialRifas: any[] = [];
  participantesPendientes: any[] = [];
  usuarios: any[] = [];
  searchTerm: string = '';
  currentTab: 'dashboard' | 'crear' | 'rifas' | 'pendientes' | 'clientes' = 'dashboard';
  today = new Date();
  isSidebarCollapsed = false;
  isSidebarVisible = true;
  subTabRifas: 'activas' | 'terminadas' | 'suspendidas' | 'todas' = 'activas';
  usuario: any = null;
  cargando: boolean = false;
  editando: any = null;
  editandoUsuario: any = null;
  usuarioSeleccionado: any = null;

  // --- GESTIÓN DE BOLETOS DE USUARIO Y DETALLES DE RIFA ---
  usuarioBoletosSeleccionado: any = null;
  boletosDelUsuario: any[] = [];
  cargandoBoletosUsuario: boolean = false;
  filtroBoletoEstado: 'todos' | 'vendido' | 'reservado' | 'ganadores' = 'todos';
  busquedaBoletoUsuario: string = '';
  rifaAsignarId: string = '';
  boletoAsignarNumero: number | null = null;
  asignarBoletoUsuarioCargando: boolean = false;

  rifaDetalleSeleccionada: any = null;
  busquedaParticipanteRifa: string = '';
  filtroEstadoParticipante: 'todos' | 'vendido' | 'reservado' = 'todos';

  // --- CONTEO Y DESTACADO DE MULTI-COMPRADORES ---
  conteoBoletosPorUsuario: { [key: string]: number } = {};
  filtroClientesBoletos: 'todos' | 'multi' = 'todos';


  stats = {
    boletosVendidos: 0,
    boletosReservados: 0,
    rifasActivas: 0,
    clientesTotales: 0,
    revenues: 0,
    potentialRevenue: 0,
    rifasRecientes: [] as any[]
  };

  public salesChartOptions: Partial<ChartOptions> | any;
  public distributionChartOptions: Partial<ChartOptions> | any;
  public rafflePerformanceOptions: Partial<ChartOptions> | any;

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



  constructor(
    private rifasService: RifasService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.usuario = this.authService.getUsuarioActual();
    if (!this.usuario?.es_admin) {
      this.toastr.error('Solo los administradores pueden acceder aquí.');
      window.location.href = '/';
      return;
    }
    this.cargarTodo();
    
    // Exponer métodos para el modal de detalles
    (window as any).adminComponent = this;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    if (window.innerWidth < 768) {
      this.isSidebarVisible = false;
      this.isSidebarCollapsed = false;
    } else {
      this.isSidebarVisible = true;
    }
  }

  toggleSidebar() {
    if (window.innerWidth < 768) {
      this.isSidebarVisible = !this.isSidebarVisible;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  toggleSidebarMobile() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  cargarTodo(): void {
    this.obtenerRifas();
    this.obtenerPendientes();
    this.obtenerUsuarios();
  }

  cambiarTab(tab: any): void {
    this.currentTab = tab;
    if (tab === 'pendientes') {
      this.obtenerPendientes();
    } else if (tab === 'clientes') {
      this.obtenerUsuarios();
    } else if (tab === 'dashboard') {
      this.cargarTodo();
    } else {
      this.obtenerRifas();
    }
  }

  obtenerPendientes(): void {
    this.rifasService.getParticipantesPendientes().subscribe({
      next: (res: any) => {
        this.participantesPendientes = res.pendientes || [];
      },
      error: () => this.toastr.error('Error al cargar pendientes')
    });
  }

  obtenerRifas(): void {
    this.cargando = true;
    this.rifasService.getRifas().subscribe({
      next: (res: any) => {
        this.rifas = (res.rifas || []).sort((a: any, b: any) => {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        this.rifasActivas = this.rifas.filter(r => r.estado === 'activa');
        this.historialRifas = this.rifas.filter(r => r.estado !== 'activa');
        this.calcularEstadisticas();
        this.calcularConteoBoletosUsuarios();
        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Error al cargar las rifas');
        this.cargando = false;
      }
    });
  }

  get rifasFiltradas() {
    if (this.subTabRifas === 'todas') return this.rifas;
    if (this.subTabRifas === 'activas') return this.rifas.filter(r => r.estado === 'activa');
    if (this.subTabRifas === 'terminadas') return this.rifas.filter(r => r.estado === 'finalizada' || r.estado === 'cerrada');
    if (this.subTabRifas === 'suspendidas') return this.rifas.filter(r => r.estado === 'suspendida');
    return this.rifas;
  }

  cambiarSubTab(sub: any) {
    this.subTabRifas = sub;
  }

  calcularDiasRestantes(fecha: any): number {
    if (!fecha) return 0;
    const fin = new Date(fecha).getTime();
    const hoy = new Date().getTime();
    const dif = fin - hoy;
    if (dif <= 0) return 0;
    return Math.ceil(dif / (1000 * 60 * 60 * 24));
  }

  obtenerUsuarios(): void {
    if (!this.usuario?.id) return;
    this.authService.getUsuarios(this.usuario.id).subscribe({
      next: (res: any) => {
        this.usuarios = res.usuarios || [];
        this.stats.clientesTotales = this.usuarios.length;
        this.calcularConteoBoletosUsuarios();
      },
      error: () => this.toastr.error('Error al cargar usuarios')
    });
  }

  calcularConteoBoletosUsuarios(): void {
    if (!this.rifas || this.rifas.length === 0) {
      this.conteoBoletosPorUsuario = {};
      return;
    }

    const map: { [key: string]: number } = {};
    const requests = this.rifas.map((r: any) =>
      firstValueFrom(this.rifasService.getRifaPorId(r.id)).catch(() => null)
    );

    Promise.all(requests).then((detalles: any[]) => {
      detalles.forEach((det: any) => {
        if (det && det.success && det.rifa && det.rifa.participantes) {
          det.rifa.participantes.forEach((p: any) => {
            if (p.user_id) {
              map[p.user_id] = (map[p.user_id] || 0) + 1;
            }
            if (p.email) {
              const emailKey = p.email.toLowerCase().trim();
              map[emailKey] = (map[emailKey] || 0) + 1;
            }
          });
        }
      });
      this.conteoBoletosPorUsuario = map;
    }).catch(() => {
      this.conteoBoletosPorUsuario = map;
    });
  }

  obtenerCantidadBoletosUsuario(u: any): number {
    if (!u) return 0;
    const countById = u.id ? (this.conteoBoletosPorUsuario[u.id] || 0) : 0;
    const countByEmail = u.correo ? (this.conteoBoletosPorUsuario[u.correo.toLowerCase().trim()] || 0) : 0;
    return Math.max(countById, countByEmail);
  }

  esMultiComprador(u: any): boolean {
    return this.obtenerCantidadBoletosUsuario(u) > 1;
  }

  obtenerBoletosEnSorteoActual(p: any): number {
    if (!this.rifaDetalleSeleccionada || !this.rifaDetalleSeleccionada.participantes) return 1;
    const participantes = this.rifaDetalleSeleccionada.participantes;
    const pEmail = p.email ? p.email.toLowerCase().trim() : '';
    const pUserId = p.user_id;

    return participantes.filter((other: any) => {
      const sameUser = pUserId && other.user_id === pUserId;
      const sameEmail = pEmail && other.email && other.email.toLowerCase().trim() === pEmail;
      return sameUser || sameEmail;
    }).length;
  }

  get usuariosFiltrados() {
    let list = this.usuarios || [];

    if (this.filtroClientesBoletos === 'multi') {
      list = list.filter(u => this.esMultiComprador(u));
    }

    if (!this.searchTerm.trim()) return list;
    const term = this.searchTerm.toLowerCase();
    return list.filter(u => 
      (u.nombre || '').toLowerCase().includes(term) || 
      (u.correo || '').toLowerCase().includes(term)
    );
  }

  calcularEstadisticas(): void {
    this.stats.rifasActivas = this.rifasActivas.length;
    this.stats.rifasRecientes = this.rifas.slice(0, 5);
    
    let totalVendidosCount = 0;
    let totalReservadosCount = 0;
    let totalRevenue = 0;
    let potentialRevenue = 0;

    this.rifas.forEach(r => {
      // Tickets VENDIDOS (Ingresos reales)
      if (r.boletos_vendidos && Array.isArray(r.boletos_vendidos)) {
        totalVendidosCount += r.boletos_vendidos.length;
        totalRevenue += (r.boletos_vendidos.length * (r.precio || 0));
      }
      // Tickets RESERVADOS (Potencial)
      if (r.boletos_reservados && Array.isArray(r.boletos_reservados)) {
        totalReservadosCount += r.boletos_reservados.length;
        potentialRevenue += (r.boletos_reservados.length * (r.precio || 0));
      }
    });

    this.stats.boletosVendidos = totalVendidosCount;
    this.stats.boletosReservados = totalReservadosCount;
    this.stats.revenues = totalRevenue;
    this.stats.potentialRevenue = potentialRevenue;

    this.initCharts();
  }

  initCharts() {
    // 1. Chart de Distribución (Donut con 3 Categorías: Vendido, Reservado, Libre)
    const totalCapacidad = this.rifas.reduce((acc, r) => acc + (r.cantidad_boletos || 0), 0);
    const totalVendidos = this.stats.boletosVendidos;
    const totalReservados = this.stats.boletosReservados;
    const totalLibres = Math.max(0, totalCapacidad - totalVendidos - totalReservados);

    this.distributionChartOptions = {
      series: [totalVendidos, totalReservados, totalLibres],
      chart: {
        type: "donut",
        height: 185,
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      labels: ["Vendidos", "Reservados", "Disponibles"],
      colors: ["#10B981", "#F59E0B", "#E2E8F0"],
      legend: { position: "bottom", fontWeight: 700 },
      plotOptions: {
        pie: {
          donut: {
            size: "75%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total Boletos",
                formatter: () => totalCapacidad.toString()
              }
            }
          }
        }
      },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: "bottom" } } }]
    };

    // 2. Chart de Desempeño por Rifa (Bar)
    const topRifas = this.rifas.slice(0, 6);
    this.rafflePerformanceOptions = {
      series: [{
        name: "Ventas Reales ($)",
        data: topRifas.map(r => (r.boletos_vendidos?.length || 0) * Number(r.precio || 0))
      }],
      chart: { type: "bar", height: 220, toolbar: { show: false } },
      plotOptions: {
        bar: { borderRadius: 8, columnWidth: "45%", distributed: true }
      },
      colors: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"],
      xaxis: {
        categories: topRifas.map(r => r.nombre.substring(0, 12) + (r.nombre.length > 12 ? '...' : '')),
        labels: { style: { fontWeight: 600 } }
      },
      legend: { show: false }
    };

    // 3. Chart de Tendencia (Area)
    this.salesChartOptions = {
      series: [{
        name: "Ingresos Confirmados",
        data: [...this.rifas].reverse().map((r, i) => {
          const dateLabel = r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A';
          return {
            x: dateLabel,
            y: (r.boletos_vendidos?.length || 0) * Number(r.precio || 0)
          };
        })
      }],
      chart: { type: "area", height: 220, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 4 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100, 100, 100] }
      },
      colors: ["#008CBA"],
      xaxis: { type: "category", labels: { rotate: -45, style: { fontWeight: 600 } } },
      yaxis: { labels: { formatter: (val: number) => `$${val.toFixed(0)}` } }
    };
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
    this.busquedaParticipanteRifa = '';
    this.filtroEstadoParticipante = 'todos';

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
        Swal.close();
        if (!res.success) {
          this.toastr.error('No se pudo cargar la información del sorteo');
          return;
        }
        this.rifaDetalleSeleccionada = res.rifa;
      },
      error: () => {
        Swal.close();
        this.toastr.error('Error al obtener detalles del sorteo');
      }
    });
  }

  get participantesRifaFiltrados(): any[] {
    if (!this.rifaDetalleSeleccionada || !this.rifaDetalleSeleccionada.participantes) return [];
    let list = [...this.rifaDetalleSeleccionada.participantes];

    if (this.filtroEstadoParticipante === 'vendido') {
      list = list.filter((p: any) => p.estado === 'VENDIDO');
    } else if (this.filtroEstadoParticipante === 'reservado') {
      list = list.filter((p: any) => p.estado !== 'VENDIDO');
    }

    if (this.busquedaParticipanteRifa.trim()) {
      const term = this.busquedaParticipanteRifa.toLowerCase().trim();
      list = list.filter((p: any) =>
        p.numero.toString().includes(term) ||
        (p.nombre && p.nombre.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term))
      );
    }

    return list;
  }

  get boletosLibresRifaDetalle(): number {
    if (!this.rifaDetalleSeleccionada) return 0;
    const cap = this.rifaDetalleSeleccionada.cantidad_boletos || 0;
    const count = this.rifaDetalleSeleccionada.participantes ? this.rifaDetalleSeleccionada.participantes.length : 0;
    return Math.max(0, cap - count);
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
            if (this.currentTab === 'pendientes') {
              this.obtenerPendientes();
            } else {
              this.verDetalles(idRifa); // Recargar modal
            }
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
            if (this.currentTab === 'pendientes') {
              this.obtenerPendientes();
            } else {
              this.verDetalles(idRifa); // Recargar modal
            }
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

    // Auto-calcular cantidad_ganadores desde los premios
    const totalPremios = this.editando.premios.reduce(
      (acc: number, p: any) => acc + (Number(p.cantidad) || 0), 0
    );
    this.editando.cantidad_ganadores = totalPremios;

    const dataActualizada = {
      ...this.editando,
      precio: Number(this.editando.precio),
      cantidad_ganadores: totalPremios,
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

  // --- GESTIÓN DE USUARIOS ---
  verDetallesUsuario(u: any): void {
    this.usuarioSeleccionado = u;
  }

  eliminarUsuarioConfirm(u: any): void {
    if (u.es_admin) {
      this.toastr.warning("No se puede eliminar a un administrador");
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar permanentemente a ${u.nombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Sí, eliminar permanentemente',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.eliminarUsuario(u.id, this.usuario.id).subscribe({
          next: () => {
            this.toastr.success('Usuario eliminado correctamente');
            if (this.usuarioSeleccionado?.id === u.id) this.usuarioSeleccionado = null;
            this.obtenerUsuarios();
          },
          error: () => this.toastr.error('Error al eliminar el usuario')
        });
      }
    });
  }

  prepararEdicionUsuario(u: any): void {
    this.editandoUsuario = { ...u };
  }

  guardarEdicionUsuario(): void {
    if (!this.editandoUsuario) return;
    
    if (!this.editandoUsuario.nombre.trim() || !this.editandoUsuario.correo.trim()) {
      this.toastr.warning('Nombre y correo son obligatorios');
      return;
    }

    this.cargando = true;
    this.authService.actualizarUsuario(this.editandoUsuario.id, this.usuario.id, {
      nombre: this.editandoUsuario.nombre,
      correo: this.editandoUsuario.correo,
      es_admin: this.editandoUsuario.es_admin
    }).subscribe({
      next: (res) => {
        this.toastr.success('Usuario actualizado correctamente');
        this.editandoUsuario = null;
        if (this.usuarioSeleccionado?.id === res.usuario.id) {
          this.usuarioSeleccionado = res.usuario;
        }
        this.obtenerUsuarios();
        this.cargando = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.error || 'Error al actualizar usuario');
        this.cargando = false;
      }
    });
  }

  // --- MÉTODOS PARA BOLETOS POR USUARIO ---
  abrirModalBoletosUsuario(u: any): void {
    this.usuarioBoletosSeleccionado = u;
    this.filtroBoletoEstado = 'todos';
    this.busquedaBoletoUsuario = '';
    this.rifaAsignarId = '';
    this.boletoAsignarNumero = null;
    this.asignarBoletoUsuarioCargando = false;
    this.cargarBoletosDeUsuario(u);
  }

  cargarBoletosDeUsuario(u: any): void {
    if (!u) return;
    this.cargandoBoletosUsuario = true;
    this.boletosDelUsuario = [];

    this.rifasService.getRifas().subscribe({
      next: (res: any) => {
        const rawRifas = res.rifas || [];
        if (rawRifas.length === 0) {
          this.cargandoBoletosUsuario = false;
          return;
        }

        const requests = rawRifas.map((r: any) => this.rifasService.getRifaPorId(r.id).toPromise().catch(() => null));

        Promise.all(requests).then((detalles: any[]) => {
          const boletosUsuario: any[] = [];

          detalles.forEach((det: any) => {
            if (!det || !det.success || !det.rifa) return;
            const rifa = det.rifa;
            const participantes = rifa.participantes || [];
            const ganadores = rifa.ganadores || [];

            participantes.forEach((p: any) => {
              const esCoincidencia = 
                (p.user_id && p.user_id === u.id) || 
                (p.email && u.correo && p.email.toLowerCase().trim() === u.correo.toLowerCase().trim());

              if (esCoincidencia) {
                const ganadorInfo = ganadores.find((g: any) => Number(g.numero_boleto) === Number(p.numero));

                boletosUsuario.push({
                  rifaId: rifa.id,
                  rifaNombre: rifa.nombre,
                  rifaPrecio: Number(rifa.precio || 0),
                  rifaEstado: rifa.estado,
                  numero: p.numero,
                  estadoBoleto: p.estado, // 'VENDIDO' o 'RESERVADO'
                  user_id: p.user_id,
                  nombre: p.nombre,
                  email: p.email,
                  esGanador: !!ganadorInfo,
                  premioGanado: ganadorInfo ? ganadorInfo.premio : null,
                  created_at: p.created_at || rifa.created_at
                });
              }
            });
          });

          this.boletosDelUsuario = boletosUsuario.sort((a, b) => a.numero - b.numero);
          this.cargandoBoletosUsuario = false;
        }).catch((err) => {
          console.error(err);
          this.toastr.error('Error al procesar boletos del usuario');
          this.cargandoBoletosUsuario = false;
        });
      },
      error: () => {
        this.toastr.error('Error al obtener rifas para boletos');
        this.cargandoBoletosUsuario = false;
      }
    });
  }

  get boletosUsuarioFiltrados(): any[] {
    let result = [...this.boletosDelUsuario];

    if (this.filtroBoletoEstado === 'vendido') {
      result = result.filter(b => b.estadoBoleto === 'VENDIDO');
    } else if (this.filtroBoletoEstado === 'reservado') {
      result = result.filter(b => b.estadoBoleto !== 'VENDIDO');
    } else if (this.filtroBoletoEstado === 'ganadores') {
      result = result.filter(b => b.esGanador);
    }

    if (this.busquedaBoletoUsuario.trim()) {
      const term = this.busquedaBoletoUsuario.toLowerCase().trim();
      result = result.filter(b => 
        b.numero.toString().includes(term) || 
        b.rifaNombre.toLowerCase().includes(term) ||
        (b.premioGanado && b.premioGanado.toLowerCase().includes(term))
      );
    }

    return result;
  }

  get statsBoletosUsuario() {
    const total = this.boletosDelUsuario.length;
    const vendidos = this.boletosDelUsuario.filter(b => b.estadoBoleto === 'VENDIDO').length;
    const reservados = this.boletosDelUsuario.filter(b => b.estadoBoleto !== 'VENDIDO').length;
    const invertido = this.boletosDelUsuario
      .filter(b => b.estadoBoleto === 'VENDIDO')
      .reduce((sum, b) => sum + (b.rifaPrecio || 0), 0);
    const premios = this.boletosDelUsuario.filter(b => b.esGanador).length;

    return { total, vendidos, reservados, invertido, premios };
  }

  confirmarPagoDesdeTablaUsuario(idRifa: string, numero: number): void {
    Swal.fire({
      title: '¿Confirmar Pago?',
      text: `¿Deseas marcar el boleto #${numero} como VENDIDO?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rifasService.confirmarPagoManual(idRifa, numero).subscribe({
          next: () => {
            this.toastr.success('Boleto confirmado exitosamente');
            this.cargarBoletosDeUsuario(this.usuarioBoletosSeleccionado);
          },
          error: (err) => {
            this.toastr.error('Error al confirmar el pago');
            console.error(err);
          }
        });
      }
    });
  }

  liberarBoletoDesdeTablaUsuario(idRifa: string, numero: number): void {
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
            this.cargarBoletosDeUsuario(this.usuarioBoletosSeleccionado);
          },
          error: (err) => {
            this.toastr.error('Error al liberar el boleto');
            console.error(err);
          }
        });
      }
    });
  }

  get rifasDisponiblesParaAsignacion(): any[] {
    return (this.rifas || []).filter((rifa: any) => {
      const ocupados = rifa.boletos_ocupados?.length || 0;
      return (rifa.cantidad_boletos || 0) > ocupados;
    });
  }

  asignarBoletoAUsuario(): void {
    if (!this.usuarioBoletosSeleccionado) return;
    if (!this.rifaAsignarId || !this.boletoAsignarNumero) {
      this.toastr.warning('Selecciona la rifa y el número de boleto a asignar.');
      return;
    }

    const rifa = this.rifas.find((r: any) => r.id === this.rifaAsignarId);
    if (!rifa) {
      this.toastr.error('No se encontró la rifa seleccionada.');
      return;
    }

    const numero = Number(this.boletoAsignarNumero);
    if (numero < 1 || numero > (rifa.cantidad_boletos || 0)) {
      this.toastr.warning('Número de boleto inválido.');
      return;
    }

    const estaOcupado = (rifa.boletos_ocupados || []).includes(numero);
    if (estaOcupado) {
      this.toastr.warning('El boleto ya está ocupado. Elige otro número.');
      return;
    }

    this.asignarBoletoUsuarioCargando = true;
    this.rifasService.apartarBoleto(this.rifaAsignarId, {
      user_id: this.usuarioBoletosSeleccionado.id,
      boletos: [numero]
    }).subscribe({
      next: (res: any) => {
        this.asignarBoletoUsuarioCargando = false;
        if (res.success) {
          this.toastr.success(`Boleto #${numero} asignado a ${this.usuarioBoletosSeleccionado.nombre}.`);
          this.boletoAsignarNumero = null;
          this.rifaAsignarId = '';
          this.cargarBoletosDeUsuario(this.usuarioBoletosSeleccionado);
          this.obtenerRifas();
          this.obtenerUsuarios();
        } else {
          this.toastr.error(res.error || 'No se pudo asignar el boleto.');
        }
      },
      error: (err) => {
        this.asignarBoletoUsuarioCargando = false;
        const mensajeError = err.error?.error || 'Error al asignar el boleto';
        this.toastr.error(mensajeError);
        console.error(err);
      }
    });
  }
}
