import { TestBed } from '@angular/core/testing';

import { TrackitService } from './trackit.service';

describe('TrackitService', () => {
  let service: TrackitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
