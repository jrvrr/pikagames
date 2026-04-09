import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Pixel {
  x: number;
  delay: number;
  duration: number;
  color: string;
}

@Component({
  selector: 'app-error404',
  imports: [CommonModule],
  templateUrl: './error404.component.html',
  styleUrl: './error404.component.css'
})
export class Error404Component implements OnInit {

  /** Código de error personalizable desde fuera */
  @Input() errorCode: string = 'ERROR_PAGE_NOT_FOUND_404';

  pixels: Pixel[] = [];

  private readonly PIXEL_COLORS = [
    'var(--nin-red, #E4000F)',
    'var(--nin-blue, #0049D4)',
    '#000',
    'var(--nin-yellow, #FFE033)',
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.generarPixeles();
  }

  /** Genera 30 píxeles con posición y animación aleatoria */
  generarPixeles(): void {
    this.pixels = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 5,
      color: this.PIXEL_COLORS[Math.floor(Math.random() * this.PIXEL_COLORS.length)]
    }));
  }

  irAHome(): void {
    this.router.navigate(['/home']);
  }

  recargar(): void {
    window.location.reload();
  }
}
