import { Component, OnInit } from '@angular/core';
import { RifasService } from '../service/rifas.service';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

declare var paypal: any;

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

  boletoSeleccionado: number | null = null;
  rifaSeleccionada: any = null;

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
      next: (res: any) => {
        this.rifas = res.rifas || [];
        this.cargando = false;
      },
      error: (err: any) => {
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
      error: (err: any) => {
        console.error('Error creando rifa:', err);
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

    this.boletoSeleccionado = num;
    this.rifaSeleccionada = rifa;

    this.renderizarPayPal(rifa, num);
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

      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: rifa.precio || "50.00"
            },
            description: `Boleto #${boleto} - ${rifa.nombre}`
          }]
        });
      },

      onApprove: async (data: any, actions: any) => {
        const order = await actions.order.capture();

        this.registrarCompra(rifa.id, boleto);
      },

      onError: (err: any) => {
        console.error("Error PayPal:", err);
      }

    }).render(containerId);
  }

  registrarCompra(rifaId: number, boleto: number): void {
    const payload = {
      usuario_id: this.usuario.id,
      rifa_id: rifaId,
      numero: boleto,
      metodo_pago: "PayPal"
    };

    this.rifasService.comprarBoletos(payload).subscribe({
      next: () => {
        alert(`Compra exitosa Boleto #${boleto}`);
        this.obtenerRifas();
      },
      error: (err: any) => {
        console.error("Error registrando compra:", err);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.usuario = null;
  }
}
