import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1/public',
  headers: { 'Content-Type': 'application/json' },
})

export default api
