import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { Address } from '../../types/address';
import { AddressSelectionModal } from '../modules/Header/AddressSelectionModal';

/**
 * Modal that automatically opens when user has no selected location.
 * Uses the same AddressSelectionModal as the home screen LocationSelector.
 * Blocks app usage until user selects a location.
 */
const LocationRequiredModal: React.FC = () => {
  const { selectedAddress, setSelectedAddress } = useAuth();
  const [showModal, setShowModal] = React.useState(false);

  // Auto-open modal when there's no selectedAddress
  useEffect(() => {
    if (!selectedAddress) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [selectedAddress]);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    // Modal will auto-close when selectedAddress is set (via useEffect)
  };

  const handleClose = () => {
    // AddressSelectionModal will prevent closing when needCompulsoryAddress=true and no address
    // But if somehow it closes, we can handle it here
    setShowModal(false);
  };

  return (
    <AddressSelectionModal
      visible={showModal}
      onClose={handleClose}
      onAddressSelect={handleAddressSelect}
      selectedAddress={selectedAddress}
      needCompulsoryAddress={true}
    />
  );
};

export default LocationRequiredModal;
