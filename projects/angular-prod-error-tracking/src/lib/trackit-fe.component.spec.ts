import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackitFeComponent } from './trackit-fe.component';

describe('TrackitFeComponent', () => {
  let component: TrackitFeComponent;
  let fixture: ComponentFixture<TrackitFeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackitFeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackitFeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
