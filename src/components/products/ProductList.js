import React, { useEffect, useState } from 'react';
import { getProducts, deleteProduct } from '../../services/ProductService';

const ProductList = ({ onAdd, onEdit }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        if (response.data && Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          setProducts([]);
          setError('Invalid product data format');
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product.');
      }
    }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div>Loading products...</div>;

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
        <button className="btn-sm ml-2" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Products</h3>
        <button className="btn-primary" onClick={onAdd}>+ Add Product</button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="filter-controls">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="btn-sm"
          onClick={() => {
            setFilterCategory('');
            setSearchTerm('');
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Import Price</th>
              <th>Selling Price</th>
              <th>In Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.import_price} ETB</td>
                <td>{product.selling_price} ETB</td>
                <td>{product.in_stock}</td>
                <td>
                  <button
                    className="btn-sm"
                    onClick={() => onEdit(product)}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-sm danger"
                    onClick={() => handleDelete(product.id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
