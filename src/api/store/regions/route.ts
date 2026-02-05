import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";

const parseFields = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (typeof entry !== "string") {
        return [];
      }

      return entry
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);
    });
  }

  return [];
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const requestedFields = parseFields(req.query?.fields);
  const includePaymentProviders = requestedFields.includes("payment_providers");
  const regionFields = req.queryConfig.fields.filter(
    (field) => field !== "payment_providers"
  );

  if (!regionFields.includes("id")) {
    regionFields.push("id");
  }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "region",
    variables: {
      filters: req.filterableFields,
      ...req.queryConfig.pagination,
    },
    fields: regionFields,
  });

  const { rows: regions, metadata } = await remoteQuery(queryObject);

  if (includePaymentProviders && regions.length) {
    const regionIds = regions.map((region) => region.id);
    const regionPaymentProviderQuery = remoteQueryObjectFromString({
      entryPoint: "region_payment_provider",
      variables: {
        filters: {
          region_id: regionIds,
        },
      },
      fields: ["region_id", "payment_provider.id"],
    });

    const regionPaymentProviderResult = await remoteQuery(
      regionPaymentProviderQuery
    );
    const relations = Array.isArray(regionPaymentProviderResult)
      ? regionPaymentProviderResult
      : regionPaymentProviderResult.rows ?? [];
    const providersByRegion = new Map<string, string[]>();

    for (const relation of relations) {
      const regionId = relation.region_id ?? relation.region?.id;
      const providerId =
        relation.payment_provider?.id ??
        relation.payment_provider_id ??
        relation.provider_id;

      if (!regionId || !providerId) {
        continue;
      }

      const providers = providersByRegion.get(regionId) ?? [];
      providers.push(providerId);
      providersByRegion.set(regionId, providers);
    }

    for (const region of regions) {
      region.payment_providers = providersByRegion.get(region.id) ?? [];
    }
  }

  res.json({
    regions,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  });
}
