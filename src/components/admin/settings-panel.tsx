'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, Cloud, HardDrive, Wifi, RefreshCw, Key, Save, AlertTriangle, CheckCircle2, XCircle, AlertCircle, Trash2, RotateCcw, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiDelete, ApiError } from '@/lib/api-client';

interface ServiceStatus {
  status: 'connected' | 'error' | 'limited';
  message?: string;
}

interface SystemStatus {
  appwrite: ServiceStatus;
  r2: Record<string, ServiceStatus>;
  d1: ServiceStatus;
  kv: ServiceStatus;
  email: ServiceStatus;
}

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_id: string | null;
  user_email: string | null;
  details: string;
  ip_address: string | null;
  created_at: string;
}

export default function SettingsPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // API Key form
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);

  // Danger zone
  const [clearing, setClearing] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchStatus(); fetchAuditLogs(); }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/system/status');
      setStatus(data as SystemStatus);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await apiGet('/analytics') as Record<string, unknown>;
      setAuditLogs((data.recentLogs as AuditLog[]) || []);
    } catch {
      // Audit logs may fail silently
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Error', description: 'Please enter an API key', variant: 'destructive' });
      return;
    }
    setSavingKey(true);
    try {
      await apiPost('/system/api-key', { apiKey: apiKey.trim() });
      toast({ title: 'Success', description: 'API key updated. Please restart the server for changes to take effect.' });
      setApiKey('');
      fetchStatus();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Network error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearSessions = async () => {
    if (!confirm('Are you sure? This will force logout all admin sessions including your own.')) return;
    setClearing(true);
    try {
      await apiDelete('/auth/sessions');
      toast({ title: 'Success', description: 'All sessions cleared. You will need to log in again.' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to clear sessions';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  const handleResetConfig = async () => {
    if (!confirm('Are you sure? This will reset all server configuration to defaults.')) return;
    setResetting(true);
    try {
      await apiPost('/config/reset', {});
      toast({ title: 'Success', description: 'Configuration reset to defaults.' });
      fetchStatus();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to reset config';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const getServiceStatus = (key: string, group?: string): ServiceStatus => {
    if (!status) return { status: 'error', message: 'Loading...' };
    if (group === 'r2') {
      const r2 = status.r2 as Record<string, ServiceStatus> | undefined;
      return r2?.[key] || { status: 'error', message: 'Unknown' };
    }
    return (status as Record<string, ServiceStatus>)[key] || { status: 'error', message: 'Unknown' };
  };

  const getStatusIcon = (svc: ServiceStatus) => {
    if (svc.status === 'connected') return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (svc.status === 'limited') return <AlertCircle className="h-4 w-4 text-amber-400" />;
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  const getStatusColor = (svc: ServiceStatus) => {
    if (svc.status === 'connected') return 'bg-green-500/10 text-green-400';
    if (svc.status === 'limited') return 'bg-amber-500/10 text-amber-400';
    return 'bg-red-500/10 text-red-400';
  };

  const services = [
    { name: 'Appwrite', key: 'appwrite', icon: Database, description: 'Primary database & auth' },
    { name: 'R2 - Videos', key: 'videos', icon: HardDrive, description: 'Video storage bucket', group: 'r2' },
    { name: 'R2 - Thumbnails', key: 'thumbnails', icon: HardDrive, description: 'Image storage bucket', group: 'r2' },
    { name: 'R2 - Avatars', key: 'avatars', icon: HardDrive, description: 'Avatar storage bucket', group: 'r2' },
    { name: 'R2 - Resources', key: 'resources', icon: HardDrive, description: 'Resource storage bucket', group: 'r2' },
    { name: 'D1 Database', key: 'd1', icon: Database, description: 'Sessions, audit logs & config' },
    { name: 'Workers KV', key: 'kv', icon: Cloud, description: 'Config cache & broadcast' },
    { name: 'Resend', key: 'email', icon: Wifi, description: 'Email delivery service' },
  ];

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const logPages = Math.ceil(auditLogs.length / 10);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* System Status */}
      <Card className="glass-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-dakkho-blue" /> System Status
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchStatus} className="border-white/10">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service) => {
              const Icon = service.icon;
              const svc = getServiceStatus(service.key, service.group);
              return (
                <div key={service.name} className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                      {svc.message && svc.status !== 'connected' && (
                        <p className="text-xs text-red-300/80 mt-0.5 max-w-[200px] truncate" title={svc.message}>
                          {svc.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusIcon(svc)}
                    <Badge variant="secondary" className={`${getStatusColor(svc)} text-[10px] md:text-xs`}>
                      {loading ? '...' : svc.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fix Instructions */}
      {status && status.appwrite?.status === 'error' && (
        <Card className="glass-card border-0 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" /> Fix Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-200">Appwrite API Key — Missing Scopes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Appwrite API key does not have the required scopes. Create a new API key:
                  </p>
                  <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Go to <span className="text-blue-400 font-mono">Appwrite Console → dakkho project → API Keys</span></li>
                    <li>Click <span className="font-semibold">Create API Key</span></li>
                    <li>Name it <span className="font-mono">dakkho-admin</span></li>
                    <li>Select ALL these scopes:</li>
                  </ol>
                  <div className="mt-2 p-2 rounded bg-black/20 text-xs font-mono text-green-300 space-y-0.5">
                    <div>databases.read, databases.write</div>
                    <div>collections.read, collections.write</div>
                    <div>documents.read, documents.write</div>
                    <div>users.read, users.write</div>
                    <div>health.read</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    5. Copy the new key (starts with <span className="font-mono">standard_</span>) and paste it below
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appwrite API Key Configuration */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" /> Appwrite API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New API Key</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-white/5 border-white/10 font-mono text-sm"
                placeholder="standard_xxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <Button onClick={handleSaveApiKey} disabled={savingKey} className="gradient-primary text-white flex-shrink-0">
                <Save className="h-4 w-4 mr-2" /> {savingKey ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The API key is stored in Cloudflare Workers KV. For permanent updates, use: <span className="font-mono">wrangler secret put APPWRITE_API_KEY</span>
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 rounded bg-white/[0.03]">
              <span className="text-muted-foreground">Current Key Status</span>
              <Badge variant="secondary" className={status?.appwrite?.status === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
                {status?.appwrite?.status === 'connected' ? 'Working' : 'Not Working'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="glass-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-dakkho-blue" /> Audit Logs
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchAuditLogs} className="border-white/10">
              <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No audit logs found</p>
          ) : (
            <div className="space-y-1">
              {auditLogs.slice((logPage - 1) * 10, logPage * 10).map((log, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="bg-white/5 text-muted-foreground text-[10px] flex-shrink-0">
                      {log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {log.resource_type}{log.resource_id ? `/${log.resource_id.slice(0, 8)}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="truncate max-w-[120px]">{log.user_email || 'System'}</span>
                    <span className="flex-shrink-0">{formatTime(log.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {logPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-sm text-muted-foreground">Page {logPage} of {logPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setLogPage(Math.max(1, logPage - 1))} disabled={logPage === 1} className="border-white/10">Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setLogPage(Math.min(logPages, logPage + 1))} disabled={logPage === logPages} className="border-white/10">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card className="glass-card border-0">
        <CardHeader><CardTitle className="text-lg">Environment</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              { label: 'App URL', value: 'https://dakkho.pro.bd' },
              { label: 'API Backend', value: 'Cloudflare Workers (Hono)' },
              { label: 'Appwrite Endpoint', value: 'https://sgp.cloud.appwrite.io/v1' },
              { label: 'Appwrite Project', value: 'dakkho' },
              { label: 'Database', value: 'dakkho_main' },
              { label: 'D1 Database', value: 'dakkho-admin-db' },
              { label: 'KV Namespace', value: 'dakkho-admin-kv' },
              { label: 'Email Provider', value: 'Resend' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between p-2 rounded bg-white/[0.03]">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono text-xs">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card border-0 border-dakkho-danger/20">
        <CardHeader><CardTitle className="text-lg text-dakkho-danger flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10 gap-3">
            <div>
              <p className="text-sm font-medium">Clear All Sessions</p>
              <p className="text-xs text-muted-foreground">Force logout all admin sessions (including yours)</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSessions}
              disabled={clearing}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4 mr-2" /> {clearing ? 'Clearing...' : 'Clear Sessions'}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10 gap-3">
            <div>
              <p className="text-sm font-medium">Reset Config</p>
              <p className="text-xs text-muted-foreground">Reset all server config to defaults</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetConfig}
              disabled={resetting}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-shrink-0"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> {resetting ? 'Resetting...' : 'Reset Config'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
