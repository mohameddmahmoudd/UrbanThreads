/* eslint-disable no-console */
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const starterCatalog = require('./starter-catalog.json');

const prisma = new PrismaClient();

function getEnv(name, options = {}) {
  const value = process.env[name];
  if (value && value.trim() !== '') return value.trim();
  if (options.defaultValue !== undefined) return options.defaultValue;
  throw new Error(`Missing required environment variable: ${name}`);
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${fieldName}: expected a non-empty string.`);
  }
  return value.trim();
}

function normalizeOptionalString(value, fieldName) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${fieldName}: expected a string.`);
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function validateCategoryCycles(categoriesByName) {
  const state = new Map();

  const dfs = (name, path) => {
    const visitState = state.get(name);
    if (visitState === 'done') return;
    if (visitState === 'visiting') {
      const cycle = [...path, name].join(' -> ');
      throw new Error(`Category parent cycle detected: ${cycle}`);
    }

    state.set(name, 'visiting');
    const category = categoriesByName.get(name);
    if (category.parent) {
      dfs(category.parent, [...path, name]);
    }
    state.set(name, 'done');
  };

  for (const name of categoriesByName.keys()) {
    dfs(name, []);
  }
}

function validateAndNormalizeCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') {
    throw new Error('Invalid starter catalog: expected an object.');
  }
  if (!Array.isArray(catalog.categories)) {
    throw new Error('Invalid starter catalog: `categories` must be an array.');
  }
  if (!Array.isArray(catalog.products)) {
    throw new Error('Invalid starter catalog: `products` must be an array.');
  }

  const categories = catalog.categories.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid categories[${index}]: expected an object.`);
    }
    const name = normalizeNonEmptyString(item.name, `categories[${index}].name`);
    const parent = normalizeOptionalString(item.parent, `categories[${index}].parent`);
    return { name, parent };
  });

  const categoryKeySet = new Set();
  const categoriesByName = new Map();
  for (const category of categories) {
    const key = `${category.name}::${category.parent ?? '__root__'}`;
    if (categoryKeySet.has(key)) {
      throw new Error(
        `Duplicate category seed entry for name="${category.name}" and parent="${category.parent ?? ''}".`,
      );
    }
    categoryKeySet.add(key);

    if (categoriesByName.has(category.name)) {
      throw new Error(
        `Category name "${category.name}" appears multiple times. Category names must be unique in starter-catalog.json.`,
      );
    }
    categoriesByName.set(category.name, category);
  }

  for (const category of categories) {
    if (!category.parent) continue;
    if (category.parent === category.name) {
      throw new Error(`Category "${category.name}" cannot be its own parent.`);
    }
    if (!categoriesByName.has(category.parent)) {
      throw new Error(
        `Category "${category.name}" references unknown parent "${category.parent}".`,
      );
    }
  }

  validateCategoryCycles(categoriesByName);

  const products = catalog.products.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid products[${index}]: expected an object.`);
    }

    const name = normalizeNonEmptyString(item.name, `products[${index}].name`);
    const category = normalizeNonEmptyString(item.category, `products[${index}].category`);
    const imageUrl = normalizeNonEmptyString(item.imageUrl, `products[${index}].imageUrl`);
    const description = normalizeOptionalString(item.description, `products[${index}].description`);

    if (typeof item.basePrice !== 'number' || !Number.isFinite(item.basePrice) || item.basePrice < 0) {
      throw new Error(
        `Invalid products[${index}].basePrice: expected a finite number >= 0.`,
      );
    }

    if (!categoriesByName.has(category)) {
      throw new Error(
        `Product "${name}" references unknown category "${category}".`,
      );
    }

    return {
      name,
      description,
      basePrice: item.basePrice,
      category,
      imageUrl,
    };
  });

  const productKeySet = new Set();
  for (const product of products) {
    const key = `${product.name}::${product.category}`;
    if (productKeySet.has(key)) {
      throw new Error(
        `Duplicate product seed entry for name="${product.name}" and category="${product.category}".`,
      );
    }
    productKeySet.add(key);
  }

  return { categories, products };
}

