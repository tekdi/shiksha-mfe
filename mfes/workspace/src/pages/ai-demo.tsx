import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Container, CssBaseline, Divider, Drawer, Grid, IconButton, LinearProgress, List, ListItem, ListItemText, MenuItem, Paper, Stack, Tab, Tabs, TextField, ThemeProvider, Tooltip, Typography, createTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CodeIcon from '@mui/icons-material/Code';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DownloadIcon from '@mui/icons-material/Download';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QuizIcon from '@mui/icons-material/Quiz';
import SettingsIcon from '@mui/icons-material/Settings';
import TerminalIcon from '@mui/icons-material/Terminal';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LaunchIcon from '@mui/icons-material/Launch';
import CloseIcon from '@mui/icons-material/Close';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axios from 'axios';

const API_BASE = '/mfe_workspace/api/ai';
const tekdiBlue = '#005696';
const tekdiOrange = '#F37021';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: tekdiBlue },
    secondary: { main: tekdiOrange },
    success: { main: '#10B981' },
    background: { default: '#F1F5F9', paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B' },
    divider: 'rgba(226, 232, 240, 0.8)',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", "system-ui", "sans-serif"',
    h4: { fontWeight: 800, letterSpacing: '-0.02em', color: tekdiBlue },
    h5: { fontWeight: 700, color: tekdiBlue },
    h6: { fontWeight: 700, color: tekdiBlue },
    subtitle1: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

type Tenant = { tenant_id: string; name: string; logo_text: string; };
type Artifact = { label: string; kind: string; filename: string; download_url: string; };
type JobState = { job_id: string; status: 'queued' | 'running' | 'completed' | 'failed'; workflow: 'document' | 'multimedia'; message: string; result?: any; };

const Terminal = ({ logs }: { logs: string[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <Box
      sx={{
        bgcolor: '#0F172A',
        color: '#10B981',
        p: 2,
        borderRadius: 2,
        fontFamily: '"Fira Code", monospace',
        fontSize: '0.8rem',
        height: 180,
        overflowY: 'auto',
        border: '1px solid #1E293B',
      }}
      ref={scrollRef}
    >
      {logs.map((log, i) => (
        <Typography key={i} variant="body2" component="div" sx={{ fontFamily: 'inherit', mb: 0.5 }}>
          <Box component="span" sx={{ color: '#94A3B8', mr: 1 }}>{`[${new Date().toLocaleTimeString()}]`}</Box>
          <Box component="span" sx={{ color: tekdiOrange, mr: 1 }}>{`>`}</Box>
          {log}
        </Typography>
      ))}
    </Box>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
  <Paper sx={{ p: 3, height: '100%', borderLeft: `4px solid ${color}` }}>
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>{title}</Typography>
      <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800 }}>{value}</Typography>
      <Box sx={{ color, mt: 1, display: 'flex', opacity: 0.8 }}>{icon}</Box>
    </Stack>
  </Paper>
);

const GlossaryTable = ({ glossary }: { glossary: any[] }) => {
  if (!glossary || glossary.length === 0) return null;
  return (
    <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderBottom: '1px solid #E2E8F0' }}>
        <Typography variant="caption" sx={{ fontWeight: 900, color: tekdiBlue, textTransform: 'uppercase' }}>
          Extracted Technical Glossary
        </Typography>
      </Box>
      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {glossary.map((item, index) => (
          <Box key={index} sx={{ p: 2, borderBottom: index === glossary.length - 1 ? 'none' : '1px solid #F1F5F9', '&:hover': { bgcolor: '#FBFDFE' } }}>
            <Typography variant="subtitle2" sx={{ color: tekdiOrange, fontWeight: 700 }}>{typeof item === 'string' ? item : item.term}</Typography>
            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>{typeof item === 'string' ? '' : item.definition}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const TechnicalTrace = ({ title, value }: { title: string; value: unknown }) => (
  <Accordion disableGutters sx={{ bgcolor: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
      <Typography variant="caption" sx={{ color: tekdiBlue, fontWeight: 800, textTransform: 'uppercase' }}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ p: 0 }}>
      <Box component="pre" sx={{ m: 0, p: 2, borderRadius: 1, fontSize: '0.7rem', bgcolor: '#F1F5F9', color: '#475569', maxHeight: 150, overflow: 'auto', border: '1px solid #E2E8F0' }}>
        {JSON.stringify(value, null, 2)}
      </Box>
    </AccordionDetails>
  </Accordion>
);

const ModulePreviewer = ({ open, onClose, moduleData, title }: { open: boolean; onClose: () => void; moduleData: any; title: string }) => {
  if (!moduleData) return null;
  const mcqs = moduleData.mcqs || moduleData.assessment?.mcqs || [];
  const sections = moduleData.structured_sections || moduleData.module_a?.structured_sections || [];
  const chapters = moduleData.chapters || moduleData.module_c?.chapters || [];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 800 }, p: 0 } }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3, bgcolor: tekdiBlue, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 900, opacity: 0.8 }}>PREVIEW & INTERACT</Typography>
            <Typography variant="h5" color="inherit" sx={{ lineHeight: 1.2 }}>{title}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 4, bgcolor: '#F8FAFC' }}>
          <Stack spacing={4}>
            {mcqs.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><QuizIcon color="secondary" /> Assessment Questions</Typography>
                <Stack spacing={3}>
                  {mcqs.map((q: any, i: number) => (
                    <Paper key={i} sx={{ p: 3, borderLeft: `4px solid ${tekdiOrange}` }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>{i + 1}. {q.prompt || q.question}</Typography>
                      <Grid container spacing={2}>
                        {(q.options || []).map((opt: any, j: number) => {
                          const text = typeof opt === 'string' ? opt : opt.option;
                          const isCorrect = typeof opt === 'string' ? opt === q.answer : opt.correct;
                          return (
                            <Grid item xs={12} key={j}>
                              <Button fullWidth variant="outlined" sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5, px: 2, borderColor: isCorrect ? '#10B981' : 'divider', bgcolor: isCorrect ? '#F0FDF4' : 'transparent', color: isCorrect ? '#10B981' : 'text.primary', fontWeight: isCorrect ? 800 : 500, borderLeft: isCorrect ? '4px solid #10B981' : '1px solid divider' }}>
                                {text}
                              </Button>
                            </Grid>
                          );
                        })}
                      </Grid>
                      {q.explanation && <Alert severity="info" sx={{ mt: 2, bgcolor: 'transparent' }}>{q.explanation}</Alert>}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
            {sections.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><AssignmentIcon color="primary" /> Lesson Content</Typography>
                <Stack spacing={3}>
                  {sections.map((section: any, i: number) => (
                    <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Box sx={{ p: 2, bgcolor: tekdiBlue, color: 'white' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>SECTION {i + 1}: {section.heading}</Typography>
                      </Box>
                      <CardContent>
                        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>{section.content}</Typography>
                        {section.key_points?.length > 0 && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#F1F5F9', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: tekdiBlue, display: 'block', mb: 1 }}>KEY POINTS</Typography>
                            {section.key_points.map((pt: string, k: number) => (
                              <Typography key={k} variant="body2" sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                <Box sx={{ color: tekdiOrange }}>•</Box> {pt}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
            {chapters.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><SmartDisplayIcon color="success" /> Video Timeline</Typography>
                <Stack spacing={2}>
                  {chapters.map((chapter: any, i: number) => (
                    <Paper key={i} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip label={chapter.timestamp} sx={{ bgcolor: tekdiOrange, color: 'white', fontWeight: 900 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{chapter.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{chapter.summary}</Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
          <Button variant="contained" size="large" fullWidth startIcon={<CheckCircleIcon />} onClick={onClose}>Review Complete</Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default function AIDemoPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('tekdi');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [multimediaTitle, setMultimediaTitle] = useState('');
  const [multimediaText, setMultimediaText] = useState('');
  const [documentJob, setDocumentJob] = useState<JobState | null>(null);
  const [multimediaJob, setMultimediaJob] = useState<JobState | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [documentApproved, setDocumentApproved] = useState('true');
  const [multimediaApproved, setMultimediaApproved] = useState('true');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const documentPoll = useRef<number | null>(null);
  const multimediaPoll = useRef<number | null>(null);

  useEffect(() => {
    axios.get<Tenant[]>(`${API_BASE}/tenants`).then((res) => {
      setTenants(res.data);
      if (res.data.length > 0 && !res.data.find((t) => t.tenant_id === tenantId)) setTenantId(res.data[0].tenant_id);
    }).catch(() => setError('Gateway offline.'));
  }, []);

  const selectedTenant = useMemo(() => tenants.find((t) => t.tenant_id === tenantId), [tenantId, tenants]);
  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const startPolling = (jobId: string, type: 'document' | 'multimedia') => {
    const setter = type === 'document' ? setDocumentJob : setMultimediaJob;
    const interval = window.setInterval(async () => {
      try {
        const res = await axios.get<JobState>(`${API_BASE}/jobs/${jobId}`);
        setter(res.data);
        if (res.data.message) addLog(res.data.message);
        if (res.data.status === 'completed' || res.data.status === 'failed') {
          window.clearInterval(interval);
          addLog(`${type.toUpperCase()} Process Finished.`);
        }
      } catch (e) { window.clearInterval(interval); }
    }, 2000);
    if (type === 'document') documentPoll.current = interval; else multimediaPoll.current = interval;
  };

  const handleRunDocument = async () => {
    setError(null); setLogs([]); setDocumentJob(null);
    addLog(`System: Starting Document Pipeline...`);
    try {
      const formData = new FormData();
      formData.append('title', documentTitle);
      formData.append('source_text', documentText);
      formData.append('tenant_id', tenantId);
      formData.append('approved', documentApproved);
      if (documentFile) formData.append('file', documentFile);
      const res = await axios.post<JobState>(`${API_BASE}/workflows/document`, formData);
      setDocumentJob(res.data);
      addLog(`Job Created.`);
      startPolling(res.data.job_id, 'document');
    } catch (e) { setError('Pipeline failed.'); }
  };

  const handleRunMultimedia = async () => {
    setError(null); setLogs([]); setMultimediaJob(null);
    addLog(`System: Starting Multimedia Pipeline...`);
    try {
      const formData = new FormData();
      formData.append('title', multimediaTitle);
      formData.append('transcript_text', multimediaText);
      formData.append('tenant_id', tenantId);
      formData.append('approved', multimediaApproved);
      if (mediaFile) formData.append('file', mediaFile);
      const res = await axios.post<JobState>(`${API_BASE}/workflows/multimedia`, formData);
      setMultimediaJob(res.data);
      addLog(`Job Created.`);
      startPolling(res.data.job_id, 'multimedia');
    } catch (e) { setError('Pipeline failed.'); }
  };

  const currentJob = activeTab === 1 ? documentJob : multimediaJob;
  const result = currentJob?.result;
  const processedGlossary = useMemo(() => {
    if (activeTab === 1 && documentText.includes('ACRONYMS')) {
      const lines = documentText.split('\n').filter(l => l && !l.includes('ACRONYMS'));
      return lines.map(line => {
        const parts = line.split(' ');
        return { term: parts[0], definition: parts.slice(1).join(' ') };
      });
    }
    return result?.module_a?.glossary || result?.module_b?.glossary || [];
  }, [documentText, result, activeTab]);

  const handleVisit = (artifact: Artifact) => {
    const isAssessment = artifact.label.toLowerCase().includes('assessment') || artifact.label.toLowerCase().includes('quiz') || artifact.label.toLowerCase().includes('question');
    const isLesson = artifact.label.toLowerCase().includes('lesson') || artifact.label.toLowerCase().includes('presentation');
    setPreviewTitle(artifact.label);
    if (isAssessment) setPreviewData(result?.module_b);
    else if (isLesson) setPreviewData(result?.module_d || result?.module_a);
    else if (activeTab === 2) setPreviewData(result?.module_c);
    else setPreviewData(result);
    setPreviewOpen(true);
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box sx={{ width: 280, minWidth: 280, borderRight: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'flex' }, flexDirection: 'column', bgcolor: '#FFFFFF', zIndex: 10 }}>
          <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: tekdiBlue, borderRadius: 1.5 }}><AutoAwesomeIcon /></Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.1rem' }}>SHIKSHA AI</Typography>
              <Typography variant="caption" sx={{ color: tekdiOrange, fontWeight: 900 }}>ENGINE v2.0</Typography>
            </Box>
          </Box>
          <Box sx={{ px: 2, flex: 1 }}>
            <Stack spacing={1}>
              {[ { label: 'Overview', icon: <DashboardIcon />, id: 0 }, { label: 'Document Studio', icon: <MenuBookIcon />, id: 1 }, { label: 'Multimedia Studio', icon: <OndemandVideoIcon />, id: 2 } ].map((item) => (
                <Button key={item.id} fullWidth variant={activeTab === item.id ? 'contained' : 'text'} onClick={() => setActiveTab(item.id)} startIcon={item.icon} sx={{ justifyContent: 'flex-start', py: 1.5, bgcolor: activeTab === item.id ? tekdiBlue : 'transparent', color: activeTab === item.id ? '#FFFFFF' : 'text.secondary', fontWeight: 800, '&:hover': { bgcolor: activeTab === item.id ? '#004375' : `${tekdiBlue}05` } }}>
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Box>
          <Box sx={{ p: 2, mt: 'auto' }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981' }} />
                <Typography variant="caption" sx={{ fontWeight: 900 }}>LOCAL AI RUNTIME ACTIVE</Typography>
              </Stack>
            </Paper>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ height: 72, bgcolor: '#FFFFFF', borderBottom: '1px solid', borderColor: 'divider', px: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{activeTab === 0 ? 'Dashboard' : activeTab === 1 ? 'Document Studio' : 'Multimedia Studio'}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField select size="small" label="Tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} sx={{ width: 180 }}>
                {tenants.map((t) => <MenuItem key={t.tenant_id} value={t.tenant_id}>{t.name}</MenuItem>)}
              </TextField>
              <Avatar sx={{ bgcolor: tekdiOrange, width: 32, height: 32 }}>{selectedTenant?.name[0] || 'T'}</Avatar>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 0 ? (
              <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
                <Stack spacing={4}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}><StatCard title="Processed Assets" value="1,284" color={tekdiBlue} icon={<TerminalIcon />} /></Grid>
                    <Grid item xs={12} md={3}><StatCard title="Active Workflows" value="48" color={tekdiOrange} icon={<AutoAwesomeIcon />} /></Grid>
                    <Grid item xs={12} md={3}><StatCard title="LMS Artifacts" value="942" color="#10B981" icon={<FolderZipIcon />} /></Grid>
                    <Grid item xs={12} md={3}><StatCard title="System Uptime" value="99.9%" color="#6366F1" icon={<SettingsIcon />} /></Grid>
                  </Grid>
                  <Paper sx={{ p: 6, bgcolor: tekdiBlue, color: 'white', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: -40, right: -40, opacity: 0.1 }}><AutoAwesomeIcon sx={{ fontSize: 320 }} /></Box>
                    <Stack spacing={2} sx={{ position: 'relative', maxWidth: 700 }}>
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>Multimodal AI Learning Content Engine.</Typography>
                      <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem' }}>Ingest raw technical assets to generate interactive, SCORM-compliant micro-learning modules entirely on local infrastructure.</Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 2 }}><Button variant="contained" color="secondary" onClick={() => setActiveTab(1)} endIcon={<KeyboardArrowRightIcon />}>Launch Studio</Button></Stack>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', height: '100%', minWidth: 0 }}>
                {/* Input Column */}
                <Box sx={{ width: '45%', minWidth: 500, maxWidth: 650, borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto', p: 4, bgcolor: '#FFFFFF' }}>
                  <Stack spacing={4}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Configuration</Typography>
                        <Button size="small" variant="outlined" startIcon={<MenuOpenIcon />} onClick={() => { if (activeTab === 1) { setDocumentTitle('Enterprise Kubernetes Strategy'); setDocumentText('ACRONYMS\nK8s Kubernetes\nPVC Persistent Volume Claim\nSTS StatefulSet'); } else { setMultimediaTitle('Web Security'); setMultimediaText('Module on XSS, SQLi and CSRF protection.'); } }}>Load Sample</Button>
                      </Stack>
                      <Stack spacing={3}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}><TextField fullWidth label="Project Name" value={activeTab === 1 ? documentTitle : multimediaTitle} onChange={(e) => (activeTab === 1 ? setDocumentTitle(e.target.value) : setMultimediaTitle(e.target.value))} /></Grid>
                          <Grid item xs={12} md={4}><TextField select fullWidth label="Human Gate" value={activeTab === 1 ? documentApproved : multimediaApproved} onChange={(e) => (activeTab === 1 ? setDocumentApproved(e.target.value) : setMultimediaApproved(e.target.value))}><MenuItem value="true">Auto-Publish</MenuItem><MenuItem value="false">Manual Review</MenuItem></TextField></Grid>
                        </Grid>
                        <TextField fullWidth multiline rows={12} label="Source Content / Script" value={activeTab === 1 ? documentText : multimediaText} onChange={(e) => (activeTab === 1 ? setDocumentText(e.target.value) : setMultimediaText(e.target.value))} />
                        <Stack direction="row" spacing={2}>
                          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ flex: 1, borderStyle: 'dashed' }}>
                            {activeTab === 1 ? (documentFile?.name || 'Attach PDF/PPT') : (mediaFile?.name || 'Attach Media')}
                            <input type="file" hidden onChange={(e) => { const f = e.target.files?.[0] || null; activeTab === 1 ? setDocumentFile(f) : setMediaFile(f); }} />
                          </Button>
                          <Button variant="contained" size="large" fullWidth sx={{ flex: 1.5, height: 48, fontWeight: 900 }} disabled={currentJob?.status === 'running'} onClick={activeTab === 1 ? handleRunDocument : handleRunMultimedia} startIcon={<PlayArrowIcon />}>RUN ENGINE</Button>
                        </Stack>
                      </Stack>
                    </Box>
                    <Box><Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1, display: 'block' }}>TELEMETRY</Typography><Terminal logs={logs} /></Box>
                  </Stack>
                </Box>
                {/* Output Column */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 4, bgcolor: '#F8FAFC', minWidth: 400 }}>
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 800 }}>Artifacts</Typography>
                      {!currentJob ? (
                        <Paper variant="outlined" sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'transparent', borderStyle: 'dashed' }}>
                          <AutoAwesomeIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} /><Typography variant="body2" sx={{ color: 'text.secondary' }}>Results will appear here.</Typography>
                        </Paper>
                      ) : currentJob.status === 'running' ? (
                        <Paper variant="outlined" sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#FFFFFF' }}>
                          <CircularProgress size={40} sx={{ mb: 2 }} /><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>AI Inference in Progress...</Typography>
                        </Paper>
                      ) : (
                        <Stack spacing={4}>
                          <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                              <Typography variant="caption" sx={{ color: tekdiBlue, fontWeight: 900, textTransform: 'uppercase' }}>Interactive Gallery</Typography>
                              {(activeTab === 1 ? documentApproved : multimediaApproved) === 'false' ? (
                                <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => { if (activeTab === 1) setDocumentApproved('true'); else setMultimediaApproved('true'); }}>Approve</Button>
                              ) : <Chip icon={<CloudDoneIcon />} label="System Approved" size="small" color="success" variant="outlined" sx={{ fontWeight: 800 }} />}
                            </Stack>
                            <Grid container spacing={2}>
                              {((activeTab === 1 ? result?.module_b : result?.module_c)?.artifacts || []).map((art: any, i: number) => (
                                <Grid item xs={12} key={`b-${i}`}>
                                  <Card variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderWidth: 2, cursor: 'pointer', '&:hover': { borderColor: tekdiBlue, bgcolor: '#F0F9FF', transform: 'translateY(-2px)' }, transition: 'all 0.15s' }} onClick={() => handleVisit(art)}>
                                    <Avatar sx={{ bgcolor: `${tekdiOrange}15`, color: tekdiOrange, borderRadius: 1.5 }}><QuizIcon /></Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>{art.label}</Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}><VisibilityIcon sx={{ fontSize: 14 }} /> Interactive Module</Typography>
                                    </Box>
                                    <Button variant="contained" size="small" sx={{ fontWeight: 800 }}>VISIT</Button>
                                    <IconButton component="a" href={`${API_BASE}${art.download_url}`} download onClick={(e) => e.stopPropagation()} size="small"><FileDownloadIcon fontSize="small" /></IconButton>
                                  </Card>
                                </Grid>
                              ))}
                              {(result?.module_d?.artifacts || []).map((art: any, i: number) => (
                                <Grid item xs={12} key={`d-${i}`}>
                                  <Card variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderWidth: 2, cursor: 'pointer', '&:hover': { borderColor: tekdiBlue, bgcolor: '#F0F9FF', transform: 'translateY(-2px)' }, transition: 'all 0.15s' }} onClick={() => handleVisit(art)}>
                                    <Avatar sx={{ bgcolor: `${tekdiBlue}15`, color: tekdiBlue, borderRadius: 1.5 }}><RocketLaunchIcon /></Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>{art.label}</Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}><VisibilityIcon sx={{ fontSize: 14 }} /> Micro-Lesson</Typography>
                                    </Box>
                                    <Button variant="contained" size="small" sx={{ fontWeight: 800 }}>VISIT</Button>
                                    <IconButton component="a" href={`${API_BASE}${art.download_url}`} download onClick={(e) => e.stopPropagation()} size="small"><FileDownloadIcon fontSize="small" /></IconButton>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                          <Divider />
                          <Box>
                            <Typography variant="caption" sx={{ color: tekdiOrange, fontWeight: 900, mb: 2, display: 'block', textTransform: 'uppercase' }}>Analysis & Insights</Typography>
                            <Stack spacing={3}>
                              <GlossaryTable glossary={processedGlossary} />
                              {activeTab === 1 && result?.module_a?.key_takeaways?.length > 0 && (
                                <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2, bgcolor: '#FFFFFF' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: tekdiBlue, mb: 1.5, display: 'block' }}>EXTRACTED TAKEAWAYS</Typography>
                                  {result?.module_a?.key_takeaways?.map((t: string, i: number) => (<Stack key={i} direction="row" spacing={1.5} sx={{ mb: 1 }}><CheckCircleIcon sx={{ color: tekdiOrange, fontSize: 18, mt: 0.2 }} /><Typography variant="body2">{t}</Typography></Stack>))}
                                </Box>
                              )}
                              {activeTab === 2 && result?.module_c?.chapters?.length > 0 && (
                                <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2, bgcolor: '#FFFFFF' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: tekdiBlue, mb: 1.5, display: 'block' }}>VIDEO CHAPTERS</Typography>
                                  {result?.module_c?.chapters?.map((c: any, i: number) => (<Stack key={i} direction="row" spacing={1.5} sx={{ mb: 1.5 }} alignItems="center"><Chip label={c.timestamp} size="small" sx={{ bgcolor: tekdiOrange, color: 'white', fontWeight: 900 }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{c.label}</Typography></Stack>))}
                                </Box>
                              )}
                            </Stack>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 900, mb: 1, display: 'block' }}>SYSTEM TRACES</Typography>
                            <Stack>{activeTab === 1 ? (<><TechnicalTrace title="Module A" value={result?.module_a} /><TechnicalTrace title="Module B" value={result?.module_b} /></>) : (<><TechnicalTrace title="Module C" value={result?.module_c} /><TechnicalTrace title="Module D" value={result?.module_d} /></>)}</Stack>
                          </Box>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        <ModulePreviewer open={previewOpen} onClose={() => setPreviewOpen(false)} moduleData={previewData} title={previewTitle} />
      </Box>
    </ThemeProvider>
  );
}
