import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const defaultCategoryFields = [
  "id",
  "name",
  "description",
  "handle",
  "rank",
  "parent_category_id",
  "created_at",
  "updated_at",
  "metadata",
  "*parent_category",
  "*category_children",
];

const collectAllCategories = async (
  req: MedusaRequest,
  filters: Record<string, unknown>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const categories: Record<string, unknown>[] = [];
  const limit = 200;
  let offset = 0;

  while (true) {
    const { data, metadata } = await query.graph(
      {
        entity: "product_category",
        fields: defaultCategoryFields,
        filters,
        pagination: {
          skip: offset,
          take: limit,
        },
      },
      {
        locale: req.locale,
      }
    );

    categories.push(...(data ?? []));

    if (!data?.length || data.length < limit) {
      break;
    }

    offset += limit;
    if (metadata?.count && offset >= metadata.count) {
      break;
    }
  }

  return categories;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const categories = await collectAllCategories(req, {
    is_active: true,
    is_internal: false,
  });

  return res.status(200).json({ categories });
}
