import axios from 'axios'

let accessToken = null
let currentHotelId = null

export const setAccessToken = (token, hotelId) => {
  accessToken = token
  currentHotelId = hotelId ?? null
}
export const getAccessToken = () => accessToken

const api = axios.create({ baseURL: '/api/v1', withCredentials: true })

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  if (currentHotelId != null) config.headers['X-Hotel-Id'] = String(currentHotelId)
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
        // Decode new token to get hotel_id
        try {
          const base64 = data.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
          const claims = JSON.parse(atob(base64))
          setAccessToken(data.access_token, claims.hotel_id)
        } catch {
          setAccessToken(data.access_token, null)
        }
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        setAccessToken(null, null)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
