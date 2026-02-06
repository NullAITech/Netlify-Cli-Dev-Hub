import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Box, Chip, Button, IconButton } from '@mui/material';
import { Github, Download, FolderCheck, RefreshCw, Plus, Mail } from 'lucide-react';
import GhostControl from './GhostControl';
import SmtpSettings from './SmtpSettings';

const SiteCard = ({ site, onRefresh }) => {
  const [cloning, setCloning] = useState(false);

  const handleClone = async () => {
    setCloning(true);
    try {
      await axios.post(`http://localhost:8000/api/clone`, null, { params: { repo_url: site.repo } });
      onRefresh();
    } catch (e) {
      console.error("Clone failed");
    }
    setCloning(false);
  };

  return (
    <Card sx={{ bgcolor: '#111', color: '#fff', border: '1px solid #333', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>{site.name}</Typography>
        <Typography variant="caption" sx={{ color: '#666', fontFamily: 'monospace', display: 'block', mb: 1 }}>
          ID: {site.id}
        </Typography>
        
        <Box sx={{ my: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            icon={<Github size={14} color={site.repo ? "#00ff41" : "#666"} />} 
            label={site.repo ? "Repo Found" : "No Repo"} 
            size="small" 
            variant="outlined"
            sx={{ color: site.repo ? '#00ff41' : '#666', borderColor: site.repo ? '#00ff41' : '#444' }}
          />
          {site.is_cloned && (
            <Chip icon={<FolderCheck size={14} color="#00ff41"/>} label="Local" size="small" sx={{ bgcolor: '#1b5e20', color: '#fff' }} />
          )}
        </Box>

        {!site.is_cloned ? (
          <Button 
            fullWidth 
            variant="contained" 
            disabled={!site.repo || cloning}
            startIcon={cloning ? <RefreshCw className="animate-spin" size={16}/> : <Download size={16}/>}
            onClick={handleClone}
          >
            {cloning ? "Cloning..." : "Clone Repo"}
          </Button>
        ) : (
          <GhostControl site={site} onRefresh={onRefresh} />
        )}
     <SmtpSettings />
<Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
  {site.contacts?.map(email => (
    <Chip 
      key={email} 
      label={email} 
      size="small" 
      onDelete={() => handleDeleteContact(email)}
      sx={{ fontSize: '0.6rem', bgcolor: '#333' }}
    />
  ))}
  <IconButton size="small" onClick={() => setAddContactOpen(true)}><Plus size={14}/></IconButton>
</Box>

<Button 
  fullWidth 
  startIcon={<Mail size={14}/>} 
  sx={{ mt: 1 }} 
  variant="outlined"
  onClick={() => handleSendEmail(site)}
>
  Email Preview
</Button>
      </CardContent>
    </Card>
  );
};

export default SiteCard;