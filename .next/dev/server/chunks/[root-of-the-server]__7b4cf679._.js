module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/supabase/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateSession",
    ()=>updateSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
;
;
async function updateSession(request) {
    const supabaseResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request
    });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // Skip during build time
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "placeholder") {
        return supabaseResponse;
    }
    // Look for all possible Supabase auth cookie patterns
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    // Supabase stores session in chunks for large tokens
    const authCookies = request.cookies.getAll().filter((cookie)=>cookie.name.startsWith(`sb-${projectRef}-auth-token`) || cookie.name === "sb-access-token" || cookie.name.startsWith("sb-") && cookie.name.includes("auth"));
    // Reconstruct the auth token from chunks if needed
    let authToken = null;
    // Check for single token first
    const singleToken = request.cookies.get(`sb-${projectRef}-auth-token`)?.value;
    if (singleToken) {
        try {
            const parsed = JSON.parse(singleToken);
            authToken = parsed.access_token;
        } catch  {
            authToken = singleToken;
        }
    }
    // If no single token, check for chunked tokens
    if (!authToken && authCookies.length > 0) {
        // Sort chunks by name to ensure correct order
        const sortedCookies = authCookies.sort((a, b)=>a.name.localeCompare(b.name));
        const combinedValue = sortedCookies.map((c)=>c.value).join("");
        try {
            const parsed = JSON.parse(combinedValue);
            authToken = parsed.access_token;
        } catch  {
            // If parsing fails, it might be the raw token
            if (sortedCookies.length === 1) {
                authToken = sortedCookies[0].value;
            }
        }
    }
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: authToken ? {
                Authorization: `Bearer ${authToken}`
            } : {}
        }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
        // Check for demo mode cookie
        const isDemoMode = request.cookies.get("codetales_demo_mode")?.value === "true";
        if (!isDemoMode) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            url.searchParams.set("redirect", request.nextUrl.pathname);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
    }
    // Redirect logged-in users from auth pages to dashboard
    if (request.nextUrl.pathname.startsWith("/auth/") && !request.nextUrl.pathname.includes("/callback") && user) {
        const url = request.nextUrl.clone();
        const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard";
        url.pathname = redirectTo;
        url.search = "";
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    return supabaseResponse;
}
}),
"[project]/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$proxy$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/proxy.ts [middleware] (ecmascript)");
;
async function proxy(request) {
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$proxy$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["updateSession"])(request);
}
const __TURBOPACK__default__export__ = proxy;
const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7b4cf679._.js.map