import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Grid, Box, AppBar, Toolbar, Typography, Button, LinearProgress } from '@mui/material';
import { Terminal, RefreshCw } from 'lucide-react';
import SiteCard from './components/SiteCard';

export default function App() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/sites');
      setSites(res.data);
    } catch (e) { console.error("API Error"); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <Box sx={{ bgcolor: '#050505', minHeight: '100vh', color: '#fff', pb: 10 }}>
      <AppBar position="sticky" sx={{ bgcolor: '#000', borderBottom: '1px solid #333' }}>
        <Toolbar>
          <Terminal size={24} style={{ marginRight: 15, color: '#00ff41' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 900, letterSpacing: 2 }}>
            PARROT <span style={{color: '#00ff41'}}>GHOST HUB</span>
          </Typography>
          <Button color="inherit" onClick={loadData} startIcon={<RefreshCw />}>Sync</Button>
        </Toolbar>
        {loading && <LinearProgress color="success" />}
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {sites.map(site => (
            <Grid item xs={12} sm={6} md={4} key={site.id}>
              <SiteCard site={site} onRefresh={loadData} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}