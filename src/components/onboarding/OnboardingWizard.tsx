'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Check, BookOpen, SkipForward, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkip?: () => void;
  onComplete?: () => void;
  role: 'CLIENT' | 'VENDOR';
  steps: OnboardingStep[];
  title: string;
  subtitle: string;
}

export function OnboardingWizard({
  open,
  onOpenChange,
  onSkip,
  onComplete,
  role,
  steps,
  title,
  subtitle,
}: OnboardingWizardProps) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    setCanScrollDown(remaining > 8);
  }, []);

  useEffect(() => {
    if (open) handleScroll();
  }, [open, index, handleScroll]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setIndex(0);
  }, [onOpenChange]);

  const handleSkip = useCallback(() => {
    onSkip?.();
    handleClose();
  }, [onSkip, handleClose]);

  const handleComplete = useCallback(() => {
    onComplete?.();
    handleClose();
  }, [onComplete, handleClose]);

  const step = steps[Math.min(index, steps.length - 1)];
  const progress = steps.length > 0 ? ((index + 1) / steps.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0",
              role === 'VENDOR' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
            )}>
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-sm">{subtitle}</DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Étape {index + 1} sur {steps.length}</span>
              <span className="text-xs font-semibold text-emerald-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Steps dots */}
        <div className="px-6 py-3 border-b bg-muted/20 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                title={s.title}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  i === index
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <span className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center text-[9px]",
                  i < index ? 'bg-emerald-500 text-white' : i === index ? 'bg-emerald-600 text-white' : 'bg-muted-foreground/20'
                )}>
                  {i < index ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full min-h-0 overflow-y-auto overscroll-contain px-6 py-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 text-emerald-600">
                {step.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{step.title}</h3>
                {step.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{step.subtitle}</p>}
              </div>
            </div>
            <div className="text-sm space-y-3">{step.content}</div>
            <div className="h-4" />
          </div>

          {/* Scroll down hint */}
          {canScrollDown && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-background/95 border shadow-md px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors z-10"
              aria-label="Faire défiler vers le bas"
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              Faire défiler
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            <SkipForward className="h-4 w-4 mr-1" /> Passer
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
            </Button>
            {index === steps.length - 1 ? (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete}>
                <Check className="h-4 w-4 mr-1" /> J&apos;ai compris
              </Button>
            ) : (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}>
                Suivant <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
