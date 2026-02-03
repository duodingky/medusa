import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Use 'export default' instead of 'module.exports'
export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!, // Ensure your .env has no trailing slash
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    // Required for cross-port login (7000 to 9000)
    cookieOptions: {
      secure: false, 
      sameSite: "lax",
    }
  },
 // Plugins MUST be in this array in v2
  plugins: [
    {
      resolve: "@medusajs/dashboard",
      options: {
        // Leave empty for default, or specify custom path
      },
    },
  ],
  modules: [
    { resolve: "./modules/restaurant" },
    { resolve: "./modules/delivery" },
    { resolve: "./modules/vendor" },
    { resolve: "./modules/vendor-group" },
    { resolve: "./modules/service-fee" }
  ]
})