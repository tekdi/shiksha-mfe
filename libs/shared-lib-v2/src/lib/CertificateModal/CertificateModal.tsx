"use client";
import React, { useEffect, useState } from "react";
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

// Declaring html2pdf for TypeScript
declare const html2pdf: any;

const DEFAULT_TEMPLATE_ID = 'cm7nbogii000moc3gth63l863';

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "98vw", sm: "95vw", md: "90vw", lg: "85vw" },
  maxWidth: 1200,
  maxHeight: "95vh",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: { xs: 1, sm: 2, md: 3 },
  display: "flex",
  flexDirection: "column",
};

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
  const [certificateHtml, setCertificateHtml] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!certificateId) return;

      try {
        setLoading(true);
        const templateId = localStorage.getItem("templateId") || localStorage.getItem("templtateId") || DEFAULT_TEMPLATE_ID;
        
        const response = await renderCertificate({
          credentialId: certificateId,
          templateId: templateId,
        });

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
          
          const firstName = isValid(lFirstName)
  ? lFirstName!.toString().trim()
  : "";

const lastName = isValid(lLastName)
  ? lLastName!.toString().trim()
  : "";

let holderName = "Learner";

// Priority 1 → firstName + lastName
if (firstName || lastName) {
  holderName = `${firstName} ${lastName}`.trim();
}

// Priority 2 → explicit userName
else if (isValid(userName)) {
  holderName = userName!.toString().trim();
}

// Priority 3 → generic name
else if (isValid(lName)) {
  holderName = lName!.toString().trim();
}
          
          let levelName = 'Swadhaar Course';
          if (isValid(courseName)) {
            levelName = courseName!.toString().trim();
          }
          
          const certNo = certificateId || 'N/A';
          const logoUrl = typeof window !== 'undefined' ? (window.location.origin + "/images/swadhar_logo.png") : "/images/swadhar_logo.png";

          // Dynamically convert logo to Base64 to prevent CORS issues and guarantee text rendering
          const logoBase64 = await new Promise<string>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = logoUrl;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
              } else {
                resolve("");
              }
            };
            img.onerror = () => resolve("");
            // Timeout to prevent hanging if image fails
            setTimeout(() => resolve(""), 2000);
          });

          
          const swadhaarTemplate = `
 <div id="swadhaar-pdf-target" style="width: 1122px; height: 794px; background-color: #fff; position: relative; font-family: 'Montserrat', sans-serif; box-sizing: border-box; overflow: hidden; color: #333; display: flex; flex-direction: column; border-top: 60px solid #53331F; padding: 60px 80px;">
     <style>
         @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,700;1,400&display=swap');
     </style>
     <div style="margin-bottom: 20px;">
         <img src="${logoBase64}" alt="Swadhaar Logo" style="height: 70px; object-fit: contain; display: ${logoBase64 ? 'block' : 'none'};">
     </div>
    <h1 style="font-size: 56px; margin: 0 0 30px 0; font-weight: 500; color: #53331F;">Certificate of Completion</h1>
    <div style="text-transform: uppercase; letter-spacing: 0.25em; font-size: 20px; margin-bottom: 20px; color: #666;">This certificate is presented to</div>
    <div style="font-size: 64px; font-style: italic; border-bottom: 4px solid #F7941D; display: block; width: 90%; margin-bottom: 40px; padding-bottom: 10px; font-weight: 700; color: #53331F !important; line-height: 1.2;">${holderName}</div>
    <div style="margin-top: 15px; font-size: 24px; color: #444;">
        <div style="margin-bottom: 15px;">For successfully completing the</div>
        <div style="font-size: 36px; font-weight: 700; border-bottom: 2px solid #ddd; display: block; width: 100%; margin-top: 15px; padding-bottom: 10px; color: #F7941D; line-height: 1.4;">${levelName || "Swadhaar Course"}</div>
    </div>

    <div style="position: absolute; bottom: -20px; right: -20px; width: 180px; height: 160px; background: #F7941D; border-radius: 50%; opacity: 0.8; z-index: 1;"></div>
    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 120px; background: #53331F; clip-path: polygon(0 40%, 100% 0, 100% 100%, 0 100%);"></div>
</div>
`;
          setCertificateHtml(swadhaarTemplate);
        } else {
          setCertificateHtml(response);
        }
      } catch (e) {
        console.error("Error fetching certificate:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId, userName, courseName]);

  const onDownloadCertificate = async () => {
    try {
      setLoading(true);
      
      const isSwadhaar = typeof window !== 'undefined' && 
        (window.location.hostname.includes('swadhaar') || 
         localStorage.getItem('tenantName')?.toLowerCase().includes('swadhaar') ||
         localStorage.getItem('userProgram')?.toLowerCase().includes('swadhaar'));

      if (isSwadhaar && certificateHtml) {
        if (typeof html2pdf === 'undefined') {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load html2pdf library'));
            document.head.appendChild(script);
          });
        }

        const holderName = userName || localStorage.getItem('firstName') || localStorage.getItem('name') || 'Learner';
        const safeName = holderName.toString().trim().replace(/\s+/g, '_');
        const fileName = `Swadhaar_Certificate_${safeName}.pdf`;

        // Instead of a hidden div, we'll try to use the library's ability to parse strings
        // and we'll ensure we use a worker to avoid blank page issues
        const opt = {
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        // Generating from HTML string directly
        await html2pdf().set(opt).from(certificateHtml).save();
        setLoading(false);
        return;
      }

      // Fallback
      const response = await downloadCertificate({
        credentialId: certificateId,
        templateId: localStorage.getItem("templateId") || localStorage.getItem("templtateId") || DEFAULT_TEMPLATE_ID,
      });

      if (!response || response.size === 0) throw new Error("No response from server");

      const blob = new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const holderName = userName || localStorage.getItem('firstName') || localStorage.getItem('name') || 'Learner';
      const safeName = holderName.toString().trim().replace(/\s+/g, '_');
      a.download = `Swadhaar_Certificate_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error downloading certificate:", e);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onShare = async () => {
    try {
      setLoading(true);

      const isSwadhaar = typeof window !== 'undefined' &&
        (window.location.hostname.includes('swadhaar') ||
         localStorage.getItem('tenantName')?.toLowerCase().includes('swadhaar') ||
         localStorage.getItem('userProgram')?.toLowerCase().includes('swadhaar'));

      const holderName = userName || localStorage.getItem('firstName') || localStorage.getItem('name') || 'Learner';
      const safeName = holderName.toString().trim().replace(/\s+/g, '_');
      const fileName = `Swadhaar_Certificate_${safeName}.pdf`;

      let shareBlob: Blob | null = null;

      if (isSwadhaar && certificateHtml) {
        // Generate PDF blob from the locally-rendered Swadhaar HTML certificate.
        // The backend API (downloadCertificate) does not handle locally-rendered certs.
        if (typeof html2pdf === 'undefined') {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load html2pdf library'));
            document.head.appendChild(script);
          });
        }

        const opt = {
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        };


        // Generate blob output instead of saving directly
        const pdfBlob: Blob = await html2pdf().set(opt).from(certificateHtml).outputPdf('blob');
        shareBlob = pdfBlob;
      } else {
        // Non-Swadhaar: fetch PDF from backend
        const response = await downloadCertificate({
          credentialId: certificateId,
          templateId: localStorage.getItem("templateId") || localStorage.getItem("templtateId") || DEFAULT_TEMPLATE_ID,
        });
        if (!response || response.size === 0) throw new Error("No response from server");
        shareBlob = new Blob([response], { type: "application/pdf" });
      }

      if (!shareBlob) throw new Error("Could not generate certificate for sharing");

      const file = new File([shareBlob], fileName, { type: "application/pdf" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        // Full file share (Android Chrome, iOS Safari 15.1+)
        await navigator.share({
          title: "My Certificate of Completion",
          text: `I just completed ${courseName || 'the course'}!`,
          files: [file],
        });
      } else if (navigator.share) {
        // Text-only fallback (desktop browsers that support share but not file share)
        await navigator.share({
          title: "My Certificate of Completion",
          text: `I just completed ${courseName || 'the course'}! Certificate ID: ${certificateId}`,
        });
      } else {
        // Web Share API not available — fall back to download
        console.warn('[CertificateModal] navigator.share not available, falling back to download');
        const url = URL.createObjectURL(shareBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      // AbortError = user cancelled the share sheet — not a real error
      if (error?.name !== 'AbortError') {
        console.error("Sharing failed:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setOpen(false);

  const CertificatePage: React.FC<{ htmlContent: string }> = ({ htmlContent }) => {
    const encodedHtml = encodeURIComponent(htmlContent);
    const dataUri = `data:text/html;charset=utf-8,${encodedHtml}`;
    return (
      <Box sx={{ width: "100%", height: "auto", display: "flex", justifyContent: "center" }}>
        <iframe
          src={dataUri}
          style={{
            width: "100%",
            aspectRatio: "800 / 560",
            maxHeight: "82vh",
            border: "none",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
          }}
        />
      </Box>
    );
  };

  return (
    <Modal 
      open={open} 
      onClose={(event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          handleClose();
        }
      }}
    >
      <Box sx={style}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Certificate</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Download">
              <IconButton onClick={onDownloadCertificate} disabled={loading}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton onClick={onShare} disabled={loading}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box sx={{ maxHeight: "85vh", overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
              <Typography variant="h6">Processing...</Typography>
            </Box>
          ) : certificateHtml ? (
            <CertificatePage htmlContent={certificateHtml} />
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
              <Typography variant="h6" color="text.secondary">Certificate not available</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default CertificateModal;
