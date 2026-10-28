import axios from 'axios';

// Como estás probando en el navegador web (localhost), apuntamos directo al puerto 8080 de Spring Boot:
const API_BASE_URL = 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});