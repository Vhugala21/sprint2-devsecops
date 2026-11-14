import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HelloResponse, HelloService } from './hello.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'sprint-frontend';
  backendState: 'loading' | 'success' | 'error' = 'loading';
  helloResponse: HelloResponse | null = null;
  backendError = '';

  private readonly helloService = inject(HelloService);

  ngOnInit(): void {
    this.loadBackendStatus();
  }

  loadBackendStatus(): void {
    this.backendState = 'loading';
    this.backendError = '';

    this.helloService.getHello().subscribe({
      next: (response) => {
        this.helloResponse = response;
        this.backendState = 'success';
      },
      error: (error: unknown) => {
        this.backendState = 'error';
        this.backendError =
          error instanceof HttpErrorResponse && error.status !== 0
            ? `The backend returned HTTP ${error.status}.`
            : 'Could not connect to the backend. Please try again.';
        console.error('Failed to load the backend greeting.', error);
      }
    });
  }
}
