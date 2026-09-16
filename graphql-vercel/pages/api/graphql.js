import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { Pool } from 'pg';

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: {
rejectUnauthorized: false
}
});

const typeDefs = `#graphql

type User {
id: ID!
name: String!
email: String!
}

type Category {
id: ID!
name: String!
products: [Product]
}

type Product {
id: ID!
name: String!
price: Float!
stock: Int!
owner: User
}

type Order {
id: ID!
quantity: Int!
total_price: Float!
user: User
product: Product
}

input CreateProductInput {
name: String!
price: Float!
stock: Int!
categoryId: ID!
ownerId: ID!
}

input UpdateProductInput {
name: String
price: Float
stock: Int
}

type Query {
users: [User]
categories: [Category]
products(categoryId: ID): [Product]
orders: [Order]
resolverCallCount: Int!
}

type Mutation {
createProduct(input: CreateProductInput!): Product!
updateProduct(id: ID!, input: UpdateProductInput!): Product!
deleteProduct(id: ID!): Boolean!
}
`;

const resolvers = {
Query: {
users: async () => {
const result = await pool.query(
'SELECT * FROM users'
);

```
  return result.rows;
},

categories: async () => {
  const result = await pool.query(
    'SELECT * FROM categories'
  );

  return result.rows;
},

products: async (_, { categoryId }) => {
  if (categoryId) {
    const result = await pool.query(
      'SELECT * FROM products WHERE category_id = $1',
      [categoryId]
    );

    return result.rows;
  }

  const result = await pool.query(
    'SELECT * FROM products'
  );

  return result.rows;
},

orders: async () => {
  const result = await pool.query(
    'SELECT * FROM orders'
  );

  return result.rows;
},

resolverCallCount: async () => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM categories'
  );

  return Number(result.rows[0].count);
}
```

},

Category: {
products: async (parent) => {
const result = await pool.query(
'SELECT * FROM products WHERE category_id = $1',
[parent.id]
);

```
  return result.rows;
}
```

},

Product: {
owner: async (parent) => {
const result = await pool.query(
'SELECT * FROM users WHERE id = $1',
[parent.owner_id]
);

```
  return result.rows[0];
}
```

},

Order: {
user: async (parent) => {
const result = await pool.query(
'SELECT * FROM users WHERE id = $1',
[parent.user_id]
);

```
  return result.rows[0];
},

product: async (parent) => {
  const result = await pool.query(
    'SELECT * FROM products WHERE id = $1',
    [parent.product_id]
  );

  return result.rows[0];
}
```

},

Mutation: {
createProduct: async (_, { input }) => {
const result = await pool.query(
`INSERT INTO products
        (name, price, stock, category_id, owner_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
[
input.name,
input.price,
input.stock,
input.categoryId,
input.ownerId
]
);

```
  return result.rows[0];
},

updateProduct: async (_, { id, input }) => {
  const result = await pool.query(
    `UPDATE products
    SET
      name = COALESCE($1, name),
      price = COALESCE($2, price),
      stock = COALESCE($3, stock)
    WHERE id = $4
    RETURNING *`,
    [
      input.name,
      input.price,
      input.stock,
      id
    ]
  );

  return result.rows[0];
},

deleteProduct: async (_, { id }) => {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1',
    [id]
  );

  return result.rowCount > 0;
}
```

}
};

const server = new ApolloServer({
typeDefs,
resolvers
});

const handler = startServerAndCreateNextHandler(server);

export default async function graphqlHandler(req, res) {
res.setHeader(
'Access-Control-Allow-Origin',
'https://studio.apollographql.com'
);

res.setHeader(
'Access-Control-Allow-Methods',
'GET, POST, OPTIONS'
);

res.setHeader(
'Access-Control-Allow-Headers',
'Content-Type, Apollo-Require-Preflight'
);

if (req.method === 'OPTIONS') {
return res.status(204).end();
}

return handler(req, res);
}
