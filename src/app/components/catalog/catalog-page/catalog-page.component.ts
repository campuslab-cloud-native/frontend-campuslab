import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../../../core/services/catalog.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AppRole } from '../../../core/models/role.model';
import { CatalogResource, ResourceType } from '../../../core/models/resource.model';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css'
})
export class CatalogPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly auth = inject(AuthService);

  readonly resourceTypes = Object.values(ResourceType);

  resources = signal<CatalogResource[]>([]);
  editingId = signal<number | null>(null);

  get canManage(): boolean {
    return this.auth.hasAnyRole(AppRole.Admin);
  }

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: [ResourceType.Lab, Validators.required],
    availableQuantity: [1, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.catalogService.getResources().subscribe((resources) => this.resources.set(resources));
  }

  edit(resource: CatalogResource): void {
    this.editingId.set(resource.id);
    this.form.setValue({ name: resource.name, type: resource.type, availableQuantity: resource.availableQuantity });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', type: ResourceType.Lab, availableQuantity: 1 });
  }

  save(): void {
    if (this.form.invalid) return;
    const id = this.editingId();
    const request = this.form.getRawValue();
    const result$ = id ? this.catalogService.updateResource(id, request) : this.catalogService.createResource(request);
    result$.subscribe(() => {
      this.cancelEdit();
      this.load();
    });
  }
}