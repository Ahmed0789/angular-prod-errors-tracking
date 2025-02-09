import { inject, Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateWorkerService {
  isNewVersionAvailable: boolean = false;
  intervalSubscription!: Subscription;
  intervalSource = interval(15 * 60 * 1000); // every 15 mins
  private readonly swUpdate = inject(SwUpdate);
  private readonly zone = inject(NgZone);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Register service worker to provide support for trackit error caching
   * @memberof UpdateWorkerService
   */
  registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/assets/js/worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  /**
   * Check for SW updates and apply them accordingly
   * @return {*}  {void}
   * @memberof UpdateWorkerService
   */
  checkForUpdate(): void {
    console.log('Checking for update...');
    this.intervalSubscription?.unsubscribe();
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.intervalSubscription = this.intervalSource.subscribe(async () => {
        try {
          this.isNewVersionAvailable = await this.swUpdate.checkForUpdate();
          console.log(
            this.isNewVersionAvailable
              ? 'A new version is available.'
              : 'Already on the latest version.'
          );
          const snack = this.snackBar.open('Update Available', 'Reload', {
            panelClass: 'snackBar',
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          snack.onAction().subscribe(() => {
            this.applyUpdate();
          });
        } catch (error) {
          console.error('Failed to check for updates:', error);
        }
      });
    });
  }

  applyUpdate(): void {
    // Reload the page to update to the latest version after the new version is activated
    this.swUpdate
      .activateUpdate()
      .then(() => document.location.reload())
      .catch((error) => console.error('Failed to apply updates:', error));
  }
}