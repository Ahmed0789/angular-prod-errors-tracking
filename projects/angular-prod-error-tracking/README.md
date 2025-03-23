# Trackit FE

### Usage with Angular Application (Angular CLI Version >= 18)

To consume 'trackit-fe into Angular FE Applications, please make sure that `@angular/cli version >= 18.0.0`, next set of steps:

- Install using **Npm** `npm install trackit-fe` or **Yarn** `yarn add trackit-fe` (make sure your using correct `node >= 20`), you should check your package-lock.json (`ctrl + f`, search trackit-fe):
```
"node_modules/trackit-fe"
```

#### Import services and add them to providers array in app.module.ts or main.ts. Make sure to provide the ErrorHandler with our CustomErrorHandlerService from trackit package
```
// Importing the services from trackIt
import { TrackitService, CustomErrorHandlerService, UpdateWorkerService } from 'trackit-fe';

@NgModule({
  providers: [
    UpdateWorkerService, TrackitService, CustomErrorHandlerService,
    { provide: ErrorHandler, useClass: CustomErrorHandlerService }
  ]
})
```

#### Set TrackIt Endpoint using TrackitService
```
import { TrackitService } from 'trackit-fe';

constructor(private trackitService: TrackitService) {
  this.trackitService.trackItEndPoint('/trackit/report');
}
```

---

## Usage with Angular PWA Apps (that provide service worker also)

To consume 'trackit-fe into Angular FE Applications, please make sure that `@angular/cli version >= 18.0.0`, next set of steps:

- Install using **Npm** `npm install trackit-fe` or **Yarn** `yarn add trackit-fe` (make sure your using correct `node >= 20`), you should check your package-lock.json (`ctrl + f`, search trackit-fe):
```
"node_modules/trackit-fe"
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