import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildPage } from './build.page';

describe('BuildPage', () => {
  let component: BuildPage;
  let fixture: ComponentFixture<BuildPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
