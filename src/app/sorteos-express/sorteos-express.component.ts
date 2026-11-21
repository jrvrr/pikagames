import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SorteosExpressService } from '../service/sorteos-express.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-sorteos-express',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sorteos-express.component.html',
  styleUrl: './sorteos-express.component.css'
})
export class SorteosExpressComponent implements OnInit, OnDestroy {
  cargando = true;
  sorteos: any[] = [];
  filtro: 'activos' | 'finalizados' | 'todos' = 'activos';

  participando: any = null;
  enviando = false;
  form = { username: '', nombre: '', correo: '' };

  verGanadores: any = null;
  revelandoGanadores = false;
  private revealTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private service: SorteosExpressService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargar();

    const usuario = this.authService.getUsuarioActual?.();
    if (usuario) {
      this.form.nombre = usuario.nombre || '';
      this.form.correo = usuario.correo || '';
    }
  }

  ngOnDestroy(): void {
    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
    }
  }

  cargar(): void {
    this.cargando = true;
    this.service.publicos().subscribe({
      next: (res: any) => {
        this.sorteos = res.sorteos || [];
        this.cargando = false;
        this.mostrarUltimoSorteoGanador();
      },
      error: () => {
        this.cargando = false;
        this.toastr.error('No se pudieron cargar los sorteos express');
      }
    });
  }

  get sorteosFiltrados(): any[] {
    if (this.filtro === 'activos') {
      return this.sorteos.filter((s) => s.estado === 'activo' || s.estado === 'programado');
    }
    if (this.filtro === 'finalizados') {
      return this.sorteos.filter((s) => s.estado === 'finalizado');
    }
    return this.sorteos;
  }

  estadoTexto(estado: string): string {
    switch (estado) {
      case 'activo':
        return 'Participa ahora';
      case 'programado':
        return 'Programado';
      case 'finalizado':
        return 'Finalizado';
      case 'cerrado':
        return 'Cerrado';
      default:
        return 'Próximamente';
    }
  }

  portada(s: any): string | null {
    const conImagen = (s.fuentes || []).find((f: any) => f.imagen_url);
    return conImagen?.imagen_url || null;
  }

  cuentaPrincipal(s: any): string | null {
    const conCuenta = (s.fuentes || []).find((f: any) => f.cuenta);
    return conCuenta?.cuenta || null;
  }

  enlacePublicacion(s: any): string | null {
    return s.fuentes?.[0]?.url || null;
  }

  abrirParticipar(s: any): void {
    if (s.estado === 'finalizado' || s.estado === 'cerrado') {
      this.toastr.info('Este sorteo ya terminó');
      return;
    }
    this.participando = s;
    this.form.username = '';
  }

  enviarParticipacion(): void {
    if (!this.participando) return;
    if (!this.form.username.trim()) {
      this.toastr.warning('Escribe tu usuario de Instagram o Facebook');
      return;
    }

    this.enviando = true;
    this.service
      .participar(this.participando.id, {
        username: this.form.username.trim().replace(/^@/, ''),
        nombre: this.form.nombre.trim(),
        correo: this.form.correo.trim()
      })
      .subscribe({
        next: (res: any) => {
          this.enviando = false;
          this.toastr.success(res?.message || '¡Participación registrada!');
          this.participando = null;
          this.form.username = '';
          this.cargar();
        },
        error: (error: any) => {
          this.enviando = false;
          this.toastr.error(error?.error?.error || 'No se pudo registrar la participación');
        }
      });
  }

  abrirGanadores(s: any): void {
    this.iniciarRevelacion(s);
  }

  iniciarRevelacion(sorteo: any): void {
    this.verGanadores = sorteo;
    this.revelandoGanadores = true;

    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
    }

    this.revealTimer = setTimeout(() => {
      this.revelandoGanadores = false;
      this.revealTimer = null;
    }, 3200);
  }

  private mostrarUltimoSorteoGanador(): void {
    if (this.verGanadores) return;

    const finalizado = this.sorteos
      .filter((s) => s.estado === 'finalizado' && s.ganadores?.length)
      .sort((a, b) => {
        const fechaA = new Date(a.finalizado_en || a.updated_at || 0).getTime();
        const fechaB = new Date(b.finalizado_en || b.updated_at || 0).getTime();
        return fechaB - fechaA;
      })[0];

    if (!finalizado) return;

    const clave = `pika-winner-seen-${finalizado.id}`;
    if (sessionStorage.getItem(clave) === '1') return;

    sessionStorage.setItem(clave, '1');
    this.iniciarRevelacion(finalizado);
  }

  copiarGanadores(s: any): void {
    const texto = (s.ganadores || [])
      .map((g: any) => `${g.posicion}. @${g.username} — ${g.premio}`)
      .join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(texto).then(
        () => this.toastr.success('Ganadores copiados'),
        () => this.toastr.error('No se pudo copiar')
      );
    }
  }
}
