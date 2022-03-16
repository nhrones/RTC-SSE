////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
//                        Main Module                           \\ 
///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

import { serve } from "https://deno.land/std@0.129.0/http/server.ts";
import { host, port } from './constants.ts'
import { contentType } from './path.ts'
import { GET } from './get.ts'
import { POST } from './post.ts'

/** 
 * handle all http requests
 */
async function handleRequest(request: Request): Promise<Response> {

    let { pathname } = new URL(request.url);

    if (pathname.includes('/listen')) {
        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                 Server Sent Events Request                   \\ 
        ///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        const id = pathname.substring(pathname.lastIndexOf('/') + 1)
        return GET(request, id)
    }
    else if (request.method === 'POST') {
        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                  Client Posting a Message                    \\ 
        ///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        return POST(request)
    }
    else {
        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                        File Request                          \\ 
        ///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        if (pathname.endsWith("/")) { pathname += "index.html" }
        try { // we expect all file requests to be from /public/
            const body = await Deno.readFile("./public" + pathname)
            const headers = new Headers()
            headers.set("content-type", contentType(pathname))
            return new Response(body, { status: 200, headers });
        } catch (e) {
            console.error(e.message)
            return await Promise.resolve(new Response(
                "Internal server error: " + e.message, { status: 500 }
            ))
        }
    }
}

serve(handleRequest, { hostname: host, port: port });
console.log(`Serving http://${host}:${port}`);
