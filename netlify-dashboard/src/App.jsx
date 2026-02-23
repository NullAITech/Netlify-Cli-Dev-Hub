import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  LinearProgress,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import { Terminal, RefreshCw, Search, Globe2, Layers, Wifi, Settings, Pause, Play, Sparkles } from 'lucide-react';
import SiteCard from './components/SiteCard';
import SmtpSettings from './components/SmtpSettings';
import { formatBytes, parseCpuPercent, parseMemUsage } from './utils';

export default function App() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [statsMap, setStatsMap] = useState({});
  const [statsPaused, setStatsPaused] = useState(false);
  const [lastStatsAt, setLastStatsAt] = useState(null);
  const [motionReduced, setMotionReduced] = useState(false);

  useEffect(() => {
    let audioCtx = null;
    const playClick = () => {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const duration = 0.06;
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1200;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.04;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();
      } catch (e) {
        console.error('Click sound failed');
      }
    };

    const handler = (event) => {
      const target = event.target?.closest('button, [role=\"button\"], a');
      if (!target) return;
      if (target.hasAttribute('data-silent-click')) return;
      playClick();
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/sites');
      setSites(res.data);
    } catch (e) {
      console.error('API Error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadStats = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/ghost/stats');
      const stats = res.data?.containers || [];
      const nextMap = {};
      stats.forEach((item) => {
        if (item.name) nextMap[item.name] = item;
      });
      setStatsMap(nextMap);
      setLastStatsAt(new Date());
    } catch (e) {
      console.error('Stats fetch failed');
    }
  };

  useEffect(() => {
    if (statsPaused) return undefined;
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [statsPaused]);

  const handleStopAll = async () => {
    try {
      await axios.post('http://localhost:8000/api/ghost/stop-all');
      await loadData();
      await loadStats();
    } catch (e) {
      console.error('Stop all failed');
    }
  };

  const summary = useMemo(() => {
    const entries = Object.values(statsMap);
    const totalCpu = entries.reduce((sum, item) => sum + parseCpuPercent(item?.cpu), 0);
    const memTotals = entries.reduce(
      (acc, item) => {
        const { usedBytes, limitBytes } = parseMemUsage(item?.mem);
        acc.used += usedBytes;
        acc.limit += limitBytes;
        return acc;
      },
      { used: 0, limit: 0 }
    );
    return {
      cpu: totalCpu,
      memUsed: formatBytes(memTotals.used),
      memLimit: formatBytes(memTotals.limit)
    };
  }, [statsMap]);

  const stats = useMemo(() => {
    const total = sites.length;
    const cloned = sites.filter((site) => site.is_cloned).length;
    const running = sites.filter((site) => site.is_running).length;
    return { total, cloned, running };
  }, [sites]);

  const filteredSites = useMemo(() => {
    if (!filter.trim()) return sites;
    const term = filter.toLowerCase();
    return sites.filter((site) => {
      const fields = [site.name, site.repo, site.url, site.ssl_url, site.admin_url].filter(Boolean);
      return fields.some((value) => value.toLowerCase().includes(term));
    });
  }, [sites, filter]);

  return (
    <Box className={`app-shell${motionReduced ? ' reduce-motion' : ''}`} sx={{ pb: 12 }}>
      <Box className="grid-overlay" />
      <Box className="noise-overlay" />
      <Box className="floating-orb orb-one" />
      <Box className="floating-orb orb-two" />
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(6, 10, 16, 0.7)',
          borderBottom: '1px solid rgba(122, 155, 196, 0.15)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <Toolbar sx={{ display: 'flex', gap: 2 }}>
          <Terminal size={26} style={{ color: '#59f0b5' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              PARROT <span style={{ color: '#59f0b5' }}>GHOST HUB</span>
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(152,176,200,0.75)' }}>
              NullAI Netlify Control Plane for Parrot OS
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => setSmtpOpen(true)}
              startIcon={<Settings size={18} />}
            >
              SMTP
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => setStatsPaused((prev) => !prev)}
              startIcon={statsPaused ? <Play size={16} /> : <Pause size={16} />}
            >
              {statsPaused ? 'Resume Stats' : 'Pause Stats'}
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => setMotionReduced((prev) => !prev)}
              startIcon={<Sparkles size={16} />}
            >
              {motionReduced ? 'Motion Low' : 'Motion High'}
            </Button>
            <Typography variant="caption" className="mono" sx={{ color: 'text.secondary' }}>
              {lastStatsAt ? `Updated ${lastStatsAt.toLocaleTimeString()}` : 'Stats warming...'}
            </Typography>
            <Button color="inherit" variant="outlined" onClick={handleStopAll}>
              Kill All Pods
            </Button>
            <Button
              color="inherit"
              variant="contained"
              onClick={loadData}
              startIcon={<RefreshCw size={18} />}
            >
              Sync
            </Button>
          </Stack>
        </Toolbar>
        {loading && <LinearProgress color="success" />}
      </AppBar>

      <Container sx={{ position: 'relative', zIndex: 1, mt: 6 }}>
        <Box
          className="glass-panel glass-panel--hero"
          sx={{
            p: { xs: 3, md: 5 },
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }
          }}
        >
          <Box>
            <Typography variant="overline" className="section-title">
              Local Netlify Fleet
            </Typography>
            <Typography variant="h3" sx={{ mt: 1, mb: 2 }}>
              Orchestrate every site, repo, and local preview from a single cinematic console.
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 540 }}>
              Sync Netlify CLI sites, clone repos, spawn pod containers, and launch live previews. Everything stays local
              to your Parrot OS environment, with instant visibility and zero context switching.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap' }}>
              <Box className="stat-pill">
                <Globe2 size={16} /> {stats.total} sites
              </Box>
              <Box className="stat-pill">
                <Layers size={16} /> {stats.cloned} cloned
              </Box>
              <Box className="stat-pill">
                <Wifi size={16} /> {stats.running} running
              </Box>
              <Tooltip title="CPU is summed across all ghost_* containers. Memory is the sum of used/limit per pod.">
                <Box className="stat-pill">
                  CPU {summary.cpu.toFixed(1)}% · MEM {summary.memUsed} / {summary.memLimit}
                </Box>
              </Tooltip>
            </Stack>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              alignContent: 'center'
            }}
          >
            <Box className="glass-panel glass-panel--heavy" sx={{ p: 3, bgcolor: 'rgba(11, 16, 28, 0.7)' }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Focused Search
              </Typography>
              <TextField
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter by site, repo, or URL"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            <Box className="glass-panel glass-panel--heavy" sx={{ p: 3, bgcolor: 'rgba(11, 16, 28, 0.7)' }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                System Mode
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Chip label="Netlify CLI" variant="outlined" />
                <Chip label="Podman" variant="outlined" />
                <Chip label="React" variant="outlined" />
                <Chip label="Local-only" variant="outlined" />
              </Stack>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 4,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }
          }}
        >
          <Box className="glass-panel glass-panel--heavy" sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Live Pipelines
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Automated previews from any repo, instantly.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Spawn pods with controlled memory caps and track resource usage live.
            </Typography>
          </Box>
          <Box className="glass-panel glass-panel--heavy" sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Review Flow
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>
              One-click email previews with reviewer tracking.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Keep every stakeholder in the loop with a clean outbound pipeline.
            </Typography>
          </Box>
          <Box className="glass-panel glass-panel--heavy" sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Local Mastery
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Zero cloud dependency, full local control.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Podman containers run entirely on your system with safe limits.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 6, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="overline" className="section-title">
              Live Inventory
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              Site Previews & Deployment Controls
            </Typography>
          </Box>
          <Typography variant="caption" className="mono" sx={{ color: 'text.secondary' }}>
            Showing {filteredSites.length} of {sites.length}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {filteredSites.map((site, index) => (
            <Grid
              item
              xs={12}
              md={6}
              xl={4}
              key={site.id}
              className="stagger-item"
              style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
            >
              <SiteCard site={site} onRefresh={loadData} statsMap={statsMap} />
            </Grid>
          ))}
        </Grid>
      </Container>

      <SmtpSettings open={smtpOpen} onClose={() => setSmtpOpen(false)} />
    </Box>
  );
}
