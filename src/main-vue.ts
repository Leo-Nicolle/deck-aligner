import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Create Vue app
const app = createApp(App)

// Use router
app.use(router)

// Mount app
app.mount('#app')
