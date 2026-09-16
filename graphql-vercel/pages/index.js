import { useEffect, useState } from 'react';

const GET_DATA = `
  query GetData {
    products {
      id
      name
      price
      stock
      owner {
        id
        name
        email
      }
    }

    categories {
      id
      name
    }

    users {
      id
      name
      email
    }
  }
`;

const GET_PRODUCTS = `
  query GetProducts($categoryId: ID) {
    products(categoryId: $categoryId) {
      id
      name
      price
      stock
      owner {
        id
        name
        email
      }
    }
  }
`;

const CREATE_PRODUCT = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      price
      stock
      owner {
        id
        name
      }
    }
  }
`;

const UPDATE_PRODUCT = `
  mutation UpdateProduct(
    $id: ID!
    $input: UpdateProductInput!
  ) {
    updateProduct(id: $id, input: $input) {
      id
      name
      price
      stock
    }
  }
`;

const DELETE_PRODUCT = `
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export default function Home() {

  // ========================================
  // STATE
  // ========================================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const [categoryFilter, setCategoryFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    categoryId: '',
    ownerId: '',
  });

  // ========================================
  // GRAPHQL REQUEST
  // ========================================

  async function graphqlRequest(query, variables = {}) {

    const response = await fetch('/api/graphql', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.errors?.[0]?.message ||
        'Terjadi kesalahan pada server'
      );
    }

    if (result.errors) {
      throw new Error(
        result.errors[0]?.message ||
        'GraphQL request gagal'
      );
    }

    return result.data;
  }

  // ========================================
  // LOAD ALL DATA
  // ========================================

  async function loadData() {

    try {

      setLoading(true);
      setError('');

      const data = await graphqlRequest(GET_DATA);

      setProducts(data.products || []);
      setCategories(data.categories || []);
      setUsers(data.users || []);

    } catch (err) {

      setError(
        err.message || 'Gagal mengambil data'
      );

    } finally {

      setLoading(false);
    }
  }

  // ========================================
  // FILTER CATEGORY
  // ========================================

  async function loadProductsByCategory(categoryId) {

    try {

      setLoading(true);
      setError('');

      const data = await graphqlRequest(
        GET_PRODUCTS,
        {
          categoryId: categoryId || null,
        }
      );

      setProducts(data.products || []);

    } catch (err) {

      setError(
        err.message || 'Gagal mengambil product'
      );

    } finally {

      setLoading(false);
    }
  }

  // ========================================
  // CATEGORY FILTER
  // ========================================

  function handleCategoryChange(event) {

    const value = event.target.value;

    setCategoryFilter(value);

    loadProductsByCategory(value);
  }

  // ========================================
  // FORM CHANGE
  // ========================================

  function handleFormChange(event) {

    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ========================================
  // OPEN CREATE FORM
  // ========================================

  function openCreateForm() {

    setEditingProduct(null);

    setForm({
      name: '',
      price: '',
      stock: '',
      categoryId:
        categories.length > 0
          ? String(categories[0].id)
          : '',
      ownerId:
        users.length > 0
          ? String(users[0].id)
          : '',
    });

    setMessage('');
    setError('');
    setShowForm(true);
  }

  // ========================================
  // OPEN EDIT FORM
  // ========================================

  function openEditForm(product) {

    setEditingProduct(product);

    setForm({
      name: product.name || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      categoryId: '',
      ownerId: '',
    });

    setMessage('');
    setError('');
    setShowForm(true);
  }

  // ========================================
  // CLOSE FORM
  // ========================================

  function closeForm() {

    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingProduct(null);
  }

  // ========================================
  // CREATE PRODUCT
  // ========================================

  async function createProduct(event) {

    event.preventDefault();

    try {

      setSaving(true);
      setError('');
      setMessage('');

      if (!form.name.trim()) {
        throw new Error(
          'Nama product wajib diisi'
        );
      }

      if (!form.categoryId) {
        throw new Error(
          'Category wajib dipilih'
        );
      }

      const price = Number(form.price);
      const stock = Number(form.stock);

      if (Number.isNaN(price) || price < 0) {
        throw new Error(
          'Harga product tidak valid'
        );
      }

      if (Number.isNaN(stock) || stock < 0) {
        throw new Error(
          'Stock product tidak valid'
        );
      }

      await graphqlRequest(
        CREATE_PRODUCT,
        {
          input: {
            name: form.name.trim(),
            price,
            stock,
            categoryId: String(form.categoryId),
            ownerId: form.ownerId
              ? String(form.ownerId)
              : null,
          },
        }
      );

      setMessage(
        'Product berhasil ditambahkan.'
      );

      setShowForm(false);

      setForm({
        name: '',
        price: '',
        stock: '',
        categoryId: '',
        ownerId: '',
      });

      if (categoryFilter) {
        await loadProductsByCategory(
          categoryFilter
        );
      } else {
        await loadData();
      }

    } catch (err) {

      setError(
        err.message || 'Gagal menambahkan product'
      );

    } finally {

      setSaving(false);
    }
  }

  // ========================================
  // UPDATE PRODUCT
  // ========================================

  async function updateProduct(event) {

    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    try {

      setSaving(true);
      setError('');
      setMessage('');

      if (!form.name.trim()) {
        throw new Error(
          'Nama product wajib diisi'
        );
      }

      const price = Number(form.price);
      const stock = Number(form.stock);

      if (Number.isNaN(price) || price < 0) {
        throw new Error(
          'Harga product tidak valid'
        );
      }

      if (Number.isNaN(stock) || stock < 0) {
        throw new Error(
          'Stock product tidak valid'
        );
      }

      await graphqlRequest(
        UPDATE_PRODUCT,
        {
          id: String(editingProduct.id),

          input: {
            name: form.name.trim(),
            price,
            stock,
          },
        }
      );

      setMessage(
        'Product berhasil diperbarui.'
      );

      setShowForm(false);
      setEditingProduct(null);

      if (categoryFilter) {
        await loadProductsByCategory(
          categoryFilter
        );
      } else {
        await loadData();
      }

    } catch (err) {

      setError(
        err.message || 'Gagal memperbarui product'
      );

    } finally {

      setSaving(false);
    }
  }

  // ========================================
  // DELETE PRODUCT
  // ========================================

  async function deleteProduct(product) {

    const confirmed = window.confirm(
      `Yakin ingin menghapus product "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {

      setError('');
      setMessage('');

      await graphqlRequest(
        DELETE_PRODUCT,
        {
          id: String(product.id),
        }
      );

      setMessage(
        'Product berhasil dihapus.'
      );

      if (categoryFilter) {
        await loadProductsByCategory(
          categoryFilter
        );
      } else {
        await loadData();
      }

    } catch (err) {

      setError(
        err.message || 'Gagal menghapus product'
      );
    }
  }

  // ========================================
  // REFRESH
  // ========================================

  async function refreshData() {

    setCategoryFilter('');

    await loadData();
  }

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadData();
  }, []);

  // ========================================
  // STATISTICS
  // ========================================

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) =>
      total + Number(product.stock || 0),
    0
  );

  const totalValue = products.reduce(
    (total, product) =>
      total +
      Number(product.price || 0) *
      Number(product.stock || 0),
    0
  );

  // ========================================
  // FORMAT RUPIAH
  // ========================================

  function formatRupiah(value) {

    return new Intl.NumberFormat(
      'id-ID',
      {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }
    ).format(Number(value || 0));
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <div className="page">

        {/* =================================
            HEADER
        ================================= */}

        <header className="header">

          <div className="brand">

            <div className="logo">
              G
            </div>

            <div>
              <h1>GraphQL Store</h1>

              <p>
                Product Management Dashboard
              </p>
            </div>

          </div>

          <div className="header-actions">

            <button
              className="button secondary"
              onClick={refreshData}
              disabled={loading}
            >
              ↻ Refresh
            </button>

            <button
              className="button primary"
              onClick={openCreateForm}
            >
              + Add Product
            </button>

          </div>

        </header>

        {/* =================================
            CONTENT
        ================================= */}

        <main className="container">

          {/* =================================
              MESSAGE
          ================================= */}

          {message && (
            <div className="alert success">
              <span>✓</span>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="alert error">
              <span>!</span>
              <span>{error}</span>
            </div>
          )}

          {/* =================================
              STATISTICS
          ================================= */}

          <section className="stats">

            <div className="stat-card">

              <div className="stat-icon purple">
                ◈
              </div>

              <div>
                <span className="stat-label">
                  Total Products
                </span>

                <strong>
                  {totalProducts}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon blue">
                #
              </div>

              <div>
                <span className="stat-label">
                  Total Stock
                </span>

                <strong>
                  {totalStock}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon green">
                Rp
              </div>

              <div>
                <span className="stat-label">
                  Stock Value
                </span>

                <strong className="value-text">
                  {formatRupiah(totalValue)}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon orange">
                ◉
              </div>

              <div>
                <span className="stat-label">
                  Categories
                </span>

                <strong>
                  {categories.length}
                </strong>
              </div>

            </div>

          </section>

          {/* =================================
              PRODUCTS SECTION
          ================================= */}

          <section className="card">

            <div className="section-header">

              <div>
                <h2>Products</h2>

                <p>
                  Manage your product data using GraphQL.
                </p>
              </div>

              <div className="filter">

                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  value={categoryFilter}
                  onChange={handleCategoryChange}
                >
                  <option value="">
                    All Categories
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            {/* =================================
                TABLE
            ================================= */}

            <div className="table-wrapper">

              {loading ? (

                <div className="state">
                  <div className="spinner"></div>
                  <p>
                    Loading products...
                  </p>
                </div>

              ) : products.length === 0 ? (

                <div className="state empty">

                  <div className="empty-icon">
                    ◫
                  </div>

                  <h3>
                    No products found
                  </h3>

                  <p>
                    Belum ada product pada kategori ini.
                  </p>

                  <button
                    className="button primary"
                    onClick={openCreateForm}
                  >
                    + Add Product
                  </button>

                </div>

              ) : (

                <table>

                  <thead>

                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Owner</th>
                      <th>Actions</th>
                    </tr>

                  </thead>

                  <tbody>

                    {products.map((product) => (

                      <tr key={product.id}>

                        <td>
                          <span className="id-badge">
                            #{product.id}
                          </span>
                        </td>

                        <td>

                          <div className="product-name">

                            <div className="product-avatar">
                              {product.name
                                ? product.name
                                    .charAt(0)
                                    .toUpperCase()
                                : 'P'}
                            </div>

                            <div>
                              <strong>
                                {product.name}
                              </strong>

                              <span>
                                Product
                              </span>
                            </div>

                          </div>

                        </td>

                        <td>
                          <strong>
                            {formatRupiah(
                              product.price
                            )}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={
                              Number(product.stock) <= 5
                                ? 'stock low'
                                : 'stock'
                            }
                          >
                            {product.stock}
                          </span>

                        </td>

                        <td>

                          {product.owner ? (

                            <div className="owner">

                              <div className="owner-avatar">
                                {product.owner.name
                                  ? product.owner.name
                                      .charAt(0)
                                      .toUpperCase()
                                  : 'U'}
                              </div>

                              <span>
                                {product.owner.name}
                              </span>

                            </div>

                          ) : (

                            <span className="muted">
                              No owner
                            </span>

                          )}

                        </td>

                        <td>

                          <div className="actions">

                            <button
                              className="icon-button edit"
                              title="Edit product"
                              onClick={() =>
                                openEditForm(product)
                              }
                            >
                              ✎
                            </button>

                            <button
                              className="icon-button delete"
                              title="Delete product"
                              onClick={() =>
                                deleteProduct(product)
                              }
                            >
                              ×
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              )}

            </div>

            {/* =================================
                FOOTER
            ================================= */}

            {!loading && products.length > 0 && (

              <div className="table-footer">

                <span>
                  Showing{' '}
                  <strong>
                    {products.length}
                  </strong>{' '}
                  product
                  {products.length !== 1
                    ? 's'
                    : ''}
                </span>

                <span>
                  Powered by GraphQL
                </span>

              </div>

            )}

          </section>

        </main>

      </div>

      {/* =====================================
          MODAL FORM
      ===================================== */}

      {showForm && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target === event.currentTarget
            ) {
              closeForm();
            }

          }}
        >

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingProduct
                    ? 'Edit Product'
                    : 'Add Product'}
                </h2>

                <p>
                  {editingProduct
                    ? 'Update product information.'
                    : 'Add a new product to your store.'}
                </p>

              </div>

              <button
                className="close-button"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                editingProduct
                  ? updateProduct
                  : createProduct
              }
            >

              {/* NAME */}

              <div className="form-group">

                <label htmlFor="name">
                  Product Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />

              </div>

              {/* PRICE */}

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="price">
                    Price
                  </label>

                  <div className="input-prefix">

                    <span>Rp</span>

                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={form.price}
                      onChange={handleFormChange}
                      required
                    />

                  </div>

                </div>

                {/* STOCK */}

                <div className="form-group">

                  <label htmlFor="stock">
                    Stock
                  </label>

                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.stock}
                    onChange={handleFormChange}
                    required
                  />

                </div>

              </div>

              {/* CREATE ONLY */}

              {!editingProduct && (

                <>
                  <div className="form-group">

                    <label htmlFor="categoryId">
                      Category
                    </label>

                    <select
                      id="categoryId"
                      name="categoryId"
                      value={form.categoryId}
                      onChange={handleFormChange}
                      required
                    >

                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (category) => (

                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  <div className="form-group">

                    <label htmlFor="ownerId">
                      Owner
                    </label>

                    <select
                      id="ownerId"
                      name="ownerId"
                      value={form.ownerId}
                      onChange={handleFormChange}
                    >

                      <option value="">
                        No owner
                      </option>

                      {users.map((user) => (

                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {user.name}
                        </option>

                      ))}

                    </select>

                  </div>
                </>

              )}

              {/* BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="button secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingProduct
                    ? 'Save Changes'
                    : 'Create Product'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================
          CSS
      ===================================== */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #202124;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;
        }

        .header {
          background: white;
          border-bottom: 1px solid #e8e8ef;
          min-height: 76px;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #6658d9;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
        }

        .brand h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 750;
          color: #242332;
        }

        .brand p {
          margin: 3px 0 0;
          color: #858595;
          font-size: 12px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .container {
          width: min(1200px, calc(100% - 40px));
          margin: 0 auto;
          padding: 30px 0 50px;
        }

        .button {
          border: none;
          border-radius: 9px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button.primary {
          background: #6658d9;
          color: white;
        }

        .button.primary:hover:not(:disabled) {
          background: #5749c8;
          transform: translateY(-1px);
        }

        .button.secondary {
          background: white;
          color: #4e4d5c;
          border: 1px solid #dedee8;
        }

        .button.secondary:hover:not(:disabled) {
          background: #f7f7fa;
        }

        .alert {
          padding: 13px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 550;
        }

        .alert.success {
          background: #ecfdf3;
          color: #18794e;
          border: 1px solid #c9f0db;
        }

        .alert.error {
          background: #fff0f0;
          color: #c53030;
          border: 1px solid #ffd0d0;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e9e9f0;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow:
            0 3px 12px rgba(25, 25, 50, 0.025);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
        }

        .stat-icon.purple {
          background: #efedff;
          color: #6658d9;
        }

        .stat-icon.blue {
          background: #eaf4ff;
          color: #367ac8;
        }

        .stat-icon.green {
          background: #eafaf1;
          color: #27905c;
        }

        .stat-icon.orange {
          background: #fff4e6;
          color: #d98219;
        }

        .stat-label {
          display: block;
          color: #858595;
          font-size: 11px;
          margin-bottom: 5px;
        }

        .stat-card strong {
          display: block;
          font-size: 20px;
          color: #292835;
        }

        .value-text {
          font-size: 16px !important;
        }

        .card {
          background: white;
          border: 1px solid #e9e9f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow:
            0 3px 15px rgba(25, 25, 50, 0.025);
        }

        .section-header {
          padding: 22px 24px;
          border-bottom: 1px solid #eeeeF3;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 17px;
          color: #292835;
        }

        .section-header p {
          margin: 5px 0 0;
          color: #8a8998;
          font-size: 12px;
        }

        .filter {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .filter label {
          color: #777685;
          font-size: 12px;
          font-weight: 600;
        }

        select,
        input {
          width: 100%;
          border: 1px solid #ddddE7;
          background: white;
          border-radius: 8px;
          padding: 10px 11px;
          outline: none;
          color: #30303b;
          font-size: 13px;
          transition: 0.2s;
        }

        select:focus,
        input:focus {
          border-color: #6658d9;
          box-shadow:
            0 0 0 3px rgba(102, 88, 217, 0.1);
        }

        .filter select {
          width: 190px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        th {
          background: #fafafd;
          color: #858494;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 700;
          text-align: left;
          padding: 13px 20px;
          border-bottom: 1px solid #eeeeF3;
        }

        td {
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f4;
          color: #464550;
          font-size: 13px;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        tbody tr:hover {
          background: #fbfbfe;
        }

        .id-badge {
          background: #f1f1f6;
          color: #686775;
          border-radius: 6px;
          padding: 5px 8px;
          font-size: 11px;
          font-weight: 650;
        }

        .product-name {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .product-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #efedff;
          color: #6658d9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 750;
          font-size: 13px;
        }

        .product-name strong {
          display: block;
          color: #30303b;
          font-size: 13px;
        }

        .product-name span {
          display: block;
          color: #a0a0ad;
          font-size: 10px;
          margin-top: 2px;
        }

        .stock {
          background: #eafaf1;
          color: #218451;
          padding: 5px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .stock.low {
          background: #fff0ee;
          color: #c44a3e;
        }

        .owner {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .owner-avatar {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: #e9f2ff;
          color: #397bc5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 750;
        }

        .muted {
          color: #aaa9b5;
          font-size: 12px;
        }

        .actions {
          display: flex;
          gap: 7px;
        }

        .icon-button {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          border: 1px solid #e5e5ec;
          background: white;
          cursor: pointer;
          font-size: 15px;
          transition: 0.2s;
        }

        .icon-button.edit {
          color: #6658d9;
        }

        .icon-button.edit:hover {
          background: #efedff;
          border-color: #d9d5ff;
        }

        .icon-button.delete {
          color: #d65252;
        }

        .icon-button.delete:hover {
          background: #fff0f0;
          border-color: #ffd1d1;
        }

        .table-footer {
          padding: 13px 20px;
          border-top: 1px solid #eeeeF3;
          color: #9998a5;
          font-size: 11px;
          display: flex;
          justify-content: space-between;
        }

        .table-footer strong {
          color: #565563;
        }

        .state {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #92919e;
          gap: 12px;
        }

        .state p {
          margin: 0;
          font-size: 13px;
        }

        .spinner {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid #e7e5f8;
          border-top-color: #6658d9;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-icon {
          width: 55px;
          height: 55px;
          border-radius: 15px;
          background: #f1f0fa;
          color: #6658d9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
        }

        .empty h3 {
          margin: 0;
          color: #393844;
          font-size: 15px;
        }

        .empty p {
          margin: -4px 0 8px;
          color: #9695a3;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(30, 30, 45, 0.48);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 100;
        }

        .modal {
          width: min(500px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          box-shadow:
            0 25px 70px rgba(20, 20, 40, 0.2);
        }

        .modal-header {
          padding: 22px 24px;
          border-bottom: 1px solid #eeeeF3;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .modal-header h2 {
          margin: 0;
          color: #292835;
          font-size: 18px;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #92919e;
          font-size: 12px;
        }

        .close-button {
          border: none;
          background: #f5f5f8;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 21px;
          line-height: 1;
          color: #747381;
          cursor: pointer;
        }

        .modal form {
          padding: 22px 24px 24px;
        }

        .form-group {
          margin-bottom: 17px;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #555460;
          font-size: 12px;
          font-weight: 650;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
        }

        .input-prefix {
          position: relative;
        }

        .input-prefix span {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #8d8c99;
          font-size: 12px;
          font-weight: 600;
          z-index: 1;
        }

        .input-prefix input {
          padding-left: 34px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 8px;
        }

        @media (max-width: 900px) {

          .stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 650px) {

          .header {
            padding: 15px 20px;
            align-items: flex-start;
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .button {
            flex: 1;
          }

          .container {
            width: min(100% - 24px, 1200px);
            padding-top: 20px;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .section-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .filter {
            width: 100%;
          }

          .filter select {
            flex: 1;
            width: auto;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .modal-overlay {
            padding: 10px;
          }

          .modal form {
            padding: 18px;
          }

        }

      `}</style>
    </>
  );
}
