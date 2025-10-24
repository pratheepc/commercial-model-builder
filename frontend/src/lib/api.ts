const API_BASE_URL = 'http://localhost:3000/api';

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Models API
export const modelsApi = {
  getAll: () => apiRequest<any[]>('/models'),
  getById: (id: string) => apiRequest<any>(`/models/${id}`),
  create: (data: any) => apiRequest<any>('/models', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<void>(`/models/${id}`, {
    method: 'DELETE',
  }),
  duplicate: (id: string) => apiRequest<any>(`/models/${id}/duplicate`, {
    method: 'POST',
  }),
};

// Module Catalogue API
export const moduleCatalogueApi = {
  getAll: () => apiRequest<any[]>('/modules/catalogue'),
  create: (data: any) => apiRequest<any>('/modules/catalogue', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/modules/catalogue/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<void>(`/modules/catalogue/${id}`, {
    method: 'DELETE',
  }),
};

// Model Modules API
export const modelModulesApi = {
  addToModel: (modelId: string, data: any) => apiRequest<any>(`/modules/model/${modelId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateInModel: (modelId: string, moduleId: string, data: any) => 
    apiRequest<any>(`/modules/model/${modelId}/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFromModel: (modelId: string, moduleId: string) => 
    apiRequest<void>(`/modules/model/${modelId}/${moduleId}`, {
      method: 'DELETE',
    }),
};

// Unit Types API
export const unitTypesApi = {
  getByModel: (modelId: string) => apiRequest<any[]>(`/unit-types/model/${modelId}`),
  create: (data: any) => apiRequest<any>('/unit-types', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/unit-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<void>(`/unit-types/${id}`, {
    method: 'DELETE',
  }),
};

// Projections API
export const projectionsApi = {
  getAll: () => apiRequest<any[]>('/projections'),
  getById: (id: string) => apiRequest<any>(`/projections/${id}`),
  getByModel: (modelId: string) => apiRequest<any[]>(`/projections/model/${modelId}`),
  create: (data: any) => apiRequest<any>('/projections', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/projections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<void>(`/projections/${id}`, {
    method: 'DELETE',
  }),
};

// Products API
export const productsApi = {
  getAll: () => apiRequest<any[]>('/products'),
  getById: (id: string) => apiRequest<any>(`/products/${id}`),
  create: (data: any) => apiRequest<any>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest<any>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest<void>(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// Health check
export const healthApi = {
  check: () => apiRequest<{status: string, timestamp: string, service: string}>('/health'),
};
