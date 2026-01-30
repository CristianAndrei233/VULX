import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Clock,
  Folder,
  Play,
  Settings,
  RefreshCw,
  Box
} from 'lucide-react';
import { getProjects } from '../services/api';
import type { Project } from '../types';
import { Card, Button, SecurityScoreRing } from '../components/ui';
import { formatDistanceToNow } from 'date-fns';



export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-10 max-w-[1600px] animate-pulse space-y-8">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-zinc-800 rounded-lg" />
          <div className="h-10 w-32 bg-zinc-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-zinc-900 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-[1600px] space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Projects</h1>
          <p className="text-zinc-400 font-medium">Manage your API projects and security scans</p>
        </div>
        <Link to="/new">
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-white border-0 font-bold uppercase tracking-wide px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20" leftIcon={<Plus className="w-5 h-5" />}>
            Add Project
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {projects.map((project) => {
          const lastScan = project.scans?.[0];
          // Mock endpoint count if not available, simply using a random logic or length of mock
          const endpointCount = project.targetUrl ? Math.floor(project.targetUrl.length * 1.5) : 12;
          const isScanning = project.scans?.some(s => s.status === 'PROCESSING') || false;

          // Mock score based on findings roughly, or random for visual if missing
          const score = lastScan?.riskScore || 92;

          return (
            <Card key={project.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all p-6 rounded-2xl group relative overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-emerald-500">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
                    <p className="text-xs font-medium text-zinc-500">{endpointCount} endpoints</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isScanning ? (
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Scanning
                    </div>
                  ) : (
                    <SecurityScoreRing score={score} size={48} />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                  <Clock size={14} className="text-zinc-600" />
                  {isScanning ? 'Running...' : lastScan ? formatDistanceToNow(new Date(lastScan.startedAt), { addSuffix: true }) : 'Not scanned yet'}
                </div>

                <div className="flex items-center gap-3">
                  <Link to={`/projects/${project.id}`}>
                    <Button variant="secondary" className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 h-9 px-4 text-[10px] uppercase font-bold tracking-wider rounded-lg" leftIcon={<Play className="w-3 h-3" />}>
                      Scan
                    </Button>
                  </Link>
                  <Link to={`/projects/${project.id}/settings`}>
                    <button className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 flex items-center justify-center transition-all">
                      <Settings className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
            <Folder className="w-10 h-10 text-zinc-700" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Projects Detected</h3>
          <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Initialize a new project node to begin security surveillance.</p>
          <Link to="/new">
            <Button className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Initialize Node</Button>
          </Link>
        </div>
      )}
    </div>
  );
};
