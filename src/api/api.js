const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8181';
const REQUEST_STARTED = 'leo-api-request-start';
const REQUEST_FINISHED = 'leo-api-request-finish';
let nextRequestId = 0;

const dispatchRequestEvent = (name, detail) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
};

const getHeaders = ()=> { 
  const token = localStorage.getItem('leo_token');
  return { 
    'Content-Type': 'application/json', 
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    window.dispatchEvent(new Event('leo-auth-expired'));
  }
  try {
    const data = await res.json();
    return data;
  } catch {
    if (res.ok) {
      return { success: true, message: 'Operation successful' };
    }
    return { success: false, message: `Server error: ${res.status} ${res.statusText}` };
  }
};

const request = async (path, options, label) => {
  const id = ++nextRequestId;
  dispatchRequestEvent(REQUEST_STARTED, { id, label });
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    return await handleResponse(response);
  } finally {
    dispatchRequestEvent(REQUEST_FINISHED, { id });
  }
};

export const api = {
  get: (path) =>
    request(path, { headers: getHeaders() }, 'Loading data'),

  post: (path, body, label = 'Saving') =>
    request(path, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Idempotency-Key': globalThis.crypto?.randomUUID?.()
          || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    }, label),

  put: (path, body) =>
    request(path, {
      method: 'PUT',
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    }, 'Saving'),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    }, 'Saving'),

  delete: (path) =>
    request(path, {
      method: 'DELETE',
      headers: getHeaders(),
    }, 'Saving'),
};