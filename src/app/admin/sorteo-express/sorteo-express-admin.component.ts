import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { SorteosExpressService } from '../../service/sorteos-express.service';

@Component({
  selector: 'app-sorteo-express-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sorteo-express-admin.component.html',
  styleUrl: './sorteo-express-admin.component.css'
})
export class SorteoExpressAdminComponent implements OnInit, OnDestroy {
  vista: 'lista' | 'wizard' = 'lista';
  cargando = false;
  sorteos: any[] = [];
  busqueda = '';
  filtro: 'todos' | 'activos' | 'programados' | 'finalizados' = 'todos';

  paso: 1 | 2 | 3 = 1;
  editandoId: string | null = null;
  sorteoActual: any = null;

  // Configuración del sorteo
  titulo = '';
  descripcion = '';
  cantidadGanadores = 1;
  premioTitulo = 'Premio principal';
  programar = false;
  programadoPara = '';
  criterio: 'comentarios' | 'likes' = 'comentarios';
  modo: 'union' | 'ganadora' = 'union';

  // Publicaciones
  urls: string[] = [''];
  limite = 500;
  analizando = false;
  fuentes: any[] = [];
  private pollHandle: any = null;
  private pollIntentos = 0;

  // Importación manual
  manualFuenteId: string | null = null;
  manualTexto = '';
  manualLikes: number | null = null;
  manualGuardando = false;

  // Ganadores
  guardando = false;
  sorteando = false;
  forzar = false;
  ganadores: any[] = [];
  seed = '';

