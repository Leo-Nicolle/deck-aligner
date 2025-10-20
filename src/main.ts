/**
 * Main Entry Point - Vue 3 Application
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Optional: Pinia for state management
// import { createPinia } from 'pinia'

const app = createApp(App)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Error Info:', info)

  // You could send this to an error tracking service
  // Example: Sentry.captureException(err)
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
  event.preventDefault()
})

app.use(router)
// app.use(createPinia())

app.mount('#app')
