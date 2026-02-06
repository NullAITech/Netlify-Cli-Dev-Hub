import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, Box, CircularProgress, IconButton } from '@mui/material';
import { Play, Square, ExternalLink, Terminal } from 'lucide-react';

const GhostControl = ({ site, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const repoName = site.repo?.split("/").pop().replace(".git", "");

  // Polling for logs if running
  useEffect(() => {
    let interval;
    if (site.is_running && showLogs) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`http://localhost:8000/api/ghost/logs/${repoName}`);
          setLogs(res.data.logs);
        } catch (e) { console.error("Log fetch failed"); }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [site.is_running, showLogs, repoName]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (site.is_running) {
        await axios.post(`http://localhost:8000/api/ghost/stop/${repoName}`);
      } else {
        await axios.post(`http://localhost:8000/api/ghost/start/${repoName}`);
      }
      onRefresh();
    } catch (e) { alert("Container Action Failed"); }
    setLoading(false);
  };

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #222' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <Button
          fullWidth
          variant="contained"
          color={site.is_running ? "error" : "secondary"}
          size="small"
          onClick={handleToggle}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : (site.is_running ? <Square size={14} /> : <Play size={14} />)}
        >
          {site.is_running ? "Kill Pod" : "Spawn Pod"}
        </Button>
        
        {site.is_running && (
          <IconButton size="small" sx={{ color: '#00ff41', border: '1px solid #00ff41' }} onClick={() => setShowLogs(!showLogs)}>
            <Terminal size={16} />
          </IconButton>
        )}
      </Box>

      {site.is_running && (
        <Button 
          fullWidth size="small" variant="text" color="success" 
          startIcon={<ExternalLink size={14}/>}
          href={`http://localhost:${site.port}`} target="_blank"
          sx={{ mb: 1, fontSize: '0.7rem' }}
        >
          Open Live App (Port {site.port})
        </Button>
      )}

      {showLogs && site.is_running && (
        <Box sx={{ bgcolor: '#000', p: 1, maxHeight: 120, overflow: 'auto', border: '1px solid #333', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', whiteSpace: 'pre-wrap', color: '#aaa' }}>
            {logs || "Initializing container logs..."}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GhostControl;