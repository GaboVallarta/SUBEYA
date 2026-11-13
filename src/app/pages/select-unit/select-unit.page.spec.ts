import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectUnitPage } from './select-unit.page';

describe('SelectUnitPage', () => {
  let component: SelectUnitPage;
  let fixture: ComponentFixture<SelectUnitPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectUnitPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
