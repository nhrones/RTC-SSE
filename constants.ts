////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
//                  Constants -- Reusable values                \\ 
///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

// constants from environment variables
export const DEBUG = (Deno.env.get("DEBUG") === "true") || false
export const Region = Deno.env.get("DENO_REGION") || 'localhost'
 
export const myIP = '192.168.0.171'
export const host = "localhost" 
export const port = 8000
