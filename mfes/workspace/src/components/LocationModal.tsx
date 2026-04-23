import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import useGeolocation from "./useGeoLocation";
import { useTranslation } from "next-i18next";
import ConfirmationModal from "./ConfirmationModal";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: GeolocationPosition) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { getLocation, error } = useGeolocation();
  const { t } = useTranslation();
  const handleConfirm = async () => {
    const location = await getLocation(true);

    if (location !== null) {
      onConfirm(location as unknown as GeolocationPosition); // TypeScript now knows location is not null
    } else {
      console.error("Location could not be retrieved");
      // Handle the null case here, e.g., show an error message to the user
    }
  };

  return (
    <ConfirmationModal
      message={"Device location is needed to mark your attendance"}
      handleAction={handleConfirm}
      buttonNames={{
        primary: "Turn on",
        secondary: "Go back",
      }}
      handleCloseModal={onClose}
      modalOpen={isOpen}
    />
  );
};

export default LocationModal;
