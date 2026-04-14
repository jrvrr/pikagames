import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RifasService {
  private apiUrl = 'https://apipikagames.vercel.app/rifas';

  constructor(private http: HttpClient) {}

  // Obtener todas las rifas
  getRifas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Obtener todos los boletos reservados (Pendientes de confirmar)
  getParticipantesPendientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/participantes/pendientes`);
  }

  // Obtener una rifa por ID
  getRifaPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Crear una nueva rifa
  crearRifa(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  //editar una rifa
  editarRifa(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Elegir ganadores (Terminar rifa)
  elegirGanador(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/elegir-ganadores`, {});
  }

  // Cambiar estado (Suspender/Activar)
  cambiarEstado(id: string, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/estado`, { estado });
  }

  // Eliminar rifa
  eliminarRifa(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Apartar un boleto (Reserva manual para OXXO/Transferencia)
  apartarBoleto(rifaId: string, payload: any): Observable<any> {
    // Sincronizado con backend POST /boletos/:rifa_id/apartar
    return this.http.post(`https://apipikagames.vercel.app/boletos/${rifaId}/apartar`, payload);
  }

  // PayPal - Crear orden segura
  crearOrdenPaypal(data: { rifa_id: string | number, numero: number, monto: string | number, usuario_id: string }): Observable<any> {
    return this.http.post('https://apipikagames.vercel.app/paypal/crear-orden', data);
  }

  // PayPal - Capturar pago de forma segura
  capturarPagoPaypal(data: { orderID: string, usuario_id: string, rifa_id: number, numero: number }): Observable<any> {
    return this.http.post('https://apipikagames.vercel.app/paypal/capturar', data);
  }

  // Confirmar pago manual (Admin)
  confirmarPagoManual(idRifa: string, numero: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idRifa}/participantes/${numero}/confirmar`, {});
  }

  // Eliminar participante/reserva (Admin)
  eliminarParticipante(idRifa: string, numero: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idRifa}/participantes/${numero}`);
  }
}
