import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 只对管理员路由进行验证（除了登录页面）
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = request.cookies.get("admin-session")?.value

    if (session !== "authenticated") {
      // 没有有效session，重定向到登录页
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // session有效，继续请求
    return NextResponse.next()
  }

  // 如果已经登录，访问登录页面时重定向到管理后台
  if (pathname === "/admin/login") {
    const session = request.cookies.get("admin-session")?.value

    if (session === "authenticated") {
      // session有效，重定向到管理后台
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
}
