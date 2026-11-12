import { useEffect, useState } from 'react';
import { api } from '../../api/api';
import { useFeedback } from '../../context/useFeedback';
import styles from '../dashboard/Dashboard.module.css';

/**
 * Modal for assigning/removing shops to a staff member.
 * Props:
 *  - staffId: ID of the staff user.
 *  - staffName: Display name (username) for UI messages.
 *  - onClose: callback to close the modal.
 *  - onUpdated: callback after successful assignment changes (e.g., refresh staff list).
 */
export default function ShopAssignmentModal({ staffId, staffName, onClose, onUpdated }) {
  const { notify, beginSaving } = useFeedback();
  const [allShops, setAllShops] = useState([]);
  const [assignedShopIds, setAssignedShopIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Load all shops and current assignments
  useEffect(() => {
    const load = async () => {
      try {
        const [shopsRes, staffRes] = await Promise.all([
          api.get('/shops'),
          api.get(`/staff/${staffId}`), // Assuming endpoint returns staff detail with shops
        ]);
        if (shopsRes.success) setAllShops(shopsRes.body);
        else notify({ type: 'error', message: shopsRes.message || 'Failed to load shops.' });
        if (staffRes.success) {
          const assigned = (staffRes.body.shops || []).map(s => s.id);
          setAssignedShopIds(new Set(assigned));
        } else {
          notify({ type: 'error', message: staffRes.message || 'Failed to load staff data.' });
        }
      } catch {
        notify({ type: 'error', message: 'Network error while loading shops.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [staffId]);

  const toggleShop = (shopId) => {
    setAssignedShopIds(prev => {
      const next = new Set(prev);
      if (next.has(shopId)) next.delete(shopId);
      else next.add(shopId);
      return next;
    });
  };

  const handleSave = async () => {
    const saveStatus = beginSaving({ title: 'Updating shop assignments' });
    try {
      // First remove all existing assignments, then add selected ones.
      // Simpler approach: fetch current assignments again and diff.
      // Here we just iterate over all shops and call appropriate endpoint.
      for (const shop of allShops) {
        const isAssigned = assignedShopIds.has(shop.id);
        const endpoint = `/staff/${staffId}/shops/${shop.id}`;
        if (isAssigned) {
          await api.post(endpoint, {}); // POST to assign
        } else {
          await api.delete(endpoint); // DELETE to remove
        }
      }
      saveStatus.complete({ message: `Shop assignments updated for ${staffName}` });
      onUpdated();
    } catch {
      saveStatus.fail({ message: 'Failed to update assignments.' });
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>Assign Shops to {staffName}</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className={styles.shopList}>
            {allShops.map(shop => (
              <li key={shop.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={assignedShopIds.has(shop.id)}
                    onChange={() => toggleShop(shop.id)}
                  />
                  {shop.name}
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.modalActions}>
          <button onClick={handleSave} disabled={loading}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
