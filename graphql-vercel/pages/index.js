import { useEffect, useState } from 'react';

const GET_DATA = `  query {
    products {
      id
      name
      price
      stock
      owner {
        id
        name
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
  }`;

const GET_PRODUCTS = `  query GetProducts($categoryId: ID) {
    products(categoryId: $categoryId) {
      id
      name
      price
      stock
      owner {
        id
        name
      }
    }
  }`;

const CREATE_PRODUCT = `  mutation CreateProduct($input: CreateProductInput!) {
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
  }`;

const UPDATE_PRODUCT = `  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      price
      stock
      owner {
        id
        name
      }
    }
  }`;

const DELETE_PRODUCT = `  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }`;

export default function Home() {
const [products, setProducts] = useState([]);
const [categories, setCategories] = useState([]);
const [users, setUsers] = useState([]);

const [categoryFilter, setCategoryFilter] = useState('');

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

const [message, setMessage] = useState('');
const [error, setError] = useState('');

const [showForm, setShowForm] = useState(false);
const [editingProduct, setEditingProduct] = useState(null);

const [form, setForm] = useState({
name: '',
price: '',
stock: '',
categoryId: '',
ownerId: ''
});

async function graphqlRequest(query, variables = {}) {
const response = await fetch('/api/graphql', {
method: 'POST',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify({
query,
variables
})
});

```
const result = await response.json();

if (result.errors) {
  throw new Error(result.errors[0].message);
}

return result.data;
```

}

async function loadData() {
try {
setLoading(true);
setError('');

```
  const data = await graphqlRequest(GET_DATA);

  setProducts(data.products || []);
  setCategories(data.categories || []);
  setUsers(data.users || []);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

}

async function loadProductsByCategory(categoryId) {
try {
setLoading(true);
setError('');

```
  const data = await graphqlRequest(
    GET_PRODUCTS,
    categoryId ? { categoryId } : {}
  );

  setProducts(data.products || []);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

}

useEffect(() => {
loadData();
}, []);

function handleFilterChange(event) {
const value = event.target.value;

```
setCategoryFilter(value);
loadProductsByCategory(value);
```

}

function handleInputChange(event) {
const { name, value } = event.target;

```
setForm((prev) => ({
  ...prev,
  [name]: value
}));
```

}

function openCreateForm() {
setEditingProduct(null);

```
setForm({
  name: '',
  price: '',
  stock: '',
  categoryId: categories.length > 0 ? categories[0].id : '',
  ownerId: users.length > 0 ? users[0].id : ''
});

setShowForm(true);
setMessage('');
setError('');
```

}

function openEditForm(product) {
setEditingProduct(product);

```
setForm({
  name: product.name,
  price: product.price,
  stock: product.stock,
  categoryId: '',
  ownerId: product.owner?.id || ''
});

setShowForm(true);
setMessage('');
setError('');
```

}

function closeForm() {
setShowForm(false);
setEditingProduct(null);
}

async function handleSubmit(event) {
event.preventDefault();

```
try {
  setSaving(true);
  setError('');
  setMessage('');

  if (editingProduct) {
    await graphqlRequest(
      UPDATE_PRODUCT,
      {
        id: editingProduct.id,
        input: {
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock)
        }
      }
    );

    setMessage('Produk berhasil diperbarui.');
  } else {
    await graphqlRequest(
      CREATE_PRODUCT,
      {
        input: {
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          categoryId: form.categoryId,
          ownerId: form.ownerId
        }
      }
    );

    setMessage('Produk berhasil ditambahkan.');
  }

  closeForm();

  if (categoryFilter) {
    await loadProductsByCategory(categoryFilter);
  } else {
    await loadData();
  }
} catch (err) {
  setError(err.message);
} finally {
  setSaving(false);
}
```

}

async function handleDelete(product) {
const confirmed = window.confirm(
`Hapus produk "${product.name}"?`
);

```
if (!confirmed) {
  return;
}

try {
  setError('');
  setMessage('');

  await graphqlRequest(
    DELETE_PRODUCT,
    {
      id: product.id
    }
  );

  setMessage('Produk berhasil dihapus.');

  if (categoryFilter) {
    await loadProductsByCategory(categoryFilter);
  } else {
    await loadData();
  }
} catch (err) {
  setError(err.message);
}
```

}

function formatRupiah(value) {
return new Intl.NumberFormat('id-ID', {
style: 'currency',
currency: 'IDR',
maximumFractionDigits: 0
}).format(value);
}

const totalProducts = products.length;

const totalStock = products.reduce(
(total, product) => total + Number(product.stock || 0),
0
);

const totalValue = products.reduce(
(total, product) =>
total +
Number(product.price || 0) *
Number(product.stock || 0),
0
);

return (
<> <div className="app">

```
    <header className="header">
      <div className="brand">
        <div className="brandIcon">G</div>

        <div>
          <h1>GraphQL Store</h1>
          <p>Product Management Dashboard</p>
        </div>
      </div>

      <button
        className="refreshButton"
        onClick={() => {
          setCategoryFilter('');
          loadData();
        }}
      >
        ↻ Refresh
      </button>
    </header>

    <main className="container">

      <section className="hero">
        <div>
          <span className="badge">GRAPHQL DASHBOARD</span>

          <h2>
            Kelola Produk
            <br />
            dengan lebih mudah.
          </h2>

          <p>
            Tambahkan, ubah, hapus, dan filter produk
            langsung melalui GraphQL API.
          </p>
        </div>

        <button
          className="primaryButton heroButton"
          onClick={openCreateForm}
        >
          + Tambah Produk
        </button>
      </section>

      {message && (
        <div className="alert success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="alert danger">
          ! {error}
        </div>
      )}

      <section className="stats">

        <div className="statCard">
          <div className="statIcon">📦</div>

          <div>
            <span>Total Produk</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>

        <div className="statCard">
          <div className="statIcon">▣</div>

          <div>
            <span>Total Stok</span>
            <strong>{totalStock}</strong>
          </div>
        </div>

        <div className="statCard">
          <div className="statIcon">Rp</div>

          <div>
            <span>Nilai Stok</span>
            <strong>{formatRupiah(totalValue)}</strong>
          </div>
        </div>

        <div className="statCard">
          <div className="statIcon">◉</div>

          <div>
            <span>Kategori</span>
            <strong>{categories.length}</strong>
          </div>
        </div>

      </section>

      <section className="contentCard">

        <div className="sectionHeader">

          <div>
            <h3>Daftar Produk</h3>
            <p>
              Data produk yang tersimpan di database Neon.
            </p>
          </div>

          <div className="filterBox">
            <label>Filter kategori</label>

            <select
              value={categoryFilter}
              onChange={handleFilterChange}
            >
              <option value="">
                Semua Kategori
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

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Memuat data...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty">
            <div className="emptyIcon">📦</div>

            <h3>Belum ada produk</h3>

            <p>
              Tambahkan produk pertama kamu menggunakan
              tombol Tambah Produk.
            </p>
          </div>
        ) : (
          <div className="tableWrapper">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Produk</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Owner</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>

                {products.map((product) => (
                  <tr key={product.id}>

                    <td>
                      <span className="idBadge">
                        #{product.id}
                      </span>
                    </td>

                    <td>
                      <div className="productName">
                        <div className="productAvatar">
                          {product.name
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>

                        <strong>
                          {product.name}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {formatRupiah(product.price)}
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
                      {product.owner?.name || '-'}
                    </td>

                    <td>

                      <div className="actions">

                        <button
                          className="editButton"
                          onClick={() =>
                            openEditForm(product)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="deleteButton"
                          onClick={() =>
                            handleDelete(product)
                          }
                        >
                          Hapus
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

      <footer>
        <span>GraphQL Store</span>
        <span>Powered by Next.js + Apollo + Neon</span>
      </footer>

    </main>

  </div>

  {showForm && (
    <div
      className="modalOverlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeForm();
        }
      }}
    >

      <div className="modal">

        <div className="modalHeader">

          <div>
            <span className="modalLabel">
              {editingProduct
                ? 'EDIT PRODUCT'
                : 'NEW PRODUCT'}
            </span>

            <h2>
              {editingProduct
                ? 'Edit Produk'
                : 'Tambah Produk'}
            </h2>
          </div>

          <button
            className="closeButton"
            onClick={closeForm}
          >
            ×
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          <div className="formGroup">
            <label>Nama Produk</label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Contoh: Laptop ASUS"
              required
            />
          </div>

          <div className="formRow">

            <div className="formGroup">
              <label>Harga</label>

              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                placeholder="100000"
                min="0"
                required
              />
            </div>

            <div className="formGroup">
              <label>Stok</label>

              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleInputChange}
                placeholder="10"
                min="0"
                required
              />
            </div>

          </div>

          {!editingProduct && (
            <>
              <div className="formGroup">
                <label>Kategori</label>

                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Pilih kategori
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

              <div className="formGroup">
                <label>Owner</label>

                <select
                  name="ownerId"
                  value={form.ownerId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Pilih owner
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

          <div className="modalActions">

            <button
              type="button"
              className="cancelButton"
              onClick={closeForm}
            >
              Batal
            </button>

            <button
              type="submit"
              className="primaryButton"
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : editingProduct
                ? 'Simpan Perubahan'
                : 'Tambah Produk'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )}

  <style jsx>{`

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
    }

    .app {
      min-height: 100vh;
      background:
        radial-gradient(
          circle at top right,
          #e8e7ff 0,
          transparent 35%
        ),
        #f6f7fb;
      color: #171827;
      font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    .header {
      height: 76px;
      background: rgba(255, 255, 255, 0.9);
      border-bottom: 1px solid #e7e7ef;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 6%;
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(12px);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brandIcon {
      width: 42px;
      height: 42px;
      border-radius: 13px;
      background: #6658d9;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 20px;
      box-shadow: 0 8px 20px rgba(102, 88, 217, .25);
    }

    .brand h1 {
      font-size: 16px;
      margin: 0;
    }

    .brand p {
      font-size: 12px;
      color: #8b8c9d;
      margin: 3px 0 0;
    }

    .refreshButton {
      border: 1px solid #dddde8;
      background: white;
      padding: 10px 15px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
    }

    .container {
      width: min(1200px, 92%);
      margin: auto;
      padding: 42px 0 25px;
    }

    .hero {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 28px;
    }

    .badge {
      color: #6658d9;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    .hero h2 {
      font-size: clamp(32px, 5vw, 52px);
      line-height: 1.05;
      letter-spacing: -2px;
      margin: 10px 0 15px;
    }

    .hero p {
      color: #747589;
      max-width: 550px;
      line-height: 1.7;
      margin: 0;
    }

    .primaryButton {
      border: 0;
      background: #6658d9;
      color: white;
      padding: 12px 18px;
      border-radius: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: .2s;
    }

    .primaryButton:hover {
      transform: translateY(-1px);
      background: #5749ca;
      box-shadow: 0 8px 20px rgba(102, 88, 217, .25);
    }

    .heroButton {
      white-space: nowrap;
      padding: 14px 20px;
    }

    .alert {
      padding: 13px 16px;
      border-radius: 11px;
      margin-bottom: 18px;
      font-size: 14px;
      font-weight: 600;
    }

    .success {
      background: #e8f8ee;
      color: #168044;
    }

    .danger {
      background: #fff0f0;
      color: #c63c3c;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 22px;
    }

    .statCard {
      background: white;
      border: 1px solid #e8e8f0;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 4px 20px rgba(30, 30, 60, .03);
    }

    .statIcon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #f0efff;
      color: #6658d9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
    }

    .statCard span {
      display: block;
      color: #898a9c;
      font-size: 12px;
      margin-bottom: 5px;
    }

    .statCard strong {
      font-size: 19px;
    }

    .contentCard {
      background: white;
      border: 1px solid #e8e8f0;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(30, 30, 60, .04);
    }

    .sectionHeader {
      padding: 22px 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1px solid #ededf3;
      gap: 20px;
    }

    .sectionHeader h3 {
      margin: 0 0 5px;
      font-size: 19px;
    }

    .sectionHeader p {
      margin: 0;
      color: #8b8c9d;
      font-size: 13px;
    }

    .filterBox {
      min-width: 190px;
    }

    .filterBox label,
    .formGroup label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #696a7b;
      margin-bottom: 7px;
    }

    select,
    input {
      width: 100%;
      border: 1px solid #dddde8;
      background: white;
      padding: 11px 12px;
      border-radius: 9px;
      outline: none;
      font-size: 14px;
      color: #242535;
    }

    select:focus,
    input:focus {
      border-color: #6658d9;
      box-shadow: 0 0 0 3px rgba(102, 88, 217, .1);
    }

    .tableWrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 14px 20px;
      background: #fafafe;
      color: #858698;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .7px;
    }

    td {
      padding: 16px 20px;
      border-top: 1px solid #f0f0f5;
      font-size: 14px;
    }

    tr:hover td {
      background: #fcfcff;
    }

    .idBadge {
      color: #77788a;
      font-size: 12px;
      font-weight: 600;
    }

    .productName {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .productAvatar {
      width: 35px;
      height: 35px;
      border-radius: 10px;
      background: #ecebff;
      color: #6658d9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
    }

    .stock {
      display: inline-block;
      padding: 5px 9px;
      border-radius: 7px;
      background: #e9f8ef;
      color: #19834a;
      font-weight: 700;
      font-size: 12px;
    }

    .stock.low {
      background: #fff1e6;
      color: #c96c22;
    }

    .actions {
      display: flex;
      gap: 7px;
    }

    .editButton,
    .deleteButton {
      border: 0;
      border-radius: 8px;
      padding: 8px 11px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
    }

    .editButton {
      background: #eeedff;
      color: #5d50cb;
    }

    .deleteButton {
      background: #fff0f0;
      color: #c44747;
    }

    .loading {
      padding: 70px 20px;
      text-align: center;
      color: #88899a;
    }

    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid #e5e4f5;
      border-top-color: #6658d9;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: auto;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .empty {
      text-align: center;
      padding: 70px 20px;
    }

    .emptyIcon {
      font-size: 42px;
    }

    .empty h3 {
      margin: 12px 0 6px;
    }

    .empty p {
      color: #88899a;
      font-size: 14px;
    }

    footer {
      display: flex;
      justify-content: space-between;
      padding: 22px 5px;
      color: #9293a2;
      font-size: 12px;
    }

    .modalOverlay {
      position: fixed;
      inset: 0;
      background: rgba(17, 17, 30, .5);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 100;
    }

    .modal {
      width: min(500px, 100%);
      background: white;
      border-radius: 18px;
      padding: 25px;
      box-shadow: 0 25px 70px rgba(0,0,0,.2);
    }

    .modalHeader {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .modalLabel {
      color: #6658d9;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.2px;
    }

    .modalHeader h2 {
      margin: 5px 0 0;
    }

    .closeButton {
      border: 0;
      background: #f1f1f5;
      width: 34px;
      height: 34px;
      border-radius: 9px;
      font-size: 23px;
      cursor: pointer;
    }

    .formGroup {
      margin-bottom: 16px;
    }

    .formRow {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 13px;
    }

    .modalActions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }

    .cancelButton {
      border: 1px solid #dddde8;
      background: white;
      padding: 12px 17px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    button:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    @media (max-width: 800px) {

      .header {
        padding: 0 4%;
      }

      .container {
        width: 94%;
        padding-top: 28px;
      }

      .hero {
        align-items: flex-start;
        flex-direction: column;
      }

      .stats {
        grid-template-columns: 1fr 1fr;
      }

      .sectionHeader {
        align-items: stretch;
        flex-direction: column;
      }

      .filterBox {
        width: 100%;
      }

    }

    @media (max-width: 520px) {

      .brand p {
        display: none;
      }

      .refreshButton {
        padding: 9px;
      }

      .stats {
        grid-template-columns: 1fr;
      }

      .hero h2 {
        font-size: 36px;
      }

      .formRow {
        grid-template-columns: 1fr;
        gap: 0;
      }

      footer {
        flex-direction: column;
        gap: 7px;
      }

    }

  `}</style>
</>
```

);
}
