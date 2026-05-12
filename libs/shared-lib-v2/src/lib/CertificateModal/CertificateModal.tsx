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
import { getSwadhaarTemplate } from "./templateFuction";

declare const html2pdf: any;

const DEFAULT_TEMPLATE_ID = "cm7nbogii000moc3gth63l863";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {
    xs: "98vw",
    sm: "95vw",
    md: "92vw",
    lg: "90vw",
  },
  maxWidth: "1600px",
  maxHeight: "96vh",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 2,
  display: "flex",
  flexDirection: "column",
};

interface CertificateModalProps {
  certificateId?: string;
  userName?: string;
  courseName?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CertificatePage: React.FC<{
  htmlContent: string;
}> = ({ htmlContent }) => {

  const encodedHtml =
    encodeURIComponent(htmlContent);

  const dataUri =
    `data:text/html;charset=utf-8,${encodedHtml}`;

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "1400px",

          aspectRatio: "16 / 9",

          borderRadius: "12px",

          overflow: "hidden",

          background: "#fff",

          boxShadow:
            "0 6px 20px rgba(0,0,0,0.12)",
        }}
      >
        <iframe
          src={dataUri}
          title="Certificate Preview"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      </Box>
    </Box>
  );
};

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

        const templateId =
          localStorage.getItem("templateId") ||
          localStorage.getItem("templtateId") ||
          DEFAULT_TEMPLATE_ID;

        const response = await renderCertificate({
          credentialId: certificateId,
          templateId,
        });

        const isSwadhaar =
          typeof window !== "undefined" &&
          (window.location.hostname.includes("swadhaar") ||
            localStorage
              .getItem("tenantName")
              ?.toLowerCase()
              .includes("swadhaar") ||
            localStorage
              .getItem("userProgram")
              ?.toLowerCase()
              .includes("swadhaar"));

        if (isSwadhaar) {
          const isValid = (val: any) => {
            if (!val) return false;
            const s = val.toString().trim();
            return (
              s !== "" &&
              s !== "null" &&
              s !== "undefined"
            );
          };

          const lFirstName = typeof window !== "undefined" ? localStorage.getItem("firstName") : null;
          const lLastName = typeof window !== "undefined" ? localStorage.getItem("lastName") : null;
          const lName = typeof window !== "undefined" ? localStorage.getItem("name") : null;

          const firstName = isValid(lFirstName) ? lFirstName!.toString().trim() : "";
          const lastName = isValid(lLastName) ? lLastName!.toString().trim() : "";

          let holderName = "Learner";
          if (firstName || lastName) {
            holderName = `${firstName} ${lastName}`.trim();
          } else if (isValid(userName)) {
            holderName = userName!.toString().trim();
          } else if (isValid(lName)) {
            holderName = lName!.toString().trim();
          }

          let levelName = "Swadhaar Course";
          if (isValid(courseName)) {
            levelName = courseName!.toString().trim();
          }

          const logoUrl = typeof window !== "undefined"
              ? window.location.origin + "/images/swadhar_logo.png"
              : "/images/swadhar_logo.png";

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
            setTimeout(() => resolve(""), 2000);
          });

          const swadhaarTemplate = getSwadhaarTemplate({
            holderName,
            levelName,
            logoBase64,
            isPdf: false,
          });
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

  const generatePdf = async () => {
    let wrapper: HTMLDivElement | null = null;
    try {
      const loadScript = (src: string) =>
        new Promise<void>((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
          document.body.appendChild(script);
        });

      await Promise.all([
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      ]);

      const html2canvas = (window as any).html2canvas;
      const jsPDF = (window as any).jspdf.jsPDF;

      const holderName = userName || localStorage.getItem("firstName") || localStorage.getItem("name") || "Learner";
      const safeName = holderName.replace(/\s+/g, "_");

      const logoUrl = `${window.location.origin}/images/swadhar_logo.png`;
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
      });

      const html = getSwadhaarTemplate({
        holderName,
        levelName: courseName || "Swadhaar Course",
        logoBase64,
        isPdf: true,
      });

      wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.top = "0";
      wrapper.style.left = "-2000px"; // Off-screen but "visible"
      wrapper.style.width = "1600px";
      wrapper.style.height = "900px";
      wrapper.style.zIndex = "-9999";
      wrapper.style.opacity = "0";
      wrapper.style.pointerEvents = "none";
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper);

      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 1000));

      const element = wrapper.querySelector("#certificate-pdf") as HTMLElement;
      if (!element) throw new Error("Certificate element not found");

      // Ensure dimensions are captured correctly
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: true,
        width: 1600,
        height: 900,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector("#certificate-pdf") as HTMLElement;
          if (clonedElement) {
            clonedElement.style.visibility = "visible";
            clonedElement.style.opacity = "1";
          }
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1600, 900],
        compress: true
      });

      pdf.addImage(imgData, "JPEG", 0, 0, 1600, 900);
      const pdfBlob = pdf.output("blob");

      return { pdf, pdfBlob, safeName };
    } finally {
      if (wrapper && wrapper.parentNode) {
        document.body.removeChild(wrapper);
      }
    }
  };

  const onDownloadCertificate = async () => {
    try {
      setLoading(true);
      const { pdf, safeName } = await generatePdf();
      pdf.save(`Swadhaar_Certificate_${safeName}.pdf`);
    } catch (e) {
      console.error("Download Error:", e);
      alert("Failed to download certificate.");
    } finally {
      setLoading(false);
    }
  };

  const onShare = async () => {
    try {
      setLoading(true);
      const { pdfBlob, safeName } = await generatePdf();
      const fileName = `Swadhaar_Certificate_${safeName}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "My Certificate of Completion",
          text: `I just completed ${courseName || "the course"}!`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      if ((e as any).name !== "AbortError") {
        console.error("Share Error:", e);
        alert("Failed to share certificate.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setOpen(false);

  return (
    <Modal
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose();
        }
      }}
    >
      <Box sx={style}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Certificate
          </Typography>
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

        <Box sx={{ width: "100%", flex: 1, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {loading ? (
            <Box sx={{ height: "400px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Typography variant="h6">Processing...</Typography>
            </Box>
          ) : certificateHtml ? (
            <CertificatePage htmlContent={certificateHtml} />
          ) : (
            <Box sx={{ height: "400px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Typography variant="h6" color="text.secondary">
                Certificate not available
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default CertificateModal;