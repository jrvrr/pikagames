import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://apipikagames.vercel.app/usuarios';

  constructor(private http: HttpClient) {}

  login(correo: string, contraseña: string): Observable<any> {
    const body = { correo, password: contraseña };
    return this.http.post(`${this.apiUrl}/login`, body).pipe(
      tap({
        next: (response: any) => {
          if (response.success) {
            localStorage.setItem('usuario', JSON.stringify(response.usuario));
          }
        },
      })
    );
  }
  register(nombre: string, correo: string, contraseña: string): Observable<any> {
    const body = { nombre, correo, password: contraseña };
    return this.http.post(`${this.apiUrl}/register`, body);
  }

  logout(): void {
    localStorage.removeItem('usuario');
  }

  getUsuarioActual(): any {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  isAdmin(): boolean {
    const user = this.getUsuarioActual();
    return !!(user && user.es_admin);
  }

  isLoggedIn(): boolean {
    return !!this.getUsuarioActual();
  }

  getUsuarios(adminId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/listar?adminId=${adminId}`);
  }

  getUsuarioById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  eliminarUsuario(id: string, adminId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}?adminId=${adminId}`);
  }

  actualizarUsuario(id: string, adminId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { ...data, adminId });
  }
}
