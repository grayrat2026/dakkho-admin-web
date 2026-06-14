'use client';

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Camera, Briefcase, GraduationCap,
  BookOpen, FileText, Upload, X, Check, ChevronLeft, ChevronRight,
  ShieldCheck, FileCheck, Info
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { useNavigationStore } from '@/lib/store';
import { TECHNOLOGY_OPTIONS, EXPERIENCE_OPTIONS } from '@/lib/constants';
import { cn, generateId } from '@/lib/utils';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  profilePhoto: File | null;
  profilePhotoPreview: string;
  department: string;
  specialization: string;
  teachingExperience: string;
  highestQualification: string;
  shortBio: string;
  nidNumber: string;
  nidPhoto: File | null;
  nidPhotoPreview: string;
  academicCertPhoto: File | null;
  academicCertPhotoPreview: string;
  termsAccepted: boolean;
}

const STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Professional', icon: Briefcase },
  { label: 'Verification', icon: ShieldCheck },
  { label: 'Review', icon: FileCheck },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export function ApplyInstructor() {
  const navigate = useNavigationStore((s) => s.navigate);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    profilePhoto: null,
    profilePhotoPreview: '',
    department: '',
    specialization: '',
    teachingExperience: '',
    highestQualification: '',
    shortBio: '',
    nidNumber: '',
    nidPhoto: null,
    nidPhotoPreview: '',
    academicCertPhoto: null,
    academicCertPhotoPreview: '',
    termsAccepted: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (
    field: 'profilePhoto' | 'nidPhoto' | 'academicCertPhoto',
    previewField: 'profilePhotoPreview' | 'nidPhotoPreview' | 'academicCertPhotoPreview',
    file: File | null
  ) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm((prev) => ({
          ...prev,
          [field]: file,
          [previewField]: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setForm((prev) => ({
        ...prev,
        [field]: null,
        [previewField]: '',
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    setIsDragging(zoneId);
  };

  const handleDragLeave = () => {
    setIsDragging(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    field: 'profilePhoto' | 'nidPhoto' | 'academicCertPhoto',
    previewField: 'profilePhotoPreview' | 'nidPhotoPreview' | 'academicCertPhotoPreview',
    zoneId: string
  ) => {
    e.preventDefault();
    setIsDragging(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(field, previewField, file);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nidInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const goNext = () => {
    if (currentStep < 3) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const handleSubmit = () => {
    if (!form.termsAccepted) return;
    // Instructors are invited by admin - no application endpoint exists.
    // Show a message directing the user to contact admin.
    setSubmitted(true);
  };

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl text-sm',
    'premium-input',
    'placeholder:text-muted-foreground/60',
    'text-foreground'
  );

  const selectClass = cn(
    'w-full px-4 py-3 rounded-xl text-sm appearance-none',
    'premium-input',
    'text-foreground'
  );

  const uploadZone = (
    field: 'profilePhoto' | 'nidPhoto' | 'academicCertPhoto',
    previewField: 'profilePhotoPreview' | 'nidPhotoPreview' | 'academicCertPhotoPreview',
    zoneId: string,
    label: string,
    inputRef: React.RefObject<HTMLInputElement | null>,
    optional = false
  ) => (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 cursor-pointer',
        isDragging === zoneId
          ? 'border-neutral-400 bg-black/[0.02] dark:bg-white/[0.02] shimmer'
          : 'border-white/30 dark:border-white/[0.04] bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm hover:border-neutral-300',
        form[previewField] && 'border-neutral-400/50'
      )}
      onDragOver={(e) => handleDragOver(e, zoneId)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, field, previewField, zoneId)}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0] || null;
          handleFileUpload(field, previewField, file);
        }}
      />
      {form[previewField] ? (
        <div className="flex items-center gap-3">
          <img
            src={form[previewField]}
            alt="Preview"
            className="w-16 h-16 rounded-lg object-cover border border-white/30"
          />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Image uploaded</p>
            <p className="text-xs text-muted-foreground">Click to change</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFileUpload(field, previewField, null);
            }}
            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div>
          <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {optional && <p className="text-xs text-muted-foreground/60 mt-1">(optional)</p>}
        </div>
      )}
    </div>
  );

  // Success screen - shows message about admin invitation
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-slate-950 dark:via-slate-900 dark:to-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8 text-center">
            {/* Animated info icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 via-amber-400 to-amber-500 flex items-center justify-center shadow-[0_4px_15px_rgba(245,158,11,0.3)]"
            >
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.5 }}
              >
                <Info className="w-10 h-10 text-white" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            <h2 className="text-2xl font-extrabold text-foreground mb-2">Invitation Required</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Instructor accounts on Dakkho are created by invitation from the admin team. 
              If you&apos;ve been invited, you should have received login credentials from the administrator.
            </p>

            <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-4 mb-6 text-left space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Already invited?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sign in using the credentials provided by admin.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Not yet invited?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Contact the Dakkho admin team to request instructor access.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-foreground/50 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Need to change your password?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">After signing in, go to Settings to change your password.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <GradientButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('login')}
                icon={<Check className="w-4 h-4" />}
              >
                Go to Sign In
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-slate-950 dark:via-slate-900 dark:to-neutral-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-neutral-200/30 dark:bg-neutral-800/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-neutral-300/30 dark:bg-neutral-700/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        <GlassCard className="p-6 md:p-8">
          {/* Back to login */}
          <button
            type="button"
            onClick={() => navigate('login')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Sign In
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-neutral-900 to-black dark:from-neutral-100 dark:to-white bg-clip-text text-transparent">
              Instructor Application
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Join Dakkho as an instructor</p>
            {/* Info banner */}
            <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/20 rounded-xl p-3 text-left">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Instructor accounts require admin approval. If you&apos;ve been invited, you can sign in directly with the credentials provided.
                </p>
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress line background */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/20 dark:bg-white/10" />
              {/* Animated progress line */}
              <motion.div
                className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white"
                initial={false}
                animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              />

              {STEPS.map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                      i < currentStep
                        ? 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white text-white dark:text-black shadow-[0_4px_15px_rgba(0,0,0,0.1)]'
                        : i === currentStep
                        ? 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white text-white dark:text-black shadow-[0_4px_15px_rgba(0,0,0,0.1)] ring-4 ring-black/5'
                        : 'bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm text-muted-foreground border border-white/30 dark:border-white/[0.04]'
                    )}
                    animate={{ scale: i === currentStep ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {i < currentStep ? <Check className="w-4 h-4" /> : <step.icon className="w-3.5 h-3.5" />}
                  </motion.div>
                  <span className={cn(
                    'text-[10px] mt-1.5 font-medium',
                    i <= currentStep ? 'text-foreground/70' : 'text-muted-foreground/50'
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="relative overflow-hidden min-h-[340px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Step 1: Personal Info */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={form.fullName}
                          onChange={(e) => updateField('fullName', e.target.value)}
                          placeholder="Your full name"
                          className={cn(inputClass, 'pl-11')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="Email address"
                          className={cn(inputClass, 'pl-11')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className={cn(inputClass, 'pl-11')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Profile Photo</label>
                      {uploadZone('profilePhoto', 'profilePhotoPreview', 'profile', 'Click or drag to upload photo', fileInputRef)}
                    </div>
                  </div>
                )}

                {/* Step 2: Professional Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Department *</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                        <select
                          value={form.department}
                          onChange={(e) => updateField('department', e.target.value)}
                          className={cn(selectClass, 'pl-11')}
                        >
                          <option value="">Select department</option>
                          {TECHNOLOGY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Specialization *</label>
                      <input
                        type="text"
                        value={form.specialization}
                        onChange={(e) => updateField('specialization', e.target.value)}
                        placeholder="e.g. Web Development, Machine Learning"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Teaching Experience *</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                        <select
                          value={form.teachingExperience}
                          onChange={(e) => updateField('teachingExperience', e.target.value)}
                          className={cn(selectClass, 'pl-11')}
                        >
                          <option value="">Select experience</option>
                          {EXPERIENCE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Highest Qualification *</label>
                      <input
                        type="text"
                        value={form.highestQualification}
                        onChange={(e) => updateField('highestQualification', e.target.value)}
                        placeholder="e.g. BSc in CSE"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Short Bio</label>
                      <div className="relative">
                        <textarea
                          value={form.shortBio}
                          onChange={(e) => updateField('shortBio', e.target.value.slice(0, 500))}
                          placeholder="Write briefly about yourself..."
                          rows={3}
                          className={cn(inputClass, 'resize-none')}
                        />
                        <span className={cn(
                          'absolute bottom-2 right-3 text-xs',
                          form.shortBio.length >= 450 ? 'text-amber-500' : 'text-muted-foreground/40'
                        )}>
                          {form.shortBio.length}/500
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Document Verification */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">NID/Birth Certificate Number *</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={form.nidNumber}
                          onChange={(e) => updateField('nidNumber', e.target.value)}
                          placeholder="NID or birth certificate number"
                          className={cn(inputClass, 'pl-11')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">NID/Birth Certificate Photo *</label>
                      {uploadZone('nidPhoto', 'nidPhotoPreview', 'nid', 'Upload NID photo', nidInputRef)}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Academic Certificate Photo</label>
                      {uploadZone('academicCertPhoto', 'academicCertPhotoPreview', 'cert', 'Upload certificate photo', certInputRef, true)}
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {/* Personal Info Summary */}
                    <div className="bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <User className="w-4 h-4 text-foreground/70" /> Personal Info
                        </h3>
                        <button
                          type="button"
                          onClick={() => goToStep(0)}
                          className="text-xs text-foreground/70 hover:text-foreground font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-medium">{form.fullName || '—'}</span></div>
                        <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground font-medium break-all">{form.email || '—'}</span></div>
                        <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground font-medium">{form.phone || '—'}</span></div>
                        <div>
                          <span className="text-muted-foreground">Photo:</span>{' '}
                          <span className="text-foreground font-medium">{form.profilePhotoPreview ? '✓' : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Professional Info Summary */}
                    <div className="bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-foreground/70" /> Professional Info
                        </h3>
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="text-xs text-foreground/70 hover:text-foreground font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Department:</span> <span className="text-foreground font-medium">{TECHNOLOGY_OPTIONS.find(o => o.value === form.department)?.label || '—'}</span></div>
                        <div><span className="text-muted-foreground">Specialization:</span> <span className="text-foreground font-medium">{form.specialization || '—'}</span></div>
                        <div><span className="text-muted-foreground">Experience:</span> <span className="text-foreground font-medium">{EXPERIENCE_OPTIONS.find(o => o.value === form.teachingExperience)?.label || '—'}</span></div>
                        <div><span className="text-muted-foreground">Qualification:</span> <span className="text-foreground font-medium">{form.highestQualification || '—'}</span></div>
                        {form.shortBio && (
                          <div className="col-span-2"><span className="text-muted-foreground">Bio:</span> <span className="text-foreground font-medium">{form.shortBio}</span></div>
                        )}
                      </div>
                    </div>

                    {/* Document Summary */}
                    <div className="bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verification
                        </h3>
                        <button
                          type="button"
                          onClick={() => goToStep(2)}
                          className="text-xs text-foreground/70 hover:text-foreground font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">NID Number:</span> <span className="text-foreground font-medium">{form.nidNumber || '—'}</span></div>
                        <div><span className="text-muted-foreground">NID Photo:</span> <span className="text-foreground font-medium">{form.nidPhotoPreview ? '✓' : '—'}</span></div>
                        <div><span className="text-muted-foreground">Certificate Photo:</span> <span className="text-foreground font-medium">{form.academicCertPhotoPreview ? '✓' : '—'}</span></div>
                      </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04] hover:bg-white/40 dark:hover:bg-white/[0.06] transition-colors">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(e) => updateField('termsAccepted', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-foreground focus:ring-black/5 accent-foreground"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I understand that instructor accounts on Dakkho are created by admin invitation only. I have read and agree to the <span className="text-foreground/70 font-medium">Terms & Privacy Policy</span>.
                      </span>
                    </label>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20 dark:border-white/10">
            {currentStep > 0 ? (
              <GradientButton variant="ghost" size="sm" onClick={goPrev} icon={<ChevronLeft className="w-4 h-4" />}>
                Previous
              </GradientButton>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <GradientButton variant="primary" size="sm" onClick={goNext} icon={<ChevronRight className="w-4 h-4" />}>
                Next
              </GradientButton>
            ) : (
              <GradientButton
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={!form.termsAccepted}
                icon={<Check className="w-4 h-4" />}
              >
                Submit Application
              </GradientButton>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
