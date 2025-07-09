import React, { useState } from 'react';
import Layout from '../components/shared/Layout';
import ProductList from '../components/products/ProductList';
import ProductForm from '../components/products/ProductForm';

const ProductsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditProduct(null);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Product Management</h2>
      </div>
      
      {showForm ? (
        <ProductForm 
          existingProduct={editProduct}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <ProductList 
          onAdd={() => setShowForm(true)} 
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};
export default ProductsPage;