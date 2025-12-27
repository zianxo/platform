import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  return handleRequest(request, proxy, "GET");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  return handleRequest(request, proxy, "POST");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  return handleRequest(request, proxy, "PUT");
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  console.log("DEBUG: Proxy DELETE called for path:", proxy.join("/"));
  return handleRequest(request, proxy, "DELETE");
}

async function handleRequest(request: Request, proxyPath: string[], method: string) {
  const path = proxyPath.join("/");
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const targetUrl = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const body = method !== "GET" && method !== "DELETE" ? await request.json() : undefined;

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Proxy error (${method} ${path}):`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
