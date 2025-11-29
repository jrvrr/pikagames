import { Component, OnInit } from '@angular/core';
import { RifasService } from '../service/rifas.service';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
  selector: 'app-compra',
  templateUrl: './compra.component.html',
  styleUrls: ['./compra.component.css'],
  imports: [CommonModule, AuthModalComponent]
})
export class CompraComponent implements OnInit {
  rifas: any[] = [];
  mostrarModal = false;
  usuario: any = null;
  cargando = false;

  constructor(
    private rifasService: RifasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    this.obtenerRifas();
  }

  obtenerRifas(): void {
    this.cargando = true;
    this.rifasService.getRifas().subscribe({
      next: (res) => {
        this.rifas = res.rifas || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar rifas:', err);
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
      cantidad_boletos: 10,
      cantidad_ganadores: 1,
      modo_finalizacion: 'manual',
      fecha_fin: '2025-12-31',
      admin_id: this.usuario?.id,
      premios: [{ titulo: 'Premio Único', cantidad: 1 }]
    };

    this.rifasService.crearRifa(nuevaRifa).subscribe({
      next: () => {
        alert('Rifa creada correctamente ✅');
        this.obtenerRifas();
      },
      error: (err) => {
        console.error('Error creando rifa:', err);
        alert('Error al crear rifa');
      }
    });
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
    alert("Los administradores no pueden comprar boletos");
    return;
  }

  if (rifa.boletos_ocupados?.includes(num)) {
    alert("Ese boleto ya está ocupado ❌");
    return;
  }

  if (confirm(`¿Deseas comprar el boleto #${num} de "${rifa.nombre}"?`)) {
    this.comprarBoleto(rifa, num);
  }
}


  comprarBoleto(rifa: any, num: number): void {
    if (!this.authService.isLoggedIn()) {
      alert('Debes iniciar sesión para comprar boletos');
      this.abrirAuth();
      return;
    }

    if (this.authService.isAdmin()) {
      alert('Los administradores no pueden comprar boletos');
      return;
    }

    alert(`Comprando boleto #${num} para la rifa: ${rifa.nombre}`);
  }

  logout(): void {
    this.authService.logout();
    this.usuario = null;
  }
}
