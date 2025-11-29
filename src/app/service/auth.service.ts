import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://proyectopikagames.onrender.com/usuarios';

  constructor(private http: HttpClient) {}

  login(correo: string, contraseña: string): Observable<any> {
    const body = { correo, contraseña };
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
    const body = { nombre, correo, contraseña };
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
    return user && user.rol === 'admin';
  }

  isLoggedIn(): boolean {
    return !!this.getUsuarioActual();
  }
}
