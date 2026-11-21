import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SorteosExpressService {
  private apiUrl = 'https://apipikagames.vercel.app/sorteos-express';

  constructor(private http: HttpClient) {}

  /* ---------------- Sorteos ---------------- */

  listar(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  publicos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/publicos`);
  }

  obtener(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  crear(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  editar(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /* ---------------- Previews (paso 1) ---------------- */

  preview(urls: string[], limite?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/preview`, { urls, limite });
  }

  consultarPreview(fuenteId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/preview/${fuenteId}`);
  }

  actualizarPreview(fuenteId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/preview/${fuenteId}`, data);
  }

  obtenerLikesPreview(fuenteId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/preview/${fuenteId}/likes`, {});
  }

  /* ---------------- Publicaciones del sorteo ---------------- */

  agregarFuente(id: string, url: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/fuentes`, { url });
  }

  eliminarFuente(id: string, fuenteId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/fuentes/${fuenteId}`);
  }

  actualizarFuente(id: string, fuenteId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/fuentes/${fuenteId}`, data);
  }

  extraerFuente(id: string, fuenteId: string, limite?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/fuentes/${fuenteId}/extraer`, { limite });
  }

  consultarFuente(id: string, fuenteId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/fuentes/${fuenteId}/estado`);
  }

  obtenerLikes(id: string, fuenteId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/fuentes/${fuenteId}/likes`, {});
  }

  /* ---------------- Ganadores ---------------- */

  obtenerGanadores(id: string, data: any = {}): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/ganadores`, data);
  }

  reiniciarGanadores(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/ganadores`);
  }

  /* ---------------- Participación pública ---------------- */

  participar(id: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/participar`, data);
  }
}