  constructor(
    private service: SorteosExpressService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarSorteos();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  /* ======================= LISTA ======================= */

  cargarSorteos(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (res: any) => {
        this.sorteos = res.sorteos || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.toastr.error('No se pudieron cargar los sorteos express');
      }
    });
  }

  get sorteosFiltrados(): any[] {
    let lista = [...this.sorteos];
    if (this.filtro === 'activos') lista = lista.filter((s) => s.estado === 'activo');
    if (this.filtro === 'programados') lista = lista.filter((s) => s.estado === 'programado');
    if (this.filtro === 'finalizados') lista = lista.filter((s) => s.estado === 'finalizado');

    const term = this.busqueda.trim().toLowerCase();
    if (term) {
      lista = lista.filter(
        (s) =>
          (s.titulo || '').toLowerCase().includes(term) ||
          (s.descripcion || '').toLowerCase().includes(term)
      );
    }
    return lista;
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'programado':
        return 'Programado';
      case 'activo':
        return 'Activo';
      case 'cerrado':
        return 'Cerrado';
      case 'finalizado':
        return 'Finalizado';
      default:
        return 'Borrador';
    }
  }

  portadaSorteo(s: any): string | null {
    const conImagen = (s.fuentes || []).find((f: any) => f.imagen_url);
    return conImagen?.imagen_url || null;
  }

  nombresGanadores(s: any): string {
    return (s.ganadores || [])
      .slice(0, 4)
      .map((g: any) => `@${g.username}`)
      .join(' · ');
  }

  nuevoSorteo(): void {
    this.detenerPolling();
    this.editandoId = null;
    this.sorteoActual = null;
    this.paso = 1;
    this.titulo = '';
    this.descripcion = '';
    this.cantidadGanadores = 1;
    this.premioTitulo = 'Premio principal';
    this.programar = false;
    this.programadoPara = '';
    this.criterio = 'comentarios';
    this.modo = 'union';
    this.urls = [''];
    this.fuentes = [];
    this.ganadores = [];
    this.seed = '';
    this.forzar = false;
    this.manualFuenteId = null;
    this.vista = 'wizard';
  }

  abrirSorteo(s: any): void {
    this.cargando = true;
    this.service.obtener(s.id).subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (!res?.sorteo) return;
        this.cargarEnFormulario(res.sorteo);
        this.vista = 'wizard';
        this.paso = res.sorteo.estado === 'finalizado' ? 3 : 2;
        if (this.fuentes.some((f) => f.estado_extraccion === 'procesando')) {
          this.iniciarPolling();
        }
      },
      error: () => {
        this.cargando = false;
        this.toastr.error('No se pudo abrir el sorteo express');
      }
    });
  }

  private cargarEnFormulario(sorteo: any): void {
    this.editandoId = sorteo.id;
    this.sorteoActual = sorteo;
    this.titulo = sorteo.titulo || '';
    this.descripcion = sorteo.descripcion || '';
    this.cantidadGanadores = sorteo.cantidad_ganadores || 1;
    this.premioTitulo = sorteo.premios?.[0]?.titulo || 'Premio principal';
    this.criterio = sorteo.criterio_comparacion === 'likes' ? 'likes' : 'comentarios';
    this.modo = sorteo.modo_participacion === 'ganadora' ? 'ganadora' : 'union';
    this.programar = Boolean(sorteo.programado_para);
    this.programadoPara = sorteo.programado_para ? this.aInputLocal(sorteo.programado_para) : '';
    this.fuentes = sorteo.fuentes || [];
    this.ganadores = sorteo.ganadores || [];
    this.seed = sorteo.seed || '';
    this.urls = [''];
    this.forzar = false;
  }

  eliminarSorteo(s: any): void {
    Swal.fire({
      title: '¿Eliminar sorteo express?',
      text: `Se borrarán "${s.titulo}" y sus publicaciones analizadas. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#EF4444',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.service.eliminar(s.id).subscribe({
        next: () => {
          this.toastr.success('Sorteo express eliminado');
          this.cargarSorteos();
        },
        error: () => this.toastr.error('No se pudo eliminar el sorteo')
      });
    });
  }

  volverLista(): void {
    this.detenerPolling();
    this.vista = 'lista';
    this.cargarSorteos();
  }

  /* ======================= PASO 1 ======================= */

  agregarUrl(): void {
    if (this.urls.length >= 5) {
      this.toastr.warning('Puedes analizar hasta 5 publicaciones por sorteo');
      return;
    }
    this.urls.push('');
  }

  quitarUrl(index: number): void {
    this.urls.splice(index, 1);
    if (!this.urls.length) this.urls = [''];
  }

  private urlYaCargada(url: string): boolean {
    const limpia = url.trim().replace(/\/+$/, '');
    return this.fuentes.some((f: any) => (f.url || '').replace(/\/+$/, '') === limpia);
  }

  async analizarUrls(): Promise<void> {
    const validas = this.urls.map((u) => u.trim()).filter(Boolean);
    if (!validas.length) {
      this.toastr.warning('Pega la URL de la publicación de Instagram o Facebook');
      return;
    }

    this.analizando = true;

    try {
      if (this.editandoId) {
        const nuevas = validas.filter((u) => !this.urlYaCargada(u));
        if (!nuevas.length) {
          this.toastr.info('Esas publicaciones ya están en el sorteo');
          return;
        }
        for (const url of nuevas) {
          const res: any = await firstValueFrom(this.service.agregarFuente(this.editandoId, url));
          if (res?.fuente) this.reemplazarFuente(res.fuente, true);
        }
        this.urls = [''];
      } else {
        const res: any = await firstValueFrom(this.service.preview(validas, Number(this.limite) || 500));
        this.fuentes = res.fuentes || [];
      }

      if (this.fuentes.some((f) => f.estado_extraccion === 'procesando')) {
        this.iniciarPolling();
      } else if (this.fuentes.every((f) => f.estado_extraccion === 'error')) {
        this.toastr.warning('No se pudo extraer automáticamente. Puedes importar los comentarios a mano.');
      }
    } catch (error: any) {
      this.toastr.error(error?.error?.error || 'No se pudieron analizar las URLs');
    } finally {
      this.analizando = false;
    }
  }

  private iniciarPolling(): void {
    this.detenerPolling();
    this.pollIntentos = 0;
    this.pollHandle = setInterval(() => this.refrescarExtracciones(), 3000);
  }

  private detenerPolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  private refrescarExtracciones(): void {
    const pendientes = this.fuentes.filter((f) => f.estado_extraccion === 'procesando');
    if (!pendientes.length) {
      this.detenerPolling();
      this.actualizarSorteoActual();
      return;
    }

    this.pollIntentos += 1;
    if (this.pollIntentos > 120) {
      this.detenerPolling();
      this.toastr.warning('La extracción está tardando demasiado. Puedes recargar o importar los comentarios a mano.');
      return;
    }

    pendientes.forEach((fuente) => {
      const peticion = this.editandoId
        ? this.service.consultarFuente(this.editandoId, fuente.id)
        : this.service.consultarPreview(fuente.id);

      peticion.subscribe({
        next: (res: any) => {
          if (res?.fuente) this.reemplazarFuente(res.fuente);
          if (!this.fuentes.some((f) => f.estado_extraccion === 'procesando')) {
            this.detenerPolling();
            this.actualizarSorteoActual();
          }
        },
        error: () => {}
      });
    });
  }

  private reemplazarFuente(fuente: any, agregarSiNoExiste = false): void {
    const index = this.fuentes.findIndex((f) => f.id === fuente.id);
    if (index >= 0) {
      this.fuentes[index] = { ...this.fuentes[index], ...fuente };
    } else if (agregarSiNoExiste) {
      this.fuentes.push(fuente);
    }
  }

  private actualizarSorteoActual(): void {
    if (!this.editandoId) return;
    this.service.obtener(this.editandoId).subscribe({
      next: (res: any) => {
        if (!res?.sorteo) return;
        this.sorteoActual = res.sorteo;
        this.fuentes = res.sorteo.fuentes || this.fuentes;
        this.ganadores = res.sorteo.ganadores || this.ganadores;
      }
    });
  }

  score(fuente: any): number {
    return this.criterio === 'likes'
      ? Number(fuente?.likes_count || 0)
      : Number(fuente?.comentarios_count || 0);
  }

  get fuenteGanadora(): any {
    if (!this.fuentes.length) return null;
    return [...this.fuentes].sort((a, b) => this.score(b) - this.score(a))[0] || null;
  }

  barra(fuente: any): number {
    const max = Math.max(...this.fuentes.map((f) => this.score(f)), 1);
    return Math.max(4, Math.round((this.score(fuente) / max) * 100));
  }

  get participantesTotales(): number {
    return this.fuentes.reduce((acc, f) => acc + Number(f.participantes_count || 0), 0);
  }

  get totalComentarios(): number {
    return this.fuentes.reduce((acc, f) => acc + Number(f.comentarios_count || 0), 0);
  }

  textoEstadoFuente(f: any): string {
    if (f.estado_extraccion === 'procesando') return 'Extrayendo…';
    if (f.estado_extraccion === 'listo') return 'Listo';
    if (f.estado_extraccion === 'error') return 'Revisar';
    return 'Pendiente';
  }

  async actualizarLikes(fuente: any): Promise<void> {
    try {
      const res: any = this.editandoId
        ? await firstValueFrom(this.service.obtenerLikes(this.editandoId, fuente.id))
        : await firstValueFrom(this.service.obtenerLikesPreview(fuente.id));
      if (res?.fuente) this.reemplazarFuente(res.fuente);
      this.toastr.success('Likes actualizados');
    } catch (error: any) {
      this.toastr.error(error?.error?.error || 'No se pudieron obtener los likes');
    }
  }

  async reintentarFuente(fuente: any): Promise<void> {
    try {
      let actualizada: any = null;

      if (this.editandoId) {
        const res: any = await firstValueFrom(
          this.service.extraerFuente(this.editandoId, fuente.id, Number(this.limite) || 500)
        );
        actualizada = res?.fuente;
      } else {
        const res: any = await firstValueFrom(
          this.service.preview([fuente.url], Number(this.limite) || 500)
        );
        actualizada = res?.fuentes?.[0];
        if (actualizada) {
          this.fuentes = this.fuentes.filter(
            (f) => f.id !== fuente.id && f.id !== actualizada.id && f.url !== actualizada.url
          );
        }
      }

      if (actualizada) this.reemplazarFuente(actualizada, true);
      if (this.fuentes.some((f) => f.estado_extraccion === 'procesando')) {
        this.iniciarPolling();
      }
    } catch (error: any) {
      this.toastr.error(error?.error?.error || 'No se pudo reintentar la extracción');
    }
  }

  abrirManual(fuente: any): void {
    if (this.manualFuenteId === fuente.id) {
      this.manualFuenteId = null;
      return;
    }
    this.manualFuenteId = fuente.id;
    this.manualLikes = fuente.likes_count;
    this.manualTexto = (fuente.participantes || [])
      .map((p: any) => p.username)
      .join('\n');
  }

  async guardarManual(fuente: any): Promise<void> {
    this.manualGuardando = true;
    const payload = {
      likes_count: this.manualLikes,
      comentarios_manuales: this.manualTexto
    };

    try {
      const res: any = this.editandoId
        ? await firstValueFrom(this.service.actualizarFuente(this.editandoId, fuente.id, payload))
        : await firstValueFrom(this.service.actualizarPreview(fuente.id, payload));
      if (res?.fuente) this.reemplazarFuente(res.fuente);
      this.manualFuenteId = null;
      this.toastr.success('Comentarios guardados');
    } catch (error: any) {
      this.toastr.error(error?.error?.error || 'No se pudieron guardar los comentarios');
    } finally {
      this.manualGuardando = false;
    }
  }

  quitarFuente(fuente: any): void {
    if (!this.editandoId || !fuente.id) {
      this.fuentes = this.fuentes.filter((f) => f.id !== fuente.id);
      return;
    }

    Swal.fire({
      title: '¿Quitar publicación?',
      text: 'Se eliminarán del sorteo los comentarios extraídos de esta publicación.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.service.eliminarFuente(this.editandoId as string, fuente.id).subscribe({
        next: () => {
          this.fuentes = this.fuentes.filter((f) => f.id !== fuente.id);
          this.toastr.success('Publicación quitada');
        },
        error: () => this.toastr.error('No se pudo quitar la publicación')
      });
    });
  }

  irPaso2(): void {
    if (!this.fuentes.length) {
      this.toastr.warning('Analiza al menos una publicación antes de continuar');
      return;
    }

    const sinDatos = this.fuentes.every(
      (f) => Number(f.participantes_count || 0) === 0
    );

    if (sinDatos) {
      Swal.fire({
        title: 'Sin comentarios todavía',
        text: 'No hay comentarios importados. Puedes continuar y agregarlos después con la importación manual.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Revisar'
      }).then((result) => {
        if (result.isConfirmed) this.paso = 2;
      });
      return;
    }

    this.paso = 2;
  }

  /* ======================= PASO 2 ======================= */

  async guardarConfiguracion(): Promise<void> {
    if (!this.titulo.trim()) {
      this.toastr.warning('Escribe un título para el sorteo');
      return;
    }
    if (!this.cantidadGanadores || this.cantidadGanadores < 1) {
      this.toastr.warning('El número de ganadores debe ser mayor a 0');
      return;
    }
    if (this.programar && !this.programadoPara) {
      this.toastr.warning('Elige la fecha y hora de programación');
      return;
    }

    this.guardando = true;
    const premio = this.premioTitulo.trim() || 'Premio principal';

    const payload: any = {
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      cantidad_ganadores: Number(this.cantidadGanadores),
      premio_titulo: premio,
      premios: [{ titulo: premio, cantidad: Number(this.cantidadGanadores) }],
      criterio_comparacion: this.criterio,
      modo_participacion: this.modo,
      programado_para: this.programar && this.programadoPara
        ? new Date(this.programadoPara).toISOString()
        : null
    };

    try {
      let res: any;

      if (this.editandoId) {
        res = await firstValueFrom(this.service.editar(this.editandoId, payload));
      } else {
        payload.fuente_ids = this.fuentes.map((f) => f.id).filter(Boolean);
        res = await firstValueFrom(this.service.crear(payload));
      }

      if (res?.sorteo) {
        this.cargarEnFormulario(res.sorteo);
        this.sorteoActual = res.sorteo;
      }

      this.toastr.success(this.editandoId ? 'Sorteo actualizado' : 'Sorteo express creado');
      this.paso = 3;
      this.cargarSorteos();
    } catch (error: any) {
      this.toastr.error(error?.error?.error || 'No se pudo guardar el sorteo');
    } finally {
      this.guardando = false;
    }
  }

  get fechaProgramadaFutura(): boolean {
    if (!this.sorteoActual?.programado_para) return false;
    return new Date(this.sorteoActual.programado_para).getTime() > Date.now();
  }

  /* ======================= PASO 3 ======================= */

  obtenerGanadores(): void {
    if (!this.editandoId) {
      this.toastr.warning('Primero guarda la configuración del sorteo');
      this.paso = 2;
      return;
    }

    if (this.fechaProgramadaFutura && !this.forzar) {
      this.toastr.warning('El sorteo aún no llega a su fecha programada. Marca "Forzar" si quieres sortear ahora.');
      return;
    }

    Swal.fire({
      title: '¿Obtener ganadores?',
      html: `Se elegirán <b>${this.cantidadGanadores}</b> ganador(es) entre <b>${this.participantesTotales}</b> participantes.<br><br>
             Modo: <b>${this.modo === 'union' ? 'Unir todas las publicaciones' : 'Solo la publicación ganadora'}</b><br>
             Comparando por: <b>${this.criterio === 'likes' ? 'likes' : 'comentarios'}</b>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, sortear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.sorteando = true;
      this.service.obtenerGanadores(this.editandoId as string, { forzar: this.forzar }).subscribe({
        next: (res: any) => {
          this.sorteando = false;
          this.ganadores = res.ganadores || [];
          this.seed = res.seed || '';
          if (res.sorteo) this.sorteoActual = res.sorteo;
          this.cargarSorteos();
          this.toastr.success('¡Ganadores elegidos!');
        },
        error: (error: any) => {
          this.sorteando = false;
          Swal.fire('No se pudo sortear', error?.error?.error || 'Intenta de nuevo', 'error');
        }
      });
    });
  }

  reiniciarSorteo(): void {
    if (!this.editandoId) return;

    Swal.fire({
      title: '¿Reiniciar sorteo?',
      text: 'Se borrarán los ganadores actuales y podrás volver a sortear.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.service.reiniciarGanadores(this.editandoId as string).subscribe({
        next: (res: any) => {
          this.ganadores = [];
          this.seed = '';
          if (res?.sorteo) {
            this.sorteoActual = res.sorteo;
            this.fuentes = res.sorteo.fuentes || this.fuentes;
          }
          this.toastr.success('Sorteo reiniciado');
          this.cargarSorteos();
        },
        error: () => this.toastr.error('No se pudo reiniciar el sorteo')
      });
    });
  }

  copiarGanadores(): void {
    const texto = this.ganadores
      .map((g) => `${g.posicion}. @${g.username} — ${g.premio}`)
      .join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(texto).then(
        () => this.toastr.success('Lista de ganadores copiada'),
        () => this.toastr.error('No se pudo copiar')
      );
    } else {
      this.toastr.info(texto);
    }
  }

  get resumenParticipantes(): string {
    if (this.modo === 'ganadora' && this.fuenteGanadora) {
      return `Solo participantes de la publicación ganadora (${this.score(this.fuenteGanadora)} ${
        this.criterio === 'likes' ? 'likes' : 'comentarios'
      })`;
    }
    return `${this.fuentes.length} publicación(es) combinadas, sin usuarios duplicados`;
  }

  private aInputLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
