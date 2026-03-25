import axios from 'axios'

let accessToken = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken

const api = axios.create({ baseURL: '/api/v1', withCredentials: true })

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        setAccessToken(data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        setAccessToken(null)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
