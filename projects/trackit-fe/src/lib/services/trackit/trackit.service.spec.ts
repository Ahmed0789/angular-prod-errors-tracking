import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TrackitService } from './trackit.service';

describe('TrackitService', () => {
  let service: TrackitService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), // Use provideHttpClient instead of HttpClientModule
        TrackitService
      ]
    });
    service = TestBed.inject(TrackitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
