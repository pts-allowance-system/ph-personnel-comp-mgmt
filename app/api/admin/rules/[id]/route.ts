import { NextResponse } from "next/server";
import { RulesDAL } from "@/lib/dal/rules";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { withValidation, NextRequestWithExtras, RouteContext } from "@/lib/utils/validation";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";
import { z } from "zod";
import { Rule } from "@/lib/models";

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  conditions: z.record(z.any()).optional(),
});

async function getHandler(request: NextRequestWithAuth, { params }: RouteContext<{ id: string }>) {
  try {
    const rule = await RulesDAL.findById(params.id);
    if (!rule) {
      throw new ApiError(404, "Rule not found");
    }
    return NextResponse.json({ rule });
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchHandler(request: NextRequestWithExtras, { params }: RouteContext<{ id: string }>) {
  try {
    const updates = request.parsedBody as Partial<Rule>;

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No update data provided.");
    }

    const success = await RulesDAL.update(params.id, updates);

    if (!success) {
      throw new ApiError(404, "Rule not found or failed to update.");
    }

    return NextResponse.json({ success: true, message: "Rule updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(['admin'], getHandler);
export const PATCH = withAuthorization(['admin'], withValidation(updateRuleSchema, patchHandler));