async function upsertBootstrapAdmin(tx, admin) {
  const passwordHash = await bcrypt.hash(admin.password, 12);
  const existing = await tx.user.findUnique({
    where: { email: admin.email },
    select: { id: true },
  });

  if (existing) {
    await tx.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: 'ADMIN',
      },
    });
    return 'updated';
  }

  await tx.user.create({
    data: {
      email: admin.email,
      passwordHash,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: 'ADMIN',
    },
  });
  return 'created';
}

async function seedCategories(tx, categories) {
  const categoriesByName = new Map(categories.map((item) => [item.name, item]));
  const resolvedCategoryIds = new Map();
  let createdCount = 0;
  let reusedCount = 0;

  const ensureCategory = async (name) => {
    if (resolvedCategoryIds.has(name)) {
      return resolvedCategoryIds.get(name);
    }

    const category = categoriesByName.get(name);
    if (!category) {
      throw new Error(`Category "${name}" is missing from normalized seed data.`);
    }

    const parentId = category.parent ? await ensureCategory(category.parent) : null;
    const matches = await tx.category.findMany({
      where: { name: category.name, parentId },
      select: { id: true },
    });

    if (matches.length > 1) {
      throw new Error(
        `Ambiguous existing categories for name="${category.name}" and parentId="${parentId ?? 'null'}".`,
      );
    }

    let categoryId;
    if (matches.length === 1) {
      categoryId = matches[0].id;
      reusedCount += 1;
    } else {
      const created = await tx.category.create({
        data: { name: category.name, parentId },
        select: { id: true },
      });
      categoryId = created.id;
      createdCount += 1;
    }

    resolvedCategoryIds.set(name, categoryId);
    return categoryId;
  };

  for (const category of categories) {
    await ensureCategory(category.name);
  }

  return {
    categoryIdsByName: resolvedCategoryIds,
    createdCount,
    reusedCount,
  };
}

async function seedProducts(tx, products, categoryIdsByName) {
  let createdCount = 0;
  let updatedCount = 0;

  for (const product of products) {
    const categoryId = categoryIdsByName.get(product.category);
    if (!categoryId) {
      throw new Error(
        `Could not resolve category "${product.category}" for product "${product.name}".`,
      );
    }

    const data = {
      name: product.name,
      description: product.description ?? null,
      basePrice: product.basePrice,
      categoryId,
      imageUrl: product.imageUrl,
      isActive: true,
    };

    const matches = await tx.product.findMany({
      where: { name: product.name, categoryId },
      select: { id: true },
    });

    if (matches.length > 1) {
      throw new Error(
        `Ambiguous existing products for name="${product.name}" and category="${product.category}".`,
      );
    }

    if (matches.length === 1) {
      await tx.product.update({
        where: { id: matches[0].id },
        data,
      });
      updatedCount += 1;
    } else {
      await tx.product.create({ data });
      createdCount += 1;
    }
  }

  return { createdCount, updatedCount };
}

async function main() {
  const admin = {
    email: getEnv('BOOTSTRAP_ADMIN_EMAIL'),
    password: getEnv('BOOTSTRAP_ADMIN_PASSWORD'),
    firstName: getEnv('BOOTSTRAP_ADMIN_FIRST_NAME', { defaultValue: 'Admin' }),
    lastName: getEnv('BOOTSTRAP_ADMIN_LAST_NAME', { defaultValue: 'User' }),
  };
  const catalog = validateAndNormalizeCatalog(starterCatalog);

  const result = await prisma.$transaction(async (tx) => {
    const adminAction = await upsertBootstrapAdmin(tx, admin);
    const categoryResult = await seedCategories(tx, catalog.categories);
    const productResult = await seedProducts(tx, catalog.products, categoryResult.categoryIdsByName);

    return {
      adminAction,
      categories: categoryResult,
      products: productResult,
    };
  });

  console.log(`[bootstrap] Admin ${result.adminAction}: ${admin.email}`);
  console.log(
    `[bootstrap] Categories seeded. created=${result.categories.createdCount}, reused=${result.categories.reusedCount}`,
  );
  console.log(
    `[bootstrap] Products seeded. created=${result.products.createdCount}, updated=${result.products.updatedCount}`,
  );
}

main()
  .catch((error) => {
    console.error('[bootstrap] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
