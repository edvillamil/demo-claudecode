import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 })
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}
