"use client";
import React, { useEffect, useState } from "react";
import { CheckboxProps } from "@mui/material/Checkbox";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import ShareIcon from "@mui/icons-material/Share";
import {
  downloadCertificate,
  renderCertificate,
} from "../../utils/CertificateService/coursesCertificates";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90vw", sm: "85vw", md: "80vw", lg: 900 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: { xs: 2, sm: 3 },
  display: "flex",
  flexDirection: "column",
};
interface CommonCheckboxProps extends CheckboxProps {
  label: string;
  required?: boolean;
  disabled?: boolean;
}

interface CertificateModalProps {
  certificateId?: string;
  open: any;
  setOpen: any;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificateId,
  open,
  setOpen,
}) => {
  // certificateId = 'did:rcw:20f5fe82-4912-401a-a33a-09b46413b9cf'; // temporaory hardcoded
  const handleCloseCertificate = async () => {};
  const [certificateHtml, setCertificateHtml] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [certificateSite, setCertificateSite] = useState("");
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("desktop");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!certificateId) {
        console.log("No certificateId provided");
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching certificate with ID:", certificateId);
        const templateId = localStorage.getItem("templtateId") || "";
        console.log("Using template ID:", templateId);

        const response = await renderCertificate({
          credentialId: certificateId,
          templateId: templateId,
        });
        console.log("Certificate response:", response);
        setCertificateHtml(response);
      } catch (e) {
        console.error("Error fetching certificate:", e);
        // Show a fallback certificate if rendering fails
        setCertificateHtml(`
          <div style="font-family: 'Segoe UI', sans-serif; text-align: center; padding: 40px; background: linear-gradient(to bottom, #fff, #f9f9f9); border: 2px solid #0b3d91; border-radius: 12px; width: 600px; margin: auto;">
            <h1 style="color: #0b3d91; margin-bottom: 0;">CERTIFICATE</h1>
            <h2 style="color: #1565c0; margin-top: 5px;">OF COMPLETION</h2>
            <p style="margin-top: 40px; font-size: 18px;">This Certificate is presented to</p>
            <h2 style="color: #8b0000; font-family: cursive; margin: 16px 0;">Certificate Holder</h2>
            <hr style="width: 60%; margin: 20px auto; border: 1px solid #ccc;" />
            <p style="font-size: 14px; color: #555;">
              for successfully completing the course requirements
            </p>
            <div style="margin-top: 40px;">
              <p style="font-size: 12px; color: #666;">Certificate ID: ${certificateId}</p>
            </div>
          </div>
        `);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    // Check for mobile or tablet in the userAgent string
    if (/mobile|android|touch|webos|iphone|ipad|ipod/i.test(userAgent)) {
      setDeviceType("mobile");
    } else {
      setDeviceType("desktop");
    }
  }, []);

  const CertificatePage: React.FC<{ htmlContent: string }> = ({
    htmlContent,
  }) => {
    const encodedHtml = encodeURIComponent(htmlContent);
    const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
    setCertificateSite(dataUri);
    return (
      <Box sx={{ width: "100%", height: "100%", display: "flex" }}>
        <iframe
          src={dataUri}
          style={{
            width: "100%",
            height: "1200px",
            // minHeight: '800px',
            border: "none",
          }}
        />
      </Box>
    );
  };
  const handleViewCertificate = async (rowData: any) => {
    try {
      const response = await renderCertificate({
        credentialId: rowData.certificateId,
        templateId: localStorage.getItem("templtateId") || "",
      });
      // setCertificateHtml(response);
      // setShowCertificate(true);
    } catch (e) {
      // if (selectedRowData.courseStatus === Status.ISSUED) {
      //   showToastMessage(t('CERTIFICATES.RENDER_CERTIFICATE_FAILED'), 'error');
      // }
    }
  };
  const onDownloadCertificate = async () => {
    try {
      const response = await downloadCertificate({
        credentialId: certificateId,
        templateId: localStorage.getItem("templtateId") || "",
      });

      if (!response) {
        throw new Error("No response from server");
      }

      const blob = new Blob([response], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate_${certificateId}.pdf`; // Set filename
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      //  showToastMessage(
      //   t('CERTIFICATES.DOWNLOAD_CERTIFICATE_SUCCESSFULLY'),
      //   'success'
      // );
    } catch (e) {
      // if (rowData.courseStatus === Status.ISSUED)
      {
        // showToastMessage(t('CERTIFICATES.RENDER_CERTIFICATE_FAILED'), 'error');
      }
      console.error("Error downloading certificate:", e);
    }
  };
  // const [open, setOpen] = useState(true);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const onDownload = () => {
    console.log("Download clicked");
  };

  const onClose = () => {
    console.log("Close clicked");
  };

  // const onShare = () => {
  //   console.log('Share clicked');
  // };
  const onShare = async () => {
    try {
      const response = await downloadCertificate({
        credentialId: certificateId,
        templateId: localStorage.getItem("templtateId") || "",
      });

      const blob = new Blob([response], { type: "application/pdf" });
      const file = new File([blob], `certificate_${certificateId}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Certificate of Completion",
          text: "Here is your certificate!",
          files: [file],
        });
      } else {
        // fallback
        //   const url = window.URL.createObjectURL(blob);
        //   await navigator.clipboard.writeText(url);
        //   alert('Link to certificate copied! Direct sharing not supported.');
        //
        setShowShareOptions(true);
      }
    } catch (error) {
      console.error("Sharing failed:", error);
      alert("Unable to share certificate.");
    }
  };
  const handleNativeShare = async () => {
    setShowShareOptions(false);
    try {
      const response = await downloadCertificate({
        credentialId: certificateId,
        templateId: localStorage.getItem("templtateId") || "",
      });

      const blob = new Blob([response], { type: "application/pdf" });
      const file = new File([blob], `certificate_${certificateId}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Certificate",
          text: "Here is your certificate!",
          files: [file],
        });
      } else {
        alert("Your browser does not support file sharing.");
      }
    } catch (error) {
      console.error("Native sharing failed:", error);
      alert("Unable to share.");
    }
  };
  const shareViaEmail = async () => {
    try {
      // Fetching the certificate PDF
      const response = await downloadCertificate({
        credentialId: certificateId,
        templateId: localStorage.getItem("templtateId") || "",
      });

      const blob = new Blob([response], { type: "application/pdf" });
      const file = new File([blob], `certificate_${certificateId}.pdf`, {
        type: "application/pdf",
      });

      // Create a downloadable URL for the PDF
      const fileUrl = URL.createObjectURL(file);

      // Generate a mailto link with the PDF link as the body
      const subject = encodeURIComponent("Certificate of Completion");
      const body = encodeURIComponent(`Here is your certificate: ${fileUrl}`);

      window.open(`mailto:?subject=${subject}&body=${body}`);
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Unable to share certificate via email.");
    }
  };

  const handleCopyLink = async () => {
    setShowShareOptions(false);
    const url = `https://example.com/certificate/${certificateId}`;
    await navigator.clipboard.writeText(url);
    alert("Certificate link copied to clipboard!");
  };

  const handleShareWhatsApp = () => {
    setShowShareOptions(false);
    const url = `https://example.com/certificate/${certificateId}`;
    const whatsappUrl = `https://wa.me/?text=Check%20this%20certificate:%20${encodeURIComponent(
      url
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  //   const certificateHtml = `
  //   <div style="font-family: 'Segoe UI', sans-serif; text-align: center; padding: 40px; background: linear-gradient(to bottom, #fff, #f9f9f9); border: 2px solid #0b3d91; border-radius: 12px; width: 600px; margin: auto;">
  //     <h1 style="color: #0b3d91; margin-bottom: 0;">CERTIFICATE</h1>
  //     <h2 style="color: #1565c0; margin-top: 5px;">OF COMPLETION</h2>
  //     <p style="margin-top: 40px; font-size: 18px;">This Certificate is presented to</p>
  //     <h2 style="color: #8b0000; font-family: cursive; margin: 16px 0;">Lorem Ipsum Dola</h2>
  //     <hr style="width: 60%; margin: 20px auto; border: 1px solid #ccc;" />
  //     <p style="font-size: 14px; color: #555;">
  //       on the occasion of Lorem Ipsum Dolor held on 00th November 2023 at the Lorem Ipsum Dolor
  //     </p>

  //     <div style="display: flex; justify-content: space-between; margin-top: 60px; padding: 0 40px;">
  //       <div>
  //         <div style="border-top: 1px solid #000; width: 120px; margin: auto;"></div>
  //         <p style="margin: 5px 0;">Principal</p>
  //       </div>
  //       <div>
  //         <div style="border-top: 1px solid #000; width: 120px; margin: auto;"></div>
  //         <p style="margin: 5px 0;">Director</p>
  //       </div>
  //     </div>

  //     <div style="position: absolute; bottom: 20px; left: 20px;">
  //       <div style="width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle, #1976d2, #0b3d91); border: 4px solid gold;"></div>
  //     </div>
  //   </div>
  // `;

  return (
    <>
      {/* <Button variant="contained" onClick={handleOpen}>
        Open Modal
      </Button> */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            ...style,
            overflow: "auto",
            // display: 'flex',
            // flexDirection: 'column',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Certificate</Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Download">
                <IconButton onClick={onDownloadCertificate}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              {deviceType === "mobile" && (
                <Tooltip title="Share">
                  <IconButton onClick={onShare}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Close">
                <IconButton onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Box sx={{ maxHeight: "80vh", overflowY: "auto" }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "400px",
                }}
              >
                <Typography variant="h6">Loading Certificate...</Typography>
              </Box>
            ) : certificateHtml ? (
              <CertificatePage htmlContent={certificateHtml} />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "400px",
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Certificate not available
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>
      {/* <Dialog
        open={showShareOptions}
        onClose={() => setShowShareOptions(false)}
      >
        <DialogTitle>Select Share Option</DialogTitle>
        <DialogContent>
          <List>
            <ListItemButton onClick={shareViaEmail}>
              <ListItemText primary="Share via Email" />
            </ListItemButton>
            <ListItemButton onClick={handleCopyLink}>
              <ListItemText primary="Copy Link" />
            </ListItemButton>
            <ListItemButton onClick={handleShareWhatsApp}>
              <ListItemText primary="WhatsApp" />
            </ListItemButton>
          </List>
        </DialogContent>
      </Dialog> */}
    </>
  );
};
export default CertificateModal;
