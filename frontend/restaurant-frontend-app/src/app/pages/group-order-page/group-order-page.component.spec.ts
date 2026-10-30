import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOrderPageComponent } from './group-order-page.component';

describe('GroupOrderPageComponent', () => {
  let component: GroupOrderPageComponent;
  let fixture: ComponentFixture<GroupOrderPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupOrderPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupOrderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
