import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RifasService } from '../service/rifas.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  rifas: any[] = [];

  nuevaRifa: {
    nombre: string;
    descripcion: string;
    cantidad_boletos: number;
    cantidad_ganadores: number;
    modo_finalizacion: string;
    fecha_fin: string | null;     
    premios: { titulo: string; cantidad: number }[];
  } = {
    nombre: '',
    descripcion: '',
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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    if (!this.usuario?.es_admin) {
      alert('Solo los administradores pueden acceder aquí.');
      window.location.href = '/';
    }
    this.obtenerRifas();
  }

  obtenerRifas(): void {
    this.cargando = true;
    this.rifasService.getRifas().subscribe({
      next: (res) => {
        this.rifas = res.rifas || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
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
      alert('Solo los administradores pueden crear rifas.');
      return;
    }

    // VALIDACIONES
    if (!this.nuevaRifa.nombre.trim()) return alert("El nombre es obligatorio.");
    if (!this.nuevaRifa.descripcion.trim()) return alert("La descripción es obligatoria.");
    if (this.nuevaRifa.cantidad_boletos <= 0) return alert("Cantidad de boletos inválida.");
    if (this.nuevaRifa.cantidad_ganadores <= 0) return alert("Cantidad de ganadores inválida.");

    for (let p of this.nuevaRifa.premios) {
      if (!p.titulo.trim()) return alert("Todos los premios deben tener título.");
      if (p.cantidad <= 0) return alert("Cantidad de premio inválida.");
    }

    let fechaFinEnviada: string | null = null;

    if (this.nuevaRifa.modo_finalizacion === "fecha") {
      if (!this.nuevaRifa.fecha_fin?.trim()) {
        alert("Debes seleccionar una fecha de finalización.");
        return;
      }

      fechaFinEnviada = `${this.nuevaRifa.fecha_fin}T23:59:59`;
    }

    if (this.nuevaRifa.modo_finalizacion === "manual") {
      fechaFinEnviada = null;
    }

    const nuevaRifaData = {
      ...this.nuevaRifa,
      fecha_fin: fechaFinEnviada,   
      premios: this.nuevaRifa.premios.map(p => ({
        titulo: p.titulo.trim(),
        cantidad: Number(p.cantidad)
      })),
      admin_id: this.usuario.id
    };

    this.rifasService.crearRifa(nuevaRifaData).subscribe({
      next: () => {
        alert('🎉 Rifa creada correctamente');
        this.obtenerRifas();

        // RESET
        this.nuevaRifa = {
          nombre: '',
          descripcion: '',
          cantidad_boletos: 0,
          cantidad_ganadores: 1,
          modo_finalizacion: 'manual',
          fecha_fin: null,
          premios: [{ titulo: '', cantidad: 1 }]
        };
      },
      error: () => alert('Error al crear la rifa')
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }

editar(rifa: any): void {
  this.editando = {
    ...rifa,
    premios: rifa.premios && Array.isArray(rifa.premios) && rifa.premios.length > 0
      ? rifa.premios.map((p: any) => ({
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
  if (!this.editando.nombre.trim()) return alert("El nombre es obligatorio.");
  if (!this.editando.descripcion.trim()) return alert("La descripción es obligatoria.");
  if (this.editando.cantidad_boletos <= 0) return alert("Boletos inválidos.");

  for (let p of this.editando.premios) {
    if (!p.titulo.trim()) return alert("Todos los premios deben tener título.");
    if (p.cantidad <= 0) return alert("Cantidad inválida.");
  }

  const dataActualizada = {
    ...this.editando,
    fecha_fin:
      this.editando.modo_finalizacion === 'fecha'
        ? `${this.editando.fecha_fin}T23:59:59`
        : null
  };

  this.rifasService.editarRifa(this.editando.id, dataActualizada).subscribe({
    next: () => {
      alert("Rifa actualizada correctamente");
      this.obtenerRifas();
      this.editando = null;
    },
    error: (err) => {
      console.error(err);
      alert("Error al actualizar la rifa");
    }
  });
}
}
