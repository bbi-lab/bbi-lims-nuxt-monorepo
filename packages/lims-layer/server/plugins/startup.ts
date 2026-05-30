import { z } from 'zod'

export default defineNitroPlugin(() => {
    // Zod schema for validating required environment variables at startup.
    const envSchema = z.object({
        NUXT_AUTH_JWT_ACCESS_TOKEN_SECRET: z.string().min(32, "NUXT_AUTH_JWT_ACCESS_TOKEN_SECRET must be 32 characters or longer"),
        NUXT_AUTH_JWT_REFRESH_TOKEN_SECRET: z.string().min(32, "NUXT_AUTH_JWT_REFRESH_TOKEN_SECRET must be 32 characters or longer"),
        NUXT_SESSION_PASSWORD: z.string().min(32, "NUXT_SESSION_PASSWORD must be 32 characters or longer"),  // Used by nuxt-auth-utils for encrypting session data
        NUXT_DB_DATABASE_NAME: z.string().min(1, "NUXT_DB_DATABASE_NAME is required"),
        NUXT_DB_USERNAME: z.string().min(1, "NUXT_DB_USERNAME is required"),
        NUXT_DB_PASSWORD: z.string().min(1, "NUXT_DB_PASSWORD is required"),
    })

    // Safe parse throws a clear layout error if parsing fails
    const envResult = envSchema.safeParse(process.env)

    if (!envResult.success) {
        console.error("❌ Invalid environment variables:", JSON.stringify(z.treeifyError(envResult.error), null, 2))
        throw new Error("Invalid project configuration.")
    }
})
