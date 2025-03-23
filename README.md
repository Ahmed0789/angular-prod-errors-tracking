# Angular Production Errors Tracking (NOT PUBLISHED YET, IT IS NOT CONSUMBLE VIA NPM)

## Catch errors in Angular production environment and track their exact location details and it generates a report for you to send to ES server or a custom indexing logs api.


To consume 'angular-prod-errors-tracking into Angular Applications, 
**
the app needs /dist to have all map.js & .js files, your application Production build configuration should have:
`"sourceMap":{
      "hidden": true,
      "scripts": true,
      "styles": true
    },
`
** 

please make sure that `@angular/cli version >= 18.0.0`, next set of steps:

1) In terminal install using **Npm** `npm i angular-prod-errors-tracking` or **Yarn** `yarn add angular-prod-errors-tracking` (make sure your using correct `node >= 20`), you should check your package-lock.json (`ctrl + f`, search angular-prod-errors-tracking):
```
"node_modules/angular-prod-errors-tracking"
```
2) Usage, see below:

### Usage with Angular Application (Angular CLI Version >= 18)

#### Import services and add them to providers array in app.module.ts or main.ts. Make sure to provide the ErrorHandler with our CustomErrorHandlerService from trackit package

```
// Importing the services from trackIt
import { TrackitService, CustomErrorHandlerService, UpdateWorkerService } from 'angular-prod-errors-tracking';

@NgModule({
  providers: [
    TrackitService, CustomErrorHandlerService,
    { provide: ErrorHandler, useClass: CustomErrorHandlerService }
  ]
})
```

#### Set Tracking backend api url using a baseUrl without '/api' prefix.
```
import { TrackitService } from 'angular-prod-errors-tracking';

constructor(private trackitSer: TrackitService) {
  this.trackitSer.environmentApiUrl = environment.baseURL;
}
```

---

## Usage with Angular PWA Apps (that provides service worker support)

Follow the steps at the top to install **Trackit FE** package.

#### Import services and add them to providers array in app.module.ts or main.ts. Make sure to provide the ErrorHandler with our CustomErrorHandlerService from trackit package

```
// Importing the services from trackIt
import { TrackitService, CustomErrorHandlerService, UpdateWorkerService } from 'angular-prod-errors-tracking';

@NgModule({
  providers: [
    UpdateWorkerService, TrackitService, CustomErrorHandlerService,
    { provide: ErrorHandler, useClass: CustomErrorHandlerService }
  ]
})
```

#### Set Trackit backend api url using a baseUrl without '/api' prefix. Optional - register a service worker using TrackitService & UpdateWorkerService
```
import { TrackitService, UpdateWorkerService } from 'angular-prod-errors-tracking';

constructor(private trackitSer: TrackitService, private readonly sww: UpdateWorkerService) {
  this.trackitSer.environmentApiUrl = environment.baseURL;
  UpdateWorkerService.registerServiceWorker(); // Register service worker when app starts
  this.sww.checkForUpdate(); // Check for updates if needed
}
```

---

# TrackitFe Package Info

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.10.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
