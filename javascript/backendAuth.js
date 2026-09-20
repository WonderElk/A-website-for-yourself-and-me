const API_BASE_URL = "http://localhost:8080";
const ACCESS_TOKEN_KEY = "backend_access_token";

export async function signIn(email, password) {
  const response = await fetch(`${API_BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || "Login failed");
  }

  const tokenData = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);
  return getCurrentUser();
}

export function signOut() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function getCurrentUser() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    signOut();
    return null;
  }

  if (!response.ok) {
    throw new Error("Could not load the signed-in user");
  }

  return response.json();
}

export async function authenticatedFetch(path, options = {}) {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

export async function uploadImage(file, folder) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const response = await authenticatedFetch("/uploads", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Image upload failed");
  }
  return (await response.json()).path;
}

export async function deleteImage(path) {
  const formData = new FormData();
  formData.append("path", path);
  await authenticatedFetch("/uploads", {
    method: "DELETE",
    body: formData,
  });
}

export function assetUrl(path) {
  return path?.startsWith("/") ? `${API_BASE_URL}${path}` : path;
}
