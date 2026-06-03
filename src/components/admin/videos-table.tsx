'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Upload,
  Link,
  FileVideo,
  Image,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload, ApiError } from '@/lib/api-client';

function FileUploadZone({
  bucket,
  label,
  accept,
  onUploaded,
  currentUrl,
}: {
  bucket: string;
  label: string;
  accept: string;
  onUploaded: (url: string) => void;
  currentUrl?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      const result = await apiUpload('/upload', formData) as Record<string, unknown>;
      const url = result.url as string;
      setUploadedUrl(url);
      onUploaded(url);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Upload failed';
      console.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-dakkho-blue bg-dakkho-blue/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-dakkho-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : uploadedUrl ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
            <p className="text-xs text-muted-foreground truncate max-w-full">File uploaded</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-dakkho-blue"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              Replace file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
            <p className="text-xs text-muted-foreground/60">{accept === 'video/*' ? 'MP4, WebM, MOV' : 'PNG, JPG, WebP'}</p>
          </div>
        )}
      </div>
      {uploadedUrl && (
        <div className="flex items-center gap-2">
          <Input
            value={uploadedUrl}
            readOnly
            className="bg-white/5 border-white/10 text-xs font-mono"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8"
            onClick={() => { setUploadedUrl(''); onUploaded(''); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VideosTable() {
  const [videos, setVideos] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<Record<string, unknown> | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '', slug: '', description: '', courseId: '', videoUrl: '', thumbnailUrl: '',
    duration: 0, order: 0, isPreview: false, isPublished: false,
  });

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (courseId) params.set('courseId', courseId);
      const data = await apiGet(`/videos?${params}`) as Record<string, unknown>;
      setVideos((data.documents as Record<string, unknown>[]) || []);
      setTotal((data.total as number) || 0);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch videos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, courseId, toast]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const openCreateDialog = () => {
    setEditVideo(null);
    setForm({ title: '', slug: '', description: '', courseId: '', videoUrl: '', thumbnailUrl: '', duration: 0, order: 0, isPreview: false, isPublished: false });
    setDialogOpen(true);
  };

  const openEditDialog = (video: Record<string, unknown>) => {
    setEditVideo(video);
    setForm({
      title: String(video.title || ''), slug: String(video.slug || ''), description: String(video.description || ''),
      courseId: String(video.courseId || ''), videoUrl: String(video.videoUrl || ''),
      thumbnailUrl: String(video.thumbnailUrl || ''),
      duration: Number(video.duration || 0), order: Number(video.order || 0),
      isPreview: Boolean(video.isPreview), isPublished: Boolean(video.isPublished),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = { ...form, slug };

      if (editVideo) {
        await apiPut('/videos', { videoId: editVideo.$id, ...payload });
      } else {
        await apiPost('/videos', payload);
      }
      toast({ title: 'Success', description: `Video ${editVideo ? 'updated' : 'created'}` });
      setDialogOpen(false);
      fetchVideos();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Network error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try { await apiDelete(`/videos?id=${id}`); toast({ title: 'Deleted' }); fetchVideos(); } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by Course ID..." value={courseId} onChange={(e) => { setCourseId(e.target.value); setPage(1); }} className="pl-9 bg-white/5 border-white/10" />
            </div>
            <Button variant="outline" size="icon" onClick={fetchVideos} className="border-white/10 self-start">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="gradient-primary text-white self-start"><Plus className="h-4 w-4 mr-2" /> Add Video</Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editVideo ? 'Edit Video' : 'Add Video'}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10" /></div>
                  <div className="space-y-2"><Label>Course ID</Label><Input value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="bg-white/5 border-white/10" /></div>

                  {/* Video URL - Upload or Link */}
                  <div className="space-y-2">
                    <Label>Video</Label>
                    <Tabs defaultValue={form.videoUrl ? "link" : "upload"} className="w-full">
                      <TabsList className="bg-white/5 border border-white/10 w-full">
                        <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue">
                          <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                        </TabsTrigger>
                        <TabsTrigger value="link" className="flex-1 data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue">
                          <Link className="h-3.5 w-3.5 mr-1.5" /> Link
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-3">
                        <FileUploadZone
                          bucket="videos"
                          label=""
                          accept="video/*"
                          onUploaded={(url) => setForm({ ...form, videoUrl: url })}
                          currentUrl={form.videoUrl}
                        />
                      </TabsContent>
                      <TabsContent value="link" className="mt-3">
                        <Input
                          value={form.videoUrl}
                          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                          className="bg-white/5 border-white/10"
                          placeholder="https://example.com/video.mp4"
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Thumbnail - Upload or Link */}
                  <div className="space-y-2">
                    <Label>Thumbnail</Label>
                    <Tabs defaultValue={form.thumbnailUrl ? "link" : "upload"} className="w-full">
                      <TabsList className="bg-white/5 border border-white/10 w-full">
                        <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue">
                          <Image className="h-3.5 w-3.5 mr-1.5" /> Upload
                        </TabsTrigger>
                        <TabsTrigger value="link" className="flex-1 data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue">
                          <Link className="h-3.5 w-3.5 mr-1.5" /> Link
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-3">
                        <FileUploadZone
                          bucket="thumbnails"
                          label=""
                          accept="image/*"
                          onUploaded={(url) => setForm({ ...form, thumbnailUrl: url })}
                          currentUrl={form.thumbnailUrl}
                        />
                      </TabsContent>
                      <TabsContent value="link" className="mt-3">
                        <Input
                          value={form.thumbnailUrl}
                          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                          className="bg-white/5 border-white/10"
                          placeholder="https://example.com/thumbnail.jpg"
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-white/5 border-white/10" rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Duration (sec)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="bg-white/5 border-white/10" /></div>
                    <div className="space-y-2"><Label>Order</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="bg-white/5 border-white/10" /></div>
                  </div>
                  <div className="flex items-center justify-between"><Label>Preview (free)</Label><Switch checked={form.isPreview} onCheckedChange={(v) => setForm({ ...form, isPreview: v })} /></div>
                  <div className="flex items-center justify-between"><Label>Published</Label><Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} /></div>
                  <Button onClick={handleSave} className="w-full gradient-primary text-white">{editVideo ? 'Update' : 'Create'} Video</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0">
        <CardHeader className="pb-3"><CardTitle className="text-lg">Videos ({total})</CardTitle></CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground">Course</TableHead>
                  <TableHead className="text-muted-foreground">Duration</TableHead>
                  <TableHead className="text-muted-foreground">Order</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/[0.06]">
                      {Array.from({ length: 6 }).map((_, j) => (<TableCell key={j}><div className="h-5 rounded bg-white/5 animate-pulse" /></TableCell>))}
                    </TableRow>
                  ))
                ) : videos.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No videos found</TableCell></TableRow>
                ) : (
                  videos.map((video) => (
                    <TableRow key={String(video.$id)} className="border-white/[0.06] hover:bg-white/[0.03]">
                      <TableCell className="font-medium truncate max-w-[200px]">
                        <div className="flex items-center gap-2">
                          {video.thumbnailUrl ? (
                            <img src={String(video.thumbnailUrl)} alt="" className="w-8 h-5 rounded object-cover flex-shrink-0" />
                          ) : (
                            <FileVideo className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          {String(video.title || 'Untitled')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{String(video.courseId || 'N/A').slice(0, 8)}...</TableCell>
                      <TableCell className="text-sm">{Math.round(Number(video.duration || 0))}s</TableCell>
                      <TableCell className="text-sm">{String(video.order ?? 0)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {video.isPreview && <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 text-xs">Preview</Badge>}
                          <Badge variant="secondary" className={video.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}>
                            {video.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A1A2E] border-white/10">
                            <DropdownMenuItem onClick={() => openEditDialog(video)}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteVideo(String(video.$id))} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
              ))
            ) : videos.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No videos found</p>
            ) : (
              videos.map((video) => (
                <div key={String(video.$id)} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{String(video.title || 'Untitled')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{Math.round(Number(video.duration || 0))}s &middot; Order {String(video.order ?? 0)}</p>
                      <div className="flex gap-1 mt-1.5">
                        {video.isPreview && <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 text-[10px]">Preview</Badge>}
                        <Badge variant="secondary" className={video.isPublished ? 'bg-green-500/10 text-green-400 text-[10px]' : 'bg-gray-500/10 text-gray-400 text-[10px]'}>
                          {video.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1A1A2E] border-white/10">
                        <DropdownMenuItem onClick={() => openEditDialog(video)}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteVideo(String(video.$id))} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="border-white/10">Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="border-white/10">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
