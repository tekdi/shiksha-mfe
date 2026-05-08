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
  userName?: string;
  courseName?: string;
  open: any;
  setOpen: any;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificateId,
  userName,
  courseName,
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
        const templateId = localStorage.getItem("templateId") || localStorage.getItem("templtateId") || "";
        console.log("Using template ID:", templateId);

        const response = await renderCertificate({
          credentialId: certificateId,
          templateId: templateId,
        });
        console.log("Certificate response:", response);

        // Check if it's Swadhaar tenant
        const isSwadhaar = typeof window !== 'undefined' && 
          (window.location.hostname.includes('swadhaar') || 
           localStorage.getItem('tenantName')?.toLowerCase().includes('swadhaar') ||
           localStorage.getItem('userProgram')?.toLowerCase().includes('swadhaar'));

        if (isSwadhaar) {
          const isValid = (val: any) => {
            if (!val) return false;
            const s = val.toString().trim();
            return s !== "" && s !== "null" && s !== "undefined";
          };
          
          const lFirstName = typeof window !== 'undefined' ? localStorage.getItem('firstName') : null;
          const lLastName = typeof window !== 'undefined' ? localStorage.getItem('lastName') : null;
          const lName = typeof window !== 'undefined' ? localStorage.getItem('name') : null;
          
          let holderName = 'Learner';
          
          if (isValid(userName)) {
            holderName = userName!.toString().trim();
          } else if (isValid(lFirstName)) {
            holderName = lFirstName!.toString().trim();
            if (isValid(lLastName)) {
              holderName += " " + lLastName!.toString().trim();
            }
          } else if (isValid(lName)) {
            holderName = lName!.toString().trim();
          }
          
          if (!isValid(holderName)) {
            holderName = 'Learner';
          }
          
          const levelName = courseName || 'Swadhaar Course';
          const certNo = certificateId || 'N/A';
          
          console.log("Swadhaar Certificate Final Data:", { holderName, levelName, certNo, raw: { userName, lFirstName, lLastName, lName } });
          
    const logoUrl = typeof window !== 'undefined' ? (window.location.origin + "/images/swadhar_logo.png") : "/images/swadhar_logo.png";
    
    const swadhaarTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,700;1,400&display=swap');
    :root {
        --brown: #53331F;
        --orange: #F7941D;
        --beige: #F5E6D3;
    }
    body {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f0f0f0;
        margin: 0;
        padding: 20px;
        font-family: 'Montserrat', sans-serif;
        box-sizing: border-box;
    }
    .certificate {
        position: relative;
        width: 100%;
        max-width: 800px;
        aspect-ratio: 800 / 560;
        background-color: #fff;
        border-top: 5vw solid var(--brown);
        padding: 5% 7%;
        box-sizing: border-box;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        text-align: left;
        color: #333;
        display: flex;
        flex-direction: column;
    }
    @media (min-width: 800px) {
        .certificate {
            border-top-width: 40px;
        }
    }
    .logo-container {
        margin-bottom: 5%;
    }
    .logo-container img {
        height: 10vw;
        max-height: 80px;
        object-fit: contain;
    }
    h1 {
        font-size: 5.5vw;
        margin: 0 0 4% 0;
        font-weight: 500;
        color: var(--brown);
    }
    @media (min-width: 800px) {
        h1 { font-size: 44px; }
    }
    .presentation-text {
        text-transform: uppercase;
        letter-spacing: 0.25em;
        font-size: 2vw;
        margin-bottom: 3%;
        color: #666;
    }
    @media (min-width: 800px) {
        .presentation-text { font-size: 16px; }
    }
    .holder-name {
        position: relative;
        z-index: 10;
        font-size: 48px;
        font-style: italic;
        font-family: 'Montserrat', Arial, sans-serif;
        border-bottom: 3px solid var(--orange);
        display: block;
        width: 90%;
        margin-bottom: 30px;
        padding-bottom: 5px;
        font-weight: 700;
        color: #53331F !important;
        line-height: 1.2;
        visibility: visible !important;
        opacity: 1 !important;
    }
    @media (max-width: 800px) {
        .holder-name { 
            font-size: 6vw;
            margin-bottom: 4vw;
        }
    }
    .course-details {
        margin-top: 2%;
        font-size: 2.5vw;
        color: #444;
    }
    @media (min-width: 800px) {
        .course-details { font-size: 20px; }
    }
    .course-level {
        font-size: 3.5vw;
        font-weight: 700;
        border-bottom: 1px solid #ddd;
        display: inline-block;
        min-width: 50%;
        margin-top: 1.5%;
        padding-bottom: 0.5%;
        color: var(--orange);
    }
    @media (min-width: 800px) {
        .course-level { font-size: 28px; }
    }
    .cert-no {
        margin-top: auto;
        padding-bottom: 12%;
        font-size: 1.8vw;
        color: #888;
        font-family: monospace;
    }
    @media (min-width: 800px) {
        .cert-no { font-size: 12px; }
    }
    .bottom-accent {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 18%;
        background: var(--brown);
        clip-path: polygon(0 40%, 100% 0, 100% 100%, 0 100%);
    }
    .orange-shape {
        position: absolute;
        bottom: -3%;
        right: -3%;
        width: 18%;
        aspect-ratio: 1;
        background: var(--orange);
        border-radius: 50%;
        opacity: 0.8;
        z-index: 1;
    }
</style>
</head>
<body>
    <div class="certificate">
        <div class="logo-container">
            <img src="${logoUrl}" alt="Swadhaar Logo">
        </div>

        <h1>Certificate of Completion</h1>
        
        <div class="presentation-text">This certificate is presented to</div>
        
        <div class="holder-name">${holderName}</div>

        <div class="course-details">
            <div>For successfully completing the</div>
            <div class="course-level">${levelName}</div>
        </div>

        <div class="cert-no">Certificate No. ${certNo}</div>

        <div class="orange-shape"></div>
        <div class="bottom-accent"></div>
    </div>
</body>
</html>
`;
          setCertificateHtml(swadhaarTemplate);
        } else {
          setCertificateHtml(response);
        }
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
      <Box sx={{ width: "100%", height: "auto", display: "flex", justifyContent: "center" }}>
        <iframe
          src={dataUri}
          style={{
            width: "100%",
            aspectRatio: "800 / 560",
            maxHeight: "75vh",
            border: "none",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        />
      </Box>
    );
  };
  const handleViewCertificate = async (rowData: any) => {
    try {
      const response = await renderCertificate({
        credentialId: rowData.certificateId,
        templateId: localStorage.getItem("templateId") || localStorage.getItem("templtateId") || "",
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
    // Check if it's Swadhaar tenant
    const isSwadhaar = typeof window !== 'undefined' && 
      (window.location.hostname.includes('swadhaar') || 
       localStorage.getItem('tenantName')?.toLowerCase().includes('swadhaar') ||
       localStorage.getItem('userProgram')?.toLowerCase().includes('swadhaar'));

    // For Swadhaar, we prefer printing the custom design we've built for the preview
    if (isSwadhaar && certificateHtml) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      iframe.contentWindow?.document.open();
      iframe.contentWindow?.document.write(certificateHtml);
      
      // Add print-specific styles to make it look perfect in the print dialog
      const printStyles = `
        <style>
          @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .certificate { 
              box-shadow: none !important; 
              border-top-width: 40px !important;
              width: 100% !important;
              height: 100% !important;
              max-width: none !important;
              aspect-ratio: 800 / 560 !important;
            }
            .orange-shape, .bottom-accent { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      `;
      iframe.contentWindow?.document.write(printStyles);
      iframe.contentWindow?.document.close();

      const triggerPrint = () => {
        if (document.body.contains(iframe)) {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          }, 1000);
        }
      };

      iframe.onload = triggerPrint;
      setTimeout(triggerPrint, 500);
      return;
    }

    try {
      const response = await downloadCertificate({
        credentialId: certificateId,
        templateId: localStorage.getItem("templateId") || localStorage.getItem("templtateId") || "",
      });

      if (!response) {
        throw new Error("No response from server");
      }

      // Check if the response is actually a PDF
      if (response.type === "application/pdf") {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate_${certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: If server returns HTML instead of PDF, use the print dialog
        const text = await response.text();
        // Extract HTML if it's wrapped in a JSON result object (common for some APIs)
        let htmlContent = text;
        try {
          const json = JSON.parse(text);
          if (json.result) htmlContent = json.result;
        } catch (e) {
          // Not JSON, use as is
        }

        if (htmlContent.includes("<") && htmlContent.includes(">")) {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          document.body.appendChild(iframe);
          iframe.contentWindow?.document.open();
          iframe.contentWindow?.document.write(htmlContent);
          iframe.contentWindow?.document.close();

          const triggerPrint = () => {
            if (document.body.contains(iframe)) {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              document.body.removeChild(iframe);
            }
          };

          iframe.onload = triggerPrint;
          setTimeout(triggerPrint, 1000); // Fallback for resources
        } else {
          console.error("Invalid certificate content:", text);
          // showToastMessage("Invalid certificate format received", "error");
        }
      }
    } catch (e) {
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
        templateId: localStorage.getItem("templateId") || localStorage.getItem("templtateId") || "",
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
        templateId: localStorage.getItem("templateId") || localStorage.getItem("templtateId") || "",
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
        templateId: localStorage.getItem("templateId") || localStorage.getItem("templtateId") || "",
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
