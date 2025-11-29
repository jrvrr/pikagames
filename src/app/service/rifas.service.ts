import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RifasService {
  private apiUrl = 'https://proyectopikagames.onrender.com/rifas';

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
}
