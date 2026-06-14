'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Mail, Send, Phone, Play, HelpCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { cn } from '@/lib/utils';

const faqItems = [
  { question: 'How do I create a new course?', answer: 'Go to the Courses page and click on the "Create Course" button. Fill in the course details including title, description, and pricing. Once created, you can add videos and manage content.' },
  { question: 'How do I upload videos to my course?', answer: 'Navigate to your course detail page and click on the "Videos" tab. You can upload videos directly, add video links, or embed YouTube videos. Make sure to set the sort order for proper sequencing.' },
  { question: 'How do I schedule a live class?', answer: 'Go to the Schedule page and click "Create Class". Select a course, set the date and time, choose a platform (Jitsi, Zoom, or Google Meet), and add the meeting link.' },
  { question: 'How do I track student progress?', answer: 'Visit the Student Progress page. You can filter by course and sort by different criteria to see how students are progressing through your courses.' },
  { question: 'How do I change my password?', answer: 'Go to Settings > Security section. Enter your current password and new password. If you forgot your password, use the "Forgot Password" link on the login page.' },
  { question: 'How do I update my profile?', answer: 'Go to the Profile page and click the "Edit" button. You can update your name, specialization, department, bio, and social links. You can also upload a new avatar photo.' },
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {faqItems.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <GlassCard className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <span className="text-sm font-semibold text-foreground flex-1">{item.question}</span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent mb-3" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Help() {
  const contactItems = [
    {
      icon: Mail,
      label: 'Email',
      value: 'support@dakkho.com.bd',
      href: 'mailto:support@dakkho.com.bd',
      color: 'bg-black/[0.04] dark:bg-white/[0.04]',
      iconColor: 'text-foreground/70',
    },
    {
      icon: Send,
      label: 'Telegram',
      value: '@dakkho_support',
      href: 'https://t.me/dakkho_support',
      color: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-500',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+880 1712-345678',
      href: 'tel:+8801712345678',
      color: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-500',
    },
  ];

  const tutorials = [
    { title: 'Create a Course', duration: '5 min' },
    { title: 'Upload Videos', duration: '3 min' },
    { title: 'Schedule Live Classes', duration: '4 min' },
    { title: 'Student Management', duration: '6 min' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
          Help <span className="gradient-text">Center</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">FAQ and contact information</p>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-foreground/70" />
          <h2 className="text-lg font-bold gradient-text">Frequently Asked Questions</h2>
        </div>
        <FAQAccordion />
      </motion.div>

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <GlassCard glow className="p-6">
          <h3 className="text-lg font-bold gradient-text mb-4">Contact Us</h3>
          <div className="space-y-3">
            {contactItems.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04] hover:shadow-md transition-all"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', item.color)}>
                  <item.icon className={cn('w-5 h-5', item.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Video Tutorials */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <GlassCard glow className="p-6">
          <h3 className="text-lg font-bold gradient-text mb-4">Video Tutorials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tutorials.map((tut, i) => (
              <motion.div
                key={tut.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04] hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white flex items-center justify-center flex-shrink-0 shadow-[0_4px_15px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform">
                  <Play className="w-4 h-4 text-white dark:text-black fill-white dark:fill-black" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{tut.title}</p>
                  <p className="text-xs text-muted-foreground">{tut.duration}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
