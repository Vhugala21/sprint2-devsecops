import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface HelloResponse {
  message: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class HelloService {
  private readonly http = inject(HttpClient);

  getHello(): Observable<HelloResponse> {
    return this.http.get<HelloResponse>('/api/hello');
  }
}
