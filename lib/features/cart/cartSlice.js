import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

let debounceTimer = null

// uploadCart: kembalikan Promise agar caller bisa menunggu bila perlu
export const uploadCart = createAsyncThunk(
  'cart/uploadCart',
  async ({ getToken }, thunkAPI) => {
    try {
      clearTimeout(debounceTimer)
      return await new Promise((resolve, reject) => {
        debounceTimer = setTimeout(async () => {
          try {
            const { cartItems } = thunkAPI.getState().cart
            const token = await getToken()
            await axios.post('/api/cart', { cart: cartItems }, {
              headers: { Authorization: `Bearer ${token}` }
            })
            resolve({ success: true })
          } catch (err) {
            reject(err)
          }
        }, 1000)
      })
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data ?? { message: error.message })
    }
  }
)

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async ({ getToken }, thunkAPI) => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
      // normalisasi: pastikan selalu mengembalikan object ber-key cart
      return { cart: data?.cart ?? {} }
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data ?? { message: error.message })
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    total: 0,
    cartItems: {},
  },
  reducers: {
    addToCart: (state, action) => {
      const { productId } = action.payload
      if (state.cartItems[productId]) {
        state.cartItems[productId]++
      } else {
        state.cartItems[productId] = 1
      }
      state.total += 1
    },
    removeFromCart: (state, action) => {
      const { productId } = action.payload
      if (state.cartItems[productId]) {
        state.cartItems[productId]--
        if (state.cartItems[productId] === 0) {
          delete state.cartItems[productId]
        }
      }
      state.total -= 1
    },
    deleteItemFromCart: (state, action) => {
      const { productId } = action.payload
      state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
      delete state.cartItems[productId]
    },
    clearCart: (state) => {
      state.cartItems = {}
      state.total = 0
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      // defensive: normalisasi payload
      const cart = action.payload?.cart ?? {}
      state.cartItems = cart
      // Object.values pada object kosong aman
      state.total = Object.values(cart).reduce((acc, item) => acc + item, 0)
    })
    builder.addCase(fetchCart.rejected, (state) => {
      // fallback aman kalau fetch gagal
      state.cartItems = {}
      state.total = 0
    })
  }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions
export default cartSlice.reducer
