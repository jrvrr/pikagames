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

  // Crear una nueva rifa
  crearRifa(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  //editar una rifa
  editarRifa(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Comprar un boleto
  comprarBoletos(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/comprar`, data);
  }

  // PayPal - Crear orden segura
  crearOrdenPaypal(data: { rifaId: number, numero: number, monto: string | number, usuario_id: string }): Observable<any> {
    return this.http.post('https://apipikagames.vercel.app/paypal/crear-orden', data);
  }

  // PayPal - Capturar pago de forma segura
  capturarPagoPaypal(data: { orderID: string, usuario_id: string, rifa_id: number, numero: number }): Observable<any> {
    return this.http.post('https://apipikagames.vercel.app/paypal/capturar', data);
  }
}
