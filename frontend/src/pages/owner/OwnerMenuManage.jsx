import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  UtensilsCrossed 
} from 'lucide-react';

const CATEGORIES = [
  'BREAKFAST',
  'LUNCH',
  'FAST FOOD',
  'CHAAT',
  'BEVERAGES',
  'DESSERTS'
];

export default function OwnerMenuManage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('BREAKFAST');
  const [price, setPrice] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.menu.getAll();
      if (res.success && res.items) {
        setItems(res.items);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setCategory('BREAKFAST');
    setPrice('');
    setPrepTimeMinutes('10');
    setImageUrl('');
    setImagePreview('');
    setUploadSuccess('');
    setIsAvailable(true);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setCategory(item.category);
    setPrice(String(item.price));
    setPrepTimeMinutes(String(item.prepTimeMinutes || 10));
    setImageUrl(item.imageUrl || '');
    setImagePreview(item.imageUrl || '');
    setUploadSuccess('');
    setIsAvailable(item.isAvailable !== false);
    setError('');
    setModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file type validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Invalid format: Please choose a JPEG, PNG, or WebP image.');
      return;
    }

    // Client-side file size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large: Maximum allowed image size is 5MB.');
      return;
    }

    // Immediate local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);
    setUploadingImage(true);
    setError('');
    setUploadSuccess('');

    try {
      const res = await api.uploads.uploadFoodImage(file);
      if (res.success && res.imageUrl) {
        setImageUrl(res.imageUrl);
        setUploadSuccess(res.storageProvider === 'AMAZON_S3' ? '✓ Uploaded to Amazon S3 (Stockholm)' : '✓ Uploaded to Food Storage');
      } else {
        setError(res.error || 'Failed to upload image. Please try again.');
        setImagePreview(imageUrl || '');
      }
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.');
      setImagePreview(imageUrl || '');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const updated = await api.menu.update(item.itemId, { isAvailable: !item.isAvailable });
      if (updated.success && updated.item) {
        setItems(prev => prev.map(i => i.itemId === item.itemId ? updated.item : i));
      }
    } catch (err) {
      alert(`Failed to update availability: ${err.message}`);
    }
  };

  const handleDelete = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}" from the menu?`)) return;

    try {
      const res = await api.menu.delete(itemId);
      if (res.success) {
        setItems(prev => prev.filter(i => i.itemId !== itemId));
      }
    } catch (err) {
      alert(`Failed to delete item: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please provide a valid price.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description,
        category,
        price: numPrice,
        prepTimeMinutes: Number(prepTimeMinutes) || 10,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
        isAvailable
      };

      if (editingItem) {
        const res = await api.menu.update(editingItem.itemId, payload);
        if (res.success && res.item) {
          setItems(prev => prev.map(i => i.itemId === editingItem.itemId ? res.item : i));
          setModalOpen(false);
        } else {
          setError(res.error || 'Failed to update item.');
        }
      } else {
        const res = await api.menu.create(payload);
        if (res.success && res.item) {
          setItems(prev => [...prev, res.item]);
          setModalOpen(false);
        } else {
          setError(res.error || 'Failed to create item.');
        }
      }
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-forest)' }}>
            Menu Management
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            Add, update, or remove food items and toggle real-time availability in DynamoDB.
          </p>
        </div>

        <button 
          onClick={openAddModal} 
          className="btn btn-accent"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={18} />
          <span>Add New Food Item</span>
        </button>
      </div>

      {/* Items Table */}
      {loading ? (
        <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '40px 0' }}>Loading menu items...</p>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item Preview</th>
                  <th>Name & Category</th>
                  <th>Price</th>
                  <th>Prep Time</th>
                  <th>Availability</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.itemId}>
                    {/* Thumbnail */}
                    <td style={{ width: '80px' }}>
                      <img 
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'} 
                        alt={item.name}
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    </td>

                    {/* Name & Desc */}
                    <td>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-orange)', textTransform: 'uppercase' }}>
                        {item.category}
                      </span>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-dark)', display: 'block' }}>
                        {item.name}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </span>
                    </td>

                    {/* Price */}
                    <td>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--color-forest)' }}>
                        ₹{item.price}
                      </strong>
                    </td>

                    {/* Prep Time */}
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      ~{item.prepTimeMinutes || 10} mins
                    </td>

                    {/* Availability Toggle */}
                    <td>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: item.isAvailable ? '#DCFCE7' : '#FEE2E2',
                          color: item.isAvailable ? '#15803D' : '#991B1B',
                          border: `1px solid ${item.isAvailable ? '#86EFAC' : '#FCA5A5'}`,
                          cursor: 'pointer'
                        }}
                      >
                        {item.isAvailable ? '✓ In Stock' : '✗ Sold Out'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          onClick={() => openEditModal(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Edit Item"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.itemId, item.name)}
                          className="btn btn-sm"
                          style={{ padding: '6px 10px', backgroundColor: '#FEE2E2', color: '#DC2626' }}
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-forest)' }}>
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} color="var(--color-muted)" />
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Food Item Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Paneer Butter Masala Roll"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (INR ₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 80"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <textarea 
                  className="form-textarea" 
                  rows={2}
                  placeholder="Ingredients and culinary description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Estimated Prep Time (mins)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="10"
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(e.target.value)}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <select 
                    className="form-select"
                    value={isAvailable ? 'true' : 'false'}
                    onChange={(e) => setIsAvailable(e.target.value === 'true')}
                  >
                    <option value="true">In Stock & Available</option>
                    <option value="false">Sold Out / Unavailable</option>
                  </select>
                </div>
              </div>

              {/* Image Input & S3 Upload */}
              <div className="form-group">
                <label className="form-label">Food Image (Amazon S3 / URL)</label>
                
                {/* Image Preview Box */}
                {(imagePreview || imageUrl) && (
                  <div style={{ marginBottom: '10px', position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: '#F3F4F6' }}>
                    <img 
                      src={imagePreview || imageUrl} 
                      alt="Food preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    {uploadingImage && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>
                        Uploading to S3...
                      </div>
                    )}
                  </div>
                )}

                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://... or /images/food/... or upload file below"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  style={{ marginBottom: '8px' }}
                />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} />
                    <span>{uploadingImage ? 'Uploading to S3...' : 'Choose File to Upload (S3)'}</span>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp" 
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                  </label>
                  {uploadSuccess && (
                    <span style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> {uploadSuccess}
                    </span>
                  )}
                  {!uploadSuccess && imageUrl && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>✓ Image linked</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2 }}
                  disabled={saving || uploadingImage}
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
