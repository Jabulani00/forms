import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecieptPage } from './reciept.page';

describe('RecieptPage', () => {
  let component: RecieptPage;
  let fixture: ComponentFixture<RecieptPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecieptPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
