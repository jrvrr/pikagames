import { ApplicationConfig } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClientModule } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled', 
        scrollPositionRestoration: 'enabled', 
      })
    ),
    importProvidersFrom(
      BrowserAnimationsModule,
      MatSidenavModule,
      MatToolbarModule,
      MatIconModule,
      MatListModule,
      MatButtonModule,
      HttpClientModule
    ), provideAnimationsAsync()
  ]
};
