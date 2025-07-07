import { type NextRequest, NextResponse } from "next/server"
import { RatesDAL } from "@/lib/dal/rates"
import { verifyToken } from "@/lib/auth-utils"
import cache from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const distinct = searchParams.get("distinct")

    if (distinct === "true") {
      const cacheKey = "rates:distinct"
      const cachedRates = cache.get<any[]>(cacheKey)
      if (cachedRates) {
        return NextResponse.json(cachedRates)
      }

      const rates = await RatesDAL.findActiveGroupsAndTiers()
      cache.set(cacheKey, rates)
      return NextResponse.json(rates)
    } else {
      const cacheKey = "rates:all"
      const cachedRates = cache.get<{ rates: any[] }>(cacheKey)
      if (cachedRates) {
        return NextResponse.json(cachedRates)
      }

      const rates = await RatesDAL.findAll()
      const response = { rates }
      cache.set(cacheKey, response)
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error("Get rates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateData = await request.json()
    const newRate = await RatesDAL.create(rateData)

    // Invalidate cache
    cache.del(["rates:all", "rates:distinct"])

    return NextResponse.json({ rate: newRate }, { status: 201 })
  } catch (error) {
    console.error("Create rate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
