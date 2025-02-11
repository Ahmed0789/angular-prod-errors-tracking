import { Component } from '@angular/core';

@Component({
  selector: 'lib-trackit-fe',
  standalone: true,
  imports: [],
  template: `
    <p>
      trackit-fe is running!
    </p>
  `,
  styles: ``
})
export class TrackitFeComponent {
  get status() {
    return 'Trackit FE Package is imported and currently running if you are able to see this message.'
  }
}