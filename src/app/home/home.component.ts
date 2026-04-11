import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// ── Google Apps Script Configuration ────────────────────────────────
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzCm1Q617L-Hki6yZSIorhgEJ7WLJ_v_78pcfJlLnAJVlID3yqHW4AGIZZ-WBG7RhuUSg/exec';
// ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, CommonModule, RouterLink,
    MatFormFieldModule, MatInputModule, FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {

  scrollY = 0;
  selectedFileName: string = '';
  showForm = false;
  showMotivos = false;
  sendStatus: 'idle' | 'sending' | 'ok' | 'error' = 'idle';

  formData = {
    nombre: '',
    correo: '',
    motivo: '',
    descripcion: ''
  };

  @ViewChild('marioSection') marioSection!: ElementRef;
  
  private marioOffsetTop = 0;
  private marioHeight = 0;
  private isMarioVisible = false;

  constructor(
    private dialog: MatDialog, 
    private route: ActivatedRoute,
    private http: HttpClient,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFileName = input.files[0].name;
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.sendStatus = 'idle';
  }

  selectMotivo(motivo: string) {
    this.formData.motivo = motivo;
    this.showMotivos = false;
  }

  async sendEmail(): Promise<void> {
    this.sendStatus = 'sending';
    try {
      const payload = {
        nombre:      this.formData.nombre,
        correo:      this.formData.correo,
        motivo:      this.formData.motivo,
        descripcion: this.formData.descripcion,
      };

      // Enviamos a Google Apps Script
      await firstValueFrom(this.http.post(GAS_URL, JSON.stringify(payload)));
      
      this.sendStatus = 'ok';
      // Resetear formulario después de 3s
      setTimeout(() => {
        this.formData = { nombre: '', correo: '', motivo: '', descripcion: '' };
        this.selectedFileName = '';
        this.sendStatus = 'idle';
        this.showForm = false;
      }, 3000);
    } catch (untypedErr: any) {
      const err = untypedErr as any;
      console.error('Error enviando formulario:', err);
      // GAS a veces retorna error de CORS aunque el envío sea exitoso debido a redirecciones
      // Si el status es 0 o detectamos que es un tema de opacidad de respuesta (no-cors),
      // pero el mensaje llegó, podríamos manejarlo. Sin embargo, con ContentService suele ir bien.
      
      // Intentamos manejarlo como éxito si llega aquí pero el servidor respondió (CORS quirk)
      if (err.status === 200 || err.status === 0) {
        this.sendStatus = 'ok';
        setTimeout(() => {
          this.formData = { nombre: '', correo: '', motivo: '', descripcion: '' };
          this.selectedFileName = '';
          this.sendStatus = 'idle';
          this.showForm = false;
        }, 3000);
      } else {
        this.sendStatus = 'error';
      }
    }
  }

  images = [
    { src: '1.jpg' },
    { src: '2.jpg' },
    { src: '3.jpg' },
  ];

  currentIndex = 0;

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  ngAfterViewInit() {
    const scroller = document.querySelector('mat-sidenav-content') || document.querySelector('.mat-drawer-content') || window;
    const root = document.documentElement;

    // Cache initial layout values
    this.updateMarioCache();

    this.ngZone.runOutsideAngular(() => {
      // Resize listener to update cache
      window.addEventListener('resize', () => {
        this.updateMarioCache();
      });

      scroller.addEventListener('scroll', (event: any) => {
        const top = event.target.scrollTop || window.scrollY || 0;
        
        requestAnimationFrame(() => {
          // 1. Update Global Scroll Variable
          root.style.setProperty('--scroll-y', `${top}`);
          this.scrollY = top; // Keep internal state for logic if needed

          // 2. Update Controller Path if Mario section is visible
          if (this.isMarioVisible) {
            this.calculateControllerPath(top, root);
          }
        });
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === this.marioSection.nativeElement) {
          this.isMarioVisible = entry.isIntersecting;
        }

        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
        } else {
          entry.target.classList.remove('aos-animate');
        }
      });
    }, { threshold: 0.1 });

    if (this.marioSection) {
      observer.observe(this.marioSection.nativeElement);
    }

    document.querySelectorAll('[data-aos]').forEach(el => {
      if (el !== this.marioSection?.nativeElement) {
        observer.observe(el);
      }
    });

    setTimeout(() => {
      document.querySelectorAll('[data-aos]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200) {
          el.classList.add('aos-animate');
        }
      });
    }, 500);
  }

  private updateMarioCache() {
    if (!this.marioSection || !this.marioSection.nativeElement) return;
    const rect = this.marioSection.nativeElement.getBoundingClientRect();
    const scrollPos = window.scrollY || document.documentElement.scrollTop;
    this.marioOffsetTop = rect.top + scrollPos;
    this.marioHeight = rect.height;
  }

  calculateControllerPath(top: number, root: HTMLElement) {
    if (!this.marioHeight) return;
    
    const windowHeight = window.innerHeight;
    const marioTopRelative = this.marioOffsetTop - top;
    
    const totalDistance = windowHeight + this.marioHeight;
    const currentDistance = windowHeight - marioTopRelative;
    
    // Calculate progress between 0 and 1
    let progress = currentDistance / totalDistance;
    progress = Math.max(0, Math.min(1, progress));
    
    let p = progress * 4;
    let pTop = 80;
    let pLeft = 100;

    if (p <= 1) {
      pTop = 80 - (p * 80);
      pLeft = 100;
    } else if (p <= 2) {
      pTop = 0;
      pLeft = 100 - ((p - 1) * 100);
    } else if (p <= 3) {
      pTop = (p - 2) * 100;
      pLeft = 0;
    } else {
      pLeft = Math.min((p - 3) * 100, 100);
      pTop = 100 - ((p - 3) * 20); 
    }

    root.style.setProperty('--path-top', `${pTop}%`);
    root.style.setProperty('--path-left', `${pLeft}%`);
  }
}
