import { NextResponse } from "next/server";
import { RatesDAL } from "@/lib/dal/rates";
import cache from "@/lib/utils/cache";
import { withValidation, NextRequestWithExtras } from "@/lib/utils/validation";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { createRateSchema } from "@/lib/schemas";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";

async function getHandler(request: NextRequestWithAuth) {
  try {
    const { searchParams } = new URL(request.url);
    const distinct = searchParams.get("distinct");

    if (distinct === "true") {
      const cacheKey = "rates:distinct";
      const cachedRates = cache.get<any[]>(cacheKey);
      if (cachedRates) {
        return NextResponse.json(cachedRates);
      }

      const rates = await RatesDAL.findActiveGroupsAndTiers();
      cache.set(cacheKey, rates);
      return NextResponse.json(rates);
    } else {
      const cacheKey = "rates:all";
      const cachedRates = cache.get<any[]>(cacheKey);
      if (cachedRates) {
        return NextResponse.json(cachedRates);
      }

      const rates = await RatesDAL.findAll();
      cache.set(cacheKey, rates);
      return NextResponse.json(rates);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(request: NextRequestWithExtras) {
  try {
    const rateData = request.parsedBody;
    const newRate = await RatesDAL.create(rateData);

    cache.del(["rates:all", "rates:distinct"]);

    return NextResponse.json({ rate: newRate }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, "A rate with the same group, tier, and effective date already exists.");
    }
    return handleApiError(error);
  }
}

export const GET = withAuthorization([], getHandler);
export const POST = withAuthorization(['admin'], withValidation(createRateSchema, postHandler));
