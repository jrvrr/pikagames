import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';

// ── EmailJS credentials ──────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_a9t5n1s';  // ✅ ya configurado
const EMAILJS_TEMPLATE_ID = 'template_si7zaql';   // ← pega tu Template ID aquí
const EMAILJS_PUBLIC_KEY  = 'LjoPuY0gqDdFqwlPr';     // ← pega tu Public Key aquí
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
  sendStatus: 'idle' | 'sending' | 'ok' | 'error' = 'idle';

  formData = {
    nombre: '',
    correo: '',
    motivo: '',
    descripcion: ''
  };

  constructor(private dialog: MatDialog, private route: ActivatedRoute) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
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

  async sendEmail(): Promise<void> {
    this.sendStatus = 'sending';
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name:   this.formData.nombre,
        from_email:  this.formData.correo,
        motivo:      this.formData.motivo,
        descripcion: this.formData.descripcion,
      });
      this.sendStatus = 'ok';
      // Resetear formulario después de 3s
      setTimeout(() => {
        this.formData = { nombre: '', correo: '', motivo: '', descripcion: '' };
        this.selectedFileName = '';
        this.sendStatus = 'idle';
        this.showForm = false;
      }, 3000);
    } catch (err) {
      console.error('EmailJS error:', err);
      this.sendStatus = 'error';
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

    scroller.addEventListener('scroll', (event: any) => {
      this.scrollY = event.target.scrollTop || window.scrollY || 0;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
        } else {
          entry.target.classList.remove('aos-animate');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-aos]').forEach(el => {
      observer.observe(el);
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
}
