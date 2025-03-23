import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, isDevMode, inject } from '@angular/core';
import { debounceTime, retry } from 'rxjs/operators';
import { SourceMapConsumer } from 'source-map-js'; // Import source-map-js library
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

export interface ITrackItReport {
  error_message: string;
  http_method: string;
  user_agent: string;
  url: string;
  post: string;
  referer: string;
  stack_trace: string;
}
@Injectable({
  providedIn: 'root',
})

export class TrackitService {

  private buildTrackItURL: string = '/trackit/report';
  private errorLocationExtracted: string = 'Error location not found'; 
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };
  private queue: any[] = [];
  private isProcessing = false;

  public errorReport: any;
  private readonly sB = inject(MatSnackBar);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  async initialise() {
    await this.listenForMessages();
    this.requestNotificationPermission();
  }

  set environmentApiUrl(trackitBackend: string) {
    this.buildTrackItURL = trackitBackend + this.buildTrackItURL;
  }

  public async listenForMessages(): Promise<void> {
    navigator.serviceWorker.addEventListener('message', async event => {
      const {type, message, errorCache} = event.data;
        console.log('Received a message from service worker: ', event.data);
        if (event.data && event.data.type === 'ERROR_REPORT_SENT') {
          await this.handleMappedError(errorCache);
          this.errorReport = await this.createErrorReport(errorCache, errorCache.capturedUrl, 'offline');
          await this.sendErrorReport(this.errorReport, event.data.message);
        }
    });
  }
  /**
   * Tracks and reports errors.
   * @param error - The error to be tracked.
   * @param route - The URL captured when error occurred.
   */
  public async trackError(error: Error, route: string): Promise<void> {
    try {
      if (!navigator.onLine) {
        // Handle offline scenario by queuing the error data for later sending
        const cacheData = {
          type: 'sendError',
          errorData: error.stack,
          capturedURL: route,
          url: this.buildTrackItURL,
        };
        this.postMessageToSW('error-object', cacheData);
        console.log('trackError: Offline error -', error.stack);
      } else {
        this.showSnackBar(
          'An error was encountered and it is being reported...', 'dismiss', 4000, 'snackBarFailed'
        );
        // User is online, send the error to the tracking API
        const sourceMappedErrLoca = await this.handleMappedError(error);
        this.errorReport = await this.createErrorReport(error, route, 'online');
        const msg = 'An error was encountered. A report has been sent to TrackIt for investigation.';
        await this.sendErrorReport(this.errorReport, msg);
        setTimeout(()=>{
          this.location.back()
        }, 6000)
      }
    } catch (err) {
      console.log('trackError: TrackIt error -', err);
      //window.location.href = "mailto:warehouse@fera.co.uk+?subject=Error Report From PHIW FE&body="+this.errorReport ;
    }
  }

  /**
   * Sends a message to the service worker to register background sync.
   * @param tag - The tag identifying the sync event.
   * @param data - The data to be sent to the service worker.
   */
  private postMessageToSW(tag: string, data: any): void {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({
          action: 'registerCache',
          tag,
          data,
        });
      }).catch(error => {
        console.error('postMessageToSW: Service worker registration failed -', error);
      });
    } else {
      console.error('postMessageToSW: Service worker or background sync is not supported.');
    }
  }

  /**
   * Maps the error location using source maps to identify the original location of the error.
   * @param error - The error to be mapped.
   */
  private async handleMappedError(error: any): Promise<void> {
    const stackTrace = error?.stack ? error.stack : error;
    const regexRuntime = /at\s+\S+\s+\[as\s+factory\]\s+\(([^)]+):(\d+):(\d+)\)/g;
    const regexComponentLevel = /at\s+\S+\s+\(([^)]+):(\d+):(\d+)\)/g;
    const isRuntimeError = stackTrace.includes('[as factory]');
    const regex = isRuntimeError ? regexRuntime : regexComponentLevel;
    
    const match = regex.exec(stackTrace);
    
    if (match) {
      const [fullMatch, fileName, line, column] = match;

      const sourceMapUrl = `${fileName}.map`;
      
      console.log(`Stack trace matched file: ${fileName}, line: ${line}, column: ${column}`, match);
  
      try {
        const response = await fetch(sourceMapUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch source map: ${response.statusText}`);
        }
  
        const sourceMapJson = await response.json();
        const sourceMapConsumer = new SourceMapConsumer(sourceMapJson);
  
        const originalPosition = sourceMapConsumer.originalPositionFor({
          line: parseInt(line, 10),
          column: parseInt(column, 10),
        });
  
        if (originalPosition.source) {
          this.errorLocationExtracted = `File: ${originalPosition.source}. Line: ${originalPosition.line}. Column: ${originalPosition.column}`;
        } else {
          console.log('handleMappedError: Could not map the error to the original source code.');
        }
        
      } catch (e) {
        console.error('handleMappedError: Error occurred while fetching or parsing source map file -', e);
      }
    } else {
      this.errorLocationExtracted = 'Error location could not be extracted from the stack trace';
    }
  }

  /**
   * Creates an error report to be sent to the tracking API.
   * @param err - The error to be reported.
   * @param route - The URL captured when error occurred.
   * @param status - The network status ('online' or 'offline').
   * @returns A promise that resolves to an error report.
   */
  private async createErrorReport(err: Error, route: string, status: string): Promise<ITrackItReport> {
    this.showSnackBar(
      'Error report has been generated...', '', 2000, 'snackBarFailed'
    );
    return {
      error_message: `Error received via ${status.toUpperCase()} service - This error occurred at ${this.errorLocationExtracted}. Read stack trace for more details.`,
      http_method: 'POST',
      user_agent: window.navigator.userAgent,
      url: route,
      post: 'ANY',
      referer: document.referrer,
      stack_trace: `TESTING: ${err.stack}`,
    };
  }

    /**
   * Send a report to the tracking API.
   * @param errorReport - The error report.
   * @param message - Message to show user in alert box.
   */
  private async sendErrorReport(errorReport: any, message: string): Promise<void> {
    this.http.post<any>(this.buildTrackItURL, errorReport, this.httpOptions)
    .pipe(retry(1), debounceTime(1000))
    .subscribe({
      next: _res => {
        console.log('trackError: TrackIt response -', _res);
        this.router.navigateByUrl('/dashboard').then(() => {
          this.showSnackBar(
            'Error report has been successfully submitted.', 'dismiss', 3000, 'green-snackbar'
          );
        })
      },
      error: (_err) => {
        this.invokeMailToHelper();
      }
    });
  }

  invokeMailToHelper():void {
    this.notifyReportNotSent();
    alert(
      'An Error was captured by Trackit Service but we were not able to forward the error to support team. We will attempt to create you an email ready to forward. Please can you copy the error report below and email it to warehouse@fera.co.uk. '+this.formatErrorReportForEmail(this.errorReport)
    )
    // Construct the mailto link
    const emailSubject = "Error Report From PHIW FE";
    const emailBody = this.formatErrorReportForEmail(this.errorReport);
    
    window.location.href = `mailto:warehouse@fera.co.uk?subject=${encodeURIComponent(emailSubject)}&body=${emailBody}`;
  }

  // Function to format the this.errorReport object for the mailto link
  formatErrorReportForEmail = (errorReport: { [key: string]: any }) => {
    return Object.entries(errorReport)
      .map(([key, value]) => `${key}: ${value}`)
      .join('%0A'); // %0A is the URL-encoded newline character
  };

  private requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission !== 'granted') {
          console.warn('Notification permission not granted!');
        }
      });
    }
  }

  private showNotification(title: string, options: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  public notifyReportNotSent() {
    // Example notification when the report is not sent
    this.showNotification('Error Captured In '+location.hostname, {
      body: 'The report could not be sent. Please check your connection or send the report manually. '+this.formatErrorReportForEmail(this.errorReport),
      icon: 'assets/icons/icon-72x72.png',
      requireInteraction: true,
    });
  }

  public showSnackBar(msg: string, action: string, duration: number, pClass: string): void {
    if (!this.queue.includes({ msg, action, duration, pClass })) { 
      this.queue.push({ msg, action, duration, pClass })
    }
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private processQueue(): void {

    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
  
    this.isProcessing = true;
    const { msg, action, duration, pClass } = this.queue.shift();

    if (msg) {
      const snackBarRef = this.sB.open(msg, action, {
        duration: duration,
        panelClass: pClass,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      snackBarRef.afterDismissed().subscribe(() => {
        this.processQueue();
      });
      snackBarRef.onAction().subscribe(() => {
        this.processQueue();
      });
    }

  }
  
}
(async () => {
  const trackitService = new TrackitService;
  await trackitService.initialise();
})