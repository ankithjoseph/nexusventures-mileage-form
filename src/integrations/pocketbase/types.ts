// PocketBase types
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

export interface Record extends BaseRecord {
  [key: string]: any;
}