export enum ResourceType {
  Lab = 'LAB',
  Equipment = 'EQUIPMENT',
  Supply = 'SUPPLY'
}

export interface CatalogResource {
  id: number;
  name: string;
  type: ResourceType;
  availableQuantity: number;
}

export interface CatalogResourceRequest {
  name: string;
  type: ResourceType;
  availableQuantity: number;
}