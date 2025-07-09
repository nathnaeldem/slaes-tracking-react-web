import React, { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../../services/ProductService';
import './ProductForm.css'; // Your CSS file to hide the arrows

const ProductForm = ({ existingProduct, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    import_price: '',
    selling_price: '',
    quantity: 0
  });

  useEffect(() => {
    if (existingProduct) {
      setForm({
        name: existingProduct.name || '',
        description: existingProduct.description || '',
        category: existingProduct.category || '',
        import_price: existingProduct.import_price || '',
        selling_price: existingProduct.selling_price || '',
        quantity: existingProduct.in_stock || 0
      });
    }
  }, [existingProduct]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  // --- NEW: Add this function to handle keyboard events ---
  const handleKeyDown = (e) => {
    // Prevent value change on arrow up/down
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  // --- NEW: Add this function to handle mouse scroll ---
  const handleWheel = (e) => {
    // Prevent value change on scroll and blur the input
    e.preventDefault();
    e.target.blur();
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        import_price: parseFloat(form.import_price),
        selling_price: parseFloat(form.selling_price),
        quantity: parseInt(form.quantity, 10)
      };

      if (existingProduct) {
        await updateProduct(existingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      onSuccess();

    } catch (error) {
      console.error('Operation failed:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="card">
        <div className="card-header">
         <h3>{existingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
      </div>
      <form onSubmit={handleSubmit}>
        {/* ... other form groups ... */}
        <div className="form-group">
          <label>Product Name*</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Import Price (ETB)*</label>
            <input
              type="number"
              name="import_price"
              value={form.import_price}
              onChange={handleChange}
              onKeyDown={handleKeyDown} // <-- Add this
              onWheel={handleWheel}     // <-- Add this
              required
            />
          </div>

          <div className="form-group">
            <label>Selling Price (ETB)*</label>
            <input
              type="number"
              name="selling_price"
              value={form.selling_price}
              onChange={handleChange}
              onKeyDown={handleKeyDown} // <-- Add this
              onWheel={handleWheel}     // <-- Add this
              required
            />
          </div>
        </div>
        
        {/* ... category select ... */}
        <div className="form-group">
          <label>Category*</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Category --</option>
            <option value="balstera">Balstera</option>
            <option value="accessory">Accessory</option>
            <option value="battery">Battery</option>
            <option value="mestawet">Mestawet</option>
            <option value="cherke">Cherke</option>
            <option value="blon">Blon</option>
          </select>
        </div>


        <div className="form-group">
          <label>Quantity in Stock*</label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            onKeyDown={handleKeyDown} // <-- Add this
            onWheel={handleWheel}     // <-- Add this
            required
            min="0"
          />
        </div>
        
        {/* ... description textarea ... */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <button type="submit" className="btn-primary">
          {existingProduct ? 'Update' : 'Create'} Product
        </button>
      </form>
    </div>
  );
};

export default ProductForm;