import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider
} from '@mui/material';
import {
  Github,
  Download,
  FolderCheck,
  RefreshCw,
  Plus,
  Mail,
  ExternalLink,
  Link2,
  Copy
} from 'lucide-react';
import GhostControl from './GhostControl';

const SiteCard = ({ site, onRefresh, statsMap }) => {
  const [cloning, setCloning] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [contacts, setContacts] = useState(site.contacts || []);
  const [contactOpen, setContactOpen] = useState(false);
  const [newContact, setNewContact] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState({
    to: site.contacts?.[0] || '',
    subject: `Preview for ${site.name}`,
    body: `Netlify site ${site.name} is ready for review. Open the live preview and validate deployment status.`
  });

  useEffect(() => {
    setContacts(site.contacts || []);
  }, [site.contacts]);

  const siteUrl = site.ssl_url || site.url || site.deploy_url || '';
  const adminUrl = site.admin_url || '';
  const repoUrl = site.repo || '';
  const repoName = site.repo?.split('/').pop().replace('.git', '');
  const containerName = repoName ? `ghost_${repoName.toLowerCase().replace('.', '_')}` : '';
  const containerStats = containerName ? statsMap?.[containerName] : null;

  const previewUrl = useMemo(() => {
    if (!siteUrl) return '';
    const encoded = encodeURIComponent(siteUrl);
    return `https://image.thum.io/get/width/1200/${encoded}`;
  }, [siteUrl]);

  const handleClone = async () => {
    setCloning(true);
    try {
      await axios.post('http://localhost:8000/api/clone', null, { params: { repo_url: site.repo } });
      onRefresh();
    } catch (e) {
      console.error('Clone failed');
    }
    setCloning(false);
  };

  const handleDeleteContact = async (email) => {
    const updated = contacts.filter((contact) => contact !== email);
    setContacts(updated);
    try {
      await axios.post(`http://localhost:8000/api/sites/${site.id}/contacts`, updated);
    } catch (e) {
      console.error('Contact update failed');
    }
  };

  const handleAddContact = async () => {
    if (!newContact.trim()) return;
    const updated = Array.from(new Set([...contacts, newContact.trim()]));
    setContacts(updated);
    setNewContact('');
    setContactOpen(false);
    try {
      await axios.post(`http://localhost:8000/api/sites/${site.id}/contacts`, updated);
    } catch (e) {
      console.error('Contact update failed');
    }
  };

  const handleSendEmail = async () => {
    const toEmail = emailDraft.to || contacts[0];
    if (!toEmail) return;
    try {
      await axios.post('http://localhost:8000/api/email/send', null, {
        params: { to_email: toEmail, subject: emailDraft.subject, body: emailDraft.body }
      });
      setEmailOpen(false);
    } catch (e) {
      console.error('Email send failed');
    }
  };

  const handleCopy = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      console.error('Copy failed');
    }
  };

  return (
    <Card
      className="site-card"
      sx={{
        bgcolor: 'rgba(10, 16, 28, 0.9)',
        border: '1px solid rgba(122, 155, 196, 0.2)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 22px 45px rgba(5, 8, 15, 0.5)'
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box className="preview-surface" sx={{ height: 180 }}>
          {previewUrl && !previewFailed ? (
            <Box
              component="img"
              src={previewUrl}
              alt={`${site.name} preview`}
              loading="lazy"
              onError={() => setPreviewFailed(true)}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, rgba(89,240,181,0.18), rgba(116,199,255,0.08))'
              }}
            />
          )}
          <Box className="preview-overlay" />
          <Box sx={{ position: 'absolute', inset: 0, p: 2, display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
              <Chip
                size="small"
                label={site.is_running ? `Live :${site.port}` : 'Offline'}
                sx={{ bgcolor: site.is_running ? 'rgba(89,240,181,0.2)' : 'rgba(255,255,255,0.08)' }}
              />
              {siteUrl && (
                <Tooltip title="Open Site">
                  <IconButton
                    size="small"
                    sx={{ color: '#e7f1ff', border: '1px solid rgba(255,255,255,0.2)' }}
                    href={siteUrl}
                    target="_blank"
                  >
                    <ExternalLink size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {site.name}
              </Typography>
              <Typography variant="caption" className="mono" sx={{ color: 'rgba(231,241,255,0.7)' }}>
                {site.id}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            icon={<Github size={14} color={repoUrl ? '#59f0b5' : '#5c6b7f'} />}
            label={repoUrl ? 'Repo Linked' : 'No Repo'}
            size="small"
            variant="outlined"
            sx={{ color: repoUrl ? '#59f0b5' : '#5c6b7f', borderColor: repoUrl ? '#59f0b5' : '#334155' }}
          />
          {site.is_cloned && (
            <Chip
              icon={<FolderCheck size={14} color="#59f0b5" />}
              label="Local Clone"
              size="small"
              sx={{ bgcolor: 'rgba(89,240,181,0.2)', color: '#e7f1ff' }}
            />
          )}
          {siteUrl && <Chip label="URL Ready" size="small" variant="outlined" />}
        </Box>

        <Box sx={{ display: 'grid', gap: 1.2 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Link2 size={16} />}
              disabled={!siteUrl}
              href={siteUrl || undefined}
              target="_blank"
            >
              Visit Site
            </Button>
            <Button
              variant="outlined"
              startIcon={<Github size={16} />}
              disabled={!repoUrl}
              href={repoUrl || undefined}
              target="_blank"
            >
              GitHub Repo
            </Button>
            {adminUrl && (
              <Button variant="outlined" startIcon={<ExternalLink size={16} />} href={adminUrl} target="_blank">
                Admin
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Tooltip title="Copy Site URL">
              <span>
                <Button
                  variant="text"
                  startIcon={<Copy size={14} />}
                  onClick={() => handleCopy(siteUrl)}
                  disabled={!siteUrl}
                >
                  Copy URL
                </Button>
              </span>
            </Tooltip>
            {site.is_running && (
              <Button
                variant="text"
                color="success"
                startIcon={<ExternalLink size={14} />}
                href={`http://localhost:${site.port}`}
                target="_blank"
              >
                Local Preview
              </Button>
            )}
          </Stack>
        </Box>

        {containerStats && (
          <Box
            sx={{
              display: 'grid',
              gap: 0.5,
              p: 1.2,
              borderRadius: 2,
              border: '1px solid rgba(122, 155, 196, 0.2)',
              bgcolor: 'rgba(8, 12, 20, 0.7)'
            }}
          >
            <Typography variant="caption" className="mono" sx={{ color: 'text.secondary' }}>
              CPU {containerStats.cpu || 'n/a'} · MEM {containerStats.mem || 'n/a'} ({containerStats.mem_percent || 'n/a'})
            </Typography>
            {(containerStats.net_io || containerStats.block_io) && (
              <Typography variant="caption" className="mono" sx={{ color: 'text.secondary' }}>
                NET {containerStats.net_io || 'n/a'} · IO {containerStats.block_io || 'n/a'}
              </Typography>
            )}
          </Box>
        )}

        {!site.is_cloned ? (
          <Button
            fullWidth
            variant="contained"
            disabled={!site.repo || cloning}
            startIcon={cloning ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
            onClick={handleClone}
          >
            {cloning ? 'Cloning...' : 'Clone Repo'}
          </Button>
        ) : (
          <GhostControl site={site} onRefresh={onRefresh} />
        )}

        <Divider sx={{ borderColor: 'rgba(122, 155, 196, 0.2)' }} />

        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Review Contacts</Typography>
            <Button variant="text" size="small" startIcon={<Plus size={14} />} onClick={() => setContactOpen(true)}>
              Add
            </Button>
          </Stack>
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {contacts.length === 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                No contacts added yet.
              </Typography>
            )}
            {contacts.map((email) => (
              <Chip
                key={email}
                label={email}
                size="small"
                onDelete={() => handleDeleteContact(email)}
                sx={{ fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.08)' }}
              />
            ))}
          </Box>
        </Box>

        <Button
          fullWidth
          startIcon={<Mail size={14} />}
          variant="outlined"
          onClick={() => setEmailOpen(true)}
          sx={{ mt: 0.5 }}
        >
          Send Preview Email
        </Button>
      </CardContent>

      <Dialog open={contactOpen} onClose={() => setContactOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Reviewer Contact</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Email"
            placeholder="reviewer@domain.com"
            value={newContact}
            onChange={(event) => setNewContact(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddContact}>
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={emailOpen} onClose={() => setEmailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Preview Email</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
          <TextField
            label="To"
            value={emailDraft.to}
            placeholder={contacts[0] || 'recipient@domain.com'}
            onChange={(event) => setEmailDraft({ ...emailDraft, to: event.target.value })}
            fullWidth
          />
          <TextField
            label="Subject"
            value={emailDraft.subject}
            onChange={(event) => setEmailDraft({ ...emailDraft, subject: event.target.value })}
            fullWidth
          />
          <TextField
            label="Body"
            value={emailDraft.body}
            onChange={(event) => setEmailDraft({ ...emailDraft, body: event.target.value })}
            fullWidth
            multiline
            minRows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendEmail}>
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SiteCard;
