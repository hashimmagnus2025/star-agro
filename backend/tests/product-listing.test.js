import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProductsForRequest } from '../controllers/product.controller.js';

test('returns all active products for authenticated non-admin users', async () => {
  const allProducts = [
    { id: 1, status: 'Active' },
    { id: 2, status: 'Inactive' },
    { id: 3, status: 'Active' },
  ];
  const userProducts = [{ id: 99, status: 'Active' }];

  const products = await resolveProductsForRequest({
    user: { id: 7, role: 'user' },
    isAdmin: false,
    getAllProductsFn: async () => allProducts,
    getProductsByUserIdFn: async () => userProducts,
  });

  assert.deepEqual(products, [
    { id: 1, status: 'Active' },
    { id: 3, status: 'Active' },
  ]);
});

test('returns all products for admins without filtering by owner', async () => {
  const allProducts = [{ id: 1, status: 'Active' }];
  const userProducts = [{ id: 99, status: 'Active' }];

  const products = await resolveProductsForRequest({
    user: { id: 7, role: 'admin' },
    isAdmin: true,
    getAllProductsFn: async () => allProducts,
    getProductsByUserIdFn: async () => userProducts,
  });

  assert.deepEqual(products, allProducts);
});
