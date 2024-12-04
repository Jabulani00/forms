import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PapersconfPage } from './papersconf.page';

describe('PapersconfPage', () => {
  let component: PapersconfPage;
  let fixture: ComponentFixture<PapersconfPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PapersconfPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
