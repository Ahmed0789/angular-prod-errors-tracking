import { Injectable, ErrorHandler } from '@angular/core';
import { TrackitService } from '../trackit/trackit.service';
import { NavigationStart, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class CustomErrorHandlerService implements ErrorHandler {
  attemptedRoute: string = '';

  constructor(private trackItService: TrackitService, private router: Router) {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        this.attemptedRoute = event.url; // Capture the intended route
      }
    });
  }
  
  async handleError(error: any): Promise<void> {
    // Check if it's an application failure or JavaScript runtime error or 500 || 422
    if ( error instanceof HttpErrorResponse && this.checkStatusCodes(error) || error instanceof Error ) { 
      // Send error to tracking service
      this.trackItService.trackError(error, this.attemptedRoute); 
    } else {
      // Handle other types of errors (e.g., HTTP errors)
      console.error('An error occurred: most likely to do with http request', error);
    }
  }

  // check which error needs to be passed down to trackit
  checkStatusCodes(_err: any): boolean {
    let value: boolean = false;
    if (_err.status) {
      switch(_err.status) {
        case 500 : value = true; break;
        case 422 : value = true; break;
        default : value; break;
      }
    }
    return value
  }

}