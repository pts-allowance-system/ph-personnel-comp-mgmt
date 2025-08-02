import { NextResponse } from "next/server";
import { RulesDAL } from "@/lib/dal/rules";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { withValidation, NextRequestWithExtras } from "@/lib/utils/validation";
import { handleApiError } from "@/lib/utils/error-handler";
import { z } from "zod";
import { Rule } from "@/lib/models";

const createRuleSchema = z.object({
  name: z.string().min(1, { message: "Rule name is required." }),
  conditions: z.record(z.any()), // Allow any valid JSON for conditions
});

async function getHandler(request: NextRequestWithAuth) {
  try {
    const rules = await RulesDAL.findAll();
    return NextResponse.json({ rules });
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(request: NextRequestWithExtras) {
  try {
    const newRule = await RulesDAL.create(request.parsedBody as Omit<Rule, 'id' | 'isActive'>);

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(['admin'], getHandler);
export const POST = withAuthorization(['admin'], withValidation(createRuleSchema, postHandler));
