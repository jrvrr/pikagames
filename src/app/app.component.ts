import { Component, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { LoadingScreenComponent } from './loading-screen/loading-screen.component';

import { AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    CommonModule,
    LoadingScreenComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  title(title: any) {
    throw new Error('Method not implemented.');
  }

  showLoading = true;

  onLoadingDone(): void {
    this.showLoading = false;
    // Forzar scroll al inicio con varios intentos para asegurar que se aplique tras renderizado
    const resetScroll = () => {
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = 0;
        this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    resetScroll();
    setTimeout(resetScroll, 100);
    setTimeout(resetScroll, 500);
  }

  constructor(private el: ElementRef, private router: Router) {}

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.2 });

    const sections = this.el.nativeElement.querySelectorAll('.fade-in-section');
    sections.forEach((section: HTMLElement) => observer.observe(section));
  }

  isMobile = false;

  ngOnInit() {
    this.onResize();
    
    // Escuchar cambios de navegación para resetear el scroll del contenedor lateral
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const resetScroll = () => {
        if (this.scrollContainer && this.scrollContainer.nativeElement) {
          this.scrollContainer.nativeElement.scrollTop = 0;
          this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'instant' });
        }
      };
      resetScroll();
      setTimeout(resetScroll, 20);
      setTimeout(resetScroll, 200);
    });
  }

  @HostListener('window:resize', [])
  onResize() {
    this.isMobile = window.innerWidth <= 817; 
  }
}
